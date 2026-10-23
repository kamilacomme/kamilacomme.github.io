const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const qa = require('../qa/helpers.cjs');

const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1100, height: 700 },
  { width: 1100, height: 600 },
];

test('Desktop About keeps independent typography and fits its five animated cards', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'desktop', 'Milestone 6 Desktop About only.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  const observations = [];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(400);
    const sectionTop = await page.locator('#apropos').evaluate(el => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => {
      window.scrollTo({ top: y + innerHeight * 6.1, behavior: 'instant' });
      window.dispatchEvent(new Event('scroll'));
    }, sectionTop);
    await page.clock.runFor(250);

    const metrics = await page.locator('#apropos').evaluate((section) => {
      const stage = section.querySelector(':scope > div > div');
      const statement = stage.firstElementChild.querySelector('p');
      const cards = [...stage.querySelectorAll('[data-i]')];
      const scaleOf = (element) => {
        let scale = 1;
        for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
          const transform = getComputedStyle(node).transform;
          if (transform !== 'none') {
            const matrix = new DOMMatrixReadOnly(transform);
            scale *= Math.hypot(matrix.a, matrix.b);
          }
        }
        return scale;
      };
      const rect = (element) => {
        const r = element.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      };
      const text = (element) => ({
        cssSize: parseFloat(getComputedStyle(element).fontSize),
        effectiveSize: parseFloat(getComputedStyle(element).fontSize) * scaleOf(element),
        lineHeight: getComputedStyle(element).lineHeight,
        box: rect(element),
      });
      return {
        viewport: { width: innerWidth, height: innerHeight },
        lang: document.documentElement.lang,
        sectionHeight: section.getBoundingClientRect().height,
        stage: { box: rect(stage), transform: getComputedStyle(stage).transform, scale: scaleOf(stage), width: getComputedStyle(stage).width, height: getComputedStyle(stage).height },
        statement: text(statement),
        statementOverflow: statement.scrollWidth > statement.clientWidth + 1,
        cards: cards.map((card) => {
          const title = card.querySelector('span:first-child');
          const description = card.querySelector('span:last-child');
          return {
            index: card.dataset.i,
            box: rect(card),
            transform: getComputedStyle(card).transform,
            title: text(title),
            description: text(description),
            titleDescriptionGap: rect(description).top - rect(title).bottom,
            descriptionOverflows: description.scrollHeight > description.clientHeight + 1,
          };
        }),
      };
    });

    expect(metrics.lang).toBe(language);
    expect(metrics.cards).toHaveLength(5);
    expect(metrics.sectionHeight).toBeGreaterThanOrEqual(viewport.height * 7.9);
    expect(metrics.stage.scale).toBeCloseTo(1, 4);
    expect(metrics.statement.cssSize).toBe(56);
    expect(metrics.statement.effectiveSize).toBeCloseTo(56, 2);
    expect(metrics.statementOverflow).toBe(false);
    for (const card of metrics.cards) {
      expect(card.title.effectiveSize).toBeCloseTo(40, 2);
      expect(card.description.effectiveSize).toBeCloseTo(14, 2);
      expect(card.titleDescriptionGap).toBeGreaterThanOrEqual(-1);
      expect(card.descriptionOverflows).toBe(false);
      expect(card.box.left).toBeGreaterThanOrEqual(0);
      expect(card.box.right).toBeLessThanOrEqual(viewport.width + 1);
      expect(card.box.top).toBeGreaterThanOrEqual(-1);
      expect(card.box.bottom).toBeLessThanOrEqual(viewport.height + 1);
    }

    if ([1440, 1100].includes(viewport.width) && (viewport.width === 1440 || viewport.height === 700)) {
      await page.screenshot({
        path: info.outputPath(`desktop-about-${language}-${viewport.width}x${viewport.height}.png`),
        fullPage: false,
      });
    }
    observations.push(metrics);
  }

  const measurementPath = info.outputPath(`desktop-about-${language}-measurements.json`);
  await fs.writeFile(measurementPath, JSON.stringify(observations, null, 2));
  await info.attach(`desktop-about-${language}-measurements`, { path: measurementPath, contentType: 'application/json' });

  // Repeat width changes in both directions to prove geometry is refreshed by the existing fit owner.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.runFor(250);
  await page.setViewportSize({ width: 1100, height: 700 });
  await page.clock.runFor(250);
  const resized = await page.locator('#apropos [data-i="3"]').evaluate(el => {
    const stage = el.parentElement;
    return { right: el.getBoundingClientRect().right, stageRight: stage.getBoundingClientRect().right };
  });
  expect(Math.abs(resized.stageRight - resized.right)).toBeLessThanOrEqual(33);
  expect(observations.map(item => item.cards.map(card => card.index)).every(order => order.join(',') === '0,1,2,3,4')).toBe(true);
});
