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

  const widths = [500, 560, 607, 608, 640, 659, 660, 680, 834];
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
      const cards = [...document.querySelectorAll('#kc-tablet-projets .ticket')];
      return {
        lang: document.documentElement.lang,
        tabletActive: window.__kcTabletLayout.tablet,
        navClass: nav.classList.contains('kc-tablet-nav'),
        navDisplay: getComputedStyle(nav).display,
        navBox: rect(nav),
        navScale: getComputedStyle(nav).getPropertyValue('--kc-nav-scale').trim(),
        logo: rect(nav.children[0]),
        linksDisplay: getComputedStyle(links).display,
        links: rect(links),
        sectionLinks: [...links.querySelectorAll('a')].map((link) => ({ text: link.textContent.trim(), href: link.getAttribute('href'), rect: rect(link) })),
        pill: rect(pill),
        pillLabel: pill.lastElementChild.textContent.trim(),
        cta: rect(cta),
        ctaText: cta.textContent.trim(),
        cards: cards.map((card) => {
          const panel = card.querySelector('.ticket-panel');
          const image = card.querySelector('.ticket-image');
          const info = card.querySelector('.ticket-info');
          const group = info.firstElementChild;
          const title = group.querySelector('h2');
          const description = group.querySelector('p');
          const tags = info.querySelector('.tags');
          const barcode = card.querySelector('.barcode');
          return {
            id: card.dataset.projectId,
            href: card.getAttribute('href'),
            poster: getComputedStyle(card).getPropertyValue('--poster'),
            card: rect(card), panel: rect(panel), image: rect(image), info: rect(info),
            title: rect(title), description: rect(description), tags: rect(tags), barcode: rect(barcode),
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
    expect(Math.abs(metrics.aboutDocumentTop - metrics.projectDocumentTop - metrics.projectHeight)).toBeLessThanOrEqual(2);
    const vertical = width <= 659;
    expect(metrics.cards[0].panelPosition).toBe(vertical ? 'relative' : 'absolute');
    for (const card of metrics.cards) {
      expect(card.href).toMatch(/^https:\/\//);
      expect(card.poster).toContain('/assets/projets/bg/');
      expect(card.card.left).toBe(32);
      expect(card.card.width).toBe(width - 64);
      expect(card.textSizes).toEqual([32, 14, 12]);
      if (vertical) {
        expect(card.card.height).toBeGreaterThan(310);
        expect(card.panelDisplay).toBe('flex');
        expect(card.image.left).toBe(card.info.left);
        expect(card.image.right).toBe(card.info.right);
        expect(card.groupBottom).toBeLessThanOrEqual(card.tags.top + 1);
        expect(card.tags.bottom).toBeLessThanOrEqual(card.info.bottom + 1);
        expect(card.image.bottom).toBeLessThanOrEqual(card.info.top);
        expect(card.barcode.top).toBeGreaterThanOrEqual(card.tags.bottom);
        expect(card.barcode.bottom).toBeLessThanOrEqual(card.panel.bottom);
      } else {
        expect(card.panelPosition).toBe('absolute');
        expect(card.card.height).toBe(310);
        expect(card.groupBottom).toBeLessThanOrEqual(card.tags.top + 1);
        expect(card.tags.bottom).toBeLessThanOrEqual(card.info.bottom + 1);
      }
    }

    const navRow = width <= 607;
    expect(metrics.navDisplay).toBe(navRow ? 'grid' : 'flex');
    expect(metrics.linksDisplay).toBe(navRow ? 'flex' : 'none');
    expect(metrics.pill.height).toBe(44);
    expect(metrics.cta.height).toBe(44);
    expect(metrics.pill.width).toBeGreaterThan(metrics.pillLabel.length * 5);
    expect(metrics.ctaText).toBeTruthy();
    if (navRow) {
      expect(metrics.logo.right).toBeLessThanOrEqual(metrics.cta.left);
      expect(metrics.links.right).toBeLessThanOrEqual(metrics.pill.left);
      expect(metrics.sectionLinks).toHaveLength(3);
      expect(metrics.sectionLinks.map((link) => link.href)).toEqual(language === 'fr'
        ? ['#projets-t', '#apropos-t', '#contact']
        : ['/en/#projets', '/en/#apropos', '/en/#contact']);
    } else {
      expect(metrics.logo.right + 15).toBeLessThanOrEqual(metrics.pill.left);
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
    mobileRootDisplay: getComputedStyle(document.querySelector('#kc-mobile-root')).display,
    editorialCards: document.querySelectorAll('#kc-mobile-projets .project').length,
    mobileTicketCount: document.querySelectorAll('#kc-mobile-projets .ticket').length,
  }));
  expect(mobile).toEqual({ tablet: false, navClass: false, mobileRootDisplay: 'block', editorialCards: 6, mobileTicketCount: 0 });
  await info.attach('narrow-tablet-fit-metrics.json', {
    body: Buffer.from(JSON.stringify(records, null, 2)), contentType: 'application/json',
  });
});
