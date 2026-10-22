const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('desktop and tablet Hero headings keep their approved effective sizes', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode === 'mobile', 'Mobile Hero typography remains in the mobile layout milestone.');
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
      layoutScale: parseFloat(getComputedStyle(element).getPropertyValue(mode === 'desktop' ? '--kc-desktop-hero-scale' : '--kc-tablet-hero-scale')),
    };
  }, mode);

  expect(measured.fontSize).toBe(mode === 'desktop' ? 56 : 48);
  expect(measured.ancestorScale.x).toBeCloseTo(1, 4);
  expect(measured.ancestorScale.y).toBeCloseTo(1, 4);
  expect(measured.x).toBeCloseTo((mode === 'desktop' ? 32 : 32) * measured.layoutScale, 1);
  expect(measured.y).toBeCloseTo((mode === 'desktop' ? 130 : 128) * measured.layoutScale, 1);
  expect(measured.contentScrollWidth).toBeLessThanOrEqual(measured.contentWidth + 1);
});
