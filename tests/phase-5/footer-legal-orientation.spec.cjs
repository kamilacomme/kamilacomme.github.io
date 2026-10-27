const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('Footer legal links remain horizontal whenever their measured labels fit inside the shared gutters', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(!['desktop', 'tablet-portrait', 'mobile'].includes(mode), 'Use one project per responsive profile.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);

  const cases = mode === 'desktop'
    ? [{ width: 1440, height: 900, directions: ['row', 'row'] }, { width: 2991, height: 643, directions: ['row', 'row'] }]
    : mode === 'tablet-portrait'
      ? [{ width: 500, height: 600 }, { width: 1194, height: 834 }]
      : [{ width: 320, height: 568 }, { width: 390, height: 844 }];

  for (const viewport of cases) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(120);
    const state = await page.locator('#contact [data-c="4"]').evaluate((legal) => {
      const row = legal.querySelector(':scope > div');
      const info = legal.parentElement.querySelector('[data-c="1"]');
      const links = [...legal.querySelectorAll('a')].map((link) => {
        const rect = link.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      const rect = (element) => {
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height };
      };
      return {
        directions: [getComputedStyle(legal).flexDirection, getComputedStyle(row).flexDirection],
        gap: parseFloat(getComputedStyle(row).columnGap),
        links,
        legal: rect(legal),
        info: rect(info),
        gutters: {
          x: getComputedStyle(document.documentElement).getPropertyValue('--kc-page-gutter-x').trim(),
          bottom: getComputedStyle(document.documentElement).getPropertyValue('--kc-page-gutter-bottom').trim(),
        },
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    expect(state.links).toHaveLength(2);
    expect(state.overflow).toBeLessThanOrEqual(1);
    const availableWidth = viewport.width - 2 * parseFloat(state.gutters.x);
    const requiredWidth = state.links.reduce((sum, link) => sum + link.right - link.left, 0) + state.gap;
    const fitsHorizontally = requiredWidth <= availableWidth + 0.5;
    const expectedDirection = fitsHorizontally ? ['row', 'row'] : ['column', 'column'];
    expect(state.directions).toEqual(expectedDirection);
    if (fitsHorizontally) {
      expect(Math.abs(state.links[0].top - state.links[1].top)).toBeLessThan(1);
      expect(state.links[1].left - state.links[0].right).toBeCloseTo(state.gap, 1);
    }
    if (mode === 'mobile') {
      expect(state.gap).toBe(16);
      expect(state.legal.top - state.info.bottom).toBeCloseTo(32, 1);
      expect(state.gutters.x).toBe('16.000px');
      expect(state.gutters.bottom).toBe('24.000px');
    }
  }
});
