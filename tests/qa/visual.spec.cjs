const {test,expect}=require('@playwright/test');
const h=require('./helpers.cjs');
test.beforeEach(async({context,page})=>{
 await h.routes(context);await h.seed(page);page.__qaErrors=[];page.__qaAborts=[];
 page.on('pageerror',e=>page.__qaErrors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('net::ERR_ABORTED'))page.__qaErrors.push('console.error: '+m.text());});
 page.on('requestfailed',r=>{if(r.failure()?.errorText==='net::ERR_ABORTED')page.__qaAborts.push(r.url());else page.__qaErrors.push('requestfailed: '+r.url()+' '+r.failure()?.errorText);});
 page.on('response',r=>{if(r.status()>=400)page.__qaErrors.push('HTTP '+r.status()+': '+r.url());});
});
test.afterEach(async({page})=>{expect(page.__qaErrors || []).toEqual([]);});
test('approved visual and animation states',async({page},info)=>{
 const {mode,language}=info.project.metadata,states=[];
 await h.ready(page,language);
 await page.clock.runFor(600);await h.capture(page,info,'hero-intro-600ms',states);
 await page.clock.runFor(2400);await h.capture(page,info,'hero-settled-3000ms',states);
 const projects=h.selectors(mode).projects;
 for(const [name,fraction] of [['start',0],['middle',.5],['end',1]]){
  await h.scrollSection(page,projects,fraction,true);await h.capture(page,info,`projects-${name}`,states);
 }
 if(mode==='mobile'){
  const cards=h.projectCards(page,mode),target=cards.nth(h.expectedOrder[mode].indexOf('Tour de parole'));
  const y=await target.evaluate(el=>el.getBoundingClientRect().top+scrollY-100);await h.scrollTo(page,y,true);
  for(let i=0;i<3;i++){await page.clock.runFor(1900);await h.capture(page,info,`mobile-image-sequence-${i}`,states);}
 }
 const about=h.selectors(mode).about;
 for(const [name,fraction] of [['entry',0],['rising',.4],['settled',.9]]){
  await h.scrollSection(page,about,fraction,true);await h.capture(page,info,`about-${name}`,states);
 }
 const footer=await h.documentBox(page,'#contact');
 await h.scrollTo(page,footer.top-page.viewportSize().height*.6,true);await page.clock.runFor(600);await h.capture(page,info,'footer-entering',states);
 await h.scrollTo(page,await page.evaluate(()=>document.documentElement.scrollHeight),true);for(let elapsed=0;elapsed<9000;elapsed+=500){await page.clock.runFor(500);await new Promise(r=>setTimeout(r,50));}expect(await page.locator('curtain-cloth').evaluate(el=>el.progress)).toBeGreaterThan(.95);await h.capture(page,info,'footer-closed',states);
 for(const key of ['legal','privacy']){
  await page.locator(`a[data-legal="${key}"]:visible`).first().click();await page.clock.runFor(200);
  await expect(page.locator(`[data-sheet="${key}"]`)).toBeVisible();
  await h.capture(page,info,`dialog-${key}`,states);
  await page.keyboard.press('Escape');
 }
 await h.saveManifest(page,info,states);
});
