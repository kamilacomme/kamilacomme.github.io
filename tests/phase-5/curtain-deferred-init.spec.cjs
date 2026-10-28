const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

const curtainResource = url => /curtain-cloth\.js|footer-curtain\.webp|three@0\.160\.0/i.test(url);

test('Footer curtain resources and WebGL initialization wait for the geometry prefetch area', async ({ page, context }, info) => {
  const { language } = info.project.metadata;
  await qa.routes(context);
  const requests = [];
  const diagnostics = [];
  page.on('console', message => diagnostics.push(`console:${message.type()}:${message.text()}`));
  page.on('requestfailed', request => diagnostics.push(`requestfailed:${request.url()}:${request.failure()?.errorText}`));
  page.on('request', request => { if (curtainResource(request.url())) requests.push(request.url()); });

  await qa.ready(page, language);
  // PortfolioController intentionally remeasures at 200, 800 and 2000 ms after
  // startup; establish the settled responsive geometry before testing its rail.
  await page.waitForFunction(() => performance.now() >= 2200);
  await page.addStyleTag({ content:'html { scroll-behavior:auto !important; }' });
  const initial = await page.evaluate(() => {
    const footer = document.querySelector('#contact').getBoundingClientRect();
    return { canvasCount:document.querySelectorAll('curtain-cloth canvas').length,
      curtainElementCount:document.querySelectorAll('curtain-cloth').length,
      footerTop:footer.top, viewportHeight:innerHeight };
  });
  expect(initial.curtainElementCount).toBe(0);
  expect(initial.canvasCount).toBe(0);
  expect(initial.footerTop).toBeGreaterThan(initial.viewportHeight);
  expect(requests).toEqual([]);

  // The footer should initialize about one viewport before becoming visible.
  const prefetchScrollY = Math.max(0, initial.footerTop + await page.evaluate(() => scrollY) - initial.viewportHeight * 1.5);
  // Let Chromium deliver the native scroll event. A synthetic `scroll` event bypasses
  // scroll-linked layout bookkeeping and can make tablet geometry restore the old position.
  await page.evaluate(y => { window.scrollTo({ top:y, behavior:'instant' }); }, prefetchScrollY);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  try { await expect(page.locator('curtain-cloth')).toHaveCount(1,{timeout:10000}); await qa.waitForCurtain(page); }
  catch(error) {
    const state=await page.evaluate(()=>({scrollY,viewportHeight:innerHeight,footerTop:document.querySelector('#contact')?.getBoundingClientRect().top,scrollHeight:document.scrollingElement.scrollHeight,curtainCount:document.querySelectorAll('curtain-cloth').length,canvasCount:document.querySelectorAll('curtain-cloth canvas').length}));
    throw new Error(`${error.message}\nCurtain diagnostics: ${JSON.stringify({state,requests,diagnostics})}`);
  }
  const prefetched = await page.evaluate(() => ({
    footerTop:document.querySelector('#contact').getBoundingClientRect().top,
    viewportHeight:innerHeight,
    canvasCount:document.querySelectorAll('curtain-cloth canvas').length,
    target:document.querySelector('curtain-cloth').target,
    textureWidth:document.querySelector('curtain-cloth').left.mat.map.image.naturalWidth,
  }));
  expect(prefetched.footerTop).toBeGreaterThan(prefetched.viewportHeight);
  expect(prefetched.canvasCount).toBe(1);
  expect(prefetched.textureWidth).toBeGreaterThan(0);
  expect(prefetched.target).toBeCloseTo(0, 2);
  expect(requests.some(url => /curtain-cloth\.js/i.test(url))).toBe(true);
  expect(requests.some(url => /footer-curtain\.webp/i.test(url))).toBe(true);
  expect(requests.some(url => /three@0\.160\.0/i.test(url))).toBe(true);

  // Leaving and revisiting the Footer reuses the one canvas and does not re-request assets.
  await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
  await page.waitForTimeout(100);
  await page.evaluate(() => window.scrollTo({top:document.scrollingElement.scrollHeight,behavior:'instant'}));
  await expect(page.locator('curtain-cloth canvas')).toHaveCount(1);
  expect(requests.filter(url => /curtain-cloth\.js/i.test(url))).toHaveLength(1);
});

test('a fast jump to the page end still activates the curtain exactly once', async ({ context }, info) => {
  const { language } = info.project.metadata;
  await qa.routes(context);
  const page = await context.newPage();
  const requests = [];
  page.on('request', request => { if (curtainResource(request.url())) requests.push(request.url()); });
  await qa.ready(page, language);
  await page.waitForFunction(() => performance.now() >= 2200);
  await page.addStyleTag({ content:'html { scroll-behavior:auto !important; }' });
  await expect(page.locator('curtain-cloth')).toHaveCount(0);
  expect(requests).toEqual([]);

  const footerDocTop = await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top + scrollY);
  await page.evaluate(y => { window.scrollTo({top:y-innerHeight*0.5,behavior:'instant'}); }, footerDocTop);
  await qa.waitForCurtain(page);
  const synchronized = await page.evaluate(() => {
    const footer=document.querySelector('#contact').getBoundingClientRect();
    const target=document.querySelector('curtain-cloth').target;
    const t=Math.max(0,Math.min(1,(innerHeight-footer.top)/Math.max(1,footer.height)));
    const p=Math.max(0,Math.min(1,(t-0.02)/0.78));
    return { top:footer.top, bottom:footer.bottom, height:footer.height, target, expected:p*p*(3-2*p) };
  });
  expect(synchronized.top).toBeLessThan(synchronized.bottom);
  expect(synchronized.bottom).toBeGreaterThan(0);
  expect(synchronized.target).toBeCloseTo(synchronized.expected, 2);

  await page.evaluate(() => {
    const root=document.scrollingElement;
    window.scrollTo({ top:root.scrollHeight, behavior:'instant' });
    window.dispatchEvent(new Event('scroll'));
  });
  await qa.waitForCurtain(page);
  await expect(page.locator('curtain-cloth canvas')).toHaveCount(1);
  expect(await page.locator('curtain-cloth').evaluate(el => el.left.mat.map.image.naturalWidth)).toBeGreaterThan(0);
  expect(requests.some(url => /curtain-cloth\.js/i.test(url))).toBe(true);
  await page.evaluate(() => window.scrollTo({ top:0, behavior:'instant' }));
  await page.waitForTimeout(100);
  await page.evaluate(() => window.scrollTo({ top:document.scrollingElement.scrollHeight, behavior:'instant' }));
  await expect(page.locator('curtain-cloth canvas')).toHaveCount(1);
  expect(requests.filter(url => /curtain-cloth\.js/i.test(url))).toHaveLength(1);
  await page.close();
});

test('curtain retains eager functional fallback when IntersectionObserver is unavailable', async ({ page, context }, info) => {
  test.skip(info.project.metadata.mode !== 'desktop');
  const { language } = info.project.metadata;
  await qa.routes(context);
  const requests = [];
  page.on('request', request => { if (curtainResource(request.url())) requests.push(request.url()); });
  await page.addInitScript(() => { window.IntersectionObserver = undefined; });
  await qa.ready(page, language);
  expect(await page.evaluate(() => typeof IntersectionObserver)).toBe('undefined');
  await qa.waitForCurtain(page);
  const footerTop = await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top);
  expect(footerTop).toBeGreaterThan(info.project.metadata.viewport.height);
  expect(requests.some(url => /curtain-cloth\.js/i.test(url))).toBe(true);
});
