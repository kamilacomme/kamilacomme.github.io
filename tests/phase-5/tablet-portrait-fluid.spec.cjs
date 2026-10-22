const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');
const order = require('../../content/projects.json').canonicalOrder;

test('portrait layered cards fill 32px gutters with readable bilingual type', async ({ page, context }, info) => {
  const { mode, language, viewport: baseViewport } = info.project.metadata;
  test.skip(mode !== 'tablet-portrait', 'Custom widths apply to portrait tablet emulation.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);

  const viewports = [
    { width: 834, height: 1112, expectedCardWidth: 770 },
    { width: 900, height: 1200, expectedCardWidth: 836 },
    { width: 1032, height: 1376, expectedCardWidth: 968 },
  ];
  const reports = [];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(300);
    await qa.scrollSection(page, '#kc-tablet-projets', 0);
    const result = await page.evaluate(() => {
      const root = document.querySelector('#kc-tablet-projets');
      const stage = root.querySelector('#kc-t-stage');
      const cards = [...stage.querySelectorAll('.tickets > .ticket')];
      const scaleOf = (element) => {
        let scale = 1;
        for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
          const transform = getComputedStyle(node).transform;
          if (transform !== 'none') {
            const matrix = new DOMMatrixReadOnly(transform);
            scale *= Math.hypot(matrix.a, matrix.b);
          }
        }
        return scale;
      };
      const metrics = (element) => {
        const style = getComputedStyle(element);
        const box = element.getBoundingClientRect();
        return {
          family: style.fontFamily,
          size: parseFloat(style.fontSize),
          weight: style.fontWeight,
          lineHeight: style.lineHeight,
          letterSpacing: style.letterSpacing,
          scale: scaleOf(element),
          effectiveSize: parseFloat(style.fontSize) * scaleOf(element),
          rect: { left: box.left, top: box.top + scrollY, width: box.width, height: box.height, right: box.right, bottom: box.bottom + scrollY },
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
        };
      };
      return {
        lang: document.documentElement.lang,
        heading: metrics(stage.querySelector('h1')),
        logo: metrics(document.querySelector('.kc-responsive-nav > span')),
        cards: cards.map((card) => {
          const panel = card.querySelector('.ticket-panel');
          const image = card.querySelector('.ticket-image');
          const info = card.querySelector('.ticket-info');
          const barcode = card.querySelector('.barcode');
          const title = card.querySelector('h2');
          const description = card.querySelector('p');
          const tags = card.querySelector('.tags');
          return {
            id: card.dataset.projectId,
            href: card.getAttribute('href'),
            imageSource: image.getAttribute('aria-label'),
            poster: getComputedStyle(card).getPropertyValue('--poster'),
            outer: metrics(card), panel: metrics(panel), image: metrics(image),
            info: metrics(info), barcode: metrics(barcode), title: metrics(title),
            description: metrics(description), tags: metrics(tags),
            tagText: tags.innerText,
          };
        }),
      };
    });
    reports.push({ viewport, ...result });

    expect(result.lang).toBe(language);
    expect(result.heading.effectiveSize).toBe(48);
    expect(result.logo.effectiveSize).toBe(20);
    expect(result.cards.map((card) => card.id)).toEqual(order);
    for (const card of result.cards) {
      expect(card.href).toMatch(/^https:\/\//);
      expect(card.imageSource).toBeTruthy();
      expect(card.poster).toContain('/assets/projets/bg/');
      expect(card.outer.rect.left).toBe(32);
      expect(card.outer.rect.width).toBe(viewport.expectedCardWidth);
      expect(card.outer.rect.height).toBe(310);
      expect(card.panel.rect.width).toBe(viewport.expectedCardWidth - 96);
      expect(card.panel.rect.height).toBe(246);
      expect(card.image.rect.width).toBeCloseTo((viewport.expectedCardWidth - 228) / 2, 0);
      expect(card.image.rect.width).toBe(card.info.rect.width);
      expect(card.image.rect.height).toBe(206);
      expect(card.barcode.rect.width).toBe(52);
      for (const [part, size] of [['title', 32], ['description', 14], ['tags', 12]]) {
        expect(card[part].effectiveSize, `${card.id} ${part}`).toBe(size);
        expect(card[part].scale, `${card.id} ${part} ancestor scale`).toBe(1);
        expect(card[part].scrollWidth, `${card.id} ${part} horizontal overflow`).toBeLessThanOrEqual(card[part].clientWidth);
        // Chromium rounds the 35.2px title line box to a 36px scroll box and
        // 35px client box; allow only that single-pixel metric rounding.
        expect(card[part].scrollHeight, `${card.id} ${part} vertical overflow`).toBeLessThanOrEqual(card[part].clientHeight + 1);
      }
      expect(card.title.rect.right).toBeLessThanOrEqual(card.info.rect.right + 1);
      expect(card.description.rect.bottom).toBeLessThanOrEqual(card.tags.rect.top + 1);
      expect(card.tags.rect.bottom).toBeLessThanOrEqual(card.info.rect.bottom + 1);
    }
  }

  await info.attach('portrait-typography-and-geometry.json', {
    body: Buffer.from(JSON.stringify(reports, null, 2)), contentType: 'application/json',
  });
  expect(baseViewport.width).toBe(834);
});
