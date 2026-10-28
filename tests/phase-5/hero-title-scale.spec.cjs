const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('desktop and tablet Hero headings keep their approved effective sizes', async ({ page: fixturePage, context: fixtureContext, browser }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode === 'mobile', 'Mobile Hero typography remains in the mobile layout milestone.');
  let page = fixturePage;
  let context = fixtureContext;
  if (mode !== 'desktop') {
    // Resize sweeps need stable CSS-pixel dimensions. The legacy tablet project
    // used iPad isMobile + DPR 2 emulation; Chromium can retain a device-scaled
    // layout viewport during page.setViewportSize(), so the geometry owner never
    // observes the exact requested width/height. Keep the tablet's coarse pointer
    // capability while using exact CSS viewport dimensions, as in the focused
    // short-height Hero suite.
    context = await browser.newContext({
      baseURL: process.env.BASE_URL || 'http://127.0.0.1:8001',
      viewport: info.project.metadata.viewport,
      screen: info.project.metadata.viewport,
      isMobile: false,
      hasTouch: true,
      deviceScaleFactor: 1,
      locale: 'en-GB',
      timezoneId: 'Europe/Paris',
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      serviceWorkers: 'block',
    });
    page = await context.newPage();
  }
  await qa.routes(context);
  await qa.ready(page, language);

  const heading = page.locator(mode === 'desktop' ? '.kc-desktop-hero-title' : '[data-kc-tablet-hero-title]');
  await expect(heading).toBeVisible();
  const measured = await heading.evaluate((element, mode) => {
    const rect = element.getBoundingClientRect();
    let x = 1, y = 1;
    for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
      const transform = getComputedStyle(node).transform;
      if (transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(transform);
        x *= Math.hypot(matrix.a, matrix.b);
        y *= Math.hypot(matrix.c, matrix.d);
      }
    }
    return {
      fontSize: parseFloat(getComputedStyle(element).fontSize),
      width: rect.width,
      x: rect.left,
      y: rect.top,
      contentWidth: element.clientWidth,
      contentScrollWidth: element.scrollWidth,
      ancestorScale: { x, y },
      layoutScale: mode === 'desktop'
        ? parseFloat(getComputedStyle(element).getPropertyValue('--kc-desktop-hero-scale'))
        : 1,
      childOverflow: [...element.children].map(child => child.scrollWidth - child.clientWidth),
      logoLeft: document.querySelector('.kc-responsive-nav > span').getBoundingClientRect().left,
      cue: (() => {
        const cue = document.querySelector('[data-kc-tablet-hero-controls] span');
        if (!cue) return null;
        const cueRect = cue.getBoundingClientRect();
        return { fontSize: parseFloat(getComputedStyle(cue).fontSize), x: cueRect.left, scaleX: x };
      })(),
    };
  }, mode);

  expect(measured.fontSize).toBe(mode === 'desktop' ? 56 : 48);
  expect(measured.ancestorScale.x).toBeCloseTo(1, 4);
  expect(measured.ancestorScale.y).toBeCloseTo(1, 4);
  if (mode === 'desktop') {
    expect(measured.x).toBeCloseTo(32 * measured.layoutScale, 1);
    expect(measured.y).toBeCloseTo(130 * measured.layoutScale, 1);
  } else {
    expect(measured.x).toBeCloseTo(measured.logoLeft, 1);
    expect(measured.y).toBeCloseTo(128, 1);
    expect(measured.childOverflow.every(width => width <= 1)).toBe(true);
    expect(measured.cue.fontSize).toBe(12);
    expect(measured.cue.x).toBeCloseTo(measured.logoLeft, 1);
  }
  expect(measured.contentScrollWidth).toBeLessThanOrEqual(measured.contentWidth + 1);

  if (mode !== 'desktop') {
    const slides = page.locator('[data-kc-tablet-hero-slideshow] > div');
    await expect(slides).toHaveCount(6);
    const activeBefore = await slides.evaluateAll(elements => elements.findIndex(element => parseFloat(getComputedStyle(element).opacity) > 0.9));
    expect(activeBefore).toBeGreaterThanOrEqual(0);
    await expect.poll(() => slides.evaluateAll(elements => elements.findIndex(element => parseFloat(getComputedStyle(element).opacity) > 0.9))).toBe((activeBefore + 1) % 6);

    const viewports = [
      { width: 500, height: 834 }, { width: 500, height: 600 }, { width: 500, height: 400 },
      { width: 560, height: 800 },
      { width: 659, height: 834 }, { width: 799, height: 1112 },
      { width: 834, height: 1112 }, { width: 839, height: 834 },
      { width: 1024, height: 600 }, { width: 1194, height: 834 },
    ];
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await expect.poll(() => page.evaluate(({ width, height }) =>
        window.__kcTabletLayout?.width === width && window.__kcTabletLayout?.height === height,
      viewport)).toBe(true);
      const resized = await heading.evaluate(element => {
        const navLogo = document.querySelector('.kc-responsive-nav > span').getBoundingClientRect();
        const cue = document.querySelector('[data-kc-tablet-hero-controls] span');
        const controls = document.querySelector('[data-kc-tablet-hero-controls]');
        const box = element.getBoundingClientRect();
        const cueRect = cue.getBoundingClientRect();
        const controlsRect = controls.getBoundingClientRect();
        const transformScale = target => {
          let scale = 1;
          for (let node = target; node && node.nodeType === 1; node = node.parentElement) {
            const value = getComputedStyle(node).transform;
            if (value !== 'none') scale *= Math.hypot(new DOMMatrixReadOnly(value).a, new DOMMatrixReadOnly(value).b);
          }
          return scale;
        };
        const slideshow = document.querySelector('[data-kc-tablet-hero-slideshow]').getBoundingClientRect();
        const titleTextRects = [...element.children].flatMap(child => {
          const range = document.createRange();
          range.selectNodeContents(child);
          return [...range.getClientRects()].map(rect => ({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }));
        });
        return {
          titleLeft: box.left, titleWidth: box.width, logoLeft: navLogo.left,
          titleTop: box.top, titleFont: parseFloat(getComputedStyle(element).fontSize),
          titleScale: transformScale(element),
          childOverflow: [...element.children].map(child => child.scrollWidth - child.clientWidth),
          cueLeft: cueRect.left, cueFont: parseFloat(getComputedStyle(cue).fontSize),
          cueScale: transformScale(cue), controlsLeft: controlsRect.left,
          slideshow: { left: slideshow.left, right: slideshow.right, top: slideshow.top, bottom: slideshow.bottom, width: slideshow.width, height: slideshow.height, ratio: slideshow.width / slideshow.height },
          titleTextRects,
          scrollWidth: document.documentElement.scrollWidth,
        };
      });
      expect(resized.titleLeft).toBeCloseTo(resized.logoLeft, 1);
      expect(resized.titleFont).toBe(48);
      expect(resized.titleScale).toBeCloseTo(1, 4);
      expect(resized.cueLeft).toBeCloseTo(resized.logoLeft, 1);
      expect(resized.cueFont).toBe(12);
      expect(resized.cueScale).toBeCloseTo(1, 4);
      expect(resized.controlsLeft).toBeCloseTo(resized.logoLeft, 1);
      expect(resized.childOverflow.every(width => width <= 1)).toBe(true);
      expect(resized.slideshow.left).toBeGreaterThanOrEqual(resized.logoLeft);
      expect(resized.slideshow.right).toBeLessThanOrEqual(viewport.width - resized.logoLeft + 0.75);
      expect(resized.slideshow.width).toBeGreaterThan(0);
      expect(resized.slideshow.width).toBeLessThanOrEqual(325.1);
      expect(resized.slideshow.ratio).toBeCloseTo(326 / 204, 2);
      expect(resized.scrollWidth).toBeLessThanOrEqual(viewport.width + 1);
      const titleCollision = resized.titleTextRects.some(line =>
        line.left < resized.slideshow.right && line.right > resized.slideshow.left &&
        line.top < resized.slideshow.bottom && line.bottom > resized.slideshow.top);
      // getAttribute() on a locator waits for a matching element. In the normal
      // state this marker is intentionally absent, so read it synchronously from
      // the document and treat absence as the null (normal) mode.
      const heroMode = await page.evaluate(() =>
        document.querySelector('[data-kc-hero-mode]')?.getAttribute('data-kc-hero-mode') ?? null,
      );
      if (viewport.width === 500 && viewport.height === 400) {
        // The measured heading + controls + readable slideshow no longer fit in the
        // viewport, so this case uses the same natural-flow fallback as other constrained heights.
        expect(heroMode).toBe('flow');
        expect(resized.titleTop).toBeGreaterThanOrEqual(72);
        expect(resized.slideshow.width).toBeGreaterThanOrEqual(229.9);
        expect(titleCollision).toBe(false);
      } else {
        expect(resized.titleTop).toBeCloseTo(128, 1);
        expect(titleCollision).toBe(false);
        expect(heroMode).toBeNull();
        expect(resized.slideshow.width).toBeGreaterThanOrEqual(229.9);
      }
    }
  }
});
