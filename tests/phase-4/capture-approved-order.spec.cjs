const {test,expect}=require('@playwright/test');
const fs=require('node:fs/promises');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const qa=require('../qa/helpers.cjs');

test('capture only the approved canonical tablet project-order references',async({page,context},info)=>{
 test.skip(process.env.PHASE4_CAPTURE_ORDER_REFERENCES!=='1','reference capture is an explicit one-time operation');
 const {mode,language}=info.project.metadata;
 test.skip(!mode.startsWith('tablet-'),'only tablet project-order states changed');
 const profile=info.project.name;
 const directory=path.join(__dirname,'references',profile);
 await qa.routes(context);await qa.seed(page);
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await qa.ready(page,language);
 await page.clock.runFor(600);await page.clock.runFor(2400);
 const projects=qa.selectors(mode).projects;
 const cards=qa.projectCards(page,mode);
 const expected=qa.expectedOrder[mode];
 const rendered=await cards.evaluateAll(elements=>elements.map(element=>element.querySelector('h2')?.textContent.trim()));
 expect(rendered).toEqual(expected);

 const states=[];
 for(const [name,fraction] of [['start',0],['middle',.5],['end',1]]){
  await qa.scrollSection(page,projects,fraction,true);
  await qa.prepareVisualCapture(page);
  const file=path.join(directory,`projects-${name}.png`);
  if((await fs.stat(file).catch(()=>null)))throw new Error(`Refusing to overwrite approved-order reference ${file}`);
  await page.screenshot({path:file,fullPage:false,animations:'disabled',scale:'css',timeout:60000});
  states.push({name,viewport:page.viewportSize(),scroll:await page.evaluate(()=>({x:scrollX,y:scrollY})),projectIds:await cards.evaluateAll(elements=>elements.map(element=>element.dataset.projectId))});
 }
 const manifest={
  approvedDelta:'Canonical project order across all layouts: Pilates, Longread, Tour de parole, Inside Out, Celimax, Napoli.',
  sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  profile,language,browserVersion:page.context().browser().version(),
  configuration:{browser:'Chromium',headless:true,locale:'en-GB',timezoneId:'Europe/Paris',colorScheme:'light',reducedMotion:'no-preference',softwareWebGL:true,device:info.project.metadata},
  states
 };
 await fs.writeFile(path.join(directory,'approved-order-capture.json'),JSON.stringify(manifest,null,2)+'\n');
 expect(errors).toEqual([]);
});
