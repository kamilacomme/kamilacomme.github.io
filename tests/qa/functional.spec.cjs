const {test,expect}=require('@playwright/test');
const h=require('./helpers.cjs');
test.beforeEach(async({context,page})=>{
 await h.routes(context); page.__qaErrors=[];page.__qaAborts=[];
 page.on('pageerror',e=>page.__qaErrors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('net::ERR_ABORTED'))page.__qaErrors.push('console.error: '+m.text());});
 page.on('requestfailed',r=>{if(r.failure()?.errorText==='net::ERR_ABORTED')page.__qaAborts.push(r.url());else page.__qaErrors.push('requestfailed: '+r.url()+' '+r.failure()?.errorText);});
 page.on('response',r=>{if(r.status()>=400)page.__qaErrors.push('HTTP '+r.status()+': '+r.url());});
});
test.afterEach(async({page})=>{expect(page.__qaErrors || []).toEqual([]);});

test('rendering, localized content, responsive branch and all project links',async({page,context},info)=>{
 const {mode,language}=info.project.metadata;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await h.ready(page,language);await page.waitForTimeout(500);
 await expect(page.locator('html')).toHaveAttribute('lang',language);
 await expect(page.locator(h.selectors(mode).projects)).toBeVisible();
 for(const other of ['desktop','tablet-portrait','mobile']) if(h.selectors(other).projects!==h.selectors(mode).projects) await expect(page.locator(h.selectors(other).projects)).toBeHidden();
 const cards=h.projectCards(page,mode);
 await expect(cards).toHaveCount(6);
 await expect(cards.locator('h2')).toHaveText(h.expectedOrder[mode]);
 for(let i=0;i<6;i++){
   const card=cards.nth(i),title=h.expectedOrder[mode][i];
   await expect(card).toHaveAttribute('href',h.links[title]);
   await expect(card).toHaveAttribute('target','_blank');
   expect(await card.getAttribute('rel')).toContain('noopener');
   const desc=card.locator(mode==='mobile'?'.description':'.ticket-info p, .info p');
   await expect(desc).not.toBeEmpty();
 }
 // Rendered inventory contract detects changes in descriptions, tags, links and order.
 const inventory=require('../baseline/content-inventory.json');
 const baseline=inventory.layouts[mode][language];
 for(let i=0;i<6;i++){
   const card=cards.nth(i);
   const projectId=await card.getAttribute('data-project-id');
   const entry=baseline.find(record=>record.id===projectId);
   expect(entry,`frozen project record exists: ${projectId}`).toBeTruthy();
   expect(await card.locator('h2').evaluate(el=>el.textContent)).toBe(entry.title);
   expect(await card.locator(mode==='mobile'?'.description':'.ticket-info p, .info p').evaluate(el=>el.textContent)).toBe(entry.description);
   expect(await card.locator(mode==='mobile'?'.categories span':'.tags span').allTextContents()).toEqual(entry.tags);
   if(entry.accessibleName!==null)expect(await card.getAttribute('aria-label')).toBe(entry.accessibleName);
   const actualMedia=await card.locator('img,video').evaluateAll(es=>es.map(el=>({element:el.tagName.toLowerCase(),paths:[el.getAttribute('src'),el.getAttribute('data-src')].filter(Boolean).map(v=>new URL(v,document.baseURI).pathname)})));
   for(const media of entry.media){
     const expectedPath='/'+(media.src||media['data-src']);
     expect(actualMedia.some(actual=>actual.element===media.element&&actual.paths.includes(expectedPath))).toBe(true);
   }
   const painted=await card.evaluate(el=>[el.getAttribute('style')||'',getComputedStyle(el).backgroundImage,getComputedStyle(el,'::before').backgroundImage].join(' '));
   for(const asset of entry.styleAssets)expect(painted).toContain(asset);

 }
 await h.scrollSection(page,h.selectors(mode).projects,0);
 // Exercise actual browser keyboard activation for every outbound project. Destinations
 // are fulfilled in the isolated context so no third-party site is visited.
 await context.route(/https:\/\/(www\.behance\.net|readymag\.website|www\.youtube\.com)\//,route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Outbound link test</title>'}));
 for(let i=0;i<6;i++){
   await h.scrollSection(page,h.selectors(mode).projects,mode==='desktop'||mode==='tablet-landscape'?i/5:0);
   const popupPromise=context.waitForEvent('page');
   await cards.nth(i).press('Enter');
   const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');
   expect(popup.url()).toBe(h.links[h.expectedOrder[mode][i]]);await popup.close();
 }
 // Pointer/tap activation at both rail edges catches overlay interception that
 // keyboard activation alone cannot detect (notably the Projects/About boundary).
 for(const index of [0,5]){
   await h.scrollSection(page,h.selectors(mode).projects,index===0?0:1);
   if(mode==='mobile'||mode==='tablet-portrait')await cards.nth(index).scrollIntoViewIfNeeded();
   const popupPromise=context.waitForEvent('page');
   if(info.project.metadata.hasTouch)await cards.nth(index).tap();else await cards.nth(index).click();
   const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');
   expect(popup.url()).toBe(h.links[h.expectedOrder[mode][index]]);await popup.close();
 }
 await expect(page.locator('[role="navigation"] a[href^="mailto:"]')).toHaveAttribute('href','mailto:comme.kamila@gmail.com?subject=Un%20CDI%20chez%20nous%20%3F');
 expect(errors).toEqual([]);
});

test('navigation, About animation, footer and legal dialog interactions',async({page},info)=>{
 const {mode,language}=info.project.metadata;await h.ready(page,language);
 const nav=page.locator('[role="navigation"]');
 if(mode==='desktop') for(const label of language==='en'?['Projects','About','Contact']:['Projets','À propos','Contact']){
  const link=nav.getByRole('link',{name:label,exact:true});await link.click();
  const targetHash=new URL(page.url()).hash;
  await expect.poll(()=>page.evaluate(hash=>{const el=document.getElementById(hash.slice(1));if(!el)return 9999;const top=el.getBoundingClientRect().top+scrollY;const expected=Math.min(top,document.documentElement.scrollHeight-innerHeight);return Math.abs(scrollY-expected);},targetHash)).toBeLessThan(3);
  expect(new URL(page.url()).pathname).toBe(language==='en'?'/en/':'/');
  expect(new URL(page.url()).hash).toMatch(label==='Contact'?/#contact/:label==='About'||label==='À propos'?/#apropos(?:-t|-m)?/:/#projets(?:-t|-m)?/);
 } else {
  for(const href of ['#projets-'+(mode==='mobile'?'m':'t'),'#apropos-'+(mode==='mobile'?'m':'t'),'#contact']) await expect(nav.locator(`a[href="${href}"]`)).toBeHidden();
  await expect(nav.locator('a[href^="mailto:"]')).toBeVisible();
 }
 const about=h.selectors(mode).about;
 await h.scrollSection(page,about,0);
 const cards=page.locator(h.selectors(mode).cards);
 const initial=await cards.evaluateAll(es=>es.map(e=>({top:e.getBoundingClientRect().top,transform:e.style.transform})));
 await h.scrollSection(page,about,.7);
 const final=await cards.evaluateAll(es=>es.map(e=>({top:e.getBoundingClientRect().top,transform:e.style.transform})));
 expect(initial.length).toBe(5);expect(final.some((v,i)=>v.transform!==initial[i].transform)).toBe(true);
 await h.scrollTo(page,await page.evaluate(()=>document.documentElement.scrollHeight));
 await expect(page.locator('#contact')).toBeVisible();
 await expect.poll(()=>page.locator('curtain-cloth').evaluate(el=>el.progress),{timeout:15000}).toBeGreaterThan(.1);
 await expect(page.locator('#contact [data-c="3"], #contact video[data-src*="footer-walk"]')).toHaveCount(0);
 for(const key of ['legal','privacy']){
   await page.locator(`a[data-legal="${key}"]:visible`).first().click();
   const dialog=page.locator(`[role="dialog"][data-sheet="${key}"]`);
   await expect(dialog).toBeVisible();await expect(dialog.locator('[data-close]')).toBeFocused();
   await expect(dialog.locator('[data-body]')).toContainText(language==='en'?'website':'site');
   await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
   await page.locator(`a[data-legal="${key}"]:visible`).first().click();
   await dialog.locator('[data-close]').click();await expect(dialog).toBeHidden();
 }
});

test('project video playback and animated image sequences use real media',async({page},info)=>{
 const {mode,language}=info.project.metadata;await h.ready(page,language);
 const cards=h.projectCards(page,mode);
 for(const title of ['Pilates','Longread','Inside out']){
  // Locator has() across FrameLocator is unsupported, so resolve by approved order.
  const index=h.expectedOrder[mode].indexOf(title),target=cards.nth(index);
  await h.scrollSection(page,h.selectors(mode).projects,mode==='desktop'||mode==='tablet-landscape'?index/5:0);
  await target.scrollIntoViewIfNeeded();
  if(mode==='desktop')await target.hover();
  const video=target.locator('video');
  await expect.poll(()=>video.evaluate(v=>({ready:v.readyState,playing:!v.paused,decoded:v.videoWidth>0})),{timeout:20000}).toMatchObject({playing:true,decoded:true});
  const first=await video.evaluate(v=>v.currentTime);await page.waitForTimeout(450);
  const second=await video.evaluate(v=>v.currentTime);expect(Math.abs(second-first)).toBeGreaterThan(.02);
 }
 if(mode==='mobile')for(const title of ['Tour de parole','Celimax','Napoli']){
   const target=cards.nth(h.expectedOrder[mode].indexOf(title));await target.scrollIntoViewIfNeeded();
   const id=title==='Tour de parole'?'tour-de-parole':title.toLowerCase();
   const base=require('../baseline/content-inventory.json').mobileImageSequences[id];
   const expectedSources=language==='en'?[...base,...base.slice(1)]:base;
   const layers=target.locator('.visual img');await expect(layers).toHaveCount(expectedSources.length);
   expect(await layers.evaluateAll(es=>es.map(e=>e.getAttribute('src')))).toEqual(expectedSources);
   const visibleCycle=language==='en'?[0,3,4]:[0,1,2];
   const visible=()=>layers.evaluateAll(es=>{const visible=es.map((e,i)=>({i,opacity:+getComputedStyle(e).opacity})).filter(x=>x.opacity>.99);return visible.length===1?visible[0].i:null;});
   let first=null;
   await expect.poll(async()=>{const current=await visible();if(visibleCycle.includes(current))first=current;return first!==null;},{timeout:4500}).toBe(true);
   expect(visibleCycle).toContain(first);
   await expect.poll(visible,{timeout:6000}).toBe(visibleCycle[(visibleCycle.indexOf(first)+1)%visibleCycle.length]);
 }
});
