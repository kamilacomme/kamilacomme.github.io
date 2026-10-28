const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('mobile About keeps full-size copy and all five animated cards inside the viewport', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'mobile', 'Mobile About runs in the mobile browser profile only.');
  await qa.routes(context);

  async function openAt(width, height) {
    await page.setViewportSize({ width, height });
    await qa.ready(page, language);
    await expect(page.locator('#apropos-m')).toBeVisible();
  }

  async function inspect(width, height) {
    const state = await page.evaluate(() => {
      const section = document.querySelector('#apropos-m');
      const stage = section.querySelector(':scope > div > div');
      const intro = stage.firstElementChild;
      const portrait = intro.firstElementChild;
      const statement = intro.querySelector('p');
      const cards = [...stage.querySelectorAll(':scope > div[data-i]')];
      const rect = element => {
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      const scale = element => {
        let result = 1;
        for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
          const value = getComputedStyle(node).transform;
          if (value !== 'none') {
            const matrix = new DOMMatrixReadOnly(value);
            result *= Math.hypot(matrix.a, matrix.b);
          }
        }
        return result;
      };
      const lines = element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return [...range.getClientRects()].map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom }));
      };
      const stageStyle = getComputedStyle(stage);
      const cardData = cards.map(card => {
        const title = card.querySelector('span:first-child');
        const copy = card.querySelector('span:last-child');
        return {
          index: Number(card.dataset.i), rect: rect(card), scrollHeight: card.scrollHeight, clientHeight: card.clientHeight,
          title: { rect: rect(title), font: parseFloat(getComputedStyle(title).fontSize), scale: scale(title), lines: lines(title) },
          copy: { rect: rect(copy), font: parseFloat(getComputedStyle(copy).fontSize), scale: scale(copy), lines: lines(copy) },
        };
      });
      return {
        viewport: [innerWidth, innerHeight],
        pageWidth: { client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth },
        section: rect(section), stage: { ...rect(stage), transform: stageStyle.transform, font: parseFloat(getComputedStyle(statement).fontSize), scale: scale(statement) },
        intro: { ...rect(intro), width: getComputedStyle(intro).width },
        portrait: rect(portrait), statement: { ...rect(statement), font: parseFloat(getComputedStyle(statement).fontSize), scale: scale(statement), lines: lines(statement), text: statement.innerText },
        cards: cardData,
        footer: rect(document.querySelector('#contact')),
      };
    });

    expect(state.viewport).toEqual([width, height]);
    expect(state.pageWidth.scroll).toBeLessThanOrEqual(width + 1);
    expect(state.stage.width).toBeCloseTo(width, 0);
    expect(state.stage.height).toBeCloseTo(height, 0);
    expect(state.stage.scale).toBeCloseTo(1, 4);
    expect(state.intro.left).toBeCloseTo(16, 1);
    expect(state.intro.right).toBeCloseTo(width - 16, 1);
    expect(state.portrait.left).toBeCloseTo(16, 1);
    expect(state.statement.font).toBe(32);
    expect(state.statement.scale).toBeCloseTo(1, 4);
    expect(state.statement.lines.length).toBeGreaterThan(3);
    expect(state.statement.lines.every(line => line.left >= 15 && line.right <= width - 15)).toBe(true);
    expect(state.statement.top).toBeGreaterThanOrEqual(0);
    expect(state.statement.bottom).toBeLessThanOrEqual(height);
    expect(state.cards.map(card => card.index)).toEqual([0, 1, 2, 3, 4]);
    expect(state.cards).toHaveLength(5);

    for (const card of state.cards) {
      expect(card.rect.left).toBeGreaterThanOrEqual(15);
      expect(card.rect.right).toBeLessThanOrEqual(width - 15);
      expect(card.title.font).toBe(24);
      expect(card.title.scale).toBeCloseTo(1, 4);
      expect(card.copy.font).toBe(14);
      expect(card.copy.scale).toBeCloseTo(1, 4);
      expect(card.scrollHeight).toBeLessThanOrEqual(card.clientHeight + 1);
      for (const line of [...card.title.lines, ...card.copy.lines]) {
        expect(line.left).toBeGreaterThanOrEqual(card.rect.left - 1);
        expect(line.right).toBeLessThanOrEqual(card.rect.right + 1);
      }
    }
    expect(state.footer.top).toBeGreaterThanOrEqual(state.section.bottom - 1);
    return state;
  }

  for (const [width, height] of [[320, 568], [375, 844], [390, 667], [430, 932]]) {
    await openAt(width, height);
    const aboutTop = await page.locator('#apropos-m').evaluate(el => el.getBoundingClientRect().top + scrollY);
    await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; document.scrollingElement.scrollTop = y; }, aboutTop);
    await page.waitForTimeout(120);
    const initial = await inspect(width, height);
    expect(initial.cards.every(card => card.rect.top >= height)).toBe(true);
    await page.evaluate(({ y, h }) => { document.scrollingElement.scrollTop = y + 1.2 * h; }, { y: aboutTop, h: height });
    await page.waitForTimeout(180);
    const intermediate = await page.locator('#apropos-m [data-i]').evaluateAll(cards => cards.map(card => {
      const r = card.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    }));
    const visibleCount = intermediate.filter(card => card.top < height && card.bottom > 0).length;
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThan(5);
    // By the end of the existing sticky section travel, all five cards have arrived;
    // they remain stacked in the same single authored mobile shell.
    await page.evaluate(({ y, h }) => { document.scrollingElement.scrollTop = y + 2.45 * h; }, { y: aboutTop, h: height });
    await page.waitForTimeout(350);
    const stacked = await page.locator('#apropos-m [data-i]').evaluateAll(cards => cards.map(card => {
      const r = card.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, x: r.left, width: r.width };
    }));
    expect(stacked).toHaveLength(5);
    expect(stacked.every(card => card.top >= -1 && card.bottom <= height + 1)).toBe(true);
    expect(stacked.slice(1).every((card, index) => Math.abs(card.top - stacked[index].top) <= 11)).toBe(true);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.locator('#contact')).toBeInViewport();
  }

  // Resize in both dimensions after loading at one end of the supported range.
  await openAt(320, 568);
  const aboutTop = await page.locator('#apropos-m').evaluate(el => el.getBoundingClientRect().top + scrollY);
  await page.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; document.scrollingElement.scrollTop = y; }, aboutTop);
  for (const [width, height] of [[430, 740], [375, 932], [390, 568], [320, 700]]) {
    await page.setViewportSize({ width, height });
    const resizedAboutTop = await page.locator('#apropos-m').evaluate(el => el.getBoundingClientRect().top + scrollY);
    await page.evaluate(y => { document.scrollingElement.scrollTop = y; }, resizedAboutTop);
    await page.waitForTimeout(180);
    await inspect(width, height);
  }
});
