const {test,expect}=require('@playwright/test');
const h=require('./helpers.cjs');
const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');

test('every project presentation has a readable reference',async({page,context},info)=>{
 const {mode,language}=info.project.metadata,states=[],errors=[],cancelled=[];
 await h.routes(context);await h.seed(page);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('net::ERR_ABORTED'))errors.push('console.error: '+m.text());});
 page.on('requestfailed',r=>{if(r.failure()?.errorText==='net::ERR_ABORTED')cancelled.push(r.url());else errors.push(r.url()+' '+r.failure()?.errorText)});
 page.on('response',r=>{if(r.status()>=400)errors.push('HTTP '+r.status()+' '+r.url());});
 await h.ready(page,language);await page.clock.runFor(3000);
 const cards=h.projectCards(page,mode),inventory=require('../baseline/content-inventory.json').layouts[mode][language];
 for(let i=0;i<6;i++){
   if(mode==='desktop'||mode==='tablet-landscape')await h.scrollSection(page,h.selectors(mode).projects,i/5,true);
   else{const y=await cards.nth(i).evaluate(el=>el.getBoundingClientRect().top+scrollY-110);await h.scrollTo(page,y,true);}
   await cards.nth(i).locator('img').evaluateAll(async images=>{await Promise.all(images.map(img=>img.decode()));});
   await expect.poll(()=>cards.nth(i).locator('video').evaluateAll(videos=>videos.every(v=>!v.currentSrc||v.readyState>=2)),{timeout:10000}).toBe(true);
   await cards.nth(i).locator('video').evaluateAll(async videos=>{
     await Promise.all(videos.map(async v=>{if(v.readyState<2||!Number.isFinite(v.duration)||v.duration<=0)return;v.pause();v.playbackRate=0;const frame=0;if(Math.abs(v.currentTime-frame)>.005)await new Promise(resolve=>{v.addEventListener('seeked',resolve,{once:true});v.currentTime=frame;});}));
   });
   await new Promise(resolve=>setTimeout(resolve,200));
   const box=await cards.nth(i).boundingBox(),view=page.viewportSize();
   expect(box).not.toBeNull();expect(box.width).toBeGreaterThan(100);expect(box.height).toBeGreaterThan(100);
   expect(box.x).toBeGreaterThanOrEqual(-1);expect(box.y).toBeGreaterThanOrEqual(-1);
   expect(box.x+box.width).toBeLessThanOrEqual(view.width+1);expect(box.y+box.height).toBeLessThanOrEqual(view.height+1);
   const clip={x:Math.max(0,box.x),y:Math.max(0,box.y),width:Math.min(box.width,view.width-Math.max(0,box.x)),height:Math.min(box.height,view.height-Math.max(0,box.y))};
   const name='project-'+inventory[i].id;
   await expect(page).toHaveScreenshot(name+'.png',{clip,animations:'disabled'});
   states.push({name,id:inventory[i].id,title:inventory[i].title,clip,...await page.evaluate(()=>({scroll:{x:scrollX,y:scrollY},performanceNow:performance.now(),userAgent:navigator.userAgent,devicePixelRatio})),...await cards.nth(i).evaluate(el=>({text:el.textContent,url:el.getAttribute('href'),images:[...el.querySelectorAll('img')].map(img=>({src:img.getAttribute('src'),complete:img.complete,naturalWidth:img.naturalWidth,opacity:+getComputedStyle(img).opacity})),videos:[...el.querySelectorAll('video')].map(v=>({src:v.getAttribute('src'),currentTime:v.currentTime,readyState:v.readyState,paused:v.paused,playbackRate:v.playbackRate}))}))});
 }
 expect(errors).toEqual([]);
 const metadata={originalCommit:h.ORIGIN_COMMIT,project:info.project.name,emulation:info.project.metadata,browserVersion:page.context().browser().version(),playwrightVersion:require('@playwright/test/package.json').version,harnessSha256:crypto.createHash('sha256').update(await fs.readFile(__filename)).digest('hex'),runtimeManifestSha256:crypto.createHash('sha256').update(await fs.readFile(path.join(__dirname,'../runtime/manifest.json'))).digest('hex'),serverSha256:crypto.createHash('sha256').update(await fs.readFile(path.join(__dirname,'../runtime/server.mjs'))).digest('hex'),configuration:{clockEpoch:'2026-01-01T00:00:00.000Z',randomSeed:123456789,mediaFrameSeconds:0,screenshotScale:'css',cssAnimations:'disabled at screenshot only'},cancelledRequests:cancelled,states};
 const file=info.outputPath('project-capture-manifest.json');await fs.writeFile(file,JSON.stringify(metadata,null,2));await info.attach('project-capture-manifest',{path:file,contentType:'application/json'});
 if(process.env.UPDATE_BASELINE==='1')await fs.writeFile(path.join(__dirname,'references',info.project.name,'project-capture-manifest.json'),JSON.stringify(metadata,null,2));
});
