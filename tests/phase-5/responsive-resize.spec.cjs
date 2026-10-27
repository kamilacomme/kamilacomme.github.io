'use strict';

const { test, expect } = require('@playwright/test');
const responsive = require('./responsive-qa.helpers.cjs');

function resizeSequence(mode) {
  if (mode === 'desktop') return [
    { width: 1280, height: 800 }, { width: 1268, height: 409 }, { width: 2102, height: 289 }, { width: 1440, height: 900 },
  ];
  if (mode === 'tablet-portrait') return [
    { width: 1194, height: 834 }, { width: 834, height: 1112 },
  ];
  if (mode === 'tablet-landscape') return [
    { width: 716, height: 555 }, { width: 716, height: 300 }, { width: 716, height: 555 }, { width: 716, height: 800 }, { width: 1194, height: 834 },
  ];
  return [
    { width: 320, height: 568 }, { width: 844, height: 390 }, { width: 393, height: 852 },
  ];
}

async function waitForResponsiveSettle(page, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForFunction(({ width, height }) => innerWidth === width && innerHeight === height, viewport);
  // Viewport metrics update before the shared profile controller publishes the
  // responsive geometry consumed by the Projects owner. Wait for that handoff
  // before measuring a resize destination.
  await page.waitForFunction(({ width, height }) => {
    const layout = window.__kcTabletLayout;
    return layout && layout.width === width && layout.height === height;
  }, viewport);
  await responsive.settleLayout(page, 80);
  await waitForProjectsGeometry(page);
}

async function waitForProjectsGeometry(page) {
  let previous = null;
  for (let frame = 0; frame < 8; frame += 1) {
    // Let the existing profile and section owners consume the resize event;
    // readiness is determined from stable ticket geometry, not elapsed wall time.
    await responsive.settleLayout(page, 34);
    const profile = await responsive.readProfile(page);
    const current = await page.evaluate(modeName => {
      const round = value => Math.round(value * 100) / 100;
      const rect = element => {
        if (!element) return null;
        const r = element.getBoundingClientRect();
        return [r.left, r.top, r.width, r.height].map(round);
      };
      if (modeName === 'desktop') {
        const frame = document.querySelector('#kc-desktop-project-frame');
        const doc = frame?.contentDocument;
        const rail = doc?.querySelector('#rail');
        const cards = [...(rail?.querySelectorAll('.ticket') || [])];
        return { mode: document.querySelector('#projets')?.dataset.kcProjectsMode || null,
          frame: rect(frame), rail: rect(rail), transform: rail ? getComputedStyle(rail).transform : null,
          cards: cards.map(rect) };
      }
      const root = document.querySelector(modeName === 'mobile' ? '#kc-mobile-projets' : '#kc-tablet-projets');
      const stage = root?.querySelector(modeName === 'mobile' ? '#kc-m-canvas' : '#kc-t-stage');
      const cards = [...(root?.querySelectorAll(modeName === 'mobile' ? '.project' : '.ticket') || [])];
      const rail = modeName === 'mobile' ? stage : root?.querySelector('.tickets');
      return { mode: root?.dataset.kcProjectsMode || null, root: rect(root), stage: rect(stage),
        transform: rail ? getComputedStyle(rail).transform : null, cards: cards.map(rect) };
    }, profile.mode);
    if (current.cards.length === 6 && previous && JSON.stringify(current) === JSON.stringify(previous)) return current;
    previous = current;
  }
  throw new Error(`Projects geometry did not settle after resize: ${JSON.stringify(previous)}`);
}

async function activeSection(page, section) {
  return page.evaluate(sectionName => {
    const all = sectionName === 'projects'
      ? ['#projets', '#kc-tablet-projets', '#projets-m']
      : ['#apropos', '#apropos-t', '#apropos-m'];
    const element = all.map(selector => document.querySelector(selector)).find(node => node && getComputedStyle(node).display !== 'none' && node.getClientRects().length);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { id: element.id, top: rect.top, bottom: rect.bottom, documentTop: rect.top + scrollY, documentBottom: rect.bottom + scrollY, scrollY };
  }, section);
}

async function visibleProject(page, mode) {
  return page.evaluate(modeName => {
    const frame = modeName === 'desktop' ? document.querySelector('#kc-desktop-project-frame') : null;
    const doc = frame?.contentDocument || document;
    const outer = frame?.getBoundingClientRect();
    const cards = [...doc.querySelectorAll(modeName === 'mobile' ? '#kc-mobile-projets .project' : modeName === 'desktop' ? '#rail .ticket' : '#kc-t-stage .ticket')];
    const horizontalRail = modeName === 'desktop'
      ? document.querySelector('#projets')?.dataset.kcProjectsMode !== 'flow'
      : modeName.startsWith('tablet') && document.querySelector('#kc-tablet-projets')?.classList.contains('kc-landscape-rail');
    const candidates = cards.map((card, index) => {
      const visibleContent = card.querySelector('.ticket-panel') || card;
      const r = visibleContent.getBoundingClientRect();
      const left = r.left + (outer?.left || 0), right = r.right + (outer?.left || 0);
      const top = r.top + (outer?.top || 0), bottom = r.bottom + (outer?.top || 0);
      const width = Math.max(0, Math.min(right, innerWidth) - Math.max(left, 0));
      const height = Math.max(0, Math.min(bottom, innerHeight) - Math.max(top, 0));
      const title = card.querySelector('h2');
      const centerDistance = horizontalRail
        ? Math.abs((left + right) / 2 - innerWidth / 2)
        : Math.hypot((left + right) / 2 - innerWidth / 2, (top + bottom) / 2 - innerHeight / 2);
      return { index, href: (card.matches('a') ? card : card.closest('a'))?.href || card.getAttribute('href') || null,
        name: card.getAttribute('data-project-id') || title?.textContent?.trim() || `project-${index + 1}`,
        intersection: width * height, centerDistance, panelBounds:{left,top,right,bottom},
        title: title?.textContent?.trim(), titleVisible: !!title && title.getClientRects().length > 0 && title.getBoundingClientRect().bottom > 0 && title.getBoundingClientRect().top < innerHeight };
    }).filter(item => item.intersection > 0).sort((a, b) => a.centerDistance - b.centerDistance || b.intersection - a.intersection);
    return candidates[0] ? { ...candidates[0], ownerFocusedIndex: window.__kcFocusedProjectIndex ?? null } : null;
  }, mode);
}

async function waitForTabletFocusOwner(page, mode) {
  let measured = null;
  for (let frame = 0; frame < 10; frame += 1) {
    await responsive.settleLayout(page, 34);
    measured = await visibleProject(page, mode);
    if (measured && measured.ownerFocusedIndex === measured.index) return measured;
  }
  throw new Error(`Tablet Projects owner did not publish the centered readable ticket: ${JSON.stringify(measured)}`);
}

test('resizing preserves the active project and About section across width, height and orientation changes', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  await responsive.initialize(page, context, language, info.project.metadata.viewport);
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  if (mode === 'desktop') await page.frameLocator('#kc-desktop-project-frame').locator('#rail .ticket').nth(5).waitFor({ state: 'attached' });
  const projectRoot = mode === 'desktop' ? '#projets' : mode === 'mobile' ? '#projets-m' : '#kc-tablet-projets';
  const aboutRoot = mode === 'desktop' ? '#apropos' : mode === 'mobile' ? '#apropos-m' : '#apropos-t';
  const projectBox = await page.locator(projectRoot).evaluate(el => { const r=el.getBoundingClientRect(); return {top:r.top+scrollY,height:r.height}; });
  await page.evaluate(({ top, height }) => {
    scrollTo(0, top + Math.max(0, height - innerHeight) * 0.42);
    // The frozen QA clock suppresses Chromium's queued scroll event. Use the
    // same explicit event path as the shared QA scroll helper.
    window.dispatchEvent(new Event('scroll'));
  }, projectBox);
  await responsive.settleLayout(page);
  let initialProject = await visibleProject(page, mode);
  if (mode.startsWith('tablet')) {
    initialProject = await waitForTabletFocusOwner(page, mode);
    expect(initialProject.index, 'the Projects owner must recognize the primary readable ticket before resize').toBe(initialProject.ownerFocusedIndex);
  }
  if (mode === 'tablet-landscape') {
    const initialCapture = info.outputPath(`resize-project-${language}-${mode}-before-sequence.png`);
    await page.screenshot({ path: initialCapture, animations: 'disabled' });
    await info.attach('resize-initial-project-before-resize', { path: initialCapture, contentType: 'image/png' });
  }
  expect(initialProject, 'a current project should be visible before resizing').not.toBeNull();

  const records = [];
  let prior = initialProject;
  for (const viewport of resizeSequence(mode)) {
    await waitForResponsiveSettle(page, viewport);
    const actualProfile = await responsive.readProfile(page);
    const active = await activeSection(page, 'projects');
    const project = await visibleProject(page, actualProfile.mode);
    const state = await responsive.measurePage(page, viewport, language, 'continuous-resize');
    const record = {
      viewport, language, configuredContext: info.project.metadata, actualProfile,
      activeSection: active, priorProject: prior, currentProject: project,
      sameProjectStillVisible: !!prior && !!project && prior.href === project.href,
      activeProjectDefinition: 'readable ticket panel nearest the rail focus center; visible area breaks distance ties; vertical flow uses the viewport focal center',
      documentScrollWidth: state.viewport.documentScrollWidth,
    };
    records.push(record);
    await responsive.record(page, info, `resize-project-${language}-${mode}-${viewport.width}x${viewport.height}`, state);
    prior = project;
  }

  const projectFailures = records.filter(record => !record.sameProjectStillVisible);
  const projectReport = info.outputPath(`resize-project-preservation-${language}-${mode}.json`);
  await require('node:fs/promises').writeFile(projectReport, JSON.stringify({ initialProject, records, failures: projectFailures }, null, 2));
  await info.attach('project-scroll-preservation', { path: projectReport, contentType: 'application/json' });
  expect(projectFailures, 'keep the project that was in view through continuous resizing').toEqual([]);

  const startAbout = await page.locator(aboutRoot).evaluate(el => el.getBoundingClientRect().top + scrollY);
  await page.evaluate(top => scrollTo(0, top + 80), startAbout);
  await responsive.settleLayout(page);
  const aboutRecords = [];
  for (const viewport of resizeSequence(mode)) {
    await waitForResponsiveSettle(page, viewport);
    const profile = await responsive.readProfile(page);
    const activeAbout = await activeSection(page, 'about');
    const state = await responsive.measurePage(page, viewport, language, 'continuous-resize-about');
    const stillInAbout = !!activeAbout && activeAbout.documentTop <= activeAbout.scrollY + viewport.height
      && activeAbout.documentBottom > activeAbout.scrollY;
    aboutRecords.push({ viewport, actualProfile: profile, activeAbout, stillInAbout, scrollY: state.viewport.scrollY });
    await responsive.record(page, info, `resize-about-${language}-${mode}-${viewport.width}x${viewport.height}`, state);
  }
  const aboutFailures = aboutRecords.filter(record => !record.stillInAbout);
  const aboutReport = info.outputPath(`resize-about-preservation-${language}-${mode}.json`);
  await require('node:fs/promises').writeFile(aboutReport, JSON.stringify({ aboutRecords, failures: aboutFailures }, null, 2));
  await info.attach('about-scroll-preservation', { path: aboutReport, contentType: 'application/json' });
  expect(aboutFailures, 'remain in About if resizing begins while About is active').toEqual([]);
});
