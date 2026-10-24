'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const qa = require('../qa/helpers.cjs');

const routineMatrix = [
  { id: 'desktop', viewport: { width: 1440, height: 900 }, context: 'desktop' },
  { id: 'tablet-portrait', viewport: { width: 834, height: 1112 }, context: 'tablet-portrait' },
  { id: 'tablet-landscape', viewport: { width: 1194, height: 834 }, context: 'tablet-landscape' },
  { id: 'narrow-short-tablet', viewport: { width: 716, height: 555 }, context: 'tablet-landscape' },
  { id: 'mobile', viewport: { width: 393, height: 852 }, context: 'mobile' },
  { id: 'mobile-minimum', viewport: { width: 320, height: 568 }, context: 'mobile' },
];

const resilienceMatrix = [
  { id: 'short-wide-resilience', viewport: { width: 1268, height: 409 }, context: 'desktop', classification: 'resilience-probe' },
  { id: 'extreme-short-resilience', viewport: { width: 2102, height: 289 }, context: 'desktop', classification: 'resilience-probe' },
];

const routedContexts = new WeakSet();
const seededPages = new WeakSet();

async function initialize(page, context, language, viewport) {
  await page.setViewportSize(viewport);
  if (!routedContexts.has(context)) {
    await qa.routes(context);
    routedContexts.add(context);
  }
  if (!seededPages.has(page)) {
    await qa.seed(page);
    seededPages.add(page);
  }
  await qa.ready(page, language);
  await settleLayout(page, 80);
}

async function settleLayout(page, milliseconds = 34) {
  // The shared QA seed pauses page time. Explicitly advance it so scroll-linked
  // animation frames settle instead of awaiting a RAF that cannot run.
  await page.clock.runFor(milliseconds);
}

async function readProfile(page) {
  return page.evaluate(() => {
    const visible = (selector) => {
      const element = document.querySelector(selector);
      return !!element && getComputedStyle(element).display !== 'none' && element.getClientRects().length > 0;
    };
    const mobile = visible('#kc-mobile-root');
    const tablet = !mobile && visible('[data-kc-tablet-hero-title]');
    const mode = mobile ? 'mobile' : tablet ? 'tablet' : 'desktop';
    return {
      mode,
      detection: {
        mobileDomActive: mobile,
        tabletHeroActive: tablet,
        desktopHeroActive: !mobile && !tablet && visible('.kc-desktop-hero-title'),
        tabletLayoutPublished: window.__kcTabletLayout || null,
        userAgent: navigator.userAgent,
        touchPoints: navigator.maxTouchPoints,
        coarsePointer: matchMedia('(pointer: coarse)').matches,
        finePointer: matchMedia('(pointer: fine)').matches,
        coarseHover: matchMedia('(hover: none)').matches,
        fineHover: matchMedia('(hover: hover)').matches,
      },
    };
  });
}

async function measurePage(page, requested, language, classification = 'routine') {
  const profile = await readProfile(page);
  const metrics = await page.evaluate(({ requested, language, classification, profile }) => {
    const rect = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { x: r.x, y: r.y, left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const style = (element) => element ? getComputedStyle(element) : null;
    const visible = (element) => !!element && style(element).display !== 'none' && element.getClientRects().length > 0;
    const font = (element) => element ? parseFloat(style(element).fontSize) : null;
    const transformChain = (element) => {
      let x = 1;
      let y = 1;
      const chain = [];
      for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
        const transform = style(node).transform;
        if (transform !== 'none') {
          const matrix = new DOMMatrixReadOnly(transform);
          const sx = Math.hypot(matrix.a, matrix.b);
          const sy = Math.hypot(matrix.c, matrix.d);
          x *= sx;
          y *= sy;
          chain.push({ selector: node.id ? `#${node.id}` : node.className?.baseVal || node.className || node.tagName.toLowerCase(), transform, scaleX: sx, scaleY: sy });
        }
      }
      return { x, y, chain };
    };
    const activeHero = profile.mode === 'mobile'
      ? document.querySelector('.kc-mobile-hero-title')
      : profile.mode === 'tablet'
        ? document.querySelector('[data-kc-tablet-hero-title]')
        : document.querySelector('.kc-desktop-hero-title');
    const nav = document.querySelector('.kc-responsive-nav');
    const logo = nav?.querySelector(':scope > span:first-child');
    const hire = nav?.querySelector('a[href^="mailto"]');
    const switcher = document.querySelector('[data-kc-language-switch]');
    const gutterStyle = style(document.documentElement);
    const activeProjects = profile.mode === 'mobile' ? '#kc-mobile-projets'
      : profile.mode === 'tablet' ? '#kc-tablet-projets' : '#kc-desktop-projets';
    const projects = document.querySelector(activeProjects);
    const about = document.querySelector(profile.mode === 'mobile' ? '#apropos-m' : profile.mode === 'tablet' ? '#apropos-t' : '#apropos');
    const aboutCards = about ? [...about.querySelectorAll('[data-i]')] : [];
    const footer = document.querySelector('#contact');
    const footerHeading = footer?.querySelector('[data-c="0"]');
    const activeTicketRoot = profile.mode === 'desktop'
      ? document.querySelector('#kc-desktop-project-frame')?.contentDocument
      : projects;
    const tickets = activeTicketRoot ? [...activeTicketRoot.querySelectorAll(profile.mode === 'mobile' ? '.project' : '.ticket')] : [];
    const textBounds = (element) => {
      if (!element) return [];
      const range = element.ownerDocument.createRange();
      range.selectNodeContents(element);
      return [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0).map(r => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom }));
    };
    const root = document.documentElement;
    return {
      classification,
      language,
      requestedViewport: requested,
      viewport: { width: innerWidth, height: innerHeight, layoutWidth: root.clientWidth, layoutHeight: root.clientHeight, dpr: devicePixelRatio, scrollX, scrollY, documentScrollWidth: root.scrollWidth, documentScrollHeight: root.scrollHeight },
      profile,
      gutters: {
        x: parseFloat(gutterStyle.getPropertyValue('--kc-page-gutter-x')),
        bottom: parseFloat(gutterStyle.getPropertyValue('--kc-page-gutter-bottom')),
      },
      nav: {
        box: rect(nav), logo: rect(logo), hire: rect(hire), hireFont: font(hire?.querySelector('span') || hire),
        status: rect(nav?.querySelector('[data-fixed-ink]')),
      },
      hero: { heading: rect(activeHero), font: font(activeHero), transforms: transformChain(activeHero), textLines: textBounds(activeHero) },
      switcher: { box: rect(switcher), font: font(switcher), transforms: transformChain(switcher) },
      projects: {
        root: rect(projects), height: projects?.getBoundingClientRect().height ?? null,
        heading: rect(profile.mode === 'desktop'
          ? document.querySelector('#kc-desktop-project-frame')?.contentDocument?.querySelector('.heading')
          : projects?.querySelector('h1')),
        ticketCount: tickets.length,
        tickets: tickets.map((ticket, index) => ({
          index,
          id: ticket.getAttribute('data-project-id') || ticket.querySelector('h2')?.textContent?.trim() || ticket.querySelector('h1')?.textContent?.trim() || null,
          rect: rect(ticket),
          title: ticket.querySelector('h2'),
          titleFont: font(ticket.querySelector('h2')),
          link: ticket.closest('a')?.href || ticket.getAttribute('href') || null,
        })).map(ticket => ({ ...ticket, title: undefined })),
      },
      about: { box: rect(about), cardCount: aboutCards.length, cards: aboutCards.map(card => ({ index: card.dataset.i, rect: rect(card), transform: style(card).transform })) },
      footer: { box: rect(footer), heading: rect(footerHeading), headingFont: font(footerHeading), headingLines: textBounds(footerHeading) },
    };
  }, { requested, language, classification, profile });
  return metrics;
}

function deriveFindings(metrics) {
  const findings = [];
  const { viewport, projects, profile } = metrics;
  if (viewport.documentScrollWidth > viewport.width + 1) {
    findings.push({ classification: 'confirmed functional or geometry failure', severity: 'high', owner: 'active profile shell / responsible section geometry', evidence: `document scroll width ${viewport.documentScrollWidth}px exceeds CSS viewport ${viewport.width}px` });
  }
  if (projects.ticketCount !== 6) {
    findings.push({ classification: 'confirmed functional or geometry failure', severity: 'high', owner: profile.mode === 'mobile' ? 'mobile editorial Projects content generation' : 'shared Projects ticket generation', evidence: `found ${projects.ticketCount} project tickets; expected six` });
  }
  for (const ticket of projects.tickets) {
    if (!ticket.link || !/^https:\/\//.test(ticket.link)) {
      findings.push({ classification: 'confirmed functional or geometry failure', severity: 'high', owner: profile.mode === 'mobile' ? 'mobile editorial Projects content generation' : 'shared Projects ticket generation', evidence: `ticket ${ticket.id ?? ticket.index} has no usable project href` });
    }
  }
  if (metrics.nav.hire && metrics.nav.hire.height < 44) {
    findings.push({ classification: 'confirmed functional or geometry failure', severity: 'medium', owner: 'shared Navbar geometry', evidence: `Hire target measures ${metrics.nav.hire.height}px high` });
  }
  if (metrics.switcher.box && (metrics.switcher.box.width < 44 || metrics.switcher.box.height < 44)) {
    findings.push({ classification: 'confirmed functional or geometry failure', severity: 'medium', owner: 'language-switch shared gutter/control styles', evidence: `switch target measures ${metrics.switcher.box.width}×${metrics.switcher.box.height}px` });
  }
  if (metrics.classification === 'resilience-probe') {
    findings.push({ classification: 'visual review required', severity: 'informational', owner: 'active section owners', evidence: 'stress-probe captures assess reachability and overflow only; they are not screenshot-baseline targets' });
  }
  return findings;
}

async function record(page, testInfo, name, metrics) {
  const data = { ...metrics, findings: deriveFindings(metrics) };
  const jsonPath = testInfo.outputPath(`${name}.json`);
  const screenshotPath = testInfo.outputPath(`${name}.png`);
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, animations: 'disabled', fullPage: false });
  data.screenshotPath = screenshotPath;
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
  await testInfo.attach(`${name}-measurements`, { path: jsonPath, contentType: 'application/json' });
  await testInfo.attach(`${name}-capture`, { path: screenshotPath, contentType: 'image/png' });
  return data;
}

module.exports = { routineMatrix, resilienceMatrix, initialize, settleLayout, readProfile, measurePage, deriveFindings, record };
