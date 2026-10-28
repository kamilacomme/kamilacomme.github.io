const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');
const projectData = require('../../content/projects.json');

const order = ['pilates', 'longread', 'tour-de-parole', 'inside-out', 'celimax', 'napoli'];
const titles = { pilates: 'Pilates', longread: 'Longread', 'tour-de-parole': 'Tour de parole', 'inside-out': 'Inside out', celimax: 'Celimax', napoli: 'Napoli' };
const projectRecords = new Map(projectData.projects.map(project => [project.id, project]));
const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1200, height: 800 },
  { width: 1100, height: 700 },
  { width: 1422, height: 600 },
];

test('desktop Projects keeps target typography and maps its fluid rail at responsive widths', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'desktop', 'This milestone changes desktop Projects only.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

  const frames = [];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(500);
    const hero = await page.locator('.kc-desktop-hero-scroll-cue').evaluate((cue) => {
      let scale = 1;
      for (let node = cue; node && node !== document.documentElement; node = node.parentElement) {
        const transform = getComputedStyle(node).transform;
        if (transform !== 'none') {
          const matrix = new DOMMatrixReadOnly(transform);
          scale *= Math.hypot(matrix.a, matrix.b);
        }
      }
      const style = getComputedStyle(cue);
      const plate = document.querySelector('[data-hplate="1"]');
      const cueParentTransform = new DOMMatrixReadOnly(getComputedStyle(cue.parentElement).transform);
      return {
        cueSize: parseFloat(style.fontSize), cueEffective: parseFloat(style.fontSize) * scale,
        cueTransform: getComputedStyle(cue.parentElement).transform,
        cueScale: Math.hypot(cueParentTransform.a, cueParentTransform.b),
        artTransform: getComputedStyle(document.querySelector('.kc-desktop-hero-art')).transform,
        portraitBottom: document.querySelector('.kc-desktop-hero-portrait > div').getBoundingClientRect().bottom,
        cueTop: cue.getBoundingClientRect().top,
        plateWidth: plate.getBoundingClientRect().width,
        plateRatio: plate.getBoundingClientRect().width / plate.getBoundingClientRect().height,
        slideCount: plate.children.length,
        activeSlides: [...plate.children].filter(slide => getComputedStyle(slide).opacity === '1').length,
      };
    });
    expect(hero.cueSize).toBe(12);
    expect(hero.cueEffective).toBe(12);
    expect(hero.cueScale).toBe(1);
    expect(hero.cueTop).toBeGreaterThanOrEqual(hero.portraitBottom);
    expect(hero.plateWidth).toBeLessThanOrEqual(325.1);
    expect(hero.plateRatio).toBeCloseTo(326 / 204, 2);
    expect(hero.slideCount).toBe(6);
    expect(hero.activeSlides).toBe(1);
    if ([1440, 1100].includes(viewport.width)) {
      await page.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); });
      await page.clock.runFor(100);
      await page.screenshot({ path: info.outputPath(`desktop-hero-${language}-${viewport.width}x${viewport.height}.png`), fullPage: false });
    }
    const result = await page.frameLocator('#kc-desktop-project-frame').locator('#stage').evaluate(async (stage) => {
      await document.fonts.ready;
      const frame = window.frameElement;
      const root = frame.ownerDocument;
      const rail = stage.querySelector('#rail');
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
      const metrics = cards.map((card) => {
        const title = card.querySelector('.ticket-info h2');
        const description = card.querySelector('.ticket-info p');
        const tags = card.querySelector('.tags');
        const image = card.querySelector('.ticket-image');
        const panel = card.querySelector('.ticket-panel');
        const info = card.querySelector('.ticket-info');
        const titleStyle = getComputedStyle(title);
        const descriptionStyle = getComputedStyle(description);
        const tagsStyle = getComputedStyle(tags);
        const imageStyle = getComputedStyle(image);
        const r = { card: rect(card), panel: rect(panel), image: rect(image), info: rect(info), title: rect(title), description: rect(description), tags: rect(tags) };
        return {
          id: card.dataset.projectId,
          href: card.getAttribute('href'),
          poster: card.style.getPropertyValue('--poster'),
          text: title.textContent.trim(),
          mediaSources: [...image.querySelectorAll('.media-layer')].map(layer => layer.tagName === 'VIDEO' ? layer.dataset.src : layer.getAttribute('src')),
          fonts: {
            title: { css: parseFloat(titleStyle.fontSize), effective: parseFloat(titleStyle.fontSize) * scaleOf(title), family: titleStyle.fontFamily, weight: titleStyle.fontWeight, lineHeight: titleStyle.lineHeight, letterSpacing: titleStyle.letterSpacing },
            description: { css: parseFloat(descriptionStyle.fontSize), effective: parseFloat(descriptionStyle.fontSize) * scaleOf(description), family: descriptionStyle.fontFamily, weight: descriptionStyle.fontWeight, lineHeight: descriptionStyle.lineHeight, letterSpacing: descriptionStyle.letterSpacing },
            tags: { css: parseFloat(tagsStyle.fontSize), effective: parseFloat(tagsStyle.fontSize) * scaleOf(tags), family: tagsStyle.fontFamily, weight: tagsStyle.fontWeight, lineHeight: tagsStyle.lineHeight, letterSpacing: tagsStyle.letterSpacing },
          },
          radii: { outer: getComputedStyle(card).borderTopLeftRadius, panel: getComputedStyle(panel).borderTopLeftRadius, media: imageStyle.borderTopLeftRadius },
          media: { objectFit: imageStyle.backgroundSize, layerCount: image.querySelectorAll('.media-layer').length },
          mediaCrop: [...image.querySelectorAll('.media-layer')].map(layer => getComputedStyle(layer).objectFit),
          backgroundCrop: getComputedStyle(card, '::before').backgroundSize,
          contentFits: info.scrollHeight <= info.clientHeight + 1 && r.title.bottom <= r.description.top + 1 && r.description.bottom <= r.tags.top + 1 && r.tags.bottom <= r.info.bottom + 1,
          boxes: r,
        };
      });
      const heading = stage.querySelector('.heading');
      const toolbar = stage.querySelector('.toolbar small');
      return {
        viewport: { width: innerWidth, height: innerHeight },
        stage: { rect: rect(stage), transform: getComputedStyle(stage).transform },
        heading: { text: heading.textContent.trim(), fontSize: parseFloat(getComputedStyle(heading).fontSize), effective: parseFloat(getComputedStyle(heading).fontSize) * scaleOf(heading), transform: getComputedStyle(heading).transform, rect: rect(heading) },
        toolbar: { fontSize: parseFloat(getComputedStyle(toolbar).fontSize), effective: parseFloat(getComputedStyle(toolbar).fontSize) * scaleOf(toolbar), rect: rect(toolbar) },
        rail: { width: rail.scrollWidth, travel: Number.parseFloat(rail.style.transform.match(/-([\d.]+)px/)?.[1] || '0'), transform: rail.style.transform, rect: rect(rail) },
        section: { height: frame.ownerDocument.querySelector('#kc-desktop-projets').getBoundingClientRect().height },
        aboutDocumentTop: root.querySelector('#apropos').getBoundingClientRect().top + root.defaultView.scrollY,
        projectDocumentTop: root.querySelector('#kc-desktop-projets').getBoundingClientRect().top + root.defaultView.scrollY,
        cards: metrics,
      };
    });

    expect(result.viewport).toEqual(viewport);
    const heroLeft = await page.locator('.kc-desktop-hero-title').evaluate(title => title.getBoundingClientRect().left);
    const expectedTicketWidth = Math.min(1142, viewport.width - heroLeft * 2 - 16);
    expect(result.stage.transform).toBe('none');
    expect(result.heading.fontSize).toBe(56);
    expect(result.heading.effective).toBe(56);
    expect(result.cards[0].boxes.card.top).toBeGreaterThanOrEqual(result.heading.rect.bottom + 23.9);
    expect(result.toolbar.fontSize).toBe(12);
    expect(result.toolbar.effective).toBe(12);
    expect(result.cards.map(card => card.id)).toEqual(order);
    expect(result.cards[0].boxes.card.width).toBeCloseTo(expectedTicketWidth, 0);
    expect(result.cards[0].boxes.card.height).toBeCloseTo(expectedTicketWidth * 393.453 / 1142, 1);
    if (viewport.width === 1440) {
      expect(result.cards[0].boxes.card.left).toBe(32);
      expect(result.cards[0].boxes.card.top).toBeCloseTo(474.55, 0);
      expect(result.cards[0].boxes.card.width).toBe(1142);
      expect(result.cards[0].boxes.card.height).toBeCloseTo(393.453, 0);
    }
    expect(result.aboutDocumentTop).toBeCloseTo(result.projectDocumentTop + result.section.height, 0);
    for (const card of result.cards) {
      expect(card.fonts.title).toMatchObject({ css: 40, effective: 40, family: 'Figtree, Arial, sans-serif', weight: '700', lineHeight: '40px', letterSpacing: '-1.2px' });
      expect(card.fonts.description).toMatchObject({ css: 14, effective: 14, family: 'Inter, Arial, sans-serif', weight: '400', lineHeight: '21px', letterSpacing: '-0.14px' });
      expect(card.fonts.tags).toMatchObject({ css: 12, effective: 12, family: 'Inter, Arial, sans-serif', weight: '400', lineHeight: '18px', letterSpacing: '0.48px' });
      const record = projectRecords.get(card.id);
      expect(card.href).toBe(qa.links[titles[card.id]]);
      expect(card.mediaSources).toEqual(record.presentations.desktop.media.map(media => media.element === 'video' ? media['data-src'] : media.src));
      expect(card.poster).toContain(record.presentations.desktop.styleAssets[0]);
      expect(card.radii).toEqual({ outer: '8px', panel: '4px', media: '4px' });
      expect(card.media.layerCount).toBeGreaterThan(0);
      expect(card.mediaCrop.every(crop => crop === 'cover')).toBe(true);
      expect(card.backgroundCrop).toBe('cover');
      expect(card.contentFits, `${viewport.width}px ${card.id}: ${JSON.stringify(card.boxes)}`).toBe(true);
      expect(card.boxes.panel.left).toBeGreaterThanOrEqual(card.boxes.card.left);
      expect(card.boxes.panel.right).toBeLessThanOrEqual(card.boxes.card.right);
      expect(card.boxes.image.left).toBeGreaterThanOrEqual(card.boxes.panel.left);
      expect(card.boxes.image.right).toBeLessThanOrEqual(card.boxes.panel.right);
    }

    // Save review-only captures; these do not update or replace regression references.
    const section = page.locator('#kc-desktop-projets');
    const sectionTop = await section.evaluate(el => el.getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => { window.scrollTo({ top: y + 10, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); }, sectionTop);
    await page.clock.runFor(150);
    await page.frameLocator('#kc-desktop-project-frame').locator('#rail .ticket').first().waitFor({ state: 'visible' });
    if ([1440, 1100].includes(viewport.width)) {
      await page.screenshot({ path: info.outputPath(`desktop-projects-${language}-${viewport.width}x${viewport.height}.png`), fullPage: false });
    }

    const railState = async () => page.frameLocator('#kc-desktop-project-frame').locator('#rail').evaluate(rail => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(rail).transform);
      const last = rail.lastElementChild.getBoundingClientRect();
      const first = rail.firstElementChild.getBoundingClientRect();
      return { x: matrix.m41, firstLeft: first.left, lastRight: last.right };
    });
    const hireRight = await page.locator('.kc-responsive-nav a[href^="mailto:"]').evaluate(el => el.getBoundingClientRect().right);
    const sectionHeight = result.section.height;
    await page.evaluate((y) => { window.scrollTo({ top: y + 10, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); }, sectionTop);
    await page.clock.runFor(100);
    const start = await railState();
    expect(Math.abs(start.x)).toBeLessThanOrEqual(1);
    await page.evaluate(({ y, h, vh }) => { window.scrollTo({ top: y + h - vh, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); }, { y: sectionTop, h: sectionHeight, vh: viewport.height });
    await page.clock.runFor(100);
    const end = await railState();
    expect(end.lastRight).toBeLessThanOrEqual(viewport.width + 1);
    expect(end.lastRight).toBeGreaterThanOrEqual(viewport.width - 64);
    expect(Math.abs(end.lastRight - hireRight)).toBeLessThanOrEqual(0.5);
    expect(end.firstLeft).toBeLessThan(0);
    if ([1440, 1100].includes(viewport.width)) {
      await page.screenshot({ path: info.outputPath(`desktop-projects-rail-end-${language}-${viewport.width}x${viewport.height}.png`), fullPage: false });
    }
    frames.push({ viewport, result, start, end });
  }

  // Resize while partway through the rail, then verify the mapping is recalculated and both
  // ends remain reachable without clipping or a stale travel amount.
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.clock.runFor(300);
  const section = page.locator('#kc-desktop-projets');
  const top = await section.evaluate(el => el.getBoundingClientRect().top + scrollY);
  await page.evaluate(y => { window.scrollTo({ top: y + 800, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); }, top);
  await page.clock.runFor(150);
  await page.setViewportSize({ width: 1100, height: 700 });
  await page.clock.runFor(300);
  const resized = await page.frameLocator('#kc-desktop-project-frame').locator('#rail').evaluate(rail => ({
    transform: getComputedStyle(rail).transform,
    width: rail.scrollWidth,
    cards: [...rail.querySelectorAll('.ticket')].map(card => ({ width: card.getBoundingClientRect().width, height: card.getBoundingClientRect().height })),
  }));
  expect(resized.cards).toHaveLength(6);
  expect(resized.cards[0].width).toBeLessThanOrEqual(1036);
  expect(resized.cards[0].width).toBeGreaterThan(1000);
  expect(resized.cards[0].height).toBeCloseTo(resized.cards[0].width * 393.453 / 1142, 1);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.runFor(300);
  const finalSection = await section.evaluate(el => ({ top: el.getBoundingClientRect().top + scrollY, height: el.getBoundingClientRect().height }));
  await page.evaluate(({ top, height }) => { window.scrollTo({ top: top + height - innerHeight - 1, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); }, finalSection);
  await page.clock.runFor(150);
  const transition = await page.evaluate(() => ({
    scrollY,
    projectBottom: document.querySelector('#kc-desktop-projets').getBoundingClientRect().bottom,
    aboutTop: document.querySelector('#apropos').getBoundingClientRect().top,
  }));
  expect(Math.abs(transition.aboutTop - 900)).toBeLessThanOrEqual(2);
  expect(Math.abs(transition.projectBottom - 900)).toBeLessThanOrEqual(2);
  await page.screenshot({ path: info.outputPath(`desktop-projects-end-${language}-1440x900.png`), fullPage: false });
  expect(frames).toHaveLength(viewports.length);
});
