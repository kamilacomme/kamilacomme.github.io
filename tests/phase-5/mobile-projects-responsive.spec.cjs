const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('mobile editorial projects keep readable type and all six cards in natural flow', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'mobile', 'Mobile Projects run in the mobile browser profile only.');
  await qa.routes(context);

  const expected = qa.expectedOrder.mobile.map(title => title.toLowerCase().replaceAll(' ', '-'));

  async function openAt(width, height) {
    await page.setViewportSize({ width, height });
    await qa.ready(page, language);
    await expect(page.locator('#kc-mobile-projets')).toBeVisible();
  }

  async function inspect(width, height) {
    const state = await page.evaluate(() => {
      const root = document.querySelector('#kc-mobile-projets');
      const canvas = root.querySelector('#kc-m-canvas');
      const heading = canvas.querySelector('h1');
      const about = document.querySelector('#apropos-m');
      const rect = element => {
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top + scrollY, bottom: r.bottom + scrollY,
          width: r.width, height: r.height };
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
        return [...range.getClientRects()].map(r => ({ left: r.left, right: r.right, top: r.top + scrollY, bottom: r.bottom + scrollY }));
      };
      const cards = [...canvas.querySelectorAll('.project')].map(card => {
        const title = card.querySelector('h2');
        const description = card.querySelector('.description');
        const categories = card.querySelector('.categories');
        const visual = card.querySelector('.visual');
        const barcode = card.querySelector('.barcode');
        const video = card.querySelector('video.motion');
        const poster = card.querySelector('img.poster');
        return {
          id: card.dataset.projectId,
          href: card.href,
          target: card.target,
          rel: card.rel,
          card: rect(card),
          visual: rect(visual),
          title: { ...rect(title), font: parseFloat(getComputedStyle(title).fontSize), scale: scale(title), lines: lines(title) },
          description: { ...rect(description), font: parseFloat(getComputedStyle(description).fontSize), scale: scale(description), lines: lines(description) },
          categories: { ...rect(categories), font: parseFloat(getComputedStyle(categories).fontSize), scale: scale(categories), lines: lines(categories) },
          barcode: rect(barcode),
          poster: poster && { src: poster.getAttribute('src'), complete: poster.complete, naturalWidth: poster.naturalWidth },
          video: video && { dataSrc: video.dataset.src, source: video.getAttribute('src'), poster: video.getAttribute('poster') },
        };
      });
      const headingRect = rect(heading);
      const rootRect = rect(root);
      const aboutRect = rect(about);
      return {
        viewport: [innerWidth, innerHeight],
        documentWidth: document.documentElement.scrollWidth,
        root: rootRect,
        canvas: { ...rect(canvas), transform: getComputedStyle(canvas).transform },
        heading: { ...headingRect, font: parseFloat(getComputedStyle(heading).fontSize), scale: scale(heading), lines: lines(heading) },
        cards,
        about: aboutRect,
      };
    });

    expect(state.viewport).toEqual([width, height]);
    expect(state.documentWidth).toBeLessThanOrEqual(width + 1);
    expect(state.canvas.transform).toBe('none');
    expect(state.canvas.left).toBeCloseTo(0, 1);
    expect(state.canvas.width).toBeCloseTo(width, 1);
    expect(state.heading.font).toBe(32);
    expect(state.heading.scale).toBeCloseTo(1, 4);
    expect(state.heading.left).toBeCloseTo(16, 1);
    expect(state.heading.right).toBeLessThanOrEqual(width - 15);
    expect(state.cards.map(card => card.id)).toEqual(expected);
    expect(state.cards).toHaveLength(6);
    expect(state.cards[0].card.top - state.heading.bottom).toBeGreaterThanOrEqual(30);

    for (const [index, card] of state.cards.entries()) {
      expect(card.target).toBe('_blank');
      expect(card.rel).toContain('noopener');
      expect(card.href).toContain(qa.links[card.id === 'tour-de-parole' ? 'Tour de parole' :
        card.id === 'inside-out' ? 'Inside out' : card.id[0].toUpperCase() + card.id.slice(1)]);
      expect(card.card.left).toBeGreaterThanOrEqual(15);
      expect(card.card.right).toBeLessThanOrEqual(width - 15);
      expect(card.visual.left).toBeGreaterThanOrEqual(card.card.left - 1);
      expect(card.visual.right).toBeLessThanOrEqual(card.card.right + 1);
      expect(card.title.font).toBe(24);
      expect(card.description.font).toBe(14);
      expect(card.categories.font).toBe(12);
      expect(card.title.scale).toBeCloseTo(1, 4);
      expect(card.description.scale).toBeCloseTo(1, 4);
      expect(card.categories.scale).toBeCloseTo(1, 4);
      for (const box of [card.title, card.description, card.categories, card.barcode]) {
        expect(box.left).toBeGreaterThanOrEqual(card.card.left - 1);
        expect(box.right).toBeLessThanOrEqual(card.card.right + 1);
      }
      for (const line of [...card.title.lines, ...card.description.lines, ...card.categories.lines]) {
        expect(line.left).toBeGreaterThanOrEqual(card.card.left - 1);
        expect(line.right).toBeLessThanOrEqual(card.card.right + 1);
      }
      expect(card.visual.bottom).toBeLessThanOrEqual(card.title.top + 1);
      expect(card.title.bottom).toBeLessThanOrEqual(card.description.top + 1);
      expect(card.description.bottom).toBeLessThanOrEqual(card.categories.top + 1);
      expect(card.categories.bottom).toBeLessThanOrEqual(card.barcode.top + 1);
      expect(card.barcode.bottom).toBeLessThanOrEqual(card.card.bottom + 1);
      expect(card.poster).toBeTruthy();
      if (card.video) {
        expect(card.video.dataSrc).toContain('assets/projets/');
        expect(card.video.poster).toContain('assets/projets/');
      }
      if (index < state.cards.length - 1) {
        expect(state.cards[index + 1].card.top).toBeGreaterThanOrEqual(card.card.bottom + 70);
      }
    }

    const last = state.cards.at(-1);
    expect(state.root.bottom).toBeGreaterThanOrEqual(last.card.bottom + 64);
    expect(state.about.top).toBeGreaterThanOrEqual(last.card.bottom + 64);
    return state;
  }

  for (const [width, height] of [[320, 568], [375, 844], [390, 667], [430, 932]]) {
    await openAt(width, height);
    const state = await inspect(width, height);
    // Scroll each link into the viewport; this verifies complete-card reachability and lazy poster loading.
    for (const item of state.cards) {
      const card = page.locator(`#kc-mobile-projets .project[data-project-id="${item.id}"]`);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeInViewport();
      await expect.poll(() => card.locator('img.poster').first().evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    await page.locator('#apropos-m').scrollIntoViewIfNeeded();
    await expect(page.locator('#apropos-m')).toBeInViewport();
  }

  // Resize both directions so content wrapping updates without a stale 393px canvas transform.
  await openAt(430, 932);
  for (const [width, height] of [[320, 568], [390, 667], [375, 844], [430, 740]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(150);
    await inspect(width, height);
  }
});
