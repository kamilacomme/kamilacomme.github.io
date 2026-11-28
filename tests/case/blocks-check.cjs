// Geometry QA for all case blocks (hero-reveal … outcome-montage) on /cases/<id>/ and /en/cases/<id>/ (default jane).
// Usage: start `npm run test:serve`, then `[CASE_ID=example] node tests/case/blocks-check.cjs [report.json]`.
// Uses CHROME_PATH (default: macOS Google Chrome) and BASE_URL (default http://127.0.0.1:8000).
//
// Checks per width (320–1920, both languages): no horizontal overflow; hero between the Navbar and the
// bottom of the first screen, with the portrait/landscape frame matching the screen; every block follows its
// container (frames per line by container tier, see styles/case-blocks.css; a phone is ONE column, the only
// exception is an image-pair marked mobile: "pair") and its cells are the same size
// (same height when the widths differ); every rendered image has loaded; the left and right edge of every frame
// and text column sit on the lines of the page grid (12 columns, margins 32, gutter 24; 4 columns, 16/16 under
// 500px: the same lines as the overlay of scripts/dev/grid-overlay.js), ±1px; SVG logos are not measured against
// a file width (they have none). Container test: the same page in a 340px-wide column on a 1440px screen must
// lay out like a phone, which proves the blocks follow their container and not the window.
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
  // Frames in the most crowded line of a row (cells sharing the same top).
  const lineCount = list => { const ys = list.filter(Boolean).map(c => Math.round(c.y)); return ys.length ? Math.max(...ys.map(y => ys.filter(v => Math.abs(v - y) < 2).length)) : 0; };
  out.clientWidth = document.documentElement.clientWidth;
  out.margin = parseFloat(getComputedStyle(document.querySelector('.kc-case-chapter')).paddingLeft);
  document.querySelectorAll('.kc-case-pair').forEach(el => { const c = cells(el); out.pairs.push({ container: el.parentElement.clientWidth, authored: el.hasAttribute('data-authored'), uneq: el.hasAttribute('data-uneq'), mobilePair: el.dataset.mobile === 'pair', perLine: lineCount(c), cells: c }); });
  document.querySelectorAll('.kc-case-row').forEach(el => { const c = cells(el); out.rows.push({ container: el.parentElement.clientWidth, n: +el.dataset.n, cols: getComputedStyle(el).gridTemplateColumns.split(' ').length, cells: c, perRow: new Set(c.filter(Boolean).map(v => Math.round(v.x))).size }); });
  out.fullFrames = [...document.querySelectorAll('.kc-case-full')].map(el => { const img = el.querySelector('img'); const c = (img?.srcset || '').split(',').pop().trim().split(' ')[0]; return { fit: el.dataset.fit, w: el.querySelector('.kc-case-frame').getBoundingClientRect().width, largestW: +((c.match(/-(\d+)\.webp$/) || [])[1] || 0), src: img?.currentSrc ?? '' }; });
  document.querySelectorAll('.kc-case-block img').forEach(img => {
    if (!vis(img) || !img.closest('.kc-case-frame, .kc-case-crop-frame, .kc-case-hero-media')) return;
    if (img.closest('.kc-case-hero-media')) return;
    // File width from the name (-<width>.webp); "largest" = the biggest file the page offers for this image.
    const src = img.currentSrc || img.src;
    if (/\.svg(\?|$)/.test(src)) return; // vector art has no file width: no stretch rule applies
    const fileW = +((src.match(/-(\d+)\.webp$/) || [])[1] || 0);
    const candidates = (img.srcset || '').split(',').map(c => c.trim().split(' ')[0]).filter(Boolean);
    const largestW = +((candidates.at(-1) || '').match(/-(\d+)\.webp$/) || [])[1] || fileW;
    out.broken.push({ src, ok: img.complete && img.naturalWidth > 0, fileW, largestW, sketch: /-sketch-/.test(src), largest: !candidates.length || src.endsWith(candidates.at(-1).split('/').pop()), rendered: img.getBoundingClientRect().width });
  });
  // Remaining blocks: grid columns, cell sizes and the annotation layout, measured on the page.
  const blockOf = el => el.closest('.kc-case-block').clientWidth;
  const sizes = el => [...el.querySelectorAll(':scope > .kc-case-cell, :scope > .kc-case-swatch, :scope > .kc-case-logo')].map(c => {
    // An art-directed cell holds a wide and a narrow frame; only the visible one is measured.
    const f = [...c.querySelectorAll('.kc-case-frame, .kc-case-swatch-chip, .kc-case-logo-frame')].find(vis);
    return f ? rect(f) : null;
  });
  out.grids = [];
  for (const [sel, kind] of [['.kc-case-trio', 'trio'], ['.kc-case-rowgrid', 'rowgrid'], ['.kc-case-logos', 'logos'], ['.kc-case-swatches', 'swatches'], ['.kc-case-principle', 'principle'], ['.kc-case-split', 'split']]) {
    document.querySelectorAll(sel).forEach(el => { const cells = kind === 'principle' || kind === 'split' ? [] : sizes(el); out.grids.push({ kind, n: +el.dataset.n || cells.length, container: blockOf(el), authored: el.hasAttribute('data-authored'), uneq: el.hasAttribute('data-uneq'), cells, perLine: lineCount(cells) }); });
  }
  // Every frame and text column placed on the column grid: its box edges against the grid lines.
  out.items = [...document.querySelectorAll('.kc-case-cols > :not(.kc-case-cols)')].filter(vis).map(el => {
    const b = el.getBoundingClientRect();
    return { block: el.closest('.kc-case-block').dataset.kcBlock, mobilePair: !!el.closest('.kc-case-pair[data-mobile]'), cls: String(el.className).split(' ')[0].replace('kc-case-', ''), left: b.left, right: b.right, capped: getComputedStyle(el).getPropertyValue('--cap').trim() !== '' };
  });
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
      // Frames per line by container tier (styles/case-blocks.css); an authored `span` sets its own widths from 480px,
      // so only the default layouts are counted there. Under 480px (a phone, 4 columns) everything is ONE column
      // whatever the span; the one exception is an image-pair marked mobile: "pair" (two frames, 2 columns each).
      const perRowFor = n => (n <= 4 ? n : n <= 6 ? 3 : 4);
      const rowLine = (n, c) => (c < 480 ? 1 : c < 800 ? (n === 1 ? 1 : 2) : perRowFor(n));
      for (const pr of m.pairs) {
        if (pr.container < 480) {
          const want = pr.mobilePair ? 2 : 1;
          if (pr.perLine !== want) fail(where, `pair in ${pr.container}px has ${pr.perLine} per line, expected ${want}${pr.mobilePair ? ' (mobile: pair)' : ''}`);
          if (pr.mobilePair) sameSize(where, `mobile pair ${pr.container}px`, pr.cells);
          continue;
        }
        if (pr.authored) {
          const k = pr.cells.filter(Boolean);
          if (pr.perLine > 1 && (pr.uneq ? k.some(v => Math.abs(v.h - k[0].h) > 1.5) : false)) fail(where, `pair ${pr.container}px: frames of unequal widths differ in height`);
          if (pr.perLine > 1 && !pr.uneq) sameSize(where, `pair ${pr.container}px`, pr.cells);
          continue;
        }
        const want = pr.container >= 480 ? 2 : 1;
        if (pr.perLine !== want) fail(where, `pair in ${pr.container}px has ${pr.perLine} per line, expected ${want}`);
        if (pr.perLine === 2) sameSize(where, `pair ${pr.container}px`, pr.cells);
      }
      // ai-episode rows keep their own scheme: 1 column, 2 from 480px, then 3 for 3/5/6 frames, 4 for 4/7+ (never more than 4).
      const colsFor = (n, c) => (c < 480 ? 1 : c < 800 || n <= 2 ? 2 : [3, 5, 6].includes(n) ? 3 : 4);
      for (const r of m.rows) {
        const want = colsFor(r.n, r.container);
        if (r.cols !== want) fail(where, `row (${r.n}) in ${r.container}px has ${r.cols} columns, expected ${want}`);
        if (r.perRow > 4 || r.cols > 4) fail(where, `row (${r.n}) has more than four frames in a line`);
        if (r.cols > 1) sameSize(where, `row (${r.n}) ${r.container}px`, r.cells);
      }
      for (const g of m.grids) {
        const c = g.container;
        if (g.perLine > 4) fail(where, `${g.kind} has more than four frames in a line`);
        if (c < 480 && g.perLine > 1) fail(where, `${g.kind} (${g.n}) in ${c}px has ${g.perLine} per line, a phone is one column`);
        if (!g.authored || c < 480) {
          const want = { trio: c >= 640 ? 3 : 1, rowgrid: rowLine(g.n, c), logos: rowLine(g.n, c), swatches: c >= 640 ? 4 : c >= 480 ? 3 : 1 }[g.kind];
          if (want && g.perLine !== want) fail(where, `${g.kind} (${g.n}) in ${c}px has ${g.perLine} per line, expected ${want}`);
        }
        if (g.cells.length && g.perLine > 1) {
          if (g.uneq) { const k = g.cells.filter(Boolean); if (k.some(v => Math.abs(v.h - k[0].h) > 1.5)) fail(where, `${g.kind} ${c}px: frames of unequal widths differ in height`); }
          else sameSize(where, `${g.kind} ${c}px`, g.cells);
        }
        if (['logos', 'swatches'].includes(g.kind)) sameSize(where, `${g.kind} ${c}px`, g.cells);
      }
      for (const sp of m.splits) {
        if (sp.container >= 640 ? sp.stacked : !sp.stacked) fail(where, `split in ${sp.container}px is ${sp.stacked ? 'stacked' : 'side by side'}`);
        if (!sp.stacked && (sp.side === 'left') !== sp.imageLeftOfText) fail(where, `split image is on the wrong side (data-side ${sp.side})`);
      }
      // Quality rules: never drawn wider than 1.15x the largest file (SVG excluded); full width only for photographs
      // whose largest file is 1600px or more. (Widths of drawings and supporting frames are the layout rules of
      // `npm run case:layout-check`, a report, not a failure here.)
      for (const i of m.broken) {
        if (i.ok && i.rendered > i.largestW * 1.15 + 1) fail(where, `${i.src.split('/').pop()} drawn ${i.rendered.toFixed(0)}px wide, over 1.15x its ${i.largestW}px file`);
      }
      for (const f of m.fullFrames) {
        if (f.fit === 'full' && f.largestW < 1600) fail(where, `full-width image ${f.src.split('/').pop()} has a ${f.largestW}px file (needs 1600px)`);
      }
      // Grid edges: left edge of every frame and text column on a column start; right edge on a column end unless the
      // frame is held back by the 1.15x rule (then it stays pinned to its left line). The lines are those of the page
      // (its margin is the page gutter) and, up to 1440px, those of the overlay of scripts/dev/grid-overlay.js (margins
      // 32 or 16): above 1440px the page margin grows with the scene scale (34.5px at 1920) while the overlay keeps
      // 32. Skipped at 500px: tablet profile with a 12-column overlay but 4-column blocks (container under 480px).
      if (w !== 500) {
        const spec = m.clientWidth < 500 ? { n: 4, m: 16, g: 16 } : { n: 12, m: 32, g: 24 };
        if (w <= 1440 && Math.abs(m.margin - spec.m) > 0.5) fail(where, `page margin ${m.margin}px differs from the grid overlay margin ${spec.m}px`);
        spec.m = m.margin;
        const col = (m.clientWidth - 2 * spec.m - (spec.n - 1) * spec.g) / spec.n;
        const starts = Array.from({ length: spec.n }, (_, k) => spec.m + k * (col + spec.g));
        const ends = starts.map(x => x + col);
        const near = (v, list) => list.some(x => Math.abs(v - x) <= 1);
        for (const it of m.items) {
          if (!near(it.left, starts)) fail(where, `${it.block} ${it.cls}: left edge ${it.left.toFixed(1)}px is not on a grid line`);
          if (!it.capped && !near(it.right, ends)) fail(where, `${it.block} ${it.cls}: right edge ${it.right.toFixed(1)}px is not on a grid line`);
          // A phone: every frame and text column runs from the left page margin to the right one (16px), except the
          // two frames of an explicit mobile: "pair" (a frame held back by the 1.15x rule stays on the left margin).
          if (m.clientWidth < 500 && !it.mobilePair) {
            if (Math.abs(it.left - m.margin) > 1) fail(where, `${it.block} ${it.cls}: left edge ${it.left.toFixed(1)}px is not the page margin (${m.margin}px)`);
            if (!it.capped && Math.abs(it.right - (m.clientWidth - m.margin)) > 1) fail(where, `${it.block} ${it.cls}: right edge ${it.right.toFixed(1)}px is not the page margin (${m.clientWidth - m.margin}px)`);
          }
        }
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
    // The wide page must show the wide layouts of every block kind it has; in the 340px column the same blocks must
    // lay out as in a phone (4 columns): pairs and splits stacked, annotations lettered. Block kinds a page does not
    // have are not required (Jane has no text-image and no annotated-image; the example page has every block).
    if (wide.pairs.some(x => !x.authored && x.perLine !== 2)) fail(where, 'the full-width page does not show two-column pairs');
    if (wide.grids.some(g => g.kind === 'trio' && !g.authored) && !wide.grids.some(g => g.kind === 'trio' && g.perLine === 3)) fail(where, 'the full-width page does not show a three-column row');
    if (wide.splits.length && !wide.splits.some(x => !x.stacked)) fail(where, 'the full-width page does not show a side-by-side split');
    if (wide.annot.length && !wide.annot.some(a => a.overlay)) fail(where, 'the full-width page does not show the annotation overlay');
    if (!narrow.pairs.every(x => x.perLine === (x.mobilePair ? 2 : 1))) fail(where, 'pairs in a 340px column are not one column (two only for mobile: pair)');
    if (!narrow.rows.every(x => x.cols === 1)) fail(where, 'ai-episode rows in a 340px column did not stack');
    if (!narrow.splits.every(x => x.stacked) || !narrow.annot.every(a => !a.overlay)) fail(where, 'split or annotation did not follow the 340px column');
    for (const g of narrow.grids) {
      if (g.container >= 480) continue;
      if (g.perLine > 1) fail(where, `${g.kind} (${g.n}) in the 340px column has ${g.perLine} per line, a phone is one column`);
    }
    rows.push({ lang, container: '340px column on 1440', pairs: narrow.pairs.map(x => x.perLine), rows: narrow.rows.map(x => x.cols), grids: narrow.grids.map(g => `${g.kind}:${g.perLine}`) });
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
