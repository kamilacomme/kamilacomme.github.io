'use strict';

const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');
const responsive = require('./responsive-qa.helpers.cjs');

function projectSelector(mode) {
  return mode === 'mobile' ? '#kc-mobile-projets .project'
    : mode === 'desktop' ? '#kc-desktop-project-frame'
      : '#kc-tablet-projets';
}

async function snapshotRail(page, mode) {
  return page.evaluate((mode) => {
    const frame = mode === 'desktop' ? document.querySelector('#kc-desktop-project-frame') : null;
    const doc = frame?.contentDocument || document;
    const root = doc.querySelector(mode === 'desktop' ? '#rail' : mode === 'mobile' ? '#kc-mobile-projets' : '#kc-t-stage .tickets');
    const viewport = frame ? frame.getBoundingClientRect() : document.querySelector(mode === 'mobile' ? '#kc-m-viewport' : '#kc-t-viewport')?.getBoundingClientRect();
    const outer = { left: viewport?.left || 0, top: viewport?.top || 0, right: viewport?.right || innerWidth, bottom: viewport?.bottom || innerHeight };
    const cards = [...doc.querySelectorAll(mode === 'mobile' ? '#kc-mobile-projets .project' : mode === 'desktop' ? '#rail .ticket' : '#kc-t-stage .ticket')];
    return {
      viewport: { left: outer.left, top: outer.top, right: outer.right, bottom: outer.bottom },
      cards: cards.map((card, index) => {
        const r = card.getBoundingClientRect();
        const link = card.matches('a') ? card : card.closest('a');
        const title = card.querySelector('h2');
        const titleRect = title?.getBoundingClientRect();
        const ticket = { left: r.left + outer.left, top: r.top + outer.top, right: r.right + outer.left, bottom: r.bottom + outer.top, width: r.width, height: r.height };
        const fullyVisible = ticket.left >= outer.left - 0.5 && ticket.right <= outer.right + 0.5
          && ticket.top >= outer.top - 0.5 && ticket.bottom <= outer.bottom + 0.5;
        return {
          index,
          id: card.getAttribute('data-project-id') || title?.textContent?.trim() || `project-${index + 1}`,
          href: link?.href || card.getAttribute('href') || null,
          box: ticket,
          titleBox: titleRect ? { left: titleRect.left + outer.left, top: titleRect.top + outer.top, right: titleRect.right + outer.left, bottom: titleRect.bottom + outer.top } : null,
          fullyVisible,
        };
      }),
    };
  }, mode);
}

function reachabilitySampleCount(mode, viewport, cards, scrollSpan, minimum = 6) {
  const horizontal = mode === 'desktop' || mode === 'tablet-landscape';
  const available = horizontal ? viewport.width : viewport.height;
  const cardExtent = Math.max(0, ...cards.map(card => horizontal ? card.box.width : card.box.height));
  // Sample at half the measured full-card fit window so a ticket with only a
  // small fit interval is not falsely called unreachable between coarse steps.
  const fitWindow = available - cardExtent;
  const step = Math.max(1, fitWindow / 2);
  return Math.min(160, Math.max(minimum, Math.ceil(scrollSpan / step)));
}

test('all six projects can be brought fully into view and the next About section is reachable', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  await responsive.initialize(page, context, language, info.project.metadata.viewport);
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
  if (mode === 'desktop') await page.frameLocator('#kc-desktop-project-frame').locator('#rail .ticket').nth(5).waitFor({ state: 'attached' });
  else await expect(page.locator(projectSelector(mode) === '#kc-mobile-projets .project' ? projectSelector(mode) : `${projectSelector(mode)} .ticket`)).toHaveCount(6);

  const projectSection = mode === 'desktop' ? '#projets' : mode === 'mobile' ? '#projets-m' : '#kc-tablet-projets';
  const aboutSection = mode === 'desktop' ? '#apropos' : mode === 'mobile' ? '#apropos-m' : '#apropos-t';
  const section = await page.locator(projectSection).evaluate(el => {
    const r = el.getBoundingClientRect();
    return { top: r.top + scrollY, height: r.height };
  });
  const scrollSpan = Math.max(0, section.height - page.viewportSize().height);
  const initialRail = await snapshotRail(page, mode);
  const steps = reachabilitySampleCount(mode, info.project.metadata.viewport, initialRail.cards, scrollSpan, mode === 'mobile' || mode === 'tablet-portrait' ? 6 : 24);
  const reached = new Set();
  const captures = [];
  for (let i = 0; i <= steps; i += 1) {
    const y = section.top + scrollSpan * (i / steps);
    await page.evaluate(value => { window.scrollTo(0, value); window.dispatchEvent(new Event('scroll')); }, y);
    await responsive.settleLayout(page);
    const state = await snapshotRail(page, mode);
    for (const card of state.cards) if (card.fullyVisible) reached.add(card.index);
    if ([0, Math.floor(steps / 2), steps].includes(i)) {
      const tag = `responsive-${language}-${mode}-${i === 0 ? 'start' : i === steps ? 'end' : 'middle'}`;
      const measured = await responsive.measurePage(page, info.project.metadata.viewport, language, 'interaction-sample');
      const file = info.outputPath(`${tag}.png`);
      await page.screenshot({ path: file, animations: 'disabled' });
      await info.attach(tag, { path: file, contentType: 'image/png' });
      captures.push({ step: i, scrollY: y, file: tag, visible: state.cards.filter(card => card.fullyVisible).map(card => card.index), measured });
    }
  }

  const final = await snapshotRail(page, mode);
  const actualLinks = final.cards.map(card => card.href);
  const expectedLinks = Object.values(qa.links);
  const missing = expectedLinks.filter(href => !actualLinks.includes(href));
  const unreachable = expectedLinks.map((href, index) => ({ index, href, reached: reached.has(index) })).filter(item => !item.reached);
  const beforeAbout = await page.locator(projectSection).evaluate(el => {
    const r = el.getBoundingClientRect();
    return { top: r.top + scrollY, bottom: r.bottom + scrollY };
  });
  const aboutTop = await page.locator(aboutSection).evaluate(el => el.getBoundingClientRect().top + scrollY);
  const boundaryError = aboutTop - beforeAbout.bottom;
  await page.evaluate(() => window.scrollBy(0, 80));
  await responsive.settleLayout(page);
  const aboutVisible = await page.locator(aboutSection).evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  });
  const summary = {
    viewport: info.project.metadata.viewport,
    language,
    configuredContext: info.project.metadata,
    actualProfile: await responsive.readProfile(page),
    reachedIndices: [...reached].sort((a, b) => a - b),
    missingLinks: missing,
    unreachable,
    section: { ...beforeAbout, aboutTop, boundaryError, aboutVisible, scrollSpan },
    captures,
    classification: 'routine-interaction',
  };
  const json = info.outputPath(`responsive-interaction-${language}-${mode}.json`);
  await require('node:fs/promises').writeFile(json, JSON.stringify(summary, null, 2));
  await info.attach('project-reachability-measurements', { path: json, contentType: 'application/json' });

  expect(final.cards).toHaveLength(6);
  expect(missing, 'all six canonical project destinations must remain present').toEqual([]);
  expect(reached.size, 'each whole ticket must be reachable without confusing neighboring rail clipping with lost content').toBe(6);
  expect(Math.abs(boundaryError), 'Projects must meet the existing About section boundary').toBeLessThanOrEqual(2);
  expect(aboutVisible, 'About must become reachable after the Projects endpoint').toBe(true);

  await qa.scrollTo(page, aboutTop + 40);
  const activeCards = await page.locator(`${aboutSection} [data-i]`).count();
  expect(activeCards).toBe(5);
});

test('all six projects remain reachable at the narrow-tablet and minimum-mobile routine sizes', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  const cases = mode === 'tablet-landscape'
    ? [{ id: 'narrow-short-tablet', viewport: { width: 716, height: 555 }, section: '#kc-tablet-projets', cardSelector: '#kc-t-stage .ticket', about: '#apropos-t' }]
    : mode === 'mobile'
      ? [{ id: 'mobile-minimum', viewport: { width: 320, height: 568 }, section: '#projets-m', cardSelector: '#kc-mobile-projets .project', about: '#apropos-m' }]
      : [];
  test.skip(cases.length === 0, 'The additional compact routine reachability probes run once per responsive profile.');

  for (const entry of cases) {
    await responsive.initialize(page, context, language, entry.viewport);
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
    await expect(page.locator(entry.cardSelector)).toHaveCount(6);
    const section = await page.locator(entry.section).evaluate(el => {
      const r = el.getBoundingClientRect();
      return { top: r.top + scrollY, height: r.height };
    });
    const span = Math.max(0, section.height - entry.viewport.height);
    const initialRail = await snapshotRail(page, mode);
    const steps = reachabilitySampleCount(mode, entry.viewport, initialRail.cards, span, 8);
    const reached = new Set();
    const captures = [];
    for (let step = 0; step <= steps; step += 1) {
      const scrollY = section.top + span * step / steps;
      await page.evaluate(y => { scrollTo(0, y); dispatchEvent(new Event('scroll')); }, scrollY);
      await responsive.settleLayout(page);
      const rail = await snapshotRail(page, mode);
      for (const card of rail.cards) if (card.fullyVisible) reached.add(card.index);
      if ([0, Math.floor(steps / 2), steps].includes(step)) {
        const name = `reachability-${language}-${entry.id}-${step}`;
        const screenshot = info.outputPath(`${name}.png`);
        await page.screenshot({ path: screenshot, animations: 'disabled' });
        await info.attach(name, { path: screenshot, contentType: 'image/png' });
        captures.push({ step, scrollY, visible: rail.cards.filter(card => card.fullyVisible).map(card => card.index), screenshot });
      }
    }
    const aboutTop = await page.locator(entry.about).evaluate(el => el.getBoundingClientRect().top + scrollY);
    await page.evaluate(top => scrollTo(0, top + 80), aboutTop);
    await responsive.settleLayout(page);
    const aboutVisible = await page.locator(entry.about).evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    });
    const result = {
      viewport: entry.viewport, language, configuredContext: info.project.metadata,
      actualProfile: await responsive.readProfile(page),
      reachedIndices: [...reached].sort((a, b) => a - b),
      aboutVisible, captures,
      classification: 'routine-interaction',
      owner: mode === 'mobile' ? 'mobile editorial Projects geometry' : 'scripts/projects/tablet-project-layout.js',
    };
    const reportPath = info.outputPath(`reachability-${language}-${entry.id}.json`);
    await require('node:fs/promises').writeFile(reportPath, JSON.stringify(result, null, 2));
    await info.attach(`${entry.id}-reachability-measurements`, { path: reportPath, contentType: 'application/json' });
    expect(reached.size, `${entry.id}: every whole ticket must be reachable`).toBe(6);
    expect(aboutVisible, `${entry.id}: About must follow a reachable Projects endpoint`).toBe(true);
  }
});

test('short-height project reachability probe reports known deferred vertical clipping', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'desktop', 'The short-height risk probe uses the fine-pointer desktop profile.');
  const knownDeferredFailures = [];
  for (const entry of responsive.resilienceMatrix) {
    await responsive.initialize(page, context, language, entry.viewport);
    await page.frameLocator('#kc-desktop-project-frame').locator('#rail .ticket').nth(5).waitFor({ state: 'attached' });
    const section = await page.locator('#projets').evaluate(el => { const r=el.getBoundingClientRect(); return { top:r.top+scrollY,height:r.height }; });
    const span = Math.max(0, section.height - entry.viewport.height);
    const reached = new Set();
    const fullyReached = new Set();
    let verticalOverflow = false;
    const observations = [];
    for (let i = 0; i <= 18; i += 1) {
      await page.evaluate(y => { scrollTo(0,y); dispatchEvent(new Event('scroll')); }, section.top + span * i / 18);
      await responsive.settleLayout(page);
      const state = await snapshotRail(page, 'desktop');
      state.cards.forEach(card => {
        if (card.box.left >= state.viewport.left - 0.5 && card.box.right <= state.viewport.right + 0.5) reached.add(card.index);
        if (card.fullyVisible) fullyReached.add(card.index);
        if (card.box.height > state.viewport.bottom - state.viewport.top) verticalOverflow = true;
      });
      if ([0, 9, 18].includes(i)) {
        const file = info.outputPath(`${language}-${entry.id}-scroll-${i}.png`);
        await page.screenshot({ path: file, animations: 'disabled' });
        await info.attach(`${entry.id}-scroll-${i}`, { path: file, contentType: 'image/png' });
        observations.push({ index: i, scrollY: section.top + span * i / 18, visible: state.cards.filter(card => card.fullyVisible).map(card => card.index) });
      }
    }
    const data = {
      id: entry.id, viewport: entry.viewport, language,
      configuredContext: info.project.metadata, actualProfile: await responsive.readProfile(page),
      horizontallyReachableIndices: [...reached].sort((a,b)=>a-b),
      fullyReachableIndices: [...fullyReached].sort((a,b)=>a-b),
      fullTicketReachability: fullyReached.size === 6 && !verticalOverflow,
      ticketExceedsViewportHeight: verticalOverflow,
      classification: 'known deferred M10B short-height Projects fallback; no visual-baseline target',
      observations,
      owner: 'desktop-project-embedded.html iframe rail geometry',
    };
    const file = info.outputPath(`${language}-${entry.id}-reachability.json`);
    await require('node:fs/promises').writeFile(file, JSON.stringify(data, null, 2));
    await info.attach(`${entry.id}-reachability`, { path: file, contentType: 'application/json' });
    if (!data.fullTicketReachability) knownDeferredFailures.push({
      viewport: entry.viewport,
      language,
      fullTicketReachability: data.fullTicketReachability,
      horizontallyReachableIndices: data.horizontallyReachableIndices,
      fullyReachableIndices: data.fullyReachableIndices,
      ticketExceedsViewportHeight: data.ticketExceedsViewportHeight,
      owner: data.owner,
    });
  }
  // Keep the known acceptance assertion active, but finish both resilience probes
  // and retain evidence for each before reporting the expected baseline failure.
  expect(knownDeferredFailures, 'known M10B short-height Projects issues remain visible to acceptance').toEqual([]);
});
