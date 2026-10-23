const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('shared ticket radii and rendered media clipping', async ({ page, context }, info) => {
  const { mode, language, viewport } = info.project.metadata;
  test.skip(mode === 'mobile', 'Mobile keeps its separate editorial cards.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);
  await page.clock.runFor(500);
  await qa.scrollSection(page, qa.selectors(mode).projects, 0);
  await page.clock.runFor(100);
  const scope = mode === 'desktop' ? page.frameLocator('#kc-desktop-project-frame') : page.locator('#kc-tablet-projets');
  const ticket = scope.locator('.ticket').first();
  await expect(ticket).toBeVisible();
  const values = await ticket.evaluate((outer) => {
    const panel = outer.querySelector('.ticket-panel');
    const image = outer.querySelector('.ticket-image');
    const media = image.querySelector('.media-layer');
    const rect = (el) => { const r = el.getBoundingClientRect(); return { width: r.width, height: r.height }; };
    return {
      outer: { radius: getComputedStyle(outer).borderTopLeftRadius, overflow: getComputedStyle(outer).overflow, rect: rect(outer) },
      panel: { radius: getComputedStyle(panel).borderTopLeftRadius, overflow: getComputedStyle(panel).overflow, background: getComputedStyle(panel).backgroundColor, rect: rect(panel) },
      image: { radius: getComputedStyle(image).borderTopLeftRadius, overflow: getComputedStyle(image).overflow, rect: rect(image) },
      media: { radius: getComputedStyle(media).borderTopLeftRadius, rect: rect(media), tag: media.tagName },
    };
  });
  expect(values.outer).toMatchObject({ radius: '8px', overflow: 'hidden' });
  expect(values.outer.rect.width).toBeGreaterThan(0);
  expect(values.panel).toMatchObject({ radius: '4px', overflow: 'hidden', background: 'rgb(242, 238, 242)' });
  expect(values.panel.rect.width).toBeGreaterThan(0);
  expect(values.image).toMatchObject({ radius: '4px', overflow: 'hidden' });
  expect(values.image.rect.width).toBeGreaterThan(0);
  expect(values.media.radius).toBe('4px');
  if (mode !== 'desktop') {
    const pseudo = await ticket.evaluate((el) => getComputedStyle(el, '::after').borderTopLeftRadius);
    if (await page.locator('#kc-tablet-projets').evaluate((el) => el.classList.contains('kc-narrow-ticket'))) {
      expect(pseudo).toBe('4px');
    }
  }
  const screenshotPath = info.outputPath(`ticket-radius-${language}-${mode}.png`);
  await ticket.screenshot({ path: screenshotPath });
  await info.attach(`ticket-radius-${language}-${mode}`, { path: screenshotPath, contentType: 'image/png' });
  console.log(`${language} ${mode} ${viewport.width}x${viewport.height} ${JSON.stringify(values)}`);
  if (mode === 'tablet-portrait') {
    await page.setViewportSize({ width: 560, height: 900 });
    await page.clock.runFor(350);
    await expect.poll(() => page.locator('#kc-tablet-projets').evaluate((el) => el.classList.contains('kc-narrow-ticket'))).toBe(true);
    const narrow = await ticket.evaluate((outer) => ({
      outer: getComputedStyle(outer).borderTopLeftRadius,
      pseudoRadius: getComputedStyle(outer, '::after').borderTopLeftRadius,
      pseudoTint: getComputedStyle(outer, '::after').backgroundColor,
      panel: getComputedStyle(outer.querySelector('.ticket-panel')).borderTopLeftRadius,
      image: getComputedStyle(outer.querySelector('.ticket-image')).borderTopLeftRadius,
      media: getComputedStyle(outer.querySelector('.ticket-image .media-layer')).borderTopLeftRadius,
      boxes: [outer, outer.querySelector('.ticket-panel'), outer.querySelector('.ticket-image')].map((el) => { const r = el.getBoundingClientRect(); return [r.width, r.height]; }),
    }));
    expect(narrow).toMatchObject({ outer: '8px', pseudoRadius: '0px', pseudoTint: 'rgba(255, 255, 255, 0.04)', panel: '4px', image: '4px', media: '4px' });
    expect(narrow.boxes.every((box) => box[0] > 0 && box[1] > 0)).toBe(true);
    const narrowPath = info.outputPath(`ticket-radius-${language}-narrow.png`);
    await ticket.screenshot({ path: narrowPath });
    await info.attach(`ticket-radius-${language}-narrow`, { path: narrowPath, contentType: 'image/png' });
    console.log(`${language} narrow-tablet 560x900 ${JSON.stringify(narrow)}`);
  }
});
