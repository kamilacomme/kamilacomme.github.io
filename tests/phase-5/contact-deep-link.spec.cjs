const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

async function readContactState(page) {
  return page.evaluate(() => {
    const footer = document.querySelector('#contact');
    const rect = footer.getBoundingClientRect();
    const heading = footer.querySelector('[data-c="0"]')?.getBoundingClientRect();
    return {
      hash: location.hash,
      scrollY,
      viewport: { width: innerWidth, height: innerHeight },
      footer: { top: rect.top, bottom: rect.bottom, documentTop: rect.top + scrollY, height: rect.height },
      heading: heading && { top: heading.top, bottom: heading.bottom },
      scrollHeight: document.scrollingElement.scrollHeight,
    };
  });
}

async function expectFooterDestination(page, { aligned = true, curtain = true } = {}) {
  await expect.poll(async () => {
    const state = await readContactState(page);
    return state.footer.top < state.viewport.height && state.footer.bottom > 0;
  }, { timeout: 10000 }).toBe(true);
  const state = await readContactState(page);
  expect(state.hash).toBe('#contact');
  // A fresh/in-app Contact arrival aligns the Footer. Browser history may
  // restore its own semantic position, so history assertions only require the
  // Footer to be the active readable section.
  if (aligned) expect(Math.abs(state.footer.top)).toBeLessThan(12);
  await expect(page.locator('#contact [data-c="0"]')).toBeVisible();

  if (curtain) {
    await qa.waitForCurtain(page);
    const curtainState = await page.locator('curtain-cloth').evaluate(el => {
    const rect = document.querySelector('#contact').getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (innerHeight - rect.top) / Math.max(1, rect.height)));
    const p = Math.max(0, Math.min(1, (t - 0.02) / 0.78));
    return { count: document.querySelectorAll('curtain-cloth').length,
      canvases: el.querySelectorAll('canvas').length, target: el.target,
      expected: p * p * (3 - 2 * p), textureWidth: el.left?.mat?.map?.image?.naturalWidth || 0 };
    });
    expect(curtainState.count).toBe(1);
    expect(curtainState.canvases).toBe(1);
    expect(curtainState.target).toBeCloseTo(curtainState.expected, 2);
    expect(curtainState.textureWidth).toBeGreaterThan(0);
  }
  await expect(page.locator('#contact [data-c="4"] a[data-legal]')).toHaveCount(2);
}

async function expectFooterContentReachable(page) {
  // Keep reachability checks separate from history restoration. Programmatic
  // scrollIntoViewIfNeeded() here would itself create a history scroll position.
  for (const selector of ['#contact [data-c="1"]', '#contact [data-c="4"]']) {
    const content = page.locator(selector);
    await content.scrollIntoViewIfNeeded();
    await expect(content).toBeInViewport();
  }
  await expect(page.locator('#contact [data-c="4"] a[data-legal]')).toHaveCount(2);
}

async function expectHeroDestination(page) {
  await expect.poll(() => page.evaluate(() => {
    const footer = document.querySelector('#contact').getBoundingClientRect();
    const heroNode = [...document.querySelectorAll('.kc-mobile-hero-title, [data-kc-tablet-hero-title], .kc-desktop-hero-title')]
      .find(el => getComputedStyle(el).display !== 'none' && el.getClientRects().length);
    const rect = heroNode?.getBoundingClientRect();
    return { scrollY, hero: rect && { top: rect.top, bottom: rect.bottom }, heroInView: !!rect && rect.top < innerHeight && rect.bottom > 0,
      footer: { top: footer.top, bottom: footer.bottom }, footerOutOfView: footer.top >= innerHeight };
  }), { timeout: 5000 }).toMatchObject({ heroInView: true, footerOutOfView: true });
}

test('fresh and repeated #contact loads reach Footer after responsive layout settles', async ({ page, context }, info) => {
  const { language, mode, viewport } = info.project.metadata;
  await qa.routes(context);
  const route = language === 'en' ? '/en/#contact' : '/#contact';

  await page.goto(route, { waitUntil: 'load' });
  await expect(page.locator('#contact')).toBeAttached();
  await page.waitForFunction(() => performance.now() >= 3500);
  await expectFooterDestination(page);
  await expectFooterContentReachable(page);

  // A second fresh document navigation verifies that restoration is one-shot per load,
  // does not depend on an earlier in-app visit, and does not duplicate the curtain.
  await page.goto(route, { waitUntil: 'load' });
  await page.waitForFunction(() => performance.now() >= 3500);
  await expectFooterDestination(page);

  const resizeTo = mode === 'tablet-portrait' ? { width: 1194, height: 834 }
    : mode === 'tablet-landscape' ? { width: 834, height: 1112 }
      : mode === 'mobile' ? { width: 320, height: 568 }
        : { width: viewport.width - 80, height: viewport.height - 80 };
  await page.setViewportSize(resizeTo);
  await page.waitForTimeout(2300);
  const resized = await readContactState(page);
  expect(resized.hash).toBe('#contact');
  expect(resized.footer.top, JSON.stringify(resized)).toBeLessThan(resized.viewport.height);
  expect(resized.footer.bottom, JSON.stringify(resized)).toBeGreaterThan(0);
  await expect(page.locator('#contact [data-c="0"]')).toBeVisible();
  await expect(page.locator('curtain-cloth canvas')).toHaveCount(1);
  await expect(page.locator('#contact [data-c="4"] a[data-legal]')).toHaveCount(2);
  await page.locator('#contact [data-c="4"] a[data-legal]').first().scrollIntoViewIfNeeded();
  await expect(page.locator('#contact [data-c="4"] a[data-legal]').first()).toBeInViewport();
});

test('a homepage load without a fragment remains at the Hero and defers the Footer curtain', async ({ page, context }, info) => {
  const { language, viewport } = info.project.metadata;
  await qa.routes(context);
  await page.goto(language === 'en' ? '/en/' : '/', { waitUntil: 'load' });
  await page.waitForFunction(() => performance.now() >= 2300);
  const state = await page.evaluate(() => ({
    hash: location.hash,
    scrollY,
    footerTop: document.querySelector('#contact').getBoundingClientRect().top,
    curtainCount: document.querySelectorAll('curtain-cloth').length,
    viewportHeight: innerHeight,
  }));
  expect(state.hash).toBe('');
  expect(state.scrollY).toBeLessThanOrEqual(1);
  expect(state.footerTop).toBeGreaterThan(state.viewportHeight);
  expect(state.curtainCount).toBe(0);
  expect(page.viewportSize()).toEqual(viewport);
});

test('keyboard Contact navigation and browser history retain the existing in-app behavior', async ({ page, context }, info) => {
  const { language, mode } = info.project.metadata;
  test.skip(mode !== 'desktop', 'The persistent in-app Contact link is shown in the desktop navigation.');
  await qa.routes(context);
  await qa.ready(page, language);
  const contactLink = page.locator('[role="navigation"] a[href$="#contact"]');
  await contactLink.focus();
  await contactLink.press('Enter');
  await expect(page).toHaveURL(/#contact$/);
  await expectFooterDestination(page, { curtain: false });

  await page.goBack();
  await expect(page).toHaveURL(language === 'en' ? /\/en\/$/ : /\/$/);
  await expectHeroDestination(page);
  await page.goForward();
  await expect(page).toHaveURL(/#contact$/);
  await expectFooterDestination(page, { aligned: false, curtain: false });
});

