const { expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const ORIGIN_COMMIT='d8a37314ed7d2265f3f949c9e048b5e2beadfc20';
const expectedOrder={desktop:['Pilates','Longread','Tour de parole','Inside out','Celimax','Napoli'],mobile:['Pilates','Longread','Tour de parole','Inside out','Celimax','Napoli'],'tablet-portrait':['Celimax','Inside out','Napoli','Longread','Tour de parole','Pilates'],'tablet-landscape':['Celimax','Inside out','Napoli','Longread','Tour de parole','Pilates']};
const links={Pilates:'https://www.behance.net/gallery/254535151/Reform-pilates-studio-for-men',Longread:'https://readymag.website/u1448912666/perfectionism/','Tour de parole':'https://www.behance.net/gallery/256783201/Tour-de-parole-Negotiation-school-for-GenZ','Inside out':'https://www.youtube.com/watch?v=NG0HM9ApyP8',Celimax:'https://www.behance.net/gallery/255872777/Climax-3D-product-website',Napoli:'https://www.behance.net/gallery/257282669/Napoli-caffe-branding'};
async function routes(context){
  // Network fixture is test-only, preserves the original request URL and SRI bytes.
  const fixture = require('../runtime/replay.cjs');
  await fixture.installRuntimeRoutes(context);
}
async function ready(page,language){
  await page.goto(language==='en'?'/en/':'/',{waitUntil:'load'});
  await expect(page.locator('h1:visible').first()).toBeVisible();
  await expect(page.locator('[role="navigation"]')).toBeVisible();
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(['400 16px Figtree','700 16px Figtree','italic 400 16px Figtree','400 16px Inter','500 16px Inter','600 16px Inter'].map(font=>document.fonts.load(font,'Kamila Comme — à propos')));});
  await expect.poll(()=>page.evaluate(()=>document.fonts.check('400 16px Figtree')&&document.fonts.check('700 16px Figtree')&&document.fonts.check('400 16px Inter'))).toBe(true);
  await expect(page.locator('curtain-cloth canvas')).toHaveCount(1);
  await expect.poll(()=>page.locator('curtain-cloth').evaluate(el=>!!el.left?.mat?.map?.image?.complete&&el.left.mat.map.image.naturalWidth>0)).toBe(true);
}
function selectors(mode){return mode==='desktop'?{projects:'#kc-desktop-projets',about:'#apropos',cards:'#apropos [data-i]'}:mode==='mobile'?{projects:'#kc-mobile-projets',about:'#apropos-m',cards:'#apropos-m [data-i]'}:{projects:'#kc-tablet-projets',about:'#apropos-t',cards:'#apropos-t [data-i]'};}
function projectScope(page,mode){return mode==='desktop'?page.frameLocator('#kc-desktop-project-frame'):page.locator(selectors(mode).projects);}
function projectCards(page,mode){return projectScope(page,mode).locator(mode==='mobile'?'.project':'.ticket');}
async function documentBox(page,selector){return page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top+scrollY,height:r.height,width:r.width};});}
async function scrollTo(page,y,visual=false){await page.evaluate(y=>{window.scrollTo(0,y);window.dispatchEvent(new Event('scroll'));},Math.max(0,y));if(visual){await new Promise(r=>setTimeout(r,40));await page.clock.runFor(160)}else await page.waitForTimeout(160);}
async function scrollSection(page,selector,progress=0,visual=false){const r=await documentBox(page,selector);const h=page.viewportSize().height;await scrollTo(page,r.top+progress*Math.max(0,r.height-h),visual);return r;}
async function seed(page){
 await page.addInitScript(()=>{let value=123456789;Math.random=()=>{value=(1664525*value+1013904223)>>>0;return value/4294967296;};});
 const epoch=new Date('2026-01-01T00:00:00.000Z');
 await page.clock.install({time:epoch});await page.clock.pauseAt(new Date(epoch.getTime()+1));
}
async function freezeMedia(page){
 await expect.poll(()=>page.evaluate(()=>{const docs=[document,...[...document.querySelectorAll('iframe')].map(f=>{try{return f.contentDocument}catch{return null}}).filter(Boolean)];return docs.flatMap(doc=>[...doc.querySelectorAll('video')]).filter(v=>{const r=v.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth&&!!v.currentSrc}).every(v=>v.readyState>=2)}),{timeout:10000}).toBe(true);
 await page.evaluate(async()=>{for(const doc of [document,...[...document.querySelectorAll('iframe')].map(f=>{try{return f.contentDocument}catch{return null}}).filter(Boolean)]){
   for(const v of doc.querySelectorAll('video')){if(v.readyState<2||!Number.isFinite(v.duration)||v.duration<=0)continue;v.pause();v.playbackRate=0;const frame=0;if(Math.abs(v.currentTime-frame)>.005)await new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=frame;});}
 }});
 await new Promise(resolve=>setTimeout(resolve,200));
}
async function capture(page,testInfo,name,records){
 await page.evaluate(async()=>{for(const doc of [document,...[...document.querySelectorAll('iframe')].map(f=>{try{return f.contentDocument}catch{return null}}).filter(Boolean)]){await Promise.all([...doc.images].filter(i=>{const r=i.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth}).map(i=>i.decode()));}});
 await freezeMedia(page);
 if(process.env.REGRESSION_PROBE==='1'){if(process.env.UPDATE_BASELINE==='1')throw new Error('Refuse baseline update during negative-control probe');await page.addStyleTag({content:'h1 { color: #ff0000 !important; }'});}
 await expect(page).toHaveScreenshot(`${name}.png`,{animations:'disabled',timeout:60000});
 const record=await page.evaluate(()=>({scroll:{x:scrollX,y:scrollY},viewport:{width:innerWidth,height:innerHeight,devicePixelRatio},url:location.pathname,performanceNow:performance.now(),language:document.documentElement.lang,userAgent:navigator.userAgent,
   visibleHeadings:[...document.querySelectorAll('h1,h2')].filter(el=>el.getClientRects().length).map(el=>({text:el.textContent,rect:{x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}})),
   mobileImageLayers:[...document.querySelectorAll('#kc-mobile-projets .project')].map(c=>({title:c.querySelector('h2')?.textContent,layers:[...c.querySelectorAll('.visual img')].map(i=>({src:i.getAttribute('src'),complete:i.complete,naturalWidth:i.naturalWidth,opacity:+getComputedStyle(i).opacity}))})),
   videoState:[...document.querySelectorAll('video')].map(v=>({src:v.getAttribute('src'),readyState:v.readyState,currentTime:v.currentTime,paused:v.paused})),
   curtainProgress:document.querySelector('curtain-cloth')?.progress,projectRailTransform:(document.querySelector('#kc-desktop-project-frame')?.contentDocument?.querySelector('#rail')||document.querySelector('#kc-t-stage .tickets'))?.style.transform}));
 records.push({name,...record});
}
async function saveManifest(page,testInfo,records){
 const crypto=require('node:crypto');const hashes={};for(const name of ['helpers.cjs','visual.spec.cjs','playwright.config.cjs'])hashes[name]=crypto.createHash('sha256').update(await fs.readFile(path.join(__dirname,name))).digest('hex');hashes.runtimeManifest=crypto.createHash('sha256').update(await fs.readFile(path.join(__dirname,'../runtime/manifest.json'))).digest('hex');hashes.server=crypto.createHash('sha256').update(await fs.readFile(path.join(__dirname,'../runtime/server.mjs'))).digest('hex');
 const metadata={cancelledRequests:page.__qaAborts||[],cancellationPolicy:'net::ERR_ABORTED from original remount/pruning is recorded separately; all other request failures and HTTP errors fail. Visible images decode, required fonts and curtain texture must load.',harnessHashes:hashes,originalCommit:ORIGIN_COMMIT,browserVersion:page.context().browser().version(),project:testInfo.project.name,emulation:testInfo.project.metadata,configuration:{playwrightVersion:require('@playwright/test/package.json').version,platform:process.platform,architecture:process.arch,osRelease:require('node:os').release(),executable:process.env.CHROMIUM_PATH||'/usr/bin/chromium',launchArgs:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--autoplay-policy=no-user-gesture-required'],headless:true,locale:'en-GB',timezoneId:'Europe/Paris',colorScheme:'light',reducedMotion:'no-preference',softwareWebGL:true,randomSeed:123456789,clockEpoch:'2026-01-01T00:00:00.000Z',videoFrameSeconds:0,cssAnimations:'disabled for screenshots only',screenshotAcquisitionTimeoutMs:60000,footerClockAdvance:'18x500ms with50ms real yields to drain software GPU queues'},states:records};
 const file=testInfo.outputPath('capture-manifest.json');await fs.writeFile(file,JSON.stringify(metadata,null,2));await testInfo.attach('capture-manifest',{path:file,contentType:'application/json'});
 if(process.env.UPDATE_BASELINE==='1') {const dir=path.join(__dirname,'references',testInfo.project.name);await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'capture-manifest.json'),JSON.stringify(metadata,null,2));}
}
module.exports={ORIGIN_COMMIT,expectedOrder,links,routes,ready,selectors,projectScope,projectCards,documentBox,scrollTo,scrollSection,seed,capture,saveManifest};
