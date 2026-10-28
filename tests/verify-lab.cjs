const fs=require('node:fs');
const os=require('node:os');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const config=require('./qa/playwright.config.cjs');
const version=execFileSync(config.use.launchOptions.executablePath,['--version'],{encoding:'utf8'}).match(/\d+\.\d+\.\d+\.\d+/)?.[0];
for(const project of config.projects){
  const reference=JSON.parse(fs.readFileSync(`tests/qa/references/${project.name}/capture-manifest.json`,'utf8'));
  if(reference.browserVersion!==version)throw new Error(`Browser differs from ${project.name} reference: ${version} vs ${reference.browserVersion}`);
  const serverHash=crypto.createHash('sha256').update(fs.readFileSync('tests/runtime/server.mjs')).digest('hex');
  if(reference.harnessHashes.server!==serverHash)throw new Error(`Static server differs from ${project.name} reference.`);
  if(reference.configuration.playwrightVersion!==require('@playwright/test/package.json').version)throw new Error('Playwright version differs from recorded baseline.');
  if(reference.configuration.platform!==os.platform()||reference.configuration.architecture!==os.arch())throw new Error('Platform/architecture differs from recorded baseline.');
  if(JSON.stringify(reference.emulation)!==JSON.stringify(project.metadata))throw new Error(`Device configuration changed: ${project.name}`);
  if(project.use.userAgent && reference.states[0].userAgent!==project.use.userAgent)throw new Error(`Device user agent changed: ${project.name}`);
  for(const name of ['viewport','isMobile','hasTouch','deviceScaleFactor']) if(JSON.stringify(reference.emulation[name])!==JSON.stringify(project.use[name]))throw new Error(`Project use setting changed: ${project.name}/${name}`);
  if(config.use.serviceWorkers!=='block')throw new Error('Runtime replay requires service workers blocked.');
  if(JSON.stringify(reference.configuration.launchArgs)!==JSON.stringify(config.use.launchOptions.args))throw new Error('Chromium launch arguments changed.');
  for(const name of ['locale','timezoneId','colorScheme','reducedMotion','headless'])if(reference.configuration[name]!==config.use[name])throw new Error(`Browser setting changed: ${name}`);
}
console.log(`PASS: Chromium ${version}, Playwright, platform, launch flags and all eight device profiles match the reference lab.`);
