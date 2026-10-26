/** Controlled local Lighthouse measurements. This script never edits website files. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import os from 'node:os';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import {chromium} from 'playwright';
import {RuntimeReadinessGatherer,RuntimeReadinessAudit} from './readiness.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const recording = process.argv.includes('--record');
const diagnostic=process.argv.includes('--diagnostic');
if(diagnostic&&recording)throw new Error('A diagnostic cannot record a baseline.');
const runs = diagnostic?1:Number(process.env.LIGHTHOUSE_RUNS || 3);
if (!Number.isInteger(runs) || (!diagnostic&&runs < 3)) throw new Error('At least three runs per route/profile are required.');
const origin = process.env.BASE_URL || 'http://127.0.0.1:8000';
const output = path.resolve(repo, process.env.LIGHTHOUSE_OUTPUT || (diagnostic?'test-results/performance-diagnostic':recording ? 'tests/baseline/performance' : 'test-results/performance'));
let servedSourceVerification=null;
const originalCommit = 'd8a37314ed7d2265f3f949c9e048b5e2beadfc20';
if (recording) {
  const branch=execFileSync('git',['symbolic-ref','--short','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
  if(!branch||['main','work'].includes(branch))throw new Error('Record only on a dedicated baseline branch, never main or the initial work branch.');
  const changed = execFileSync('git', ['diff', originalCommit, '--', 'index.html', 'en', 'desktop-project-embedded.html', 'support.js', 'curtain-cloth.js', '_ds', 'assets'], {cwd: repo, encoding: 'utf8'});
  if (changed) throw new Error('Reference recording requires byte-unchanged original website files.');
  try { await fs.access(path.join(output, 'summary.json')); throw new Error('Refusing to overwrite an existing performance baseline; use a new LIGHTHOUSE_OUTPUT after review.'); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  const originalFiles=execFileSync('git',['ls-tree','-r','--name-only',originalCommit],{cwd:repo,encoding:'utf8'}).trim().split('\n');
  const checked=[];
  for(const file of originalFiles){
    const response=await fetch(origin+'/'+file.split('/').map(encodeURIComponent).join('/'));
    if(!response.ok)throw new Error(`Original source preflight HTTP ${response.status}: ${file}`);
    const received=Buffer.from(await response.arrayBuffer());
    const expected=execFileSync('git',['show',originalCommit+':'+file],{cwd:repo,maxBuffer:10*1024*1024});
    const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
    if(hash(received)!==hash(expected))throw new Error(`Served original source differs from reference commit: ${file}`);
    checked.push({file,sha256:hash(received)});
  }
  servedSourceVerification={status:'passed',files:checked.length,referenceCommit:originalCommit,manifestSha256:createHash('sha256').update(JSON.stringify(checked)).digest('hex')};
}
const replayModule = path.resolve(repo, process.env.PERFORMANCE_REPLAY_MODULE || 'tests/runtime/replay.cjs');
const {installRuntimeReplay} = await import(pathToFileURL(replayModule));
const runtimeManifestSha256=createHash('sha256').update(await fs.readFile(path.resolve(repo,'tests/runtime/manifest.json'))).digest('hex');
const serverSha256=createHash('sha256').update(await fs.readFile(path.resolve(repo,'tests/runtime/server.mjs'))).digest('hex');
const chromeFlags = ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'];
const measurementSettings={throttlingMethod:'simulate',maxWaitForLoad:45000,cpuQuietThresholdMs:0,networkQuietThresholdMs:1000,pauseAfterFcpMs:1000,pauseAfterLoadMs:1000};
const launcherDefaultFlags=chromeLauncher.Launcher.defaultFlags();
const profiles = {
  mobile: {
    formFactor: 'mobile',
    screenEmulation: {mobile: true, width: 393, height: 852, deviceScaleFactor: 1, disabled: false},
    throttling: {rttMs:150, throughputKbps:1638.4, requestLatencyMs:562.5, downloadThroughputKbps:1474.56, uploadThroughputKbps:675, cpuSlowdownMultiplier:4},
  },
  desktop: {
    formFactor: 'desktop',
    screenEmulation: {mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false},
    emulatedUserAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
    throttling: {rttMs:40, throughputKbps:10240, requestLatencyMs:0, downloadThroughputKbps:0, uploadThroughputKbps:0, cpuSlowdownMultiplier:1},
  },
};
const measurements = [];
const host={platform:os.platform(),release:os.release(),architecture:os.arch(),cpuModel:os.cpus()[0]?.model,cpuCount:os.cpus().length,memoryBytes:os.totalmem(),nodeVersion:process.version};
await fs.mkdir(output, {recursive:true});
const targets=[];
if(process.env.LIGHTHOUSE_INTERLEAVE_MOBILE==='1'){
  for(let iteration=1;iteration<=runs;iteration++){
    targets.push({locale:'fr',route:'/',profile:'mobile',iteration});
    targets.push({locale:'en',route:'/en/',profile:'mobile',iteration});
  }
}else{
  for(const [locale,route] of [['fr','/'],['en','/en/']]) for(const [profile] of Object.entries(profiles)){
    if(diagnostic&&(locale!=='fr'||profile!=='desktop'))continue;
    for(let iteration=1;iteration<=runs;iteration++)targets.push({locale,route,profile,iteration});
  }
}
for(const {locale,route,profile,iteration} of targets){
    const settings=profiles[profile];
    const chrome = await chromeLauncher.launch({chromePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', chromeFlags});
    let browser;
    try {
      browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
      const browserVersion=browser.version();
      const context = browser.contexts()[0];
      const auditPageErrors=[];
      const auditConsoleErrors=[];
      context.on('page', page=>{
        page.on('pageerror', error=>auditPageErrors.push(error.message));
        page.on('console', message=>{if(message.type()==='error')auditConsoleErrors.push({text:message.text(),location:message.location()});});
      });
      await installRuntimeReplay(context);
      const preflight = await context.newPage();
      const pageErrors=[];
      preflight.on('pageerror', e=>pageErrors.push(e.message));
      await preflight.setViewportSize({width:settings.screenEmulation.width,height:settings.screenEmulation.height});
      await preflight.goto(origin+route, {waitUntil:'load', timeout:60000});
      await preflight.waitForFunction(()=>!!document.body && document.body.innerText.length>300, undefined, {timeout:30000});
      await preflight.waitForFunction(()=>!!window.React && !document.querySelector('curtain-cloth') && performance.getEntriesByType('resource').every(entry=>!/curtain-cloth\.js|footer-curtain\.webp|three@0\.160\.0/i.test(entry.name)), undefined, {timeout:30000});
      await preflight.evaluate(()=>document.fonts.ready);
      const readiness = await preflight.evaluate(()=>({lang:document.documentElement.lang, title:document.title, textLength:document.body.innerText.length, react:!!window.React, fonts:document.fonts.status, curtainDeferred:!document.querySelector('curtain-cloth')&&performance.getEntriesByType('resource').every(entry=>!/curtain-cloth\.js|footer-curtain\.webp|three@0\.160\.0/i.test(entry.name))}));
      if (readiness.lang!==locale || !readiness.react || !readiness.curtainDeferred || pageErrors.length) throw new Error('Render preflight failed: '+JSON.stringify({readiness,pageErrors}));
      await preflight.close();
      const auditedResourceErrors=[];
      const abortedRequests=[];
      context.on('requestfailed', request=>{
        const failure={url:request.url(),error:request.failure()?.errorText,resourceType:request.resourceType()};
        if(failure.error==='net::ERR_ABORTED')abortedRequests.push(failure);
        else auditedResourceErrors.push(failure);
      });
      context.on('response', response=>{if(response.status()>=400)auditedResourceErrors.push({url:response.url(),status:response.status()});});
      const loadBefore=os.loadavg();
      const result = await lighthouse(origin+route, {port:chrome.port, output:['json','html'], logLevel:'error', onlyCategories:['performance'], disableStorageReset:false}, {
        extends:'lighthouse:default', settings: {...settings, ...measurementSettings},
        artifacts:[{id:'RuntimeReadiness',gatherer:{implementation:RuntimeReadinessGatherer}}],
        audits:[{implementation:RuntimeReadinessAudit}],
        categories:{performance:{auditRefs:[{id:'portfolio-render-ready',weight:0}]}},
      });
      if (!result || result.lhr.runtimeError || !Number.isFinite(result.lhr.categories.performance.score)) throw new Error('Lighthouse failed: '+JSON.stringify(result?.lhr.runtimeError));
      const auditedReadiness=result.lhr.audits['portfolio-render-ready']?.details?.readiness;
      if(!auditedReadiness || auditedReadiness.lang!==locale || !auditedReadiness.curtainDeferred || result.lhr.audits['portfolio-render-ready'].score!==1 || auditPageErrors.length || auditConsoleErrors.length || auditedResourceErrors.length) throw new Error('Audited page did not render with the below-fold curtain deferred: '+JSON.stringify({audit:result.lhr.audits['portfolio-render-ready'],auditedReadiness,auditPageErrors,auditConsoleErrors,auditedResourceErrors}));
      const id=`${locale}-${profile}-${iteration}`;
      await fs.writeFile(path.join(output,id+'.json'),JSON.stringify(result.lhr,null,2)+'\n');
      await fs.writeFile(path.join(output,id+'.html'),result.report[1]);
      const a=result.lhr.audits;
      const metric=k=>a[k]?.numericValue??null;
      const entry={id,locale,route,profile,iteration,fetchTime:result.lhr.fetchTime,browserVersion,lighthouseVersion:result.lhr.lighthouseVersion,userAgent:result.lhr.userAgent,configSettings:result.lhr.configSettings,loadBefore,loadAfter:os.loadavg(),readiness,pageErrors,auditedReadiness,auditPageErrors,auditConsoleErrors,auditedResourceErrors,abortedRequests,score:result.lhr.categories.performance.score*100,fcpMs:metric('first-contentful-paint'),lcpMs:metric('largest-contentful-paint'),tbtMs:metric('total-blocking-time'),cls:metric('cumulative-layout-shift'),speedIndexMs:metric('speed-index'),totalByteWeight:metric('total-byte-weight'),runWarnings:result.lhr.runWarnings};
      measurements.push(entry);
      console.log(JSON.stringify({id,score:entry.score,lcpMs:entry.lcpMs,tbtMs:entry.tbtMs,cls:entry.cls}));
    } finally {if(browser) await browser.close(); await chrome.kill();}
}
const median=values=>{const s=values.filter(Number.isFinite).sort((a,b)=>a-b);if(!s.length)return null;const mid=Math.floor(s.length/2);return s.length%2?s[mid]:(s[mid-1]+s[mid])/2;};
const aggregate=[];
for(const locale of ['fr','en']) for(const profile of Object.keys(profiles)) {
 const selected=measurements.filter(m=>m.locale===locale&&m.profile===profile);
 if(!selected.length)continue;
 const row={locale,profile,runs:selected.length};
 for(const metric of ['score','fcpMs','lcpMs','tbtMs','cls','speedIndexMs','totalByteWeight']) row[metric]=median(selected.map(m=>m[metric]));
 row.scoreRange=[Math.min(...selected.map(m=>m.score)),Math.max(...selected.map(m=>m.score))];
 aggregate.push(row);
}
const summary={schemaVersion:1,status:diagnostic?'diagnostic':'complete',diagnostic,referenceCommit:originalCommit,measuredCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),mode:'controlled-local-runtime-replay',runtimeManifestSha256,serverSha256,servedSourceVerification,host,origin,runsPerTarget:runs,chromeFlags,launcherDefaultFlags,measurementSettings,profiles,notes:['Local origin is the unchanged checkout served by tests/runtime/server.mjs (HTTP/1.1, uncompressed, byte ranges for video); production transfer compression and CDN behavior are not reproduced.','Playwright routing disables HTTP cache; fresh browser profiles and Lighthouse storage reset also prevent warm-cache reuse.','CPU quiet waiting is explicitly zero because animation continues indefinitely; network quiet and post-load/FCP pauses remain1000ms. Effects are not disabled.','CDN dependencies are fulfilled from integrity-verified local replay, not measured over the production network.','Analytics is blocked by the test harness.','Lighthouse uses simulated throttling; scores are lab measurements and not directly comparable with public PageSpeed Insights.','Fresh Chrome profiles and reset storage are used per run. Render preflight precedes each audit; Lighthouse then performs its own navigation.','Performance measurements use natural animation timing: no clock, randomness or screenshot stabilization is injected.'],aggregate,measurements};
await fs.writeFile(path.join(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({output,aggregate},null,2));
