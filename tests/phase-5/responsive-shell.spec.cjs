const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('responsive navigation keeps target type at effective size in every profile', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  await qa.routes(context);
  await qa.ready(page, language);

  const measured = await page.locator('.kc-responsive-nav').evaluate((nav) => {
    function scaleOf(element) {
      let x = 1, y = 1;
      for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
        const transform = getComputedStyle(node).transform;
        if (transform !== 'none') {
          const matrix = new DOMMatrixReadOnly(transform);
          x *= Math.hypot(matrix.a, matrix.b);
          y *= Math.hypot(matrix.c, matrix.d);
        }
      }
      return { x, y };
    }
    const size = (element) => parseFloat(getComputedStyle(element).fontSize);
    const rect = nav.getBoundingClientRect();
    const logo = nav.querySelector(':scope > span');
    const labels = [...nav.querySelectorAll(':scope > div a[href^="#"]')];
    const status = nav.querySelector('[data-fixed-ink] > [data-fixed-ink] + span');
    const cta = nav.querySelector('a[href^="mailto:"] > span');
    return {
      rect: { left: rect.left, width: rect.width, height: rect.height },
      viewport: { width: innerWidth, height: innerHeight },
      scale: scaleOf(nav),
      logo: { size: size(logo), scale: scaleOf(logo) },
      labels: labels.map(element => ({ size: size(element), scale: scaleOf(element) })),
      status: status ? { size: size(status), scale: scaleOf(status) } : null,
      cta: { size: size(cta), scale: scaleOf(cta) },
      gutter: parseFloat(getComputedStyle(nav).paddingLeft),
      navScale: parseFloat(getComputedStyle(nav).getPropertyValue('--kc-nav-scale')),
    };
  });

  expect(measured.rect.left).toBeCloseTo(0, 1);
  expect(measured.rect.width).toBeCloseTo(measured.viewport.width, 1);
  expect(measured.scale.x).toBeCloseTo(1, 4);
  expect(measured.scale.y).toBeCloseTo(1, 4);
  expect(measured.logo.size).toBe(20);
  expect(measured.logo.scale.x).toBeCloseTo(1, 4);
  expect(measured.logo.scale.y).toBeCloseTo(1, 4);
  expect(measured.labels.every(label => label.size === 12 && label.scale.x === 1 && label.scale.y === 1)).toBe(true);
  expect(measured.cta.size).toBe(14);
  expect(measured.cta.scale.x).toBeCloseTo(1, 4);
  expect(measured.cta.scale.y).toBeCloseTo(1, 4);
  if (mode !== 'mobile') {
    expect(measured.status.size).toBe(12);
    expect(measured.status.scale.x).toBeCloseTo(1, 4);
    expect(measured.status.scale.y).toBeCloseTo(1, 4);
  }
  expect(measured.gutter).toBeCloseTo((mode === 'mobile' ? 16 : 32) * measured.navScale, 2);
});
