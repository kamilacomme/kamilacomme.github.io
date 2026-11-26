// Geometry QA for the case blocks hero-reveal, image-pair and ai-episode on /cases/jane/ and /en/cases/jane/.
// Usage: start `npm run test:serve`, then `node tests/case/blocks-check.cjs [report.json]`.
// Uses CHROME_PATH (default: macOS Google Chrome) and BASE_URL (default http://127.0.0.1:8000).
//
// Checks per width (320–1920, both languages): no horizontal overflow; hero between the Navbar and the
// bottom of the first screen, with the portrait/landscape frame matching the screen; every pair and row
// follows its container (stacked / two columns / one per frame) and its cells are the same size; every
// rendered image has loaded. Container test: the same page in a 340px-wide column on a 1440px screen must
// stack like a phone, which proves the blocks follow their container and not the window.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8000';
const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const SIZES = [[320, 640], [360, 740], [393, 852], [500, 900], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];

const probe = () => {
  const vis = el => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const rect = el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, right: r.right, bottom: r.bottom }; };
  const hero = document.querySelector('.kc-case-hero-media');
  const heroImg = hero?.querySelector('img');
  const nav = document.querySelector('.kc-responsive-nav');
  const out = {
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    profile: document.documentElement.dataset.kcProfile,
    portrait: window.matchMedia('(orientation: portrait)').matches,
    navBottom: nav.getBoundingClientRect().bottom,
    hero: hero && { ...rect(hero), src: heroImg?.currentSrc ?? '', loaded: !!heroImg && heroImg.complete && heroImg.naturalWidth > 0,
      fileW: +((heroImg?.currentSrc.match(/-(\d+)\.webp$/) || [])[1] || 0),
      largest: !!heroImg && (heroImg.currentSrc.endsWith((heroImg.srcset || '').split(',').pop().trim().split(' ')[0].split('/').pop()) || (heroImg.parentElement.tagName === 'PICTURE' && heroImg.currentSrc.endsWith((heroImg.parentElement.querySelector('source')?.srcset || '').split(',').pop().trim().split(' ')[0].split('/').pop()))) },
    h1: [...document.querySelectorAll('h1')].map(h => h.textContent.trim()),
    pairs: [], rows: [], broken: [],
  };
  const cells = parent => [...parent.querySelectorAll(':scope > .kc-case-cell')].map(c => {
    const f = [...c.querySelectorAll('.kc-case-frame')].find(vis);
    return f ? rect(f) : null;
  });
  document.querySelectorAll('.kc-case-pair').forEach(el => out.pairs.push({ container: el.parentElement.clientWidth, cols: getComputedStyle(el).gridTemplateColumns.split(' ').length, cells: cells(el) }));
  document.querySelectorAll('.kc-case-row').forEach(el => out.rows.push({ container: el.parentElement.clientWidth, n: +el.dataset.n, cols: getComputedStyle(el).gridTemplateColumns.split(' ').length, cells: cells(el) }));
  document.querySelectorAll('.kc-case-block img').forEach(img => {
    if (!vis(img) || !img.closest('.kc-case-frame, .kc-case-crop-frame, .kc-case-hero-media')) return;
    if (img.closest('.kc-case-hero-media')) return;
    // File width from the name (-<width>.webp); "largest" = the biggest file the page offers for this image.
    const src = img.currentSrc || img.src;
    const fileW = +((src.match(/-(\d+)\.webp$/) || [])[1] || 0);
    const candidates = (img.srcset || '').split(',').map(c => c.trim().split(' ')[0]).filter(Boolean);
    out.broken.push({ src, ok: img.complete && img.naturalWidth > 0, fileW, largest: !candidates.length || src.endsWith(candidates.at(-1).split('/').pop()), rendered: img.getBoundingClientRect().width });
  });
  return out;
};

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const failures = [], rows = [];
  const fail = (w, m) => failures.push(`${w}: ${m}`);
  const sameSize = (where, label, cells) => {
    const k = cells.filter(Boolean);
    if (k.length > 1 && k.some(c => Math.abs(c.w - k[0].w) > 1.5 || Math.abs(c.h - k[0].h) > 1.5)) fail(where, `${label}: cells differ (${k.map(c => `${c.w.toFixed(0)}×${c.h.toFixed(0)}`).join(', ')})`);
  };
  const load = async (page, url) => {
    await page.goto(url, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
    // Lazy images load when scrolled to: walk the page once, then wait for them.
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 500) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => [...document.querySelectorAll('img')].filter(i => i.getClientRects().length).every(i => i.complete), null, { timeout: 15000 }).catch(() => {});
    await settle(page);
  };
  for (const lang of ['fr', 'en']) {
    const url = `${BASE}${lang === 'fr' ? '' : '/en'}/cases/jane/`;
    for (const [w, h] of SIZES) {
      const where = `${lang} ${w}x${h}`;
      const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
      await load(p, url);
      const m = await p.evaluate(probe); rows.push({ lang, w, h, ...m });
      if (m.overflow > 0) fail(where, `overflow ${m.overflow}px`);
      if (!m.hero) fail(where, 'no hero'); else {
        if (m.hero.y < m.navBottom - 0.5) fail(where, `hero top ${m.hero.y} under the Navbar (${m.navBottom})`);
        if (m.hero.bottom > h + 0.5) fail(where, `hero bottom ${m.hero.bottom} below the first screen (${h})`);
        if (Math.abs(m.hero.bottom - (h - 32)) > 1.5 && m.hero.h > 321) fail(where, `hero does not fill the first screen (bottom ${m.hero.bottom}, expected ${h - 32})`);
        if (!m.hero.loaded) fail(where, 'hero image not loaded');
        if (m.portrait !== /vertical/.test(m.hero.src)) fail(where, `hero frame ${m.hero.src.split('/').pop()} does not match ${m.portrait ? 'portrait' : 'landscape'}`);
      }
      if (m.h1.length !== 1 || !m.h1[0]) fail(where, `h1 ${JSON.stringify(m.h1)}`);
      for (const pr of m.pairs) {
        const wantCols = pr.container >= 480 ? 2 : 1;
        if (pr.cols !== wantCols) fail(where, `pair in ${pr.container}px has ${pr.cols} columns, expected ${wantCols}`);
        if (pr.cols === 2) sameSize(where, `pair ${pr.container}px`, pr.cells);
      }
      for (const r of m.rows) {
        const want = r.container >= 800 ? (r.n >= 3 ? r.n : 2) : r.container >= 480 ? 2 : 1;
        if (r.cols !== want) fail(where, `row (${r.n}) in ${r.container}px has ${r.cols} columns, expected ${want}`);
        if (r.cols > 1) sameSize(where, `row (${r.n}) ${r.container}px`, r.cells);
      }
      for (const i of m.broken) {
        if (!i.ok) fail(where, `image not loaded ${i.src}`);
        // The browser picked a file too small for its cell although a larger one exists: the sizes hint is wrong.
        else if (!i.largest && i.rendered > i.fileW * 1.15) fail(where, `${i.src.split('/').pop()} drawn ${i.rendered.toFixed(0)}px wide from a ${i.fileW}px file`);
      }
      await ctx.close();
    }
    // Container test: a 340px column on a 1440px screen behaves like a phone.
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
    await load(p, url);
    const wide = await p.evaluate(probe);
    await p.addStyleTag({ content: '.kc-case-chapter{max-width:340px}' }); await settle(p);
    const narrow = await p.evaluate(probe);
    const where = `${lang} 1440 screen, 340px column`;
    if (!wide.pairs.every(x => x.cols === 2) || !wide.rows.some(x => x.cols >= 3)) fail(where, 'the full-width page does not show two-column pairs and 3–4 column rows');
    if (!narrow.pairs.every(x => x.cols === 1) || !narrow.rows.every(x => x.cols === 1)) fail(where, 'blocks in a 340px column did not stack');
    rows.push({ lang, container: '340px column on 1440', pairs: narrow.pairs.map(x => x.cols), rows: narrow.rows.map(x => x.cols) });
    await ctx.close();
  }
  await b.close();
  // Source-limited frames: drawn wider than the largest file we have (never upscaled on disk), at 1x density.
  const soft = {};
  rows.filter(r => r.hero && r.hero.largest && r.hero.w > r.hero.fileW * 1.05).forEach(r => {
    const k = `${r.hero.src.split('/').pop()} (hero)`; soft[k] = Math.max(soft[k] ?? 0, +(r.hero.w / r.hero.fileW).toFixed(2));
  });
  rows.filter(r => r.broken).forEach(r => r.broken.filter(i => i.largest && i.rendered > i.fileW * 1.05).forEach(i => {
    const k = i.src.split('/').pop(); soft[k] = Math.max(soft[k] ?? 0, +(i.rendered / i.fileW).toFixed(2));
  }));
  const maxUp = Math.max(1, ...Object.values(soft));
  const summary = { viewports: SIZES.length * 2, containerTests: 2, failures, sourceLimitedFrames: soft, maxRenderedOverNatural: maxUp };
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify({ summary, rows }, null, 2) + '\n');
  console.log(`case blocks: ${summary.viewports} viewports + ${summary.containerTests} container tests (FR+EN), ${failures.length} failure(s); ${Object.keys(soft).length} frame(s) drawn wider than their source file at 1x density, at most ${maxUp}× (soft on a wide screen, listed in the report)`);
  failures.forEach(f => console.log('FAIL', f));
  process.exit(failures.length ? 1 : 0);
})();
