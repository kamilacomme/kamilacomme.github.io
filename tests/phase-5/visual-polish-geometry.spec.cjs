const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

async function footerGeometry(page) {
  return page.evaluate(() => {
    const footer = document.querySelector('#contact');
    const legal = footer?.querySelector('[data-c="4"]');
    const row = legal?.querySelector(':scope > div');
    const links = [...(legal?.querySelectorAll('a[data-legal]') || [])];
    const rect = el => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kc-page-gutter-x'));
    const linkRects = links.map(el => ({ ...rect(el), text: el.textContent.trim(),
      visibility: getComputedStyle(el).visibility, display: getComputedStyle(el).display,
      opacity: getComputedStyle(el).opacity }));
    return {
      viewport: [innerWidth, innerHeight], scrollY,
      published: window.__kcTabletLayout && { ...window.__kcTabletLayout },
      footer: rect(footer), footerHeight: footer.offsetHeight,
      legal: { ...rect(legal), direction: getComputedStyle(legal).flexDirection,
        visibility: getComputedStyle(legal).visibility, display: getComputedStyle(legal).display,
        overflow: getComputedStyle(legal).overflow },
      row: row && { ...rect(row), direction: getComputedStyle(row).flexDirection,
        gap: parseFloat(getComputedStyle(row).gap) },
      links: linkRects, gutter,
    };
  });
}

async function expectReadableFooterLinks(page) {
  await expect.poll(async () => {
    const state = await footerGeometry(page);
    return state.links.length === 2
      && state.footer.top < state.viewport[1]
      && state.footer.bottom > 0
      && state.links.every(link => link.width > 0 && link.height > 0
        && link.visibility === 'visible' && link.display !== 'none' && Number(link.opacity) > 0
        && link.top >= 0 && link.bottom <= state.viewport[1] + 1);
  }, { timeout: 12000 }).toBe(true);

  const state = await footerGeometry(page);
  expect(state.links).toHaveLength(2);
  expect(state.legal.left).toBeGreaterThanOrEqual(state.gutter - 1);
  expect(state.legal.right).toBeLessThanOrEqual(state.viewport[0] - state.gutter + 1);
  const requiredWidth = state.links.reduce((sum, link) => sum + link.width, 0) + state.row.gap;
  const availableWidth = state.viewport[0] - 2 * state.gutter;
  if (requiredWidth <= availableWidth + 1) {
    expect(state.row.direction).toBe('row');
    expect(Math.abs(state.links[0].top - state.links[1].top)).toBeLessThan(1);
  }
  return state;
}

test('legal links remain visible after fresh #contact load, refresh and responsive resize', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  const sizes = mode === 'mobile' ? [[320, 568], [390, 844], [430, 932]]
    : mode === 'tablet-portrait' ? [[500, 600], [716, 555], [834, 1112]]
      : mode === 'tablet-landscape' ? [[716, 555], [1194, 834]]
        : mode === 'desktop' ? [[1440, 900], [1905, 963]] : [];
  test.skip(!sizes.length, 'One representative responsive profile owns this browser sequence.');
  await qa.routes(context);

  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto(language === 'en' ? '/en/#contact' : '/#contact', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const fresh = await expectReadableFooterLinks(page);
    expect(fresh.viewport).toEqual([width, height]);

    await page.reload({ waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const refreshed = await expectReadableFooterLinks(page);
    expect(refreshed.viewport).toEqual([width, height]);
  }
});

test('mobile Projects content edges use the same shared right gutter as the Navbar CTA', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'mobile', 'The mobile editorial Projects composition owns this gutter check.');
  await qa.routes(context);
  const widths = [[320, 568], [393, 852], [430, 932]];
  for (const [width, height] of widths) {
    await page.setViewportSize({ width, height });
    await page.goto(language === 'en' ? '/en/' : '/', { waitUntil: 'load' });
    await page.locator('[role="navigation"]').waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(['400 16px Figtree', '700 16px Figtree', '400 16px Inter']
        .map(font => document.fonts.load(font, 'Kamila Comme')));
    });
    await page.locator('#kc-mobile-projets .project').first().scrollIntoViewIfNeeded();
    const state = await page.evaluate(() => {
      const rect = el => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, width: r.width };
      };
      const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kc-page-gutter-x'));
      const canvas = document.querySelector('#kc-m-canvas');
      const cta = document.querySelector('[role="navigation"] a[href^="mailto"]');
      const cards = [...document.querySelectorAll('#kc-mobile-projets .project')];
      return {
        viewport: [innerWidth, innerHeight], gutter,
        cta: rect(cta), canvas: rect(canvas),
        paddingRight: parseFloat(getComputedStyle(canvas).paddingRight),
        fullOrRightAlignedCards: cards.filter(el => ['pilates', 'tour-de-parole', 'inside-out', 'celimax']
          .includes(el.dataset.projectId)).map(el => ({ id: el.dataset.projectId, ...rect(el) })),
      };
    });
    expect(state.viewport).toEqual([width, height]);
    expect(state.paddingRight).toBeCloseTo(state.gutter, 1);
    expect(state.canvas.right - state.paddingRight).toBeCloseTo(state.cta.right, 1);
    // The mobile profile applies a fractional geometry scale, so allow subpixel
    // rounding while still requiring the visible edges to share the same gutter.
    for (const card of state.fullOrRightAlignedCards) {
      expect(Math.abs(card.right - state.cta.right)).toBeLessThan(0.5);
    }
  }
});

test('language switcher hover uses the approved solid dark state and preserves keyboard focus', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'desktop' || language !== 'fr', 'A single normal-profile interaction check owns hover colors.');
  await qa.routes(context);
  await qa.ready(page, language);
  const switcher = page.locator('[data-kc-language-switch]');
  const box = await switcher.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const hover = await switcher.evaluate(el => ({
    background: getComputedStyle(el).backgroundColor,
    color: getComputedStyle(el).color,
    outline: getComputedStyle(el).outlineStyle,
    border: getComputedStyle(el).borderColor,
    opacity: getComputedStyle(el).opacity,
  }));
  expect(hover.background).toBe('rgb(92, 87, 92)');
  expect(hover.color).toBe('rgb(255, 255, 255)');
  expect(hover.outline).toBe('none');
  expect(hover.border).toBe('rgb(92, 87, 92)');
  expect(hover.opacity).toBe('1');

  for (let i = 0; i < 30 && !(await switcher.evaluate(el => el === document.activeElement)); i += 1) {
    await page.keyboard.press('Tab');
  }
  await expect(switcher).toBeFocused();
  const focus = await switcher.evaluate(el => ({ style: getComputedStyle(el).outlineStyle,
    width: parseFloat(getComputedStyle(el).outlineWidth) }));
  expect(focus.style).toBe('solid');
  expect(focus.width).toBeGreaterThanOrEqual(2);
});
