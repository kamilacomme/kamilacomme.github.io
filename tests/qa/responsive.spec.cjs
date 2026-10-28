const {test,expect}=require('@playwright/test');
const h=require('./helpers.cjs');
test('responsive breakpoint and rotation contracts',async({page,context},info)=>{
 const {mode,language}=info.project.metadata;
 test.skip(language!=='fr'||!['desktop','tablet-portrait'].includes(mode),'Boundary matrix runs once per pointer profile; bilingual layout captures run separately');
 await h.routes(context);await h.ready(page,language);
 const widths=mode==='desktop'?[[499,'mobile'],[500,'tablet'],[1079,'tablet'],[1080,'desktop'],[1366,'desktop'],[1367,'desktop']]:[[499,'mobile'],[500,'tablet'],[1079,'tablet'],[1080,'tablet'],[1366,'tablet'],[1367,'desktop']];
 for(const [width,branch] of widths){
  await page.setViewportSize({width,height:900});
  await expect(page.locator(branch==='desktop'?'#kc-desktop-projets':branch==='mobile'?'#kc-mobile-projets':'#kc-tablet-projets')).toBeVisible();
 }
 if(mode==='tablet-portrait'){
  await page.setViewportSize({width:834,height:1112});await expect(page.locator('#kc-tablet-projets')).not.toHaveClass(/kc-landscape-rail/);
  await page.setViewportSize({width:1194,height:834});await expect(page.locator('#kc-tablet-projets')).toHaveClass(/kc-landscape-rail/);
  await page.setViewportSize({width:834,height:1112});await expect(page.locator('#kc-tablet-projets')).not.toHaveClass(/kc-landscape-rail/);
  expect(await page.locator('#kc-t-stage .tickets').evaluate(el=>getComputedStyle(el).flexDirection)).toBe('column');
 }
});
