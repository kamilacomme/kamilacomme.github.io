const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('semantic language restoration yields to wheel, touch and keyboard scrolling', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  const exercise = mode === 'tablet-portrait' || mode === 'desktop';
  test.skip(!exercise, 'Run the focused continuity cases in the confirmed narrow-tablet and desktop profiles.');
  const input = mode === 'tablet-portrait'
    ? (language === 'fr' ? 'keyboard' : 'touch')
    : (language === 'fr' ? 'wheel' : 'keyboard');

  await qa.routes(context);
  await qa.ready(page, language);
  const viewport = mode === 'tablet-portrait' ? { width: 716, height: 555 } : { width: 1920, height: 1080 };
  await page.setViewportSize(viewport);
  const aboutId = mode === 'tablet-portrait' ? 'apropos-t' : 'apropos';
  const destinationPath = language === 'fr' ? '/en/' : '/';
  const targetUrl = new RegExp(`${destinationPath.replaceAll('/', '\\/')}#${aboutId}$`);
  const geometry = async () => page.locator(`#${aboutId}`).evaluate(el => {
    const r = el.getBoundingClientRect();
    const travel = Math.max(1, r.height - innerHeight);
    return { top: r.top, bottom: r.bottom, progress: Math.max(0, Math.min(1, (scrollY - (r.top + scrollY)) / travel)), y: scrollY };
  });
  const isReadable = async () => {
    const r = await geometry();
    return r.top < viewport.height * .55 && r.bottom > viewport.height * .45;
  };
  await expect.poll(() => page.evaluate(() => window.__kcTabletLayout?.width === innerWidth
    && window.__kcTabletLayout?.height === innerHeight), { timeout: 10000 }).toBe(true);
  const startTop = await page.locator(`#${aboutId}`).evaluate(el => el.getBoundingClientRect().top + scrollY);
  await qa.scrollTo(page, startTop + Math.max(150, viewport.height * .24));
  await expect.poll(isReadable, { timeout: 10000 }).toBe(true);
  const before = await geometry();

  await page.locator('[data-kc-language-switch]').click();
  await expect(page).toHaveURL(targetUrl);
  await expect(page.locator(`html[lang="${language === 'fr' ? 'en' : 'fr'}"]`)).toHaveCount(1);
  await expect.poll(isReadable, { timeout: 10000 }).toBe(true);
  await expect.poll(async () => page.evaluate(() => window.__kcPendingLanguageAnchor == null), { timeout: 10000 }).toBe(true);
  const restored = await geometry();
  expect(Math.abs(restored.progress - before.progress)).toBeLessThan(.12);

  // Exercise input while the legacy implementation would still have outstanding
  // 300ms/800ms callbacks. Each action performs a real browser scroll gesture.
  await page.waitForTimeout(180);
  if (input === 'wheel') {
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    await page.mouse.wheel(0, 150);
  } else if (input === 'keyboard') {
    await page.keyboard.press('PageDown');
  } else {
    const client = await context.newCDPSession(page);
    const x = Math.round(viewport.width / 2);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: Math.round(viewport.height * .72), id: 1 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(viewport.height * .42), id: 1 }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await client.detach();
  }
  await expect.poll(async () => (await geometry()).y, { timeout: 5000 }).toBeGreaterThan(restored.y + 80);
  await page.evaluate(() => new Promise(resolve => {
    let previous = scrollY, stable = 0, frames = 0;
    const sample = () => {
      frames++;
      stable = Math.abs(scrollY - previous) < 1 ? stable + 1 : 0;
      previous = scrollY;
      if (stable >= 8 || frames > 240) resolve();
      else requestAnimationFrame(sample);
    };
    sample();
  }));
  const afterInput = await geometry();
  await page.waitForTimeout(900);
  const settled = await geometry();
  expect(settled.y).toBeGreaterThan(restored.y + 80);
  expect(Math.abs(settled.y - afterInput.y)).toBeLessThan(10);
  const footerTop = await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top);
  expect(settled.bottom > 0 || footerTop < viewport.height).toBe(true);
});

test('user scrolling cancels a semantic anchor before the responsive owner consumes it', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'tablet-portrait', 'Exercise the pending tablet geometry handoff at the confirmed narrow-tablet failure size.');
  await page.addInitScript(() => {
    const nativeRequestFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => nativeRequestFrame(timestamp => {
      if (window.__kcPendingLanguageAnchor && !window.__kcRestoreFrameHeld) {
        window.__kcRestoreFrameHeld = true;
        window.__kcRestoreHandoffWaiting = true;
        window.setTimeout(() => callback(performance.now()), 350);
      } else {
        callback(timestamp);
      }
    });
  });
  await qa.routes(context);
  await qa.ready(page, language);
  await page.setViewportSize({ width: 716, height: 555 });
  await expect.poll(() => page.evaluate(() => window.__kcTabletLayout?.width === innerWidth
    && window.__kcTabletLayout?.height === innerHeight), { timeout: 10000 }).toBe(true);
  const about = page.locator('#apropos-t');
  const top = await about.evaluate(el => el.getBoundingClientRect().top + scrollY);
  await qa.scrollTo(page, top + 200);
  await expect.poll(async () => {
    const rect = await about.boundingBox();
    return rect && rect.y < 305 && rect.y + rect.height > 250;
  }, { timeout: 10000 }).toBe(true);

  const nextPath = language === 'fr' ? '/en/' : '/';
  await page.locator('[data-kc-language-switch]').click();
  await expect(page).toHaveURL(new RegExp(`${nextPath.replaceAll('/', '\\/')}#apropos-t$`));
  await expect.poll(() => page.evaluate(() => window.__kcRestoreHandoffWaiting === true), { timeout: 10000 }).toBe(true);
  await page.mouse.move(350, 275);
  await page.mouse.wheel(0, 180);
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBeGreaterThan(20);
  const userScrollY = await page.evaluate(() => scrollY);
  await page.waitForTimeout(900);
  const final = await page.evaluate(() => ({ y: scrollY, pending: window.__kcPendingLanguageAnchor, hash: location.hash }));
  expect(final.hash).toBe('#apropos-t');
  expect(final.pending).toBeNull();
  expect(final.y).toBeGreaterThanOrEqual(userScrollY - 5);
});
