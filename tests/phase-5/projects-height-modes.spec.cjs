'use strict';

const { test, expect } = require('@playwright/test');
const responsive = require('./responsive-qa.helpers.cjs');
const qa = require('../qa/helpers.cjs');

const desktopCases = [
  { id: 'normal-1440x900', viewport: { width: 1440, height: 900 }, mode: 'normal' },
  { id: 'normal-1100x700', viewport: { width: 1100, height: 700 }, mode: 'normal' },
  { id: 'normal-boundary-1440x679', viewport: { width: 1440, height: 679 }, mode: 'normal' },
  { id: 'compact-boundary-1440x678', viewport: { width: 1440, height: 678 }, mode: 'compact' },
  { id: 'compact-1422x600', viewport: { width: 1422, height: 600 }, mode: 'compact' },
  { id: 'compact-ticket-fit-1440x502', viewport: { width: 1440, height: 502 }, mode: 'compact' },
  { id: 'flow-ticket-does-not-fit-1440x501', viewport: { width: 1440, height: 501 }, mode: 'flow' },
  { id: 'flow-1268x409', viewport: { width: 1268, height: 409 }, mode: 'flow' },
  { id: 'flow-2102x289', viewport: { width: 2102, height: 289 }, mode: 'flow' },
];

const tabletCases = [
  { id: 'normal-834x1112', viewport: { width: 834, height: 1112 }, mode: 'normal', orientation: 'portrait' },
  { id: 'normal-1194x834', viewport: { width: 1194, height: 834 }, mode: 'normal', orientation: 'landscape' },
  { id: 'compact-960x455', viewport: { width: 960, height: 455 }, mode: 'compact', orientation: 'landscape' },
  { id: 'flow-960x400', viewport: { width: 960, height: 400 }, mode: 'flow', orientation: 'landscape' },
];

async function settled(page, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForFunction(({ width, height }) => innerWidth === width && innerHeight === height, viewport);
  await responsive.settleLayout(page, 120);
  await page.waitForTimeout(50);
}

async function state(page, mode) {
  if (mode === 'desktop') {
    return page.evaluate(() => {
      const frame = document.querySelector('#kc-desktop-project-frame');
      const section = document.querySelector('#projets');
      const nav = document.querySelector('.kc-responsive-nav');
      const doc = frame.contentDocument;
      const heading = doc.querySelector('.heading');
      const rail = doc.querySelector('#rail');
      const cards = [...rail.querySelectorAll('.ticket')];
      const rect = (el) => { const r=el.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}; };
      return {
        mode: section.dataset.kcProjectsMode,
        profile: document.querySelector('#kc-desktop-projets')?.getClientRects().length ? 'desktop-active' : 'desktop-hidden',
        framePosition: getComputedStyle(frame).position,
        navPosition: getComputedStyle(nav).position,
        navBottom: nav.getBoundingClientRect().bottom,
        frameViewport: {width:doc.defaultView.innerWidth,height:doc.defaultView.innerHeight},
        sectionHeight: section.getBoundingClientRect().height,
        heading: rect(heading), headingClip: getComputedStyle(heading).clipPath,
        headingFont: getComputedStyle(heading).fontSize,
        cardCount: cards.length,
        cardHeight: cards[0]?.getBoundingClientRect().height,
        cards: cards.map((card) => ({rect:rect(card),href:card.href,title:card.querySelector('h2')?.textContent.trim(),media:card.querySelectorAll('.media-layer').length})),
        railTransform: getComputedStyle(rail).transform,
        aboutTop: document.querySelector('#apropos')?.getBoundingClientRect().top + scrollY,
        sectionTop: section.getBoundingClientRect().top + scrollY,
      };
    });
  }
  return page.evaluate(() => {
    const section=document.querySelector('#kc-tablet-projets'),stage=document.querySelector('#kc-t-stage');
    const viewport=document.querySelector('#kc-t-viewport'),rail=stage.querySelector('.tickets'),nav=document.querySelector('.kc-responsive-nav');
    const heading=stage.querySelector('h1'),cards=[...rail.querySelectorAll('.ticket')];
    const rect=(el)=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};};
    return {
      mode:section.dataset.kcProjectsMode,
      framePosition:getComputedStyle(section.querySelector('#projets-t')).position,
      navPosition:getComputedStyle(nav).position,
      sectionHeight:section.getBoundingClientRect().height,
      viewportOverflow:getComputedStyle(viewport).overflow,
      heading:rect(heading),headingClip:getComputedStyle(heading).clipPath,headingFont:getComputedStyle(heading).fontSize,
      cardCount:cards.length,cards:cards.map(card=>({rect:rect(card),href:card.href,title:card.querySelector('h2')?.textContent.trim(),media:card.querySelectorAll('.media-layer').length})),
      railTransform:getComputedStyle(rail).transform,
      aboutTop:document.querySelector('#apropos-t')?.getBoundingClientRect().top+scrollY,
      sectionTop:section.getBoundingClientRect().top+scrollY,
    };
  });
}

test('desktop Projects geometry modes preserve content, media, links and About continuation', async ({page,context}, info) => {
  const {mode,language}=info.project.metadata;
  test.skip(mode!=='desktop','The desktop mode sequence uses the fine-pointer desktop profile.');
  await responsive.initialize(page,context,language,info.project.metadata.viewport);
  await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  const records=[];
  for(const entry of desktopCases){
    await settled(page,entry.viewport);
    await expect(page.locator('#kc-desktop-project-frame')).toBeVisible();
    const before=await state(page,'desktop');
    expect(before.mode,`${entry.id} geometry=${JSON.stringify({navBottom:before.navBottom,cardHeight:before.cardHeight,frameViewport:before.frameViewport,viewport:entry.viewport})}`).toBe(entry.mode);
    expect(before.cardCount).toBe(6);
    expect(before.cards.every(card=>card.href.startsWith('https://')&&card.media>0)).toBe(true);
    expect(before.headingFont).toBe('56px');
    if(entry.mode==='normal'){
      expect(before.framePosition).toBe('sticky');
      expect(before.navPosition).toBe('fixed');
      expect(before.headingClip).not.toBe('inset(50%)');
    }else if(entry.mode==='compact'){
      expect(before.framePosition).toBe('sticky');
      expect(before.navPosition).toBe('fixed');
      expect(before.headingClip).toBe('inset(50%)');
      expect(before.cards[0].rect.top).toBeGreaterThanOrEqual(0);
      expect(before.cards[0].rect.bottom).toBeLessThanOrEqual(entry.viewport.height);
    }else{
      expect(before.framePosition).toBe('relative');
      expect(before.navPosition).toBe('absolute');
      expect(before.headingClip).toBe('inset(50%)');
      const start=await page.locator('#projets').evaluate(el=>el.getBoundingClientRect().top+scrollY);
      await page.evaluate(y=>scrollTo(0,y+24),start);
      await responsive.settleLayout(page,80);
      for(let index=0;index<6;index+=1){
        const box=await page.frameLocator('#kc-desktop-project-frame').locator('#rail .ticket').nth(index).evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,height:r.height};});
        const frameTop=await page.locator('#kc-desktop-project-frame').evaluate(el=>el.getBoundingClientRect().top);
        const cardDocumentTop=frameTop+box.top+await page.evaluate(()=>scrollY);
        await page.evaluate(y=>scrollTo(0,y),Math.max(0,cardDocumentTop-Math.max(8,Math.min(32,(entry.viewport.height-box.height)/2))));
        await responsive.settleLayout(page,60);
        const focused=page.frameLocator('#kc-desktop-project-frame').locator('#rail .ticket').nth(index);
        await focused.focus();
        expect(await focused.evaluate(el=>el===el.ownerDocument.activeElement),`${entry.id} ticket ${index+1} receives keyboard focus`).toBe(true);
        const textBounds=await focused.evaluate(el=>{const r=el.querySelector('.ticket-info').getBoundingClientRect();return {top:r.top,bottom:r.bottom,scrollHeight:el.ownerDocument.documentElement.scrollHeight};});
        expect(textBounds.bottom).toBeGreaterThan(textBounds.top);
        expect(textBounds.scrollHeight).toBeGreaterThan(0);
      }
      const about=await page.locator('#apropos').evaluate(el=>el.getBoundingClientRect().top+scrollY);
      await page.evaluate(y=>scrollTo(0,y+16),about);
      await responsive.settleLayout(page,80);
      expect(await page.locator('#apropos').evaluate(el=>{const r=el.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;})).toBe(true);
      expect(await page.locator('#projets').evaluate(el=>el.getBoundingClientRect().bottom+scrollY)).toBeCloseTo(about,0);
    }
    const projectTop=await page.locator('#projets').evaluate(el=>el.getBoundingClientRect().top+scrollY);
    await page.evaluate(y=>scrollTo(0,y),projectTop);
    await responsive.settleLayout(page,80);
    const capture=info.outputPath(`projects-${language}-${entry.id}.png`);
    await page.screenshot({path:capture,animations:'disabled'});
    await info.attach(`${entry.id}-${language}`,{path:capture,contentType:'image/png'});
    records.push({entry,state:await state(page,'desktop'),screenshot:capture});
  }
  const report=info.outputPath(`projects-height-modes-${language}-desktop.json`);
  await require('node:fs/promises').writeFile(report,JSON.stringify({records},null,2));
  await info.attach('desktop-projects-modes-measurements',{path:report,contentType:'application/json'});
});

test('tablet Projects modes preserve approved normal layouts and reflow only when height requires it', async ({page,context},info)=>{
  const {mode,language}=info.project.metadata;
  test.skip(mode!=='tablet-landscape','Tablet Projects mode tests use actual touch/coarse-pointer contexts.');
  await responsive.initialize(page,context,language,info.project.metadata.viewport);
  await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
  for(const entry of tabletCases){
    await settled(page,entry.viewport);
    const active=await responsive.readProfile(page);
    expect(active.mode).toBe('tablet');
    const record=await state(page,'tablet-landscape');
    expect(record.mode,entry.id).toBe(entry.mode);
    expect(record.cardCount).toBe(6);
    expect(record.cards.every(card=>card.href.startsWith('https://')&&card.media>0)).toBe(true);
    expect(record.headingFont).toBe('48px');
    if(entry.mode==='normal'){
      expect(record.framePosition).toBe('sticky');
      expect(record.navPosition).toBe('fixed');
      expect(record.headingClip).not.toBe('inset(50%)');
      if(entry.id==='normal-1194x834')expect(record.cards[0].rect.height).toBe(310);
    }else if(entry.mode==='compact'){
      expect(record.framePosition).toBe('sticky');
      expect(record.navPosition).toBe('fixed');
      expect(record.headingClip).toBe('inset(50%)');
      expect(record.cards[0].rect.height).toBe(310);
    }else{
      expect(record.framePosition).toBe('relative');
      expect(record.navPosition).toBe('absolute');
      expect(record.viewportOverflow).toBe('visible');
      expect(record.headingClip).toBe('inset(50%)');
    }
    const sectionTop=await page.locator('#kc-tablet-projets').evaluate(el=>el.getBoundingClientRect().top+scrollY);
    await page.evaluate(y=>scrollTo(0,y),sectionTop);
    await responsive.settleLayout(page,80);
    const capture=info.outputPath(`projects-${language}-${entry.id}.png`);
    await page.screenshot({path:capture,animations:'disabled'});
    await info.attach(`${entry.id}-${language}`,{path:capture,contentType:'image/png'});
  }
});
