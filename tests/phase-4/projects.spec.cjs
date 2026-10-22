const {test,expect}=require('@playwright/test');
const qa=require('../qa/helpers.cjs');
const data=require('../../content/projects.json');
const ids=data.canonicalOrder;
const expectedLinks=Object.fromEntries(data.projects.map(project=>[project.id,project.url]));

test('generated route exposes canonical project records and media per layout',async({page,context},info)=>{
 const {mode,language}=info.project.metadata;
 await qa.routes(context);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await qa.ready(page,language);
 const cards=qa.projectCards(page,mode);
 await expect(cards).toHaveCount(6);
 await expect(cards.evaluateAll(elements=>elements.map(element=>element.dataset.projectId))).resolves.toEqual(ids);
 for(const card of await cards.all()){
   const id=await card.getAttribute('data-project-id');
   expect(await card.getAttribute('href')).toBe(expectedLinks[id]);
   await expect(card.locator('h2')).not.toBeEmpty();
   await expect(card.locator(mode==='mobile'?'.description':'.ticket-info p, .info p')).not.toBeEmpty();
   expect(await card.locator(mode==='mobile'?'.categories span':'.tags span').count()).toBeGreaterThan(0);
 }
 expect(errors).toEqual([]);
 const mainResponse=await page.request.get(language==='en'?'/en/':'/');
 const source=await mainResponse.text();
 expect(source).not.toContain('/en/i18n.js');
 expect(source).not.toContain("fetch('/index.html'");
 if(language==='en'){
   await expect(page.locator('html')).toHaveAttribute('lang','en');
   await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href','https://kamilacomme.github.io/en/');
   expect(source).toContain('/scripts/projects/english-tablet-footer-alignment.js');
   expect(source).not.toMatch(/href="#/);
 }
});

test('mobile image sequences remain locale-specific and data-driven',async({page,context},info)=>{
 test.skip(info.project.metadata.mode!=='mobile');
 const {language}=info.project.metadata;
 await qa.routes(context); await qa.ready(page,language);
 const base=require('../baseline/content-inventory.json').mobileImageSequences;
 for(const id of Object.keys(base)){
   const card=page.locator(`#kc-mobile-projets .project[data-project-id="${id}"]`);
   await card.scrollIntoViewIfNeeded();
   const expected=language==='en'?[...base[id],...base[id].slice(1)]:base[id];
   await expect.poll(()=>card.locator('.visual img').count()).toBe(expected.length);
   expect(await card.locator('.visual img').evaluateAll(images=>images.map(image=>image.getAttribute('src')))).toEqual(expected);
 }
});
