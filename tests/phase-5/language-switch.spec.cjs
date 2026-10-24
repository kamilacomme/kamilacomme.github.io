const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('shared FR/EN language link stays aligned, keyboard reachable and preserves sections', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  await qa.routes(context);
  await qa.ready(page, language);

  const link = page.locator('[data-kc-language-switch]');
  const initialPath = language === 'fr' ? '/' : '/en/';
  const nextPath = language === 'fr' ? '/en/' : '/';
  const activeText = language === 'fr' ? 'FR' : 'EN';
  const expectedLabel = language === 'fr' ? /français.*anglais/i : /english.*french/i;
  await expect(link).toBeVisible();
  await expect(link).toHaveText(activeText);
  await expect(link).toHaveAttribute('href', nextPath);
  await expect(link).toHaveAttribute('aria-label', expectedLabel);
  await expect(page.locator('[data-kc-language-switch]')).toHaveCount(1);

  const measure = async (width, height) => {
    await page.setViewportSize({ width, height });
    await expect.poll(() => page.evaluate(mode => {
        const selector=mode==='desktop'?'[data-hplate]':mode==='mobile'?'.kc-mobile-hero-slideshow':'[data-kc-tablet-hero-slideshow]';
        const sw=document.querySelector('[data-kc-language-switch]').getBoundingClientRect();
        const plate=document.querySelector(selector).getBoundingClientRect();
        return Math.max(Math.abs(sw.right-plate.right),Math.abs(sw.bottom-plate.bottom));
      },mode), { timeout:5000 }).toBeLessThan(0.5);
    const state = await link.evaluate((el,mode) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const previewSelector=mode==='desktop'?'[data-hplate]':mode==='mobile'?'.kc-mobile-hero-slideshow':'[data-kc-tablet-hero-slideshow]';
      const preview=document.querySelector(previewSelector).getBoundingClientRect();
      let scale = 1;
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        const t = getComputedStyle(n).transform;
        if (t !== 'none') { const m = new DOMMatrixReadOnly(t); scale *= Math.hypot(m.a, m.b); }
      }
      return {
        rect: { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height },
        viewport: [innerWidth, innerHeight], clientWidth:document.documentElement.clientWidth,
        pageGutter:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kc-page-gutter')),
        bottomGutter:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kc-language-bottom-gutter')),
        hireRight:document.querySelector('[role="navigation"] a[href^="mailto"]').getBoundingClientRect().right,
        heroPreview:preview.width>0?{right:preview.right,bottom:preview.bottom}:null,
        position:cs.position, font:parseFloat(cs.fontSize), color:cs.color, bg:cs.backgroundColor,
        borderRadius:cs.borderRadius, outlineStyle:cs.outlineStyle, outlineWidth:cs.outlineWidth, scale,
      };
    },mode);
    expect(state.viewport).toEqual([width,height]);
    expect(state.position).toBe('fixed');
    expect(state.rect.width).toBe(44);
    expect(state.rect.height).toBe(44);
    expect(state.pageGutter).toBeGreaterThan(0);
    expect(state.bottomGutter).toBeGreaterThan(0);
    expect(state.rect.right).toBeCloseTo(state.clientWidth-state.pageGutter,1);
    expect(state.rect.bottom).toBeCloseTo(height-state.bottomGutter,1);
    expect(state.hireRight).toBeCloseTo(state.rect.right,1);
    if (state.heroPreview) {
      expect(state.heroPreview.right).toBeCloseTo(state.rect.right,0);
      expect(state.heroPreview.bottom).toBeCloseTo(state.rect.bottom,0);
    }
    expect(state.font).toBe(12);
    expect(state.scale).toBeCloseTo(1,4);
    expect(state.borderRadius).toBe('50%');
    expect(state.clientWidth).toBeLessThanOrEqual(width);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    return state;
  };

  const profileSize = info.project.metadata.viewport;
  const widths = mode === 'mobile'
    ? [[320,568],[375,812],[390,844],[430,932]]
    : mode === 'desktop'
      ? [[profileSize.width,profileSize.height], [Math.max(500,profileSize.width-40),Math.max(600,profileSize.height-80)], [1905,963], [1920,1080]]
      : [[profileSize.width,profileSize.height], [Math.max(500,profileSize.width-40),Math.max(600,profileSize.height-80)], [560,800], [716,555]];
  for (const [w,h] of widths) await measure(w,h);

  await link.focus();
  const focus = await link.evaluate(el => ({ style:getComputedStyle(el).outlineStyle, width:parseFloat(getComputedStyle(el).outlineWidth) }));
  expect(focus.style).toBe('solid');
  expect(focus.width).toBeGreaterThanOrEqual(2);

  const suffix = mode === 'mobile' ? '-m' : mode === 'tablet-portrait' || mode === 'tablet-landscape' ? '-t' : '';
  const projectId = `projets${suffix}`;
  const aboutId = `apropos${suffix}`;
  const projectSection = page.locator(`#${projectId}`);
  const projectTop = await projectSection.evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await qa.scrollTo(page, projectTop + Math.min(80, page.viewportSize().height*.15));
  const titleOverlap = await page.evaluate(mode => {
    const sw=document.querySelector('[data-kc-language-switch]').getBoundingClientRect();
    const intersects=r=>r.width>0&&r.height>0&&r.left<sw.right&&r.right>sw.left&&r.top<sw.bottom&&r.bottom>sw.top;
    if(mode==='desktop'){
      const frame=document.querySelector('#kc-desktop-project-frame');
      const fr=frame.getBoundingClientRect();
      return [...frame.contentDocument.querySelectorAll('.ticket h2')].map(el=>{const r=el.getBoundingClientRect();return intersects({left:r.left+fr.left,right:r.right+fr.left,top:r.top+fr.top,bottom:r.bottom+fr.top,width:r.width,height:r.height});}).some(Boolean);
    }
    const selector=mode==='mobile'?'#kc-mobile-projets .project h2':'#kc-tablet-projets .ticket h2';
    return [...document.querySelectorAll(selector)].some(el=>intersects(el.getBoundingClientRect()));
  }, mode);
  expect(titleOverlap).toBe(false);
  const projectScrollY = await page.evaluate(() => scrollY);
  await link.press('Enter');
  await expect(page).toHaveURL(new RegExp(`${nextPath.replaceAll('/','\\/')}#${projectId}$`));
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBeGreaterThan(projectScrollY - 5);
  await expect(page.locator('[data-kc-language-switch]')).toHaveText(language === 'fr' ? 'EN' : 'FR');

  // After the route change, the same one-click control returns to the prior locale
  // and preserves the active section through its corresponding static anchor.
  await page.locator('[data-kc-language-switch]').click();
  await expect(page).toHaveURL(new RegExp(`${initialPath.replaceAll('/','\\/')}#${projectId}$`));
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBeGreaterThan(projectScrollY - 5);

  const aboutTop = await page.locator(`#${aboutId}`).evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await qa.scrollTo(page, aboutTop + Math.min(80, page.viewportSize().height*.15));
  const aboutScrollY = await page.evaluate(() => scrollY);
  await page.locator('[data-kc-language-switch]').click();
  await expect(page).toHaveURL(new RegExp(`${nextPath.replaceAll('/','\\/')}#${aboutId}$`));
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBeGreaterThan(aboutScrollY - 5);
  await page.locator('[data-kc-language-switch]').click();
  await expect(page).toHaveURL(new RegExp(`${initialPath.replaceAll('/','\\/')}#${aboutId}$`));
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBeGreaterThan(aboutScrollY - 5);

  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const contactState = await page.evaluate(() => {
    const sw=document.querySelector('[data-kc-language-switch]').getBoundingClientRect();
    const overlaps = el => { const r=el.getBoundingClientRect(); return r.width>0&&r.height>0&&r.left<sw.right&&r.right>sw.left&&r.top<sw.bottom&&r.bottom>sw.top; };
    const controls=[...document.querySelectorAll('#contact a')];
    return { linkOverlaps:controls.filter(overlaps).map(a=>a.textContent.trim()), button:{x:sw.x,y:sw.y,w:sw.width,h:sw.height} };
  });
  expect(contactState.linkOverlaps).toEqual([]);
  const legalLink = page.locator('#contact [data-legal="legal"]').first();
  await legalLink.click();
  await expect(page.locator('[data-sheet="legal"]')).toBeVisible();
  const modalHit = await page.evaluate(() => {
    const r=document.querySelector('[data-kc-language-switch]').getBoundingClientRect();
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return { tag:hit?.tagName, dialog:hit?.closest('[role="dialog"]')?.getAttribute('data-sheet'), modalZ:+getComputedStyle(document.querySelector('[data-sheet="legal"]')).zIndex, switchZ:+getComputedStyle(document.querySelector('[data-kc-language-switch]')).zIndex };
  });
  expect(modalHit.modalZ).toBeGreaterThan(modalHit.switchZ);
  expect(modalHit.dialog).toBe('legal');
});
