const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');
const order = require('../../content/projects.json').canonicalOrder;

async function settleViewport(page, viewport) {
  await page.setViewportSize(viewport);
  await page.clock.runFor(250);
  await expect.poll(() => page.evaluate(() => window.__kcTabletLayout?.width)).toBe(viewport.width);
  // The controller publishes its viewport policy before Projects' next animation-frame fit.
  await page.clock.runFor(50);
  if (viewport.width >= 500) {
    const expected = viewport.width > 659 && viewport.width > viewport.height ? Math.min(770, viewport.width - 64) : viewport.width - 64;
    await expect.poll(() => page.locator('#kc-tablet-projets .ticket').first()
      .evaluate((card) => card.getBoundingClientRect().width)).toBe(expected);
  }
}

test('narrow tablet tickets and navigation reflow without scaling text', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'tablet-portrait', 'Narrow fit is driven through tablet portrait widths and orientation changes.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);

  const widths = [500, 560, 607, 608, 640, 659, 660, 680, 686, 687, 700, 720, 760, 780, 799, 800, 834];
  const records = [];
  for (const width of widths) {
    const viewport = { width, height: Math.round(width * 1.35) };
    await settleViewport(page, viewport);
    const metrics = await page.evaluate(() => {
      const rect = (element) => {
        const box = element.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
      };
      const nav = document.querySelector('.kc-responsive-nav');
      const links = nav.children[1];
      const pill = nav.children[2].children[0];
      const cta = nav.children[2].children[1];
      const cards = [...document.querySelectorAll('#kc-tablet-projets .ticket')]
        .filter((card) => card.querySelector('.ticket-info'));
      return {
        lang: document.documentElement.lang,
        tabletActive: window.__kcTabletLayout.tablet,
        navClass: nav.classList.contains('kc-tablet-nav'),
        viewportWidth: innerWidth,
        navDisplay: getComputedStyle(nav).display,
        navBox: rect(nav),
        navScale: getComputedStyle(nav).getPropertyValue('--kc-nav-scale').trim(),
        logo: rect(nav.children[0]),
        linksDisplay: getComputedStyle(links).display,
        links: rect(links),
        sectionLinks: [...links.querySelectorAll('a')].map((link) => ({ text: link.textContent.trim(), href: link.getAttribute('href'), rect: rect(link) })),
        pill: rect(pill),
        pillDisplay: getComputedStyle(pill).display,
        pillLabel: pill.lastElementChild.textContent.trim(),
        cta: rect(cta),
        ctaText: cta.textContent.trim(),
        cards: cards.map((card) => {
          const panel = card.querySelector('.ticket-panel') || card;
          const image = card.querySelector('.ticket-image');
          const info = card.querySelector('.ticket-info');
          const group = info.firstElementChild;
          const title = group.querySelector('h2');
          const description = group.querySelector('p');
          const tags = info.querySelector('.tags');
          const barcode = card.querySelector('.barcode');
          const barcodeSlot = card.querySelector('.barcode-slot');
          const titleRange = document.createRange();
          titleRange.selectNodeContents(title);
          const titleLines = titleRange.getClientRects().length;
          const firstBar = barcode.querySelector('rect');
          if (![panel, image, info, group, title, description, tags, barcode, barcodeSlot, firstBar].every(Boolean)) {
            throw new Error(`Missing shared ticket part in ${card.dataset.projectId}: ${[panel, image, info, group, title, description, tags, barcode, barcodeSlot, firstBar].map(Boolean).join(',')}`);
          }
          return {
            id: card.dataset.projectId,
            href: card.getAttribute('href'),
            descriptionText: description.textContent,
            videoCount: card.querySelectorAll('video[data-src]').length,
            poster: getComputedStyle(card).getPropertyValue('--poster'),
            card: rect(card), panel: rect(panel), image: rect(image), info: rect(info),
            title: rect(title), description: rect(description), tags: rect(tags), barcode: rect(barcode),
            barcodeSlot: rect(barcodeSlot), firstBar: rect(firstBar), titleLines,
            imageCssSize: [getComputedStyle(image).width, getComputedStyle(image).height],
            panelDisplay: getComputedStyle(panel).display,
            panelPosition: getComputedStyle(panel).position,
        textSizes: [title, description, tags].map((node) => parseFloat(getComputedStyle(node).fontSize)),
            groupBottom: rect(group).bottom,
          };
        }),
        projectDocumentTop: document.querySelector('#kc-tablet-projets').getBoundingClientRect().top + scrollY,
        projectHeight: document.querySelector('#kc-tablet-projets').getBoundingClientRect().height,
        aboutDocumentTop: document.querySelector('#apropos-t').getBoundingClientRect().top + scrollY,
      };
    });
    records.push({ width, ...metrics });

    expect(metrics.lang).toBe(language);
    expect(metrics.tabletActive).toBe(true);
    expect(metrics.navClass).toBe(true);
    expect(metrics.cards.map((card) => card.id)).toEqual(order);
    expect(metrics.cards.map((card) => card.videoCount)).toEqual([1, 1, 0, 1, 0, 0]);
    expect(Math.abs(metrics.aboutDocumentTop - metrics.projectDocumentTop - metrics.projectHeight)).toBeLessThanOrEqual(2);
    const vertical = width < 800;
    if (metrics.cards.some((card) => card.panel.width !== card.card.width)) {
      expect(metrics.cards[0].panelPosition).toBe(vertical ? 'relative' : 'absolute');
    }
    for (const card of metrics.cards) {
      expect(card.href).toMatch(/^https:\/\//);
      expect(card.poster).toContain('/assets/projets/bg/');
      expect(card.textSizes).toEqual([vertical ? 24 : 32, 14, 12]);
      if (vertical) {
        expect(card.card.height).toBeGreaterThanOrEqual(572);
        if (card.panel.width !== card.card.width) {
          expect(card.panel.width).toBe(356);
          expect(card.panel.height).toBeGreaterThanOrEqual(444);
          expect(card.panelDisplay).toBe('grid');
        }
        expect(parseFloat(card.imageCssSize[0])).toBeLessThanOrEqual(308);
        expect(parseFloat(card.imageCssSize[1])).toBeCloseTo(172, 0);
        expect(card.groupBottom).toBeLessThanOrEqual(card.tags.top + 1);
        expect(card.tags.bottom).toBeLessThanOrEqual(card.info.bottom + 1);
        expect(card.image.bottom).toBeLessThanOrEqual(card.info.top);
        expect(card.info.bottom).toBeLessThanOrEqual(card.barcodeSlot.top);
        expect(card.barcodeSlot.top).toBeGreaterThanOrEqual(card.tags.bottom);
        expect(card.barcodeSlot.bottom).toBeLessThanOrEqual(card.panel.bottom);
        expect(card.barcodeSlot.width).toBeLessThanOrEqual(308);
        expect(card.barcodeSlot.height).toBe(38);
        if (card.card.width > 0) {
          expect(card.barcode.width).toBeCloseTo(card.barcodeSlot.width, 0);
          expect(card.barcode.height).toBe(38);
          expect(card.firstBar.height).toBeCloseTo(38, 0);
          expect(card.firstBar.width).toBeGreaterThan(0);
          expect(card.firstBar.width).toBeLessThan(card.barcodeSlot.width);
        }
        if (card.panel.width !== card.card.width) {
          expect(Math.abs((card.panel.left - card.card.left) - (card.card.right - card.panel.right))).toBeLessThanOrEqual(1);
          expect(card.image.bottom).toBeLessThanOrEqual(card.info.top);
        }
      } else {
        if (card.panel.width !== card.card.width) {
          expect(card.panelPosition).toBe('absolute');
          expect(card.card.height).toBe(310);
        }
        expect(card.groupBottom).toBeLessThanOrEqual(card.tags.top + 1);
        expect(card.titleLines, `${language}/${width}/${card.id} title should stay on one line in the horizontal ticket`).toBe(1);
      }
    }

    const longread = metrics.cards.find((card) => card.id === 'longread');
    if (language === 'fr') expect(longread.descriptionText).toMatch(/autant\u202f\?$/);
    else expect(longread.descriptionText).toMatch(/much\?$/);
    const frenchType = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const texts = [];
      while (walker.nextNode()) {
        if (walker.currentNode.parentElement.closest('script,style')) continue;
        texts.push(walker.currentNode.nodeValue);
      }
      return {
        badPunctuation: texts.filter((text) => /[ \t\u00a0](?=[?!:;])/.test(text)),
        badQuotes: texts.filter((text) => /«(?!\u202f)|(?<!\u202f)»/.test(text)),
      };
    });
    if (language === 'fr') {
      expect(frenchType.badPunctuation).toEqual([]);
      expect(frenchType.badQuotes).toEqual([]);
    }

    const narrowNav = width <= 607;
    expect(metrics.navDisplay).toBe('flex');
    expect(metrics.linksDisplay).toBe('none');
    if (narrowNav) expect(metrics.pillDisplay).toBe('none');
    else expect(metrics.pillDisplay).not.toBe('none');
    expect(metrics.cta.height).toBe(44);
    expect(metrics.ctaText).toBeTruthy();
    expect(metrics.cta.width).toBeGreaterThan(metrics.ctaText.length * 5);
    expect(metrics.cta.left).toBeGreaterThanOrEqual(0);
    expect(metrics.cta.right).toBeLessThanOrEqual(width - 31);
    if (narrowNav) {
      expect(metrics.logo.right + 12).toBeLessThanOrEqual(metrics.cta.left);
    } else {
      expect(metrics.pill.height).toBe(44);
      expect(metrics.pill.width).toBeGreaterThan(metrics.pillLabel.length * 5);
      expect(metrics.logo.right + 15).toBeLessThanOrEqual(metrics.pill.left);
      expect(metrics.pill.right).toBeLessThan(metrics.cta.left);
    }
  }

  // Rotation widens the same tablet layout back to the original horizontal rail.
  await settleViewport(page, { width: 900, height: 600 });
  const rotated = await page.locator('#kc-tablet-projets').evaluate((root) => ({
    narrow: root.classList.contains('kc-narrow-ticket'),
    landscape: root.classList.contains('kc-landscape-rail'),
    cardWidth: root.querySelector('.ticket').getBoundingClientRect().width,
    cardHeight: root.querySelector('.ticket').getBoundingClientRect().height,
    titleSize: parseFloat(getComputedStyle(root.querySelector('.ticket-info h2')).fontSize),
  }));
  expect(rotated.narrow).toBe(false);
  expect(rotated.landscape).toBe(true);
  expect(rotated.cardWidth).toBe(770);
  expect(rotated.cardHeight).toBe(310);
  expect(rotated.titleSize).toBe(32);

  // Returning to phone width still selects the unchanged editorial mobile presentation.
  await settleViewport(page, { width: 393, height: 852 });
  const mobile = await page.evaluate(() => ({
    tablet: window.__kcTabletLayout.tablet,
    navClass: document.querySelector('.kc-responsive-nav').classList.contains('kc-tablet-nav'),
    nav: document.querySelector('.kc-responsive-nav').getBoundingClientRect().toJSON(),
    logo: document.querySelector('.kc-responsive-nav > span:first-child').getBoundingClientRect().toJSON(),
    linksDisplay: getComputedStyle(document.querySelector('.kc-responsive-nav > div:nth-child(2)')).display,
    pillDisplay: getComputedStyle(document.querySelector('.kc-responsive-nav > div:last-child > span[data-fixed-ink]')).display,
    cta: document.querySelector('.kc-responsive-nav a[href^="mailto"]').getBoundingClientRect().toJSON(),
    ctaText: document.querySelector('.kc-responsive-nav a[href^="mailto"]').textContent.trim(),
    mobileRootDisplay: getComputedStyle(document.querySelector('#kc-mobile-root')).display,
    editorialCards: document.querySelectorAll('#kc-mobile-projets .project').length,
    mobileTicketCount: document.querySelectorAll('#kc-mobile-projets .ticket').length,
  }));
  expect(mobile.tablet).toBe(false);
  expect(mobile.navClass).toBe(false);
  expect(mobile.linksDisplay).toBe('none');
  expect(mobile.pillDisplay).toBe('none');
  expect(mobile.cta.height).toBe(44);
  expect(mobile.logo.right + 12).toBeLessThanOrEqual(mobile.cta.left);
  expect(mobile.cta.right).toBeLessThanOrEqual(393 - 15);
  expect(mobile.mobileRootDisplay).toBe('block');
  expect(mobile.editorialCards).toBe(6);
  expect(mobile.mobileTicketCount).toBe(0);
  await settleViewport(page, { width: 320, height: 568 });
  const smallestPhoneNav = await page.evaluate(() => ({
    cta: document.querySelector('.kc-responsive-nav a[href^="mailto"]').getBoundingClientRect().toJSON(),
    logo: document.querySelector('.kc-responsive-nav > span:first-child').getBoundingClientRect().toJSON(),
  }));
  expect(smallestPhoneNav.logo.right + 8).toBeLessThanOrEqual(smallestPhoneNav.cta.left);
  expect(smallestPhoneNav.cta.right).toBeLessThanOrEqual(305);
  expect(smallestPhoneNav.cta.height).toBe(44);
  await info.attach('narrow-tablet-fit-metrics.json', {
    body: Buffer.from(JSON.stringify(records, null, 2)), contentType: 'application/json',
  });
});
