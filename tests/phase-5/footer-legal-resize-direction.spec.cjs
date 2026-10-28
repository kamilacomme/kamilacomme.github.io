const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('Footer legal-link orientation follows width through refresh and repeated profile changes', async ({ page, context }, info) => {
  const { language } = info.project.metadata;
  await qa.routes(context);
  await qa.ready(page, language);

  async function settleViewport(width, height) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => page.evaluate(() => {
      const layout = window.__kcTabletLayout;
      return layout?.width === innerWidth && layout?.height === innerHeight;
    })).toBe(true);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    await page.evaluate(() => {
      const footer = document.querySelector('#contact');
      window.scrollTo({ top: footer.getBoundingClientRect().top + scrollY, behavior: 'instant' });
    });
    await qa.waitForCurtain(page);
    const expectedDirection = await page.evaluate(() => {
      const mobile = document.querySelector('#kc-mobile-root');
      const mobileActive = mobile && getComputedStyle(mobile).display !== 'none' && mobile.getClientRects().length > 0;
      return mobileActive || window.__kcTabletLayout?.tablet ? 'column' : 'row';
    });
    await expect.poll(() => page.locator('#contact [data-c="4"] > div').evaluate(row => getComputedStyle(row).flexDirection)).toBe(expectedDirection);
  }

  async function assertLinks(width, height) {
    const state = await page.evaluate(() => {
      const legal = document.querySelector('#contact [data-c="4"]');
      const row = legal.querySelector(':scope > div');
      const links = [...legal.querySelectorAll('a[data-legal]')];
      const box = el => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      const gutters = getComputedStyle(document.documentElement);
      return {
        outerDirection: getComputedStyle(legal).flexDirection,
        innerDirection: getComputedStyle(row).flexDirection,
        profile: (() => {
          const mobile = document.querySelector('#kc-mobile-root');
          if (mobile && getComputedStyle(mobile).display !== 'none' && mobile.getClientRects().length > 0) return 'mobile';
          return window.__kcTabletLayout?.tablet ? 'tablet' : 'desktop';
        })(),
        columnGap: parseFloat(getComputedStyle(row).columnGap),
        rowGap: parseFloat(getComputedStyle(row).rowGap),
        links: links.map(link => ({ text: link.textContent.trim(), ...box(link) })),
        legal: box(legal),
        footer: box(document.querySelector('#contact')),
        gutterX: parseFloat(gutters.getPropertyValue('--kc-page-gutter-x')) || 16,
        fontStatus: document.fonts.status,
      };
    });

    expect(state.links).toHaveLength(2);
    const expectedDirection = state.profile === 'desktop' ? 'row' : 'column';
    expect(state.outerDirection).toBe(expectedDirection);
    expect(state.innerDirection).toBe(expectedDirection);
    if (expectedDirection === 'row') {
      expect(Math.abs(state.links[0].top - state.links[1].top)).toBeLessThan(1);
      expect(state.links[1].left - state.links[0].right).toBeCloseTo(state.columnGap, 1);
    } else {
      expect(Math.abs(state.links[0].left - state.links[1].left)).toBeLessThan(1);
      expect(state.links[1].top - state.links[0].bottom).toBeCloseTo(state.rowGap, 1);
    }
    expect(state.links[0].left).toBeGreaterThanOrEqual(state.gutterX - 1);
    expect(state.links[1].right).toBeLessThanOrEqual(width - state.gutterX + 1);
    expect(state.links.every(link => link.top >= 0 && link.bottom <= height),
      `legal links outside the ${width}×${height} viewport: ${JSON.stringify({ profile: state.profile, links: state.links, footer: state.footer })}`).toBe(true);
    expect(expectedDirection === 'row' ? state.columnGap : state.rowGap).toBeGreaterThan(0);
    return state;
  }

  const initial = info.project.metadata.viewport;
  await settleViewport(initial.width, initial.height);
  await assertLinks(initial.width, initial.height);

  // A fresh document must match a post-refresh document in the same profile.
  await page.reload({ waitUntil: 'load' });
  await expect(page.locator('h1:visible').first()).toBeVisible();
  await page.evaluate(async () => { await document.fonts.ready; });
  await settleViewport(initial.width, initial.height);
  await assertLinks(initial.width, initial.height);
  await page.evaluate(() => { window.__qaFooterCurtain = document.querySelector('curtain-cloth'); });

  // Exercise both profile directions repeatedly, including phone-to-desktop.
  for (const viewport of [
    { width: 1024, height: 852 },
    { width: 716, height: 800 },
    { width: 833, height: 1112 },
    { width: 834, height: 1112 },
    { width: 1377, height: 852 },
    { width: 1024, height: 852 },
    { width: 500, height: 600 },
    { width: 393, height: 852 },
    { width: 320, height: 568 },
    { width: 1377, height: 852 },
    { width: 393, height: 852 },
  ]) {
    await settleViewport(viewport.width, viewport.height);
    await assertLinks(viewport.width, viewport.height);
    const curtain = await page.evaluate(() => {
      const element = document.querySelector('curtain-cloth');
      return {
        sameInstance: element === window.__qaFooterCurtain,
        progressFinite: Number.isFinite(element?.progress),
        targetFinite: Number.isFinite(element?.target),
      };
    });
    expect(curtain.sameInstance).toBe(true);
    expect(curtain.progressFinite).toBe(true);
    expect(curtain.targetFinite).toBe(true);
  }

  const legalLink = page.locator('#contact [data-c="4"] a[data-legal="legal"]');
  await legalLink.click();
  await expect(page.locator('[role="dialog"][aria-modal="true"]:visible').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"][aria-modal="true"]:visible')).toHaveCount(0);
});
