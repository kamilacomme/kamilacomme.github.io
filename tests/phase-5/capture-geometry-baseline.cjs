const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const qa = require('../qa/helpers.cjs');

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8000';
const profiles = [
  { mode: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { mode: 'tablet-portrait', viewport: { width: 834, height: 1112 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
  { mode: 'tablet-landscape', viewport: { width: 1194, height: 834 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
  { mode: 'mobile', viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
];
const locales = ['fr', 'en'];

async function ready(page, locale) {
  await page.goto(`${baseURL}${locale === 'en' ? '/en/' : '/'}`, { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(['400 16px Figtree', '700 16px Figtree', 'italic 400 16px Figtree', '400 16px Inter', '500 16px Inter'].map(font => document.fonts.load(font, 'Kamila Comme — à propos')));
  });
  await page.waitForTimeout(700);
  if (locale === 'en' && await page.locator('#kc-desktop-project-frame').count()) {
    await page.frameLocator('#kc-desktop-project-frame').locator('body').waitFor({ state: 'attached', timeout: 15000 });
  }
}

async function collect(page, mode) {
  return page.evaluate((mode) => {
    const box = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), width: +r.width.toFixed(2), height: +r.height.toFixed(2), top: +r.top.toFixed(2), right: +r.right.toFixed(2), bottom: +r.bottom.toFixed(2), left: +r.left.toFixed(2) };
    };
    const transformScale = (element) => {
      let x = 1, y = 1;
      for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
        const transform = getComputedStyle(node).transform;
        if (transform && transform !== 'none') {
          const m = new DOMMatrixReadOnly(transform);
          x *= Math.hypot(m.a, m.b);
          y *= Math.hypot(m.c, m.d);
        }
      }
      return { x: +x.toFixed(5), y: +y.toFixed(5) };
    };
    const text = (element) => {
      if (!element) return null;
      const cs = getComputedStyle(element), scale = transformScale(element), r = element.getBoundingClientRect();
      return {
        text: (element.innerText || element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 100),
        css: { family: cs.fontFamily, size: cs.fontSize, weight: cs.fontWeight, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing },
        ancestorScale: scale,
        effectiveFontSize: `${+(parseFloat(cs.fontSize) * scale.y).toFixed(2)}px`,
        rect: { width: +r.width.toFixed(2), height: +r.height.toFixed(2) },
      };
    };
    const selectors = ['#kc-desktop-projets', '#kc-tablet-projets', '#kc-mobile-projets', '#kc-t-viewport', '#kc-t-stage', '#apropos', '#apropos-t', '#apropos-m', '#kc-mobile-root', '#kc-m-viewport', '#kc-m-canvas'];
    const roots = Object.fromEntries(selectors.map(s => [s, [...document.querySelectorAll(s)].map(e => ({ display: getComputedStyle(e).display, box: box(e), transform: getComputedStyle(e).transform }))]));
    const activeRoot = mode === 'desktop' ? '#kc-desktop-projets' : mode === 'mobile' ? '#kc-mobile-projets' : '#kc-tablet-projets';
    const projectRoot = document.querySelector(activeRoot);
    const frame = mode === 'desktop' ? document.querySelector('#kc-desktop-project-frame') : null;
    let inner = document;
    try { if (frame?.contentDocument) inner = frame.contentDocument; } catch {}
    const tickets = mode === 'mobile' ? [...(projectRoot?.querySelectorAll('.project') || [])] : [...(inner.querySelectorAll(mode === 'desktop' ? '#rail .ticket' : '#kc-t-stage .ticket') || [])];
    const aboutSelectors = mode === 'desktop' ? ['#apropos'] : mode === 'mobile' ? ['#apropos-m'] : ['#apropos-t'];
    const about = aboutSelectors.map(s => document.querySelector(s)).find(Boolean);
    const visible = (element) => !!element && getComputedStyle(element).display !== 'none' && element.getClientRects().length > 0;
    const candidates = mode === 'desktop'
      ? [...document.querySelectorAll('h1,[role="navigation"] a')].filter(visible).map(text).concat([...inner.querySelectorAll('h1,.ticket h2,.ticket p,.ticket .tags span')].filter(visible).slice(0, 7).map(text))
      : [...document.querySelectorAll('h1,[role="navigation"] a')].filter(visible).map(text).concat([...projectRoot.querySelectorAll('h1,.ticket h2,.ticket p,.ticket .tags span,.project h2,.project .description,.project .categories span')].filter(visible).slice(0, 8).map(text));
    const aboutRoot = about;
    const aboutTypography = [...(aboutRoot?.querySelectorAll('p,[data-i] span') || [])].filter(visible).slice(0, 8).map(text);
    const footer = document.querySelector('#contact');
    const footerTypography = [...(footer?.querySelectorAll('h1,h2,p,a,button,span') || [])].filter(visible).slice(0, 12).map(text);
    const slideshow = mode === 'desktop' ? document.querySelector('[data-hplate="1"]') : mode === 'tablet-landscape' || mode === 'tablet-portrait' ? document.querySelector('[data-kc-tablet-hero-slideshow]') : null;
    const nav = [...document.querySelectorAll('[role="navigation"] a')].find(visible);
    return {
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio, scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight, scrollY },
      activeRoot,
      roots,
      projectSection: box(projectRoot),
      projectSectionDocumentTop: projectRoot ? +(projectRoot.getBoundingClientRect().top + scrollY).toFixed(2) : null,
      frame: box(frame),
      stage: box(inner.querySelector(mode === 'desktop' ? '#stage' : '#kc-t-stage')),
      rail: box(inner.querySelector(mode === 'desktop' ? '#rail' : '#kc-t-stage .tickets')),
      railTransform: inner.querySelector(mode === 'desktop' ? '#rail' : '#kc-t-stage .tickets')?.style.transform || '',
      tickets: tickets.map((e, index) => ({ id: e.getAttribute('data-project-id'), index, box: box(e), transform: getComputedStyle(e).transform })),
      about: { selector: aboutSelectors[0], box: box(about), documentTop: about ? +(about.getBoundingClientRect().top + scrollY).toFixed(2) : null },
      typography: candidates,
      aboutTypography,
      footer: { box: box(footer), documentTop: footer ? +(footer.getBoundingClientRect().top + scrollY).toFixed(2) : null, typography: footerTypography },
      heroPreview: slideshow ? { box: box(slideshow), cssWidth: getComputedStyle(slideshow).width, ancestorScale: transformScale(slideshow), effectiveWidth: box(slideshow)?.width } : null,
      logo: text(document.querySelector('[role="navigation"] > span')),
      nav: text(nav),
    };
  }, mode);
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const results = [];
  for (const profile of profiles) {
    for (const locale of locales) {
      const context = await browser.newContext({ ...profile, locale: 'en-GB', timezoneId: 'Europe/Paris', colorScheme: 'light', reducedMotion: 'no-preference', serviceWorkers: 'block' });
      await qa.routes(context);
      const page = await context.newPage();
      await ready(page, locale);
      const mode = profile.mode;
      const initial = await collect(page, mode);
      const sectionSelector = mode === 'desktop' ? '#kc-desktop-projets' : mode === 'mobile' ? '#kc-mobile-projets' : '#kc-tablet-projets';
      const sectionStates = [];
      for (const progress of [0, 0.5, 1]) {
        const target = await page.locator(sectionSelector).evaluate((section, progress) => {
          const r = section.getBoundingClientRect();
          return Math.max(0, r.top + scrollY + progress * Math.max(0, r.height - innerHeight));
        }, progress);
        await page.evaluate(y => { scrollTo(0, y); dispatchEvent(new Event('scroll')); }, target);
        await page.waitForTimeout(260);
        const state = await collect(page, mode);
        sectionStates.push({ progress, scrollY: state.viewport.scrollY, projectSection: state.projectSection, stage: state.stage, rail: state.rail, railTransform: state.railTransform, tickets: state.tickets, about: state.about });
      }
      results.push({ profile: { mode, locale, viewport: profile.viewport, deviceScaleFactor: profile.deviceScaleFactor, isMobile: !!profile.isMobile, hasTouch: !!profile.hasTouch }, initial, sectionStates });
      await context.close();
    }
  }
  const output = {
    sourceCommit: require('node:child_process').execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    generatedAt: new Date().toISOString(),
    browser: browser.version(),
    configuration: { browser: 'Chromium headless', executable: process.env.CHROMIUM_PATH || '/usr/bin/chromium', launchArgs: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required'], locale: 'en-GB', timezoneId: 'Europe/Paris', colorScheme: 'light', reducedMotion: 'no-preference', fontsWait: 'document.fonts.ready plus Figtree/Inter faces', runtime: 'existing Phase 0–1 replay fixture on CDN requests only' },
    results,
  };
  const out = path.join(__dirname, 'baseline-geometry.json');
  fs.writeFileSync(out, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Saved ${results.length} locale/profile records to ${path.relative(process.cwd(), out)} (Chromium ${output.browser}).`);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
