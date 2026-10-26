const {test,expect}=require('@playwright/test');
const qa=require('../qa/helpers.cjs');
const data=require('../../content/projects.json');

test('mobile project sequences load ahead of approach and retain playback lifecycle',async({page,context},info)=>{
 const {mode,language}=info.project.metadata;
 test.skip(mode!=='mobile');
 await qa.routes(context);
 const sequencePaths=new Set(data.projects.flatMap(project=>(project.presentations.mobile.sequenceByLocale[language]||[]).slice(1)
   .map(src=>new URL(src,'http://127.0.0.1').pathname)));
 const requests=[];
 page.on('request',request=>{
   try { const path=new URL(request.url()).pathname; if(sequencePaths.has(path)) requests.push(path); } catch {}
 });
 await qa.ready(page,language);
 const cards=page.locator('#kc-mobile-projets .project');
 await expect(cards).toHaveCount(6);

 const farLayers=await cards.evaluateAll(elements=>elements.flatMap(card=>{
   const visual=card.querySelector('.visual');
   if(!visual)return[];
   const rect=visual.getBoundingClientRect();
   return rect.top>innerHeight+innerWidth?[...visual.querySelectorAll('.kc-mobile-slide')].map(img=>({id:card.dataset.projectId,src:img.getAttribute('src'),deferred:img.dataset.sequenceSrc||null})):[];
 }));
 expect(farLayers.length).toBeGreaterThan(0);
 expect(farLayers.every(layer=>!layer.src&&layer.deferred)).toBe(true);
 expect(requests).toEqual([]);

 const sequenced=await cards.evaluateAll(elements=>elements.filter(card=>card.dataset.sequence?.trim()).map(card=>card.dataset.projectId));
 expect(sequenced.length).toBeGreaterThan(0);
 for(const id of sequenced){
   const card=page.locator(`#kc-mobile-projets .project[data-project-id="${id}"]`);
   const visual=card.locator('.visual');
   const start=await visual.evaluate(el=>el.getBoundingClientRect().top+scrollY-innerHeight-innerWidth+24);
   await page.evaluate(y=>{scrollTo(0,Math.max(0,y));dispatchEvent(new Event('scroll'));},start);
   await expect.poll(()=>visual.locator('.kc-mobile-slide').evaluateAll(images=>images.length>0&&images.every(img=>img.complete&&img.naturalWidth>0)),{timeout:15000}).toBe(true);
   const stillAhead=await visual.evaluate(el=>el.getBoundingClientRect().top>=innerHeight);
   expect(stillAhead,`${id} sequence should be ready before the image block enters view`).toBe(true);
   await page.evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-innerHeight*.2),await visual.elementHandle());
   await expect.poll(()=>visual.locator('.kc-mobile-slide').evaluateAll(images=>images.some(img=>getComputedStyle(img).opacity==='1')),{timeout:5000}).toBe(true);
   await page.evaluate(()=>scrollTo(0,0));
   await page.waitForTimeout(80);
   await page.evaluate(el=>scrollTo(0,el.getBoundingClientRect().top+scrollY-innerHeight*.2),await visual.elementHandle());
   await expect.poll(()=>visual.locator('.kc-mobile-slide').evaluateAll(images=>images.some(img=>getComputedStyle(img).opacity==='1')),{timeout:5000}).toBe(true);
 }
 const lastSequenced=page.locator(`#kc-mobile-projets .project[data-project-id="${sequenced.at(-1)}"]`);
 const lastVisual=lastSequenced.locator('.visual');
 await lastVisual.scrollIntoViewIfNeeded();
 await expect.poll(()=>lastVisual.locator('.kc-mobile-slide').evaluateAll(images=>images.length>0&&images.every(img=>img.complete&&img.naturalWidth>0)),{timeout:15000}).toBe(true);
 await page.setViewportSize({width:320,height:568});
 await lastVisual.scrollIntoViewIfNeeded();
 await expect.poll(()=>lastVisual.locator('.kc-mobile-slide').evaluateAll(images=>images.length>0&&images.every(img=>img.complete&&img.naturalWidth>0))).toBe(true);
 await page.setViewportSize({width:430,height:900});
 await page.evaluate(()=>scrollTo(0,0));
 await lastVisual.scrollIntoViewIfNeeded();
 await expect.poll(()=>lastVisual.locator('.kc-mobile-slide').evaluateAll(images=>images.some(img=>getComputedStyle(img).opacity==='1')),{timeout:5000}).toBe(true);
 expect(new Set(requests)).toEqual(sequencePaths);
 expect(await cards.evaluateAll(elements=>elements.map(card=>card.dataset.projectId))).toEqual(data.canonicalOrder);
});

test('direct navigation into mobile Projects prepares a nearby sequence',async({page,context},info)=>{
 const {mode,language}=info.project.metadata;
 test.skip(mode!=='mobile');
 await qa.routes(context);
 await page.goto(language==='en'?'/en/#projets-m':'/#projets-m',{waitUntil:'load'});
 const projects=page.locator('#projets-m');
 await expect(projects).toBeVisible();
 const card=page.locator('#kc-mobile-projets .project[data-sequence]:not([data-sequence=""])').first();
 const visual=card.locator('.visual');
 await visual.scrollIntoViewIfNeeded();
 await expect.poll(()=>visual.locator('.kc-mobile-slide').evaluateAll(images=>images.length>0&&images.every(img=>img.complete&&img.naturalWidth>0)),{timeout:15000}).toBe(true);
});

test('reduced motion keeps sequence posters static while loading only on approach',async({page,context},info)=>{
 const {mode,language}=info.project.metadata;
 test.skip(mode!=='mobile');
 await page.emulateMedia({reducedMotion:'reduce'});
 await qa.routes(context);
 await qa.ready(page,language);
 const card=page.locator('#kc-mobile-projets .project[data-sequence]:not([data-sequence=""])').first();
 const visual=card.locator('.visual');
 const target=await visual.evaluate(el=>el.getBoundingClientRect().top+scrollY-innerHeight-innerWidth+24);
 await page.evaluate(y=>{scrollTo(0,Math.max(0,y));dispatchEvent(new Event('scroll'));},target);
 await expect.poll(()=>visual.locator('.kc-mobile-slide').evaluateAll(images=>images.length>0&&images.every(img=>img.complete&&img.naturalWidth>0)),{timeout:15000}).toBe(true);
 await visual.scrollIntoViewIfNeeded();
 await page.waitForTimeout(2100);
 await expect.poll(()=>visual.evaluate(el=>({poster:getComputedStyle(el.querySelector('.poster')).opacity,
   sequence:[...el.querySelectorAll('.kc-mobile-slide')].map(img=>getComputedStyle(img).opacity)}))).toEqual({poster:'1',sequence:await visual.locator('.kc-mobile-slide').evaluateAll(images=>images.map(()=> '0'))});
});
