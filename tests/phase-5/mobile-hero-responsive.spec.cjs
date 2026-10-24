const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('mobile Hero retains effective type, gutters and image composition while resizing', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'mobile', 'Mobile Hero matrix runs in the mobile browser profile only.');
  await qa.routes(context);

  async function openAt(width, height) {
    await page.setViewportSize({ width, height });
    await qa.ready(page, language);
    await expect(page.locator('.kc-mobile-hero')).toBeVisible();
    await expect(page.locator('.kc-mobile-hero-title')).toBeVisible();
  }

  async function inspect(width, height) {
    const state = await page.evaluate(() => {
      const hero = document.querySelector('.kc-mobile-hero');
      const title = hero.querySelector('.kc-mobile-hero-title');
      const portrait = hero.querySelector('.kc-mobile-hero-portrait');
      const cue = hero.querySelector('.kc-mobile-hero-scroll-cue');
      const slideshow = hero.querySelector('.kc-mobile-hero-slideshow');
      const logo = document.querySelector('.kc-responsive-nav > span');
      const rect = element => {
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      const scale = element => {
        let result = 1;
        for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
          const value = getComputedStyle(node).transform;
          if (value !== 'none') {
            const matrix = new DOMMatrixReadOnly(value);
            result *= Math.hypot(matrix.a, matrix.b);
          }
        }
        return result;
      };
      const textRects = [...title.children].flatMap(child => {
        const range = document.createRange();
        range.selectNodeContents(child);
        return [...range.getClientRects()].map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom }));
      });
      const slides = [...slideshow.children];
      return {
        viewport: [innerWidth, innerHeight],
        pageWidth: { client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth },
        hero: { ...rect(hero), scale: scale(hero) },
        title: { ...rect(title), font: parseFloat(getComputedStyle(title).fontSize), scale: scale(title),
          clientWidth: title.clientWidth, scrollWidth: title.scrollWidth, textRects },
        logo: rect(logo), portrait: rect(portrait), cue: { ...rect(cue), font: parseFloat(getComputedStyle(cue).fontSize), scale: scale(cue) },
        slideshow: { ...rect(slideshow), slides: slides.length,
          active: slides.findIndex(slide => parseFloat(getComputedStyle(slide).opacity) > 0.9),
          sources: slides.map(slide => getComputedStyle(slide).backgroundImage) },
        projectsTop: document.querySelector('#kc-mobile-projets').getBoundingClientRect().top + scrollY,
      };
    });

    expect(state.viewport).toEqual([width, height]);
    expect(state.hero.left).toBeCloseTo(0, 1);
    expect(state.hero.width).toBeCloseTo(width, 1);
    expect(state.hero.height).toBeCloseTo(height, 1);
    expect(state.hero.scale).toBeCloseTo(1, 4);
    expect(state.title.font).toBe(32);
    expect(state.title.scale).toBeCloseTo(1, 4);
    expect(state.title.left).toBeCloseTo(16, 1);
    expect(state.logo.left).toBeCloseTo(16, 1);
    expect(state.portrait.left).toBeCloseTo(16, 1);
    expect(state.cue.left).toBeCloseTo(16, 1);
    expect(state.cue.font).toBe(12);
    expect(state.cue.scale).toBeCloseTo(1, 4);
    expect(state.title.scrollWidth).toBeLessThanOrEqual(state.title.clientWidth + 1);
    expect(state.title.textRects.every(line => line.left >= 15 && line.right <= width - 15)).toBe(true);
    expect(state.title.top).toBeGreaterThanOrEqual(state.portrait.bottom + 10);
    expect(state.slideshow.slides).toBe(6);
    expect(state.slideshow.active).toBeGreaterThanOrEqual(0);
    expect(state.slideshow.sources.every(source => source.includes('preview-'))).toBe(true);
    expect(state.slideshow.left).toBeGreaterThanOrEqual(16);
    expect(state.slideshow.right).toBeLessThanOrEqual(width - 15);
    expect(state.pageWidth.scroll).toBeLessThanOrEqual(width + 1);
    expect(state.projectsTop).toBeCloseTo(height, 0);

    const titleRect = state.title;
    const slideRect = state.slideshow;
    expect(titleRect.right <= slideRect.left || titleRect.left >= slideRect.right ||
      titleRect.bottom <= slideRect.top || titleRect.top >= slideRect.bottom).toBe(true);
    const cueRect = state.cue;
    expect(cueRect.right <= slideRect.left || cueRect.left >= slideRect.right ||
      cueRect.bottom <= slideRect.top || cueRect.top >= slideRect.bottom).toBe(true);
    return state;
  }

  // Fresh loads cover supported narrow, standard and wide phone widths at short and tall heights.
  for (const [width, height] of [[320, 568], [375, 844], [390, 667], [430, 932]]) {
    await openAt(width, height);
    const before = await inspect(width, height);
    await expect.poll(() => page.locator('.kc-mobile-hero-slideshow > div').evaluateAll(slides =>
      slides.findIndex(slide => parseFloat(getComputedStyle(slide).opacity) > 0.9))).not.toBe(before.slideshow.active);
    if (width === 320) {
      const secondLineFragments = await page.locator('.kc-mobile-hero-title > span:last-child').evaluate(element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return range.getClientRects().length;
      });
      expect(secondLineFragments).toBeGreaterThan(1);
    }
  }

  // Continuous resize in both directions, including a landscape rotation through the tablet profile.
  await openAt(320, 568);
  for (const [width, height] of [[430, 740], [390, 568], [375, 932], [844, 390], [430, 740], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(180);
    if (width === 844) {
      await expect(page.locator('.kc-mobile-hero')).toBeHidden();
      await expect(page.locator('[data-kc-tablet-hero-title]')).toBeVisible();
    } else {
      await expect(page.locator('.kc-mobile-hero')).toBeVisible();
      await inspect(width, height);
    }
  }

  await page.evaluate(() => {
    const top = document.querySelector('#kc-mobile-projets').getBoundingClientRect().top + scrollY;
    scrollTo(0, top);
  });
  await expect(page.locator('#kc-mobile-projets h1')).toBeInViewport();
});
