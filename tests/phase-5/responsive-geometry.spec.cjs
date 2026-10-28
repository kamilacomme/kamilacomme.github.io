'use strict';

const { test, expect } = require('@playwright/test');
const qaBase = require('../qa/helpers.cjs');
const responsive = require('./responsive-qa.helpers.cjs');

function matrixForContext(mode) {
  if (mode === 'desktop') return [
    responsive.routineMatrix[0], ...responsive.resilienceMatrix,
  ];
  if (mode === 'tablet-portrait') return [responsive.routineMatrix[1]];
  if (mode === 'tablet-landscape') return [responsive.routineMatrix[2], responsive.routineMatrix[3]];
  return [responsive.routineMatrix[4], responsive.routineMatrix[5]];
}

test('responsive QA known-good smoke records a fresh desktop capture', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'desktop' || language !== 'fr', 'One deterministic known-good harness smoke case.');
  const viewport = { width: 1440, height: 900 };
  await responsive.initialize(page, context, language, viewport);
  await page.frameLocator('#kc-desktop-project-frame').locator('#rail .ticket').nth(5).waitFor({ state: 'attached' });
  const measured = await responsive.measurePage(page, viewport, language, 'known-good-smoke');
  await responsive.record(page, info, 'known-good-fr-desktop-1440x900', measured);
  expect(measured.profile.mode).toBe('desktop');
  expect(measured.projects.ticketCount).toBe(6);
  expect(measured.viewport.documentScrollWidth).toBeLessThanOrEqual(viewport.width + 1);
});

test('responsive geometry matrix records actual profile, text scale, gutters and ticket bounds', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  const entries = matrixForContext(mode);
  for (const entry of entries) {
    await responsive.initialize(page, context, language, entry.viewport);
    const expectedPath = language === 'en' ? '/en/' : '/';
    expect(new URL(page.url()).pathname).toBe(expectedPath);
    expect(await page.locator('#kc-desktop-project-frame').count()).toBe(1);
    if (mode === 'desktop') {
      await page.frameLocator('#kc-desktop-project-frame').locator('#rail .ticket').nth(5).waitFor({ state: 'attached' });
    } else {
      const selector = mode === 'mobile' ? '#kc-mobile-projets .project' : '#kc-tablet-projets .ticket';
      await expect(page.locator(selector)).toHaveCount(6);
    }
    await responsive.settleLayout(page);
    const measured = await responsive.measurePage(page, entry.viewport, language, entry.classification || 'routine');
    const label = `${language}-${entry.id}-${mode}`;
    await responsive.record(page, info, label, measured);

    expect(measured.viewport.width).toBe(entry.viewport.width);
    expect(measured.viewport.height).toBe(entry.viewport.height);
    expect(measured.profile.mode).toBe(mode === 'tablet-portrait' || mode === 'tablet-landscape' ? 'tablet' : mode);
    expect(measured.viewport.documentScrollWidth).toBeLessThanOrEqual(entry.viewport.width + 1);
    expect(measured.projects.ticketCount).toBe(6);
    expect(measured.nav.hire.height).toBeGreaterThanOrEqual(44);
    expect(measured.switcher.box.width).toBe(44);
    expect(measured.switcher.box.height).toBe(44);
    expect(measured.switcher.transforms.x).toBeCloseTo(1, 3);
    expect(measured.switcher.transforms.y).toBeCloseTo(1, 3);
    expect(measured.hero.font).toBe(mode === 'desktop' ? 56 : mode === 'mobile' ? 32 : 48);
    expect(measured.hero.transforms.x).toBeCloseTo(1, 3);
    expect(measured.hero.transforms.y).toBeCloseTo(1, 3);
  }
});

test('responsive geometry records compact width/profile and height-fit boundaries', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  const cases = mode === 'mobile'
    ? [
        { id: 'mobile-tablet-width-boundary-499', viewport: { width: 499, height: 800 }, expected: 'mobile' },
        { id: 'mobile-tablet-width-boundary-500', viewport: { width: 500, height: 800 }, expected: 'tablet' },
      ]
    : mode === 'desktop'
      ? [
          { id: 'tablet-desktop-width-boundary-1079', viewport: { width: 1079, height: 800 }, expected: 'tablet' },
          { id: 'tablet-desktop-width-boundary-1080', viewport: { width: 1080, height: 800 }, expected: 'desktop' },
          { id: 'desktop-art-height-fit-607', viewport: { width: 1440, height: 607 }, expected: 'desktop' },
          { id: 'desktop-art-height-fit-608', viewport: { width: 1440, height: 608 }, expected: 'desktop' },
          { id: 'desktop-art-height-fit-843', viewport: { width: 1440, height: 843 }, expected: 'desktop' },
          { id: 'desktop-art-height-fit-844', viewport: { width: 1440, height: 844 }, expected: 'desktop' },
        ]
      : mode === 'tablet-landscape'
        ? [
            { id: 'tablet-project-narrow-ticket-686', viewport: { width: 686, height: 800 }, expected: 'tablet' },
            { id: 'tablet-project-narrow-ticket-687', viewport: { width: 687, height: 800 }, expected: 'tablet' },
            { id: 'tablet-device-profile-boundary-1366', viewport: { width: 1366, height: 800 }, expected: 'tablet' },
            { id: 'tablet-device-profile-boundary-1367', viewport: { width: 1367, height: 800 }, expected: 'desktop' },
          ]
        : [];

  test.skip(cases.length === 0, 'Boundary probes run in the matching pointer/device context only.');
  for (const entry of cases) {
    await responsive.initialize(page, context, language, entry.viewport);
    if (mode === 'desktop' && entry.viewport.width >= 1080) {
      await page.waitForFunction(() => !!window.__kcTabletLayout || document.querySelector('.kc-desktop-hero-title')?.getClientRects().length > 0);
    }
    const profile = await responsive.readProfile(page);
    const measured = await responsive.measurePage(page, entry.viewport, language, 'transition-boundary');
    await responsive.record(page, info, `${language}-${entry.id}-${mode}`, measured);
    expect(profile.mode).toBe(entry.expected);
    expect(measured.viewport.documentScrollWidth).toBeLessThanOrEqual(entry.viewport.width + 1);
  }

  // Tablet landscape rail activation changes at orientation, not at a device-specific width.
  if (mode === 'tablet-landscape') {
    for (const entry of [
      { id: 'tablet-landscape-height-side-715', viewport: { width: 716, height: 715 }, landscape: true },
      { id: 'tablet-landscape-height-side-716', viewport: { width: 716, height: 716 }, landscape: false },
    ]) {
      await responsive.initialize(page, context, language, entry.viewport);
      await expect(page.locator('#kc-tablet-projets')).toBeVisible();
      const measured = await responsive.measurePage(page, entry.viewport, language, 'transition-boundary');
      const activeLandscape = await page.locator('#kc-tablet-projets').evaluate(el => el.classList.contains('kc-landscape-rail'));
      await responsive.record(page, info, `${language}-${entry.id}`, measured);
      expect(activeLandscape).toBe(entry.landscape);
    }
  }
});
