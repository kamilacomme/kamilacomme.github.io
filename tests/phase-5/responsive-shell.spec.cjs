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

  const sharedEdges = await page.evaluate(() => {
    const nav = document.querySelector('.kc-responsive-nav');
    const logo = nav.querySelector(':scope > span');
    const hero = document.querySelector('.kc-desktop-hero-title')?.getClientRects().length
      ? document.querySelector('.kc-desktop-hero-title')
      : document.querySelector('[data-kc-tablet-hero-title]');
    const box = element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width, height: rect.height };
    };
    const status = nav.querySelector(':scope > div:last-child > span[data-fixed-ink]');
    const hire = nav.querySelector('a[href^="mailto:"]');
    return {
      logo: box(logo), hero: hero ? box(hero) : null,
      status: status && getComputedStyle(status).display !== 'none' ? box(status) : null,
      hire: box(hire), viewport: { width: innerWidth, height: innerHeight },
    };
  });
  if (mode !== 'mobile') {
    expect(sharedEdges.hero).not.toBeNull();
    expect(Math.abs(sharedEdges.hero.left - sharedEdges.logo.left)).toBeLessThanOrEqual(0.75);
  }
  expect(sharedEdges.hire.height).toBeGreaterThanOrEqual(44);
  if (sharedEdges.status) expect(sharedEdges.status.height).toBeGreaterThanOrEqual(44);

  // Model the 15px classic-scrollbar difference between window.innerWidth and the
  // layout containing block. This catches centered Hero frames sized from the former.
  if (mode === 'desktop') {
    await page.evaluate(() => new Promise(resolve => {
      const nav = document.querySelector('.kc-responsive-nav');
      const hero = document.querySelector('.kc-desktop-hero-title');
      Object.defineProperty(document.documentElement, 'clientWidth', {
        configurable: true, get: () => window.innerWidth - 15,
      });
      nav.style.width = 'calc(100vw - 15px)';
      hero.parentElement.parentElement.style.width = 'calc(100vw - 15px)';
      window.dispatchEvent(new Event('resize'));
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));
    const modeledEdges = await page.evaluate(() => {
      const nav = document.querySelector('.kc-responsive-nav');
      const logo = nav.querySelector(':scope > span').getBoundingClientRect();
      const hero = document.querySelector('.kc-desktop-hero-title').getBoundingClientRect();
      return { logoLeft: logo.left, heroLeft: hero.left, clientWidth: document.documentElement.clientWidth, innerWidth };
    });
    expect(modeledEdges.clientWidth).toBe(modeledEdges.innerWidth - 15);
    expect(Math.abs(modeledEdges.heroLeft - modeledEdges.logoLeft)).toBeLessThanOrEqual(0.75);
  }
});
