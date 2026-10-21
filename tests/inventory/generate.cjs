#!/usr/bin/env node
'use strict';

// Original-export adapter. It is deliberately separate from the application and
// must not be silently updated when the future implementation changes.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const ids = { Pilates: 'pilates', Longread: 'longread', 'Tour de parole': 'tour-de-parole', 'Inside out': 'inside-out', Celimax: 'celimax', Napoli: 'napoli' };
const sourceFiles = cp.execFileSync('git', ['ls-tree', '-r', '--name-only', 'd8a37314ed7d2265f3f949c9e048b5e2beadfc20'], { cwd: root, encoding: 'utf8' }).trim().split('\n');
for (const file of sourceFiles) {
  const original = cp.execFileSync('git', ['show', `d8a37314ed7d2265f3f949c9e048b5e2beadfc20:${file}`], { cwd: root, maxBuffer: 4 * 1024 * 1024 });
  if (!original.equals(fs.readFileSync(path.join(root, file)))) throw new Error(`Original source changed: ${file}; refusing to regenerate reference inventory`);
}

async function extract(page, file, selector, language) {
  // DOMParser creates an inert document. No portfolio scripts, remote assets or
  // runtime callbacks execute. Translation is exercised separately, unchanged.
  const html = read(file);
  const cards = await page.evaluate(({ html, selector }) => {
    const document = new DOMParser().parseFromString(html, 'text/html');
    return [...document.querySelectorAll(selector)].map(card => {
      const media = [...card.querySelectorAll('img,video')].map(el => ({
        element: el.tagName.toLowerCase(),
        ...Object.fromEntries(['src', 'data-src', 'poster', 'loading', 'preload', 'aria-label'].filter(name => el.hasAttribute(name)).map(name => [name, el.getAttribute(name)]))
      }));
      const styleAssets = [...card.querySelectorAll('[style]'), card].flatMap(el => [...(el.getAttribute('style') || '').matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)].map(m => m[1]));
      return { title: card.querySelector('h2').textContent, description: card.querySelector('p').textContent,
        tags: [...card.querySelectorAll('.tags span,.categories span')].map(el => el.textContent),
        url: card.getAttribute('href'), accessibleName: card.getAttribute('aria-label'), media, styleAssets,
        html: card.outerHTML };
    });
  }, { html, selector });
  if (cards.length !== 6) throw new Error(`Expected six cards: ${file} ${selector}, found ${cards.length}`);
  for (const card of cards) {
    const title = card.title;
    if (language === 'en') {
      // Exercise original translator on a small inert fixture. This preserves its
      // whitespace normalization and NBSP polishing, not an approximation thereof.
      await page.setContent(`<html lang="en"><head></head><body>${card.html.replace(/\s(?:src|poster|data-src)="[^"]*"/g, '')}</body></html>`);
      await page.addScriptTag({ content: read('en/i18n.js') });
      Object.assign(card, await page.evaluate(() => ({
        title: document.querySelector('h2').textContent,
        description: document.querySelector('p').textContent,
        tags: [...document.querySelectorAll('.tags span,.categories span')].map(el => el.textContent),
        accessibleName: document.querySelector('a').getAttribute('aria-label')
      })));
    }
    delete card.html;
    card.id = ids[title];
    if (!card.id) throw new Error(`Unknown project ${title}`);
    const line = html.slice(0, html.indexOf(`href="${card.url}"`, html.indexOf(selector.includes('mobile') ? 'id="kc-mobile-projets"' : selector.includes('tablet') ? 'id="kc-tablet-projets"' : 'class="rail"'))).split('\n').length;
    card.source = { file, line, selector: `${selector}:has(h2:text-is(${JSON.stringify(title)}))` };
  }
  return cards;
}

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => route.abort());
    const layouts = {};
    for (const [mode, file, selector] of [
      ['desktop', 'desktop-project-embedded.html', '.rail > .ticket'],
      ['tablet-portrait', 'index.html', '#kc-tablet-projets .tickets > .ticket'],
      ['tablet-landscape', 'index.html', '#kc-tablet-projets .tickets > .ticket'],
      ['mobile', 'index.html', '#kc-mobile-projets .project']
    ]) {
      layouts[mode] = {};
      for (const lang of ['fr', 'en']) layouts[mode][lang] = await extract(page, file, selector, lang);
    }
    const originalSources = sourceFiles.filter(file => /\.(html|js|css)$/.test(file));
    const sourceIntegrity = Object.fromEntries(sourceFiles.map(file => [file, { bytes: fs.statSync(path.join(root, file)).size, sha256: sha256(fs.readFileSync(path.join(root, file))) }]));
    const resourceReferences = [];
    for (const source of originalSources) {
      read(source).split('\n').forEach((text, index) => {
        for (const resource of sourceFiles) {
          if (text.includes(resource) && /\.(webp|mp4|svg|png|jpg|css|js)$/.test(resource)) resourceReferences.push({ source, line: index + 1, reference: resource, kind: 'local-literal' });
        }
        for (const match of text.matchAll(/https?:\/\/[^\s"'<>`)]+/g)) resourceReferences.push({ source, line: index + 1, reference: match[0], kind: 'external-literal-not-necessarily-requested' });
      });
    }
    const assetFiles = sourceFiles.filter(file => file.startsWith('assets/')).map(file => {
      const referencedBy = [];
      for (const source of originalSources) {
        read(source).split('\n').forEach((text, index) => { if (text.includes(file)) referencedBy.push({ file: source, line: index + 1, kind: 'literal' }); });
      }
      // Mobile slides build URLs from a base path and filenames rather than a
      // complete literal. Report these explicitly instead of declaring them unused.
      if (file.startsWith('assets/projets/opt/')) {
        read('index.html').split('\n').forEach((text, index) => {
          if (/^\s*'(Tour de parole|Celimax|Napoli)':/.test(text) && text.includes(path.basename(file))) referencedBy.push({ file: 'index.html', line: index + 1, kind: 'mobile-image-sequence-base-plus-filename' });
        });
      }
      return { path: file, ...sourceIntegrity[file], referencedBy, staticReferenceFound: referencedBy.length > 0 };
    });
    const legacy = read('index.html').match(/ticketLinks\(\)\s*\{\s*return\s*\{([\s\S]*?)\};/)[1];
    const legacyProjectIds = ['pilates', 'tour-de-parole', 'longread', 'napoli', 'inside-out', 'celimax'];
    const legacyLinks = [...legacy.matchAll(/(\d):\s*"([^"]+)"/g)].map(m => ({ index: Number(m[1]), id: legacyProjectIds[Number(m[1])], url: m[2], source: 'index.html:1783 ticketLinks()' }));
    const inventory = {
      schemaVersion: 1,
      baselineCommit: 'd8a37314ed7d2265f3f949c9e048b5e2beadfc20',
      identityPolicy: 'IDs are audit identifiers; the original export has titles and layout selectors, not these stable data IDs.',
      englishPolicy: 'English project fields are derived by running the unchanged en/i18n.js against inert original card fixtures. End-to-end rendered-page checks remain required.',
      exactTextPolicy: 'Descriptions are DOM textContent; preserve punctuation, whitespace and U+00A0. Do not normalize them for equality tests.',
      orders: Object.fromEntries(Object.entries(layouts).map(([mode, langs]) => [mode, langs.fr.map(card => card.id)])),
      layouts,
      legacyLinks,
      discrepancies: [
        { id: 'tour-de-parole', detail: 'Legacy ticketLinks() uses Behance gallery 254618097; every active layout anchor uses 256783201. Preserve active destinations and record legacy value; do not resolve this discrepancy as part of baseline work.' },
        { id: 'inside-out', detail: 'Legacy ticketLinks() includes additional YouTube query parameters; active anchors use the shorter watch URL. These are recorded separately.' },
        { detail: 'Tablet order is different from desktop/mobile; tablet categories and some punctuation differ from desktop. These are intentional baseline variants until separately approved.' }
      ],
      mobileImageSequences: {
        'tour-de-parole': ['assets/projets/opt/p3-bg.webp', 'assets/projets/opt/p3-b.webp', 'assets/projets/opt/p3-c.webp'],
        celimax: ['assets/projets/opt/p6-bg.webp', 'assets/projets/opt/p6-b.webp', 'assets/projets/opt/p6-c.webp'],
        napoli: ['assets/projets/opt/p2-a.webp', 'assets/projets/opt/p2-b.webp', 'assets/projets/opt/p2-bg.webp']
      },
      runtimeDependencies: {
        react: { url: 'https://unpkg.com/react@18.3.1/umd/react.production.min.js', integrity: 'sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z' },
        reactDOM: { url: 'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js', integrity: 'sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1' },
        three: { url: 'https://esm.sh/three@0.160.0', consumer: 'curtain-cloth.js' },
        babel: { url: 'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js', condition: 'Only when JSX external modules are requested; not asserted as an initial-page dependency.' },
        fonts: ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']
      },
      assetFiles,
      resourceReferences,
      sourceIntegrity
    };
    const out = process.argv[2];
    const json = JSON.stringify(inventory, null, 2) + '\n';
    if (out === '--check') {
      const frozen = path.join(root, 'tests/baseline/content-inventory.json');
      if (fs.readFileSync(frozen, 'utf8') !== json) throw new Error('Frozen content inventory differs from original-source extraction; no files were written');
      console.log('PASS: frozen inventory matches original-source extraction (read-only check)');
    } else if (out) {
      if (out.startsWith('--')) throw new Error(`Unknown option ${out}`);
      const branch = cp.execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
      if (!branch || branch === 'main' || branch === 'master') throw new Error('Inventory recording requires a dedicated branch; refusing to write');
      fs.writeFileSync(path.resolve(root, out), json);
    } else process.stdout.write(json);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
