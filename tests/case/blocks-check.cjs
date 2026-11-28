// Geometry QA for all case blocks (hero-reveal … outcome-montage) on /cases/<id>/ and /en/cases/<id>/ (default jane).
// Usage: start `npm run test:serve`, then `[CASE_ID=example] node tests/case/blocks-check.cjs [report.json]`.
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
const CASE_ID = process.env.CASE_ID || 'jane';
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
  document.querySelectorAll('.kc-case-row').forEach(el => { const c = cells(el); out.rows.push({ container: el.parentElement.clientWidth, n: +el.dataset.n, cols: getComputedStyle(el).gridTemplateColumns.split(' ').length, cells: c, perRow: new Set(c.filter(Boolean).map(v => Math.round(v.x))).size }); });
  out.fullFrames = [...document.querySelectorAll('.kc-case-full')].map(el => { const img = el.querySelector('img'); const c = (img?.srcset || '').split(',').pop().trim().split(' ')[0]; return { fit: el.dataset.fit, w: el.querySelector('.kc-case-frame').getBoundingClientRect().width, largestW: +((c.match(/-(\d+)\.webp$/) || [])[1] || 0), src: img?.currentSrc ?? '' }; });
  document.querySelectorAll('.kc-case-block img').forEach(img => {
    if (!vis(img) || !img.closest('.kc-case-frame, .kc-case-crop-frame, .kc-case-hero-media')) return;
    if (img.closest('.kc-case-hero-media')) return;
    // File width from the name (-<width>.webp); "largest" = the biggest file the page offers for this image.
    const src = img.currentSrc || img.src;
    const fileW = +((src.match(/-(\d+)\.webp$/) || [])[1] || 0);
    const candidates = (img.srcset || '').split(',').map(c => c.trim().split(' ')[0]).filter(Boolean);
    const largestW = +((candidates.at(-1) || '').match(/-(\d+)\.webp$/) || [])[1] || fileW;
    out.broken.push({ src, ok: img.complete && img.naturalWidth > 0, fileW, largestW, sketch: /-sketch-/.test(src), largest: !candidates.length || src.endsWith(candidates.at(-1).split('/').pop()), rendered: img.getBoundingClientRect().width });
  });
  // Remaining blocks: grid columns, cell sizes and the annotation layout, measured on the page.
  const blockOf = el => el.closest('.kc-case-block').clientWidth;
  const sizes = el => [...el.querySelectorAll(':scope > .kc-case-cell, :scope > .kc-case-swatch, :scope > .kc-case-logo')].map(c => {
    const f = c.querySelector('.kc-case-frame, .kc-case-swatch-chip, .kc-case-logo-frame');
    return f && vis(f) ? rect(f) : null;
  });
  out.grids = [];
  for (const [sel, kind] of [['.kc-case-trio', 'trio'], ['.kc-case-montage', 'montage'], ['.kc-case-tiles', 'tiles'], ['.kc-case-logos', 'logos'], ['.kc-case-swatches', 'swatches'], ['.kc-case-principle', 'principle'], ['.kc-case-split', 'split']]) {
    document.querySelectorAll(sel).forEach(el => { const cells = kind === 'principle' || kind === 'split' ? [] : sizes(el); out.grids.push({ kind, n: +el.dataset.n || cells.length, container: blockOf(el), cols: getComputedStyle(el).gridTemplateColumns.split(' ').length, cells, perRow: new Set(cells.filter(Boolean).map(c => Math.round(c.x))).size }); });
  }
  out.splits = [...document.querySelectorAll('.kc-case-split')].map(el => {
    const copy = el.querySelector('.kc-case-copy').getBoundingClientRect(), fig = el.querySelector('.kc-case-cell').getBoundingClientRect();
    return { side: el.dataset.side, container: blockOf(el), imageLeftOfText: fig.x < copy.x - 1, stacked: Math.abs(fig.x - copy.x) < 2 };
  });
  out.full = [...document.querySelectorAll('.kc-case-full')].map(el => ({ orient: el.dataset.orient, w: el.querySelector('.kc-case-frame').getBoundingClientRect().width, container: blockOf(el), centered: Math.abs((el.querySelector('.kc-case-frame').getBoundingClientRect().left - el.getBoundingClientRect().left) - (el.getBoundingClientRect().right - el.querySelector('.kc-case-frame').getBoundingClientRect().right)) < 2 }));
  out.annot = [...document.querySelectorAll('.kc-case-annot')].map(el => {
    const stage = el.querySelector('.kc-case-annot-stage').getBoundingClientRect();
    const notes = [...el.querySelectorAll('.kc-case-note')], markers = [...el.querySelectorAll('.kc-case-marker')];
    const inside = r => r.left >= stage.left - 1 && r.right <= stage.right + 1 && r.top >= stage.top - 1 && r.bottom <= stage.bottom + 1;
    return { container: blockOf(el), overlay: getComputedStyle(el.querySelector('.kc-case-notes')).position === 'absolute', notesInside: notes.every(n => inside(n.getBoundingClientRect())), markersInside: markers.every(m => inside(m.getBoundingClientRect())),
      listBelow: el.querySelector('.kc-case-notes').getBoundingClientRect().top >= stage.bottom - 1, lines: getComputedStyle(el.querySelector('.kc-case-annot-lines')).display !== 'none', letters: getComputedStyle(markers[0], '::after').content !== 'none' && getComputedStyle(markers[0], '::after').content !== 'normal' };
  });
  const intro = document.querySelector('.kc-case-intro');
  out.introPx = intro ? parseFloat(getComputedStyle(intro).fontSize) : null;
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
    const url = `${BASE}${lang === 'fr' ? '' : '/en'}/cases/${CASE_ID}/`;
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
      // One scheme for rows, detail-grid and montage: 1 column, 2 from 480px, then 3 for 3/5/6 frames, 4 for 4/7+ (never more than 4).
      const colsFor = (n, c) => (c < 480 ? 1 : c < 800 || n <= 2 ? 2 : [3, 5, 6].includes(n) ? 3 : 4);
      for (const r of m.rows) {
        const want = colsFor(r.n, r.container);
        if (r.cols !== want) fail(where, `row (${r.n}) in ${r.container}px has ${r.cols} columns, expected ${want}`);
        if (r.perRow > 4 || r.cols > 4) fail(where, `row (${r.n}) has more than four frames in a line`);
        if (r.cols > 1) sameSize(where, `row (${r.n}) ${r.container}px`, r.cells);
      }
      for (const g of m.grids) {
        const c = g.container;
        const want = { trio: c >= 640 ? 3 : 1, montage: colsFor(g.n, c), tiles: colsFor(g.n, c), principle: c >= 640 ? 2 : 1 }[g.kind];
        if (g.perRow > 4) fail(where, `${g.kind} has more than four frames in a line`);
        if (want && g.cols !== want) fail(where, `${g.kind} in ${c}px has ${g.cols} columns, expected ${want}`);
        if (g.cells.length && g.cols > 1) sameSize(where, `${g.kind} ${c}px`, g.cells);
        if (['logos', 'swatches'].includes(g.kind)) sameSize(where, `${g.kind} ${c}px`, g.cells);
      }
      for (const sp of m.splits) {
        if (sp.container >= 640 ? sp.stacked : !sp.stacked) fail(where, `split in ${sp.container}px is ${sp.stacked ? 'stacked' : 'side by side'}`);
        if (!sp.stacked && (sp.side === 'left') !== sp.imageLeftOfText) fail(where, `split image is on the wrong side (data-side ${sp.side})`);
      }
      // Quality rules: never drawn wider than 1.15x the largest file; drawings and smaller frames inside the 64rem column;
      // full width only for photographs whose largest file is 1600px or more.
      for (const i of m.broken) {
        if (i.ok && i.rendered > i.largestW * 1.15 + 1) fail(where, `${i.src.split('/').pop()} drawn ${i.rendered.toFixed(0)}px wide, over 1.15x its ${i.largestW}px file`);
        if (i.sketch && i.rendered > 1025) fail(where, `sketch ${i.src.split('/').pop()} is ${i.rendered.toFixed(0)}px wide (column is 1024px)`);
      }
      for (const f of m.fullFrames) {
        if (f.fit === 'column' && f.w > 1025) fail(where, `column image ${f.src.split('/').pop()} is ${f.w.toFixed(0)}px wide`);
        if (f.fit === 'full' && f.largestW < 1600) fail(where, `full-width image ${f.src.split('/').pop()} has a ${f.largestW}px file (needs 1600px)`);
      }
      for (const f of m.full) {
        if (f.orient === 'portrait' && f.w > 641) fail(where, `portrait full frame is ${f.w}px wide (max 640)`);
        if (f.orient === 'portrait' && !f.centered) fail(where, 'portrait full frame is not centred');
      }
      for (const a of m.annot) {
        const wide = a.container >= 640;
        if (a.overlay !== wide || a.lines !== wide) fail(where, `annotation in ${a.container}px: overlay ${a.overlay}, lines ${a.lines}`);
        if (wide && !(a.notesInside && a.markersInside)) fail(where, 'annotation labels or markers fall outside the image');
        if (!wide && (!a.listBelow || !a.letters)) fail(where, 'narrow annotation needs a lettered list below the image');
      }
      if (m.introPx !== null && m.introPx !== (m.profile === 'mobile' ? 20 : 24)) fail(where, `chapter intro is ${m.introPx}px`);
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
    if (!narrow.grids.every(g => g.cols === 1 || ['tiles', 'logos', 'swatches'].includes(g.kind)) || !narrow.splits.every(x => x.stacked) || !narrow.annot.every(a => !a.overlay)) fail(where, 'trio, montage, split or annotation did not follow the 340px column');
    if (!wide.grids.some(g => g.kind === 'trio' && g.cols === 3) || !wide.splits.some(x => !x.stacked) || !wide.annot.some(a => a.overlay)) fail(where, 'the full-width page does not show the wide layouts');
    rows.push({ lang, container: '340px column on 1440', pairs: narrow.pairs.map(x => x.cols), rows: narrow.rows.map(x => x.cols), grids: narrow.grids.map(g => `${g.kind}:${g.cols}`) });
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
  console.log(`case blocks (${CASE_ID}): ${summary.viewports} viewports + ${summary.containerTests} container tests (FR+EN), ${failures.length} failure(s); ${Object.keys(soft).length} frame(s) drawn wider than their source file at 1x density, at most ${maxUp}× (soft on a wide screen, listed in the report)`);
  failures.forEach(f => console.log('FAIL', f));
  process.exit(failures.length ? 1 : 0);
})();
