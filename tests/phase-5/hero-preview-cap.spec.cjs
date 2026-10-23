const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('desktop Hero preview stays within 325 effective pixels at narrow and wide windows', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'desktop', 'The approved 325px cap applies to the desktop Hero preview.');
  await qa.routes(context);
  await qa.ready(page, language);

  for (const viewport of [
    { width: 1100, height: 700 },
    { width: 1280, height: 800 }, { width: 1440, height: 900 }, { width: 2560, height: 1440 },
  ]) {
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
      };
    });
    expect(measured.width).toBeLessThanOrEqual(325.1);
    expect(measured.width).toBeGreaterThanOrEqual(229.9);
    expect(measured.ratio).toBeCloseTo(326 / 204, 2);
    expect(measured.right).toBe('32px');
    expect(measured.bottom).toBe('32px');
    expect(measured.slides).toBe(6);
    expect(measured.activeSlides).toBe(1);
  }

  const plate = page.locator('[data-hplate="1"]');
  const activeBefore = await plate.evaluate(element => [...element.children].findIndex(slide => getComputedStyle(slide).opacity === '1'));
  await expect.poll(() => plate.evaluate(element => [...element.children].findIndex(slide => getComputedStyle(slide).opacity === '1')), { timeout: 3500 })
    .not.toBe(activeBefore);
});
