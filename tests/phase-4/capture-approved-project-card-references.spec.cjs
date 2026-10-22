const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const path=require('node:path');
const qa=require('../qa/helpers.cjs');

test('capture per-project crops for the approved tablet ordering',async({page,context},info)=>{
 test.skip(process.env.PHASE4_CAPTURE_PROJECT_REFERENCES!=='1','project reference capture is an explicit one-time operation');
 const {mode,language}=info.project.metadata;
 test.skip(!mode.startsWith('tablet-'),'only tablet project crops need replacement');
 const profile=info.project.name,directory=path.join(__dirname,'references',profile);
 await qa.routes(context);await qa.seed(page);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await qa.ready(page,language);await page.clock.runFor(3000);
 const selectors=qa.selectors(mode),cards=qa.projectCards(page,mode);
 expect(await cards.evaluateAll(elements=>elements.map(element=>element.dataset.projectId))).toEqual(['pilates','longread','tour-de-parole','inside-out','celimax','napoli']);
 const captured=[];
 for(let i=0;i<await cards.count();i++){
  const card=cards.nth(i),id=await card.getAttribute('data-project-id');
  if(mode==='tablet-landscape')await qa.scrollSection(page,selectors.projects,i/5,true);
  else{const y=await card.evaluate(element=>element.getBoundingClientRect().top+scrollY-110);await qa.scrollTo(page,y,true);}
  await card.locator('img').evaluateAll(async images=>{await Promise.all(images.map(image=>image.decode()));});
  await expect.poll(()=>card.locator('video').evaluateAll(videos=>videos.every(video=>!video.currentSrc||video.readyState>=2)),{timeout:10000}).toBe(true);
  await card.locator('video').evaluateAll(videos=>videos.forEach(video=>{video.style.visibility='hidden';video.pause();}));
  await new Promise(resolve=>setTimeout(resolve,200));
  const box=await card.boundingBox(),view=page.viewportSize();expect(box,`card bounds: ${id}`).not.toBeNull();
  const clip={x:Math.max(0,box.x),y:Math.max(0,box.y),width:Math.min(box.width,view.width-Math.max(0,box.x)),height:Math.min(box.height,view.height-Math.max(0,box.y))};
  const file=path.join(directory,`project-${id}.png`),existing=await fs.lstat(file).catch(()=>null);
  if(existing){if(!existing.isSymbolicLink())throw new Error(`Refusing to overwrite an independent Phase 4 reference: ${file}`);await fs.unlink(file);}
  await page.screenshot({path:file,clip,animations:'disabled',scale:'css',timeout:60000});
  captured.push({id,clip,viewport:view,scroll:await page.evaluate(()=>({x:scrollX,y:scrollY}))});
 }
 expect(errors).toEqual([]);
 const manifestFile=path.join(directory,'approved-order-capture.json'),manifest=JSON.parse(await fs.readFile(manifestFile,'utf8'));
 manifest.projectCards=captured;
 await fs.writeFile(manifestFile,JSON.stringify(manifest,null,2)+'\n');
});
