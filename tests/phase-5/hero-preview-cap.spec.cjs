const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('desktop Hero preview stays within 325 effective pixels at narrow and wide windows', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'desktop', 'The approved 325px cap applies to the desktop Hero preview.');
  await qa.routes(context);
  await qa.ready(page, language);

  for (const viewport of [{ width: 1280, height: 800 }, { width: 1440, height: 900 }, { width: 2560, height: 1440 }]) {
    await page.setViewportSize(viewport);
    const plate = page.locator('[data-hplate="1"]');
    await expect(plate).toBeVisible();
    await page.waitForTimeout(100);
    const measured = await plate.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        width: rect.width,
        height: rect.height,
        ratio: rect.width / rect.height,
        offsetWidth: element.offsetWidth,
        right: style.right,
        bottom: style.bottom,
        slides: element.children.length,
        activeSlides: [...element.children].filter(slide => getComputedStyle(slide).opacity === '1').length,
        activeIndex: [...element.children].findIndex(slide => getComputedStyle(slide).opacity === '1'),
      };
    });
    expect(measured.width).toBeLessThanOrEqual(325.1);
    expect(measured.ratio).toBeCloseTo(326 / 204, 2);
    expect(measured.right).toBe('32px');
    expect(measured.bottom).toBe('32px');
    expect(measured.slides).toBe(6);
    expect(measured.activeSlides).toBe(1);
    await expect.poll(() => plate.evaluate((element) => [...element.children].findIndex(slide => getComputedStyle(slide).opacity === '1')), { timeout: 3500 })
      .not.toBe(measured.activeIndex);
  }
});
