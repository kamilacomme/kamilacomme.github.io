const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

const regions = [
  { name: 'beginning', progress: 0.05 },
  { name: 'middle', progress: 0.5 },
  { name: 'end', progress: 0.94 },
];

const sectionFor = (profile) => profile === 'desktop'
  ? '#apropos'
  : profile === 'tablet' ? '#apropos-t' : '#apropos-m';

async function positionAbout(page, profile, progress) {
  await page.evaluate(({ selector, progress }) => {
    const section = document.querySelector(selector);
    const rect = section.getBoundingClientRect();
    const documentTop = rect.top + window.scrollY;
    const travel = Math.max(0, rect.height - window.innerHeight);
    window.scrollTo({ top: documentTop + travel * progress, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  }, { selector: sectionFor(profile), progress });
  await page.clock.runFor(120);
}

async function aboutPosition(page, expectedProfile) {
  return page.evaluate((expectedProfile) => {
    const ids = { desktop: '#apropos', tablet: '#apropos-t', mobile: '#apropos-m' };
    const section = document.querySelector(ids[expectedProfile]);
    const rect = section.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    const documentTop = rect.top + window.scrollY;
    const progress = Math.max(0, Math.min(1, (window.scrollY - documentTop) / travel));
    const footer = document.querySelector('#contact').getBoundingClientRect();
    const cards = [...section.querySelectorAll('[data-i]')];
    return {
      profile: expectedProfile,
      progress,
      region: progress < 0.25 ? 'beginning' : progress < 0.75 ? 'middle' : 'end',
      sectionTop: rect.top,
      sectionBottom: rect.bottom,
      footerTop: footer.top,
      cardCount: cards.length,
      introFont: parseFloat(getComputedStyle(section.querySelector('p')).fontSize),
    };
  }, expectedProfile);
}

async function resizeAndCheck(page, fromProfile, toProfile, viewport, expectedRegion) {
  await page.setViewportSize(viewport);
  // fit() and the tablet geometry owner both have delayed startup/reflow passes.
  await page.clock.runFor(2300);
  const result = await aboutPosition(page, toProfile);
  expect(result.profile).toBe(toProfile);
  expect(result.region, `About should remain in its ${expectedRegion} region after ${fromProfile} → ${toProfile}.`).toBe(expectedRegion);
  expect(result.cardCount).toBe(5);
  expect(Math.abs(result.progress - (expectedRegion === 'beginning' ? 0.05 : expectedRegion === 'middle' ? 0.5 : 0.94)))
    .toBeLessThan(0.12);
  // Before the final boundary, Footer must remain after the visible About section.
  expect(result.footerTop, 'Resize must not unexpectedly place the Footer at the top of the viewport.').toBeGreaterThan(0);
  expect(result.introFont).toBe(toProfile === 'desktop' ? 56 : 48);
  return result;
}

test('About keeps its semantic region across responsive profile changes and orientation resizing', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(!['desktop', 'tablet-portrait'].includes(mode), 'Cross-profile About continuity runs from desktop and tablet device profiles.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  await page.clock.runFor(2300);

  const startingProfile = mode === 'desktop' ? 'desktop' : 'tablet';
  const startViewport = mode === 'desktop' ? { width: 1440, height: 900 } : { width: 834, height: 1112 };
  const projectRegions = [];

  for (const region of regions) {
    await page.setViewportSize(startViewport);
    await page.clock.runFor(2300);
    await positionAbout(page, startingProfile, region.progress);
    const before = await aboutPosition(page, startingProfile);
    expect(before.region).toBe(region.name);

    if (startingProfile === 'desktop') {
      const tablet = await resizeAndCheck(page, 'desktop', 'tablet', { width: 834, height: 1112 }, region.name);
      const desktop = await resizeAndCheck(page, 'tablet', 'desktop', { width: 1440, height: 900 }, region.name);
      projectRegions.push({ language, region: region.name, before, tablet, desktop });
    } else {
      const landscape = await resizeAndCheck(page, 'tablet', 'tablet', { width: 1194, height: 834 }, region.name);
      const portrait = await resizeAndCheck(page, 'tablet', 'tablet', { width: 834, height: 1112 }, region.name);
      const desktop = await resizeAndCheck(page, 'tablet', 'desktop', { width: 1440, height: 900 }, region.name);
      const tablet = await resizeAndCheck(page, 'desktop', 'tablet', { width: 834, height: 1112 }, region.name);
      projectRegions.push({ language, region: region.name, before, landscape, portrait, desktop, tablet });
    }
  }

  // The About/Footer seam remains the expected end of the section, with no extra gap
  // or navigation jump. A progress of 0.99 must still be in About before the seam.
  await page.setViewportSize(startViewport);
  await page.clock.runFor(2300);
  await positionAbout(page, startingProfile, 0.99);
  const nearBoundary = await aboutPosition(page, startingProfile);
  expect(nearBoundary.region).toBe('end');
  expect(nearBoundary.footerTop).toBeGreaterThan(0);

  const footerDocumentTop = await page.locator('#contact').evaluate(footer => footer.getBoundingClientRect().top + window.scrollY);
  await page.evaluate(top => {
    window.scrollTo({ top, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  }, footerDocumentTop);
  await page.clock.runFor(100);
  const boundary = await page.evaluate(selector => ({
    sectionBottom: document.querySelector(selector).getBoundingClientRect().bottom,
    footerTop: document.querySelector('#contact').getBoundingClientRect().top,
  }), sectionFor(startingProfile));
  expect(Math.abs(boundary.sectionBottom - boundary.footerTop)).toBeLessThanOrEqual(1);
  await expect(page.locator('#contact')).toBeInViewport();
});
