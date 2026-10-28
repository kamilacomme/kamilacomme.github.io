const {test,expect}=require('@playwright/test');
const qa=require('../qa/helpers.cjs');
const data=require('../../content/about.json');

test('shared About records preserve all three layouts and scrolling animation',async({page,context},info)=>{
 const {mode,language}=info.project.metadata;
 await qa.routes(context);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await qa.ready(page,language);
 const layout=mode.startsWith('tablet')?'tablet':mode;
 const section=qa.selectors(mode).about;
 const cards=page.locator(qa.selectors(mode).cards);
 await expect(cards).toHaveCount(5);
 await expect(cards.evaluateAll(elements=>elements.map(element=>Number(element.dataset.i)))).resolves.toEqual([0,1,2,3,4]);
 for(let index=0;index<data.order.length;index++){
  const record=data.cards[index];
  const expected={...record.locales[language],...record.layoutOverrides[layout]?.[language]};
  const spans=cards.nth(index).locator('span');
  await expect(spans.nth(0)).toHaveText(expected.title);
  await expect(spans.nth(1)).toHaveText(expected.description);
 }

 await qa.scrollSection(page,section,0);
 const initial=await cards.evaluateAll(elements=>elements.map(element=>element.style.transform));
 await qa.scrollSection(page,section,.7);
 const settled=await cards.evaluateAll(elements=>elements.map(element=>element.style.transform));
 expect(initial).toHaveLength(5);
 expect(settled.some((transform,index)=>transform!==initial[index])).toBe(true);
 expect(errors).toEqual([]);
});
