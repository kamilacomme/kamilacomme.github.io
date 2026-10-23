const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const qa = require('../qa/helpers.cjs');

const viewports = [
  { width: 500, height: 600, name: 'narrow-short' },
  { width: 560, height: 800, name: 'narrow' },
  { width: 659, height: 834, name: 'narrow-wide' },
  { width: 700, height: 900, name: 'intermediate' },
  { width: 834, height: 1112, name: 'portrait-reference' },
  { width: 1032, height: 1376, name: 'portrait-large' },
  { width: 1024, height: 600, name: 'landscape-short' },
  { width: 1194, height: 834, name: 'landscape-reference' },
];

test('Tablet About uses viewport geometry, readable five-card layouts and preserves its latch', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'tablet-portrait', 'Focused Tablet About validation runs in the tablet browser profile.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  const measurements = [];
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(100);
    const sectionTop = await page.locator('#apropos-t').evaluate(el => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((top) => {
      // Stay inside the existing sticky-panel latch while allowing the slow final card
      // arrival in the existing scroll animation to settle.
      scrollTo({ top: top + innerHeight * 1.95, behavior: 'instant' });
      dispatchEvent(new Event('scroll'));
    }, sectionTop);
    await page.waitForTimeout(100);

    const result = await page.locator('#apropos-t').evaluate((section) => {
      const stage = section.querySelector(':scope > div > div');
      const statement = stage.firstElementChild.querySelector('p');
      const cards = [...stage.querySelectorAll(':scope > [data-i]')];
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      };
      const effectiveScale = (el) => {
        let scale = 1;
        for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
          const transform = getComputedStyle(node).transform;
          if (transform !== 'none') {
            const matrix = new DOMMatrixReadOnly(transform);
            scale *= Math.hypot(matrix.a, matrix.b);
          }
        }
        return scale;
      };
      const text = (el) => ({
        text: el.textContent.trim(),
        cssSize: parseFloat(getComputedStyle(el).fontSize),
        effectiveSize: parseFloat(getComputedStyle(el).fontSize) * effectiveScale(el),
        lineHeight: getComputedStyle(el).lineHeight,
        box: rect(el),
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      });
      return {
        lang: document.documentElement.lang,
        viewport: { width: innerWidth, height: innerHeight },
        sectionHeight: section.getBoundingClientRect().height,
        sectionCssHeight: getComputedStyle(section).height,
        stage: { ...rect(stage), transform: getComputedStyle(stage).transform, scale: effectiveScale(stage), width: getComputedStyle(stage).width, height: getComputedStyle(stage).height },
        statement: text(statement),
        statementFitsStage: (() => {
          const box = rect(statement);
          const stageBox = rect(stage);
          return box.top >= stageBox.top - 1 && box.bottom <= stageBox.bottom + 1;
        })(),
        nav: rect(document.querySelector('[role="navigation"]')),
        cards: cards.map((card) => ({
          index: Number(card.dataset.i),
          box: rect(card),
          title: text(card.querySelector('span:first-child')),
          description: text(card.querySelector('span:last-child')),
          padding: getComputedStyle(card).padding,
          gap: getComputedStyle(card).gap,
        })),
      };
    });

    expect(result.lang).toBe(language);
    expect(result.viewport).toEqual({ width: viewport.width, height: viewport.height });
    expect(result.cards).toHaveLength(5);
    expect(result.stage.transform).not.toBe('none');
    expect(result.stage.scale).toBeCloseTo(1, 4);
    expect(parseFloat(result.stage.width)).toBeCloseTo(viewport.width, 0);
    expect(parseFloat(result.stage.height)).toBeCloseTo(viewport.height, 0);
    expect(result.statement.cssSize).toBe(48);
    expect(result.statement.effectiveSize).toBeCloseTo(48, 1);
    expect(result.statement.box.left).toBeCloseTo(32, 0);
    expect(result.statement.box.right).toBeLessThanOrEqual(viewport.width - 31);
    expect(result.sectionHeight).toBeGreaterThanOrEqual(viewport.height * 2.99);
    if (viewport.width < 712) {
      expect(result.cards[0].box.top).toBeGreaterThanOrEqual(result.nav.bottom + 2);
    }
    for (const card of result.cards) {
      expect(card.title.cssSize).toBe(32);
      expect(card.title.effectiveSize).toBeCloseTo(32, 1);
      expect(card.description.cssSize).toBe(14);
      expect(card.description.effectiveSize).toBeCloseTo(14, 1);
      expect(card.title.scrollWidth).toBeLessThanOrEqual(card.title.clientWidth + 1);
      expect(card.description.scrollWidth).toBeLessThanOrEqual(card.description.clientWidth + 1);
      expect(card.title.scrollHeight).toBeLessThanOrEqual(card.title.clientHeight + 1);
      expect(card.description.scrollHeight).toBeLessThanOrEqual(card.description.clientHeight + 1);
      expect(card.box.left).toBeGreaterThanOrEqual(-1);
      expect(card.box.right).toBeLessThanOrEqual(viewport.width + 1);
      expect(card.box.top).toBeGreaterThanOrEqual(-1);
      expect(card.box.bottom).toBeLessThanOrEqual(viewport.height + 1);
    }

    if ([500, 560, 834, 1024, 1194].includes(viewport.width)) {
      await page.screenshot({ path: info.outputPath(`tablet-about-${language}-${viewport.name}-${viewport.width}x${viewport.height}.png`) });
    }
    measurements.push({ name: viewport.name, ...result });
  }

  // Confirm the existing geometry owner recomputes after orientation-like size changes.
  await page.setViewportSize({ width: 834, height: 1112 });
  await page.waitForTimeout(100);
  await page.setViewportSize({ width: 1194, height: 834 });
  await page.waitForTimeout(100);
  await page.setViewportSize({ width: 560, height: 800 });
  await page.waitForTimeout(100);
  const resizedStage = await page.locator('#apropos-t > div > div').evaluate(el => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return { width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height, transform: getComputedStyle(el).transform, scale: Math.hypot(matrix.a, matrix.b) };
  });
  expect(resizedStage.width).toBeCloseTo(560, 0);
  expect(resizedStage.height).toBeCloseTo(800, 0);
  expect(resizedStage.scale).toBeCloseTo(1, 4);

  // The 500×600 narrow-short tablet intentionally displays only complete opening
  // sentences of the 48px introduction. The five existing cards then enter one at a
  // time in the same scroll-linked stack; no timer or second controller is involved.
  await page.setViewportSize({ width: 500, height: 600 });
  await page.waitForTimeout(100);
  const shortSectionTop = await page.locator('#apropos-t').evaluate(el => el.getBoundingClientRect().top + scrollY);
  const excerpt = await page.locator('#apropos-t p').evaluate(p => ({
    cssSize: parseFloat(getComputedStyle(p).fontSize),
    completeText: p.textContent,
    visualSpans: [...p.querySelectorAll(':scope > span')].map(span => ({
      text: span.textContent.trim(),
      visuallyHidden: getComputedStyle(span).position === 'absolute',
    })),
    box: p.getBoundingClientRect().toJSON(),
  }));
  expect(excerpt.cssSize).toBe(48);
  expect(excerpt.visualSpans.filter(span => !span.visuallyHidden).length).toBeGreaterThan(0);
  expect(excerpt.visualSpans.filter(span => span.visuallyHidden).length).toBeGreaterThan(0);
  expect(excerpt.completeText).toContain(language === 'fr' ? 'Je' : 'I');
  const visibleCardCounts = [];
  for (const progress of [0, 0.35, 0.7, 1.05, 1.4, 1.8]) {
    await page.evaluate(({ top, progress }) => {
      scrollTo({ top: top + progress * innerHeight, behavior: 'instant' });
      dispatchEvent(new Event('scroll'));
    }, { top: shortSectionTop, progress });
    await page.waitForTimeout(40);
    visibleCardCounts.push(await page.locator('#apropos-t [data-i]').evaluateAll(cards => cards.filter(card => {
      const rect = card.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight;
    }).length));
  }
  expect(visibleCardCounts[0]).toBe(0);
  expect(visibleCardCounts.at(-1)).toBe(5);
  expect(visibleCardCounts.every((count, index) => index === 0 || count >= visibleCardCounts[index - 1])).toBe(true);

  const measurementPath = info.outputPath(`tablet-about-${language}-measurements.json`);
  await fs.writeFile(measurementPath, JSON.stringify(measurements, null, 2));
  await info.attach(`tablet-about-${language}-measurements`, { path: measurementPath, contentType: 'application/json' });
  expect(measurements.every(item => item.statementFitsStage), 'The 48px About statement must fit its tablet frame without clipping.').toBe(true);
});
