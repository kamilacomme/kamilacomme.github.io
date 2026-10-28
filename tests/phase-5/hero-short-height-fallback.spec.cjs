const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

const matrix = {
  desktop: [
    { id: '1440x289-horizontal', width: 1440, height: 289, expected: 'horizontal' },
    { id: '1707x188-flow', width: 1707, height: 188, expected: 'flow' },
    { id: '1440x900-control', width: 1440, height: 900, expected: null },
  ],
  'tablet-landscape': [
    { id: '500x188-flow', width: 500, height: 188, expected: 'flow' },
    { id: '834x1112-control', width: 834, height: 1112, expected: null },
  ],
  mobile: [
    { id: '320x188-flow', width: 320, height: 188, expected: 'flow' },
    { id: '393x852-control', width: 393, height: 852, expected: null },
  ],
};

function activeSelectors(profile) {
  if (profile === 'mobile') return {
    root: '.kc-mobile-hero', title: '.kc-mobile-hero-title', plate: '.kc-mobile-hero-slideshow',
    portrait: '.kc-mobile-hero-portrait', cue: '.kc-mobile-hero-scroll-cue', slides: '.kc-mobile-hero-slideshow > div',
    next: '#projets-m', font: 32,
  };
  if (profile === 'tablet-landscape') return {
    root: '[data-kc-tablet-hero-slideshow]', title: '[data-kc-tablet-hero-title]',
    plate: '[data-kc-tablet-hero-slideshow]', portrait: '[data-kc-tablet-hero-controls] > div',
    cue: '[data-kc-tablet-hero-controls] > span', slides: '[data-kc-tablet-hero-slideshow] > div',
    next: '#kc-tablet-projets', font: 48,
  };
  return {
    root: '.kc-desktop-hero-title', title: '.kc-desktop-hero-title', plate: '[data-hplate]',
    portrait: '.kc-desktop-hero-portrait', cue: '.kc-desktop-hero-scroll-cue',
    slides: '[data-hplate] > div', next: '#projets', font: 56,
  };
}

async function readState(page, profile, expectedMode) {
  const s = activeSelectors(profile);
  return page.evaluate(({ selectors, expectedMode }) => {
    const get = selector => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { rect: { x: rect.x, y: rect.y, left: rect.left, right: rect.right,
        top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
        fontSize: parseFloat(getComputedStyle(element).fontSize),
        position: getComputedStyle(element).position,
        display: getComputedStyle(element).display };
    };
    const title = document.querySelector(selectors.title);
    const root = document.querySelector('[data-kc-hero-mode]')
      || (selectors.root === '.kc-mobile-hero' ? title?.closest('.kc-mobile-hero')?.parentElement
        : selectors.root === '[data-kc-tablet-hero-slideshow]' ? title?.parentElement?.parentElement
          : title?.parentElement?.parentElement);
    const transforms = [];
    for (let node = title; node && node.nodeType === 1; node = node.parentElement) {
      const value = getComputedStyle(node).transform;
      if (value !== 'none') {
        const matrix = new DOMMatrixReadOnly(value);
        transforms.push(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d));
      }
      if (node === root) break;
    }
    const plate = get(selectors.plate), cue = get(selectors.cue), nav = get('.kc-responsive-nav');
    const inactiveDesktopPlate = get('[data-hplate]');
    const titleElement = document.querySelector(selectors.title);
    const titleFragments = [...titleElement.children].flatMap(child => {
      const range = document.createRange(); range.selectNodeContents(child);
      return [...range.getClientRects()].map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom }));
    });
    const parts = { title: titleFragments, plate: [plate.rect], portrait: [get(selectors.portrait).rect], cue: [cue.rect] };
    const collisions = [];
    const overlaps = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
    const names = Object.keys(parts);
    for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
      const a = parts[names[i]], b = parts[names[j]];
      if (a.some(x => b.some(y => overlaps(x, y)))) collisions.push(`${names[i]}/${names[j]}`);
    }
    return {
      mode: document.querySelector('[data-kc-hero-mode]')?.getAttribute('data-kc-hero-mode') || null,
      viewport: { width: innerWidth, height: innerHeight, layoutWidth: document.documentElement.clientWidth },
      actualResponsiveProfile: getComputedStyle(document.querySelector('.kc-responsive-nav')).display === 'none'
        ? 'hidden' : document.querySelector('.kc-responsive-nav').classList.contains('kc-tablet-nav')
          ? 'tablet' : document.querySelector('.kc-mobile-hero')
            && getComputedStyle(document.querySelector('.kc-mobile-hero')).display !== 'none' ? 'mobile' : 'desktop',
      root: root ? { height: root.getBoundingClientRect().height, scrollHeight: root.scrollHeight } : null,
      title: get(selectors.title), plate, portrait: get(selectors.portrait), cue, nav,
      inactiveDesktopPlate,
      titleScale: transforms.reduce((a, v) => a * v, 1),
      ratio: plate?.rect.height ? plate.rect.width / plate.rect.height : null,
      pageScrollWidth: document.documentElement.scrollWidth,
      collisions,
      navPosition: nav?.position,
      slideOpacities: [...document.querySelectorAll(selectors.slides)].map(el => parseFloat(getComputedStyle(el).opacity)),
      expectedMode,
    };
  }, { selectors: s, expectedMode });
}

async function settleAt(page, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await expect.poll(() => page.evaluate(() => ({ width: innerWidth, height: innerHeight })))
    .toEqual({ width: viewport.width, height: viewport.height });
  await expect.poll(() => page.evaluate(() => document.fonts.status === 'loaded')).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  // The existing owner runs a short post-resize fit after the dynamic viewport and
  // tablet frame settle; inspect the resulting composition rather than its transient.
  await page.waitForTimeout(300);
}

test('short-height Hero modes, reachability and normal controls', async ({ page, context, browser }, info) => {
  const profile = info.project.metadata.mode;
  const cases = matrix[profile];
  test.skip(!cases, 'The Hero constraints use the actual desktop, tablet-landscape and mobile profiles.');
  const { language } = info.project.metadata;
  const selectors = activeSelectors(profile);
  let activePage = page;
  let activeContext = context;
  let isolatedResponsiveContext = null;
  if (profile === 'tablet-landscape' || profile === 'mobile') {
    // Keep touch as a real input capability while using exact CSS-pixel viewport
    // dimensions. The app's existing width/profile owner selects tablet/mobile.
    isolatedResponsiveContext = await browser.newContext({
      baseURL: process.env.BASE_URL || 'http://127.0.0.1:8001', viewport: { width: cases[0].width, height: cases[0].height },
      // The supported layout viewport stays in CSS pixels. Touch is emulated as
      // input capability; the product's own width/profile owner still chooses tablet
      // or mobile from the resulting viewport.
      isMobile: false, hasTouch: true, deviceScaleFactor: 1,
      screen: { width: cases[0].width, height: cases[0].height },
      locale: 'en-GB', timezoneId: 'Europe/Paris', colorScheme: 'light', reducedMotion: 'no-preference',
    });
    activeContext = isolatedResponsiveContext;
    activePage = await isolatedResponsiveContext.newPage();
  }
  await qa.routes(activeContext);
  await activePage.setViewportSize({ width: cases[0].width, height: cases[0].height });
  await qa.ready(activePage, language);

  const evidence = [];
  for (const viewport of cases) {
    await settleAt(activePage, viewport);
    const state = await readState(activePage, profile, viewport.expected);
    evidence.push({ viewport: { width: viewport.width, height: viewport.height }, language,
      responsiveProfile: profile, ...state });
    expect(state.mode, viewport.id).toBe(viewport.expected);
    expect(state.actualResponsiveProfile, `${viewport.id} uses the expected input-selected profile`)
      .toBe(profile === 'tablet-landscape' ? 'tablet' : profile);
    if (profile !== 'desktop') {
      expect(state.inactiveDesktopPlate.rect.width, `${viewport.id} inactive desktop slideshow remains hidden`).toBe(0);
    }
    expect(state.title.fontSize, `${viewport.id} effective Hero title`).toBe(selectors.font);
    expect(state.titleScale, `${viewport.id} no text-bearing ancestor scale`).toBeCloseTo(1, 4);
    expect(state.cue.fontSize, `${viewport.id} effective scroll-cue size`).toBe(12);
    expect(state.plate.rect.width, `${viewport.id} slideshow is rendered`).toBeGreaterThan(0);
    expect(state.ratio, `${viewport.id} slideshow aspect ratio`).toBeCloseTo(326 / 204, 2);
    expect(state.collisions, `${viewport.id} Hero essentials do not overlap`).toEqual([]);
    if (viewport.expected === 'flow') {
      expect(state.plate.rect.height, `${viewport.id} complete slideshow can fit in the viewport`).toBeLessThanOrEqual(viewport.height - 24);
    }
    expect(state.pageScrollWidth, `${viewport.id} no page-level horizontal overflow`)
      .toBeLessThanOrEqual(state.viewport.width + 1);
    for (const selector of [selectors.title, selectors.plate, selectors.portrait, selectors.cue]) {
      await activePage.locator(selector).scrollIntoViewIfNeeded();
      const bounds = await activePage.locator(selector).evaluate(el => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
      });
      expect(bounds.width, `${viewport.id} ${selector} remains rendered`).toBeGreaterThan(0);
      expect(bounds.height, `${viewport.id} ${selector} remains rendered`).toBeGreaterThan(0);
      expect(bounds.top, `${viewport.id} ${selector} can be scrolled into view`).toBeGreaterThanOrEqual(-1);
      expect(bounds.bottom, `${viewport.id} ${selector} can be scrolled into view`).toBeLessThanOrEqual(viewport.height + 1);
    }
    if (viewport.expected === 'flow') {
      expect(state.navPosition, `${viewport.id} Navbar scrolls with the natural-flow Hero`).toBe('absolute');
      expect(state.root.height, `${viewport.id} Hero grows beyond the constrained viewport`).toBeGreaterThan(viewport.height);
    }
    if (viewport.expected === 'horizontal') {
      expect(state.root.height, `${viewport.id} horizontal reflow retains one-screen Hero height`).toBeCloseTo(viewport.height, 0);
      expect(state.plate.rect.height).toBeGreaterThanOrEqual(183);
    }
    if (viewport.expected === null) {
      expect(state.navPosition).toBe('fixed');
      if (profile === 'desktop') {
        expect(state.title.rect.x).toBeCloseTo(32, 1);
        expect(state.title.rect.y).toBeCloseTo(130, 1);
        expect(state.plate.rect.width).toBeCloseTo(325, 1);
      } else if (profile === 'tablet-landscape') {
        expect(state.title.rect.x).toBeCloseTo(32, 1);
        expect(state.title.rect.y).toBeCloseTo(128, 1);
      } else {
        expect(state.title.rect.x).toBeCloseTo(16, 1);
        expect(state.title.rect.y).toBeCloseTo(152, 1);
      }
    }

    const slides = activePage.locator(selectors.slides);
    await expect(slides).toHaveCount(6);
    const before = state.slideOpacities.findIndex(opacity => opacity > 0.9);
    expect(before).toBeGreaterThanOrEqual(0);
    await expect.poll(() => slides.evaluateAll(elements => elements.findIndex(el => parseFloat(getComputedStyle(el).opacity) > 0.9)))
      .not.toBe(before);

    const shot = info.outputPath(`hero-${language}-${viewport.id}.png`);
    await activePage.screenshot({ path: shot, animations: 'disabled' });
    await info.attach(`hero-${language}-${viewport.id}`, { path: shot, contentType: 'image/png' });
  }

  // Exercise a fresh short→normal→short transition in each actual profile.
  const short = cases.find(item => item.expected);
  const control = cases.find(item => item.expected === null);
  await settleAt(activePage, short);
  expect((await readState(activePage, profile)).mode).toBe(short.expected);
  await settleAt(activePage, control);
  expect((await readState(activePage, profile)).mode).toBeNull();
  await settleAt(activePage, short);
  expect((await readState(activePage, profile)).mode).toBe(short.expected);

  const next = activePage.locator(selectors.next);
  await next.scrollIntoViewIfNeeded();
  await expect(next).toBeVisible();
  const transition = await next.evaluate(el => ({ top: el.getBoundingClientRect().top,
    heroBottom: document.querySelector('[data-kc-hero-mode]')?.getBoundingClientRect().bottom }));
  expect(transition.top).toBeLessThan(info.project.metadata.viewport.height);

  const cta = activePage.locator('.kc-responsive-nav a[href^="mailto:"]').first();
  await cta.focus();
  await expect(cta).toBeFocused();
  await expect(cta).toBeVisible();

  const report = info.outputPath(`hero-${language}-${profile}-geometry.json`);
  await require('node:fs/promises').writeFile(report, JSON.stringify(evidence, null, 2));
  await info.attach('Hero geometry evidence', { path: report, contentType: 'application/json' });
  await isolatedResponsiveContext?.close();
});
