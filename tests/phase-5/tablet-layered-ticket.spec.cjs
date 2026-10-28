const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

const idOrder = ['pilates', 'longread', 'tour-de-parole', 'inside-out', 'celimax', 'napoli'];

test('tablet shared layered tickets match Figma geometry and adapt the section rail', async ({ page, context }, info) => {
  const { mode, language, viewport } = info.project.metadata;
  test.skip(!mode.startsWith('tablet-'), 'This contract applies to the two tablet presentations.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);
  await page.clock.runFor(500);
  await qa.scrollSection(page, qa.selectors(mode).projects, 0);

  const result = await page.locator('#kc-tablet-projets').evaluate((root) => {
    const stage = root.querySelector('#kc-t-stage');
    const rail = stage.querySelector('.tickets');
    const cards = [...rail.querySelectorAll('.ticket')];
    const rect = (element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    };
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
    const details = cards.map((card) => {
      const panel = card.querySelector('.ticket-panel');
      const image = card.querySelector('.ticket-image');
      const info = card.querySelector('.ticket-info');
      const group = info.firstElementChild;
      const title = group.querySelector('h2');
      const description = group.querySelector('p');
      const tags = info.querySelector('.tags');
      const barcode = card.querySelector('.barcode');
      const titleStyle = getComputedStyle(title);
      const descriptionStyle = getComputedStyle(description);
      const tagsStyle = getComputedStyle(tags);
      return {
        id: card.dataset.projectId,
        href: card.getAttribute('href'),
        poster: card.style.getPropertyValue('--poster'),
        structure: ['.ticket-panel', '.ticket-image', '.ticket-info h2', '.ticket-info p', '.tags', '.barcode'].every(selector => card.querySelector(selector)),
        type: {
          title: parseFloat(titleStyle.fontSize),
          description: parseFloat(descriptionStyle.fontSize),
          tags: parseFloat(tagsStyle.fontSize),
          scale: scaleOf(title),
        },
        boxes: {
          card: rect(card), panel: rect(panel), image: rect(image), info: rect(info),
          group: rect(group), title: rect(title), description: rect(description), tags: rect(tags), barcode: rect(barcode),
        },
      };
    });
    return {
      projectDocumentTop: root.getBoundingClientRect().top + scrollY,
      sectionHeight: root.getBoundingClientRect().height,
      aboutDocumentTop: root.parentElement.querySelector('#apropos-t').getBoundingClientRect().top + scrollY,
      stageTransform: getComputedStyle(stage).transform,
      railWidth: rail.getBoundingClientRect().width,
      cards: details,
    };
  });

  expect(result.stageTransform).toBe('none');
  expect(result.cards.map(card => card.id)).toEqual(idOrder);
  const portrait = mode === 'tablet-portrait';
  const expectedSectionHeight = portrait
    ? 269 + (6 * 310) + (5 * 32) + 32
    : viewport.height + (32 + (6 * 770) + (5 * 32) + 32 - viewport.width);
  expect(Math.abs(result.sectionHeight - expectedSectionHeight)).toBeLessThanOrEqual(2);
  expect(Math.abs(result.aboutDocumentTop - (result.projectDocumentTop + result.sectionHeight))).toBeLessThanOrEqual(2);

  for (const card of result.cards) {
    expect(card.structure, card.id).toBe(true);
    expect(card.href, card.id).toMatch(/^https:\/\//);
    expect(card.poster, card.id).toContain('/assets/projets/bg/');
    expect(card.type).toMatchObject({ title: 32, description: 14, tags: 12, scale: 1 });
    const { card: outer, panel, image, info, group, title, description, tags, barcode } = card.boxes;
    expect(outer.width).toBe(770);
    expect(outer.height).toBe(310);
    expect(panel.width).toBe(674);
    expect(panel.height).toBe(246);
    expect(image.width).toBeCloseTo(271, 0);
    expect(image.height).toBe(206);
    expect(info.width).toBeCloseTo(271, 0);
    expect(barcode.width).toBe(52);
    expect(panel.left).toBeGreaterThanOrEqual(outer.left);
    expect(panel.right).toBeLessThanOrEqual(outer.right);
    expect(image.left).toBeGreaterThanOrEqual(panel.left);
    expect(image.right).toBeLessThanOrEqual(panel.right);
    expect(barcode.left).toBeGreaterThanOrEqual(panel.left);
    expect(barcode.right).toBeLessThanOrEqual(panel.right);
    expect(title.bottom).toBeLessThanOrEqual(description.top + 1);
    expect(group.bottom).toBeLessThanOrEqual(tags.top + 1);
    expect(description.bottom).toBeLessThanOrEqual(tags.top + 1);
    expect(tags.bottom).toBeLessThanOrEqual(info.bottom + 1);
  }

  if (portrait) {
    expect(result.cards[0].boxes.card.left).toBe(32);
    expect(result.cards[0].boxes.card.top).toBe(269);
    for (let index = 1; index < result.cards.length; index += 1) {
      expect(result.cards[index].boxes.card.top - result.cards[index - 1].boxes.card.top).toBe(342);
    }
    expect(result.railWidth).toBe(770);
  } else {
    expect(result.cards[0].boxes.card.left).toBe(32);
    expect(result.cards[0].boxes.card.top).toBe(492);
    expect(result.cards[1].boxes.card.left).toBe(834);
    expect(1 + (viewport.width - result.cards[1].boxes.card.left) / result.cards[1].boxes.card.width).toBeCloseTo(1.47, 2);
    expect(result.railWidth).toBe(4780);
  }

  const opposite = mode === 'tablet-portrait' ? { width: 1194, height: 834 } : { width: 834, height: 1112 };
  await page.setViewportSize(opposite);
  await page.clock.runFor(500);
  const rotated = await page.locator('#kc-tablet-projets').evaluate(root => ({
    landscape: root.classList.contains('kc-landscape-rail'),
    stageTransform: getComputedStyle(root.querySelector('#kc-t-stage')).transform,
    cardCount: root.querySelectorAll('.ticket').length,
    titleSize: parseFloat(getComputedStyle(root.querySelector('.ticket-info h2')).fontSize),
  }));
  expect(rotated.landscape).toBe(mode === 'tablet-portrait');
  expect(rotated.stageTransform).toBe('none');
  expect(rotated.cardCount).toBe(6);
  expect(rotated.titleSize).toBe(32);

  await page.setViewportSize(viewport);
  await page.clock.runFor(500);

  if (!portrait) {
    await qa.scrollSection(page, qa.selectors(mode).projects, 0);
    await page.evaluate((documentTop) => window.scrollTo(0, documentTop + 3650), result.projectDocumentTop);
    await page.clock.runFor(500);
    const end = await page.locator('#kc-tablet-projets .tickets').evaluate(rail => ({
      transform: new DOMMatrixReadOnly(getComputedStyle(rail).transform).m41,
      lastCardRight: rail.lastElementChild.getBoundingClientRect().right,
    }));
    expect(end.transform).toBeCloseTo(-3650, 0);
    expect(end.lastCardRight).toBeCloseTo(viewport.width - 32, 0);
  }
});
