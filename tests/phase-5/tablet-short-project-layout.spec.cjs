const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('short tablet landscape keeps all ticket content clear of the Projects heading', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'tablet-landscape', 'The short-landscape rail is a tablet layout.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);

  const viewport = { width: 960, height: 455 };
  await page.setViewportSize(viewport);
  await page.clock.runFor(400);
  await expect.poll(() => page.evaluate(() => window.__kcTabletLayout?.width)).toBe(viewport.width);
  await expect.poll(() => page.locator('#kc-tablet-projets').evaluate(root => root.classList.contains('kc-landscape-rail'))).toBe(true);
  await qa.scrollSection(page, '#kc-tablet-projets', 0);
  await page.clock.runFor(100);

  const measure = () => page.evaluate(() => {
    const section = document.querySelector('#kc-tablet-projets');
    const stage = section.querySelector('#kc-t-stage');
    const heading = stage.querySelector('h1');
    const rail = stage.querySelector('.tickets');
    const cards = [...rail.querySelectorAll('.ticket')];
    const rect = el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const headingBottom = heading.offsetTop + heading.offsetHeight;
    const bottomTop = innerHeight - 32 - cards[0].getBoundingClientRect().height;
    const introShift = Math.max(0, headingBottom + 24 - bottomTop);
    const scrollLength = section.getBoundingClientRect().height - innerHeight;
    return {
      viewport: { width: innerWidth, height: innerHeight },
      heading: rect(heading), rail: rect(rail), cards: cards.map(rect),
      headingFont: getComputedStyle(heading).fontSize,
      mode: section.dataset.kcProjectsMode,
      headingClip: getComputedStyle(heading).clipPath,
      transform: getComputedStyle(rail).transform,
      horizontalTranslation: new DOMMatrixReadOnly(getComputedStyle(rail).transform).m41,
      introShift, horizontalTravel: scrollLength - introShift,
      projectTop: section.getBoundingClientRect().top + scrollY,
      projectHeight: section.getBoundingClientRect().height,
      aboutTop: section.parentElement.querySelector('#apropos-t').getBoundingClientRect().top + scrollY,
    };
  });
  const setScroll = async y => {
    await page.evaluate(value => { window.scrollTo({ top: value, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); }, y);
    await page.clock.runFor(100);
  };

  const start = await measure();
  expect(start.headingFont).toBe('48px');
  expect(start.mode).toBe('compact');
  expect(start.headingClip).toBe('inset(50%)');
  await expect(page.getByRole('heading', { name: language === 'en' ? /A selection of my projects recent work/i : /Une sélection de mes projets récents/i })).toHaveCount(1);
  expect(start.cards).toHaveLength(6);
  expect(start.cards[0].width).toBe(770);
  expect(start.cards[0].height).toBe(310);
  expect(start.cards[0].top).toBeGreaterThanOrEqual(95.9);
  expect(start.cards[0].bottom).toBeLessThanOrEqual(viewport.height - 31.5);
  await page.screenshot({ path: info.outputPath(`tablet-projects-${language}-960x455-start.png`) });

  await setScroll(start.projectTop + start.introShift / 2);
  const middle = await measure();
  expect(middle.cards[0].top).toBeGreaterThanOrEqual(95.9);
  expect(middle.horizontalTranslation).toBeLessThanOrEqual(0);
  await page.screenshot({ path: info.outputPath(`tablet-projects-${language}-960x455-reflow.png`) });

  await setScroll(start.projectTop + start.introShift);
  const settled = await measure();
  expect(settled.cards[0].top).toBeGreaterThanOrEqual(95.9);
  expect(settled.cards[0].bottom).toBeLessThanOrEqual(viewport.height - 31.5);
  expect(Math.abs(settled.cards[0].top - (viewport.height - 32 - 310))).toBeLessThanOrEqual(1);
  await page.screenshot({ path: info.outputPath(`tablet-projects-${language}-960x455-ticket-visible.png`) });

  const endY = start.projectTop + start.projectHeight - viewport.height;
  await setScroll(endY);
  const end = await measure();
  expect(end.horizontalTranslation).toBeCloseTo(-start.horizontalTravel, 0);
  expect(end.cards[0].top).toBeGreaterThanOrEqual(95.9);
  expect(Math.abs(end.cards.at(-1).right - (viewport.width - 32))).toBeLessThanOrEqual(1);
  expect(Math.abs(end.aboutTop - (end.projectTop + end.projectHeight))).toBeLessThanOrEqual(2);
  await page.screenshot({ path: info.outputPath(`tablet-projects-${language}-960x455-rail-end.png`) });
});
