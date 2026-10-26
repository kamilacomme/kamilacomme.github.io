#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const qa = require('../../tests/qa/helpers.cjs');

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8036';
const outDir = path.resolve(__dirname, '../../docs/phase-5-m10b-footer-resilience-review');
const browserPath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
const cases = [
  { id: 'desktop-short', viewport: { width: 1707, height: 188 }, input: 'desktop', short: true },
  { id: 'mobile-short', viewport: { width: 320, height: 188 }, input: 'mobile', short: true },
  { id: 'desktop-normal', viewport: { width: 1440, height: 900 }, input: 'desktop' },
  { id: 'tablet-normal', viewport: { width: 834, height: 1112 }, input: 'tablet' },
  { id: 'mobile-normal', viewport: { width: 393, height: 852 }, input: 'mobile' },
];

function contextOptions(input, viewport) {
  if (input === 'desktop') return { baseURL, viewport, deviceScaleFactor: 1 };
  return {
    baseURL,
    viewport,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: input === 'tablet'
      ? 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  };
}

async function settleFooter(page) {
  const footer = page.locator('#contact');
  for (let pass = 0; pass < 8; pass += 1) {
    await footer.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const position = await footer.evaluate(el => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    });
    if (position.top >= -1 && position.bottom <= page.viewportSize().height + 1) {
      await page.waitForTimeout(300);
      const stableTop = await footer.evaluate(el => el.getBoundingClientRect().top);
      if (Math.abs(stableTop - position.top) < 1) return;
    }
  }
  const final = await footer.evaluate(el => { const r=el.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,height:r.height}; });
  throw new Error(`Footer did not settle in the viewport: ${JSON.stringify(final)}`);
}

async function settleCurtain(page) {
  for (let i = 0; i < 100; i += 1) {
    const state = await page.locator('curtain-cloth').evaluate(el => ({ progress: el.progress ?? 0, target: el.target ?? 0 }));
    if (Math.abs(state.target - state.progress) < 0.025) return state;
    await page.waitForTimeout(100);
  }
  const state = await page.locator('curtain-cloth').evaluate(el => ({ progress: el.progress ?? 0, target: el.target ?? 0 }));
  if (Math.abs(state.target - state.progress) >= 0.03) {
    const rect = await page.locator('curtain-cloth').evaluate(el => { const r=el.getBoundingClientRect(); const p=el.parentElement.getBoundingClientRect(); const f=document.querySelector('#contact').getBoundingClientRect(); return {top:r.top,bottom:r.bottom,width:r.width,height:r.height,parent:{top:p.top,bottom:p.bottom,height:p.height,css:el.parentElement.getAttribute('style')},footer:{top:f.top,bottom:f.bottom,height:f.height,documentTop:f.top+scrollY,css:document.querySelector('#contact').getAttribute('style')},scrollY,documentHeight:document.scrollingElement.scrollHeight,maxScroll:document.scrollingElement.scrollHeight-innerHeight}; });
    throw new Error(`Footer curtain did not settle: ${JSON.stringify({ ...state, rect, viewport:page.viewportSize() })}`);
  }
  return state;
}

async function settleVisibleFooterCurtain(page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await settleFooter(page);
    const state = await settleCurtain(page);
    const visible = await page.locator('curtain-cloth').evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight;
    });
    if (visible) return state;
  }
  throw new Error('Footer and its curtain did not remain in the viewport after layout settled.');
}

async function elementDocumentTop(page, selector) {
  return page.locator(selector).evaluate(el => el.getBoundingClientRect().top + scrollY);
}

async function scrollGroup(page, selector) {
  for (let i = 0; i < 4; i += 1) {
    const top = await elementDocumentTop(page, selector);
    // Leave a visible cushion above each text group so glyphs are never cut by
    // the capture viewport's top edge when reviewing a short-height scroll step.
    await page.evaluate(y => window.scrollTo(0, Math.max(0, y - 16)), top);
    await page.waitForTimeout(200);
    const visible = await page.locator(selector).evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.top >= -1 && r.bottom <= innerHeight + 1;
    });
    if (visible) return;
  }
  throw new Error(`${selector} did not become fully readable in the ${JSON.stringify(page.viewportSize())} capture.`);
}

async function measurement(page, name) {
  return page.evaluate(name => {
    const footer = document.querySelector('#contact');
    const get = selector => {
      const el = footer.querySelector(selector), r = el.getBoundingClientRect(), fr = footer.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height,
        relativeY: r.top - fr.top, relativeBottom: r.bottom - fr.top,
        fontSize: getComputedStyle(el).fontSize };
    };
    const links = [...footer.querySelectorAll('[data-c="4"] a')].map(a => {
      const r = a.getBoundingClientRect();
      return { text: a.textContent.trim(), x: r.x, y: r.y, width: r.width, height: r.height,
        fontSize: getComputedStyle(a).fontSize, href: a.getAttribute('href') };
    });
    const switcher = document.querySelector('[data-kc-language-switch]');
    const sr = switcher.getBoundingClientRect(), fr = footer.getBoundingClientRect();
    const cloth = document.querySelector('curtain-cloth');
    return {
      capture: name,
      language: document.documentElement.lang,
      viewport: { width: innerWidth, height: innerHeight },
      scrollY,
      footer: { x: fr.x, y: fr.y, width: fr.width, height: fr.height, scrollHeight: footer.scrollHeight,
        mode: footer.dataset.kcFooterMode || 'regular', overflow: getComputedStyle(footer).overflow },
      heading: get('[data-c="0"]'), contact: get('[data-c="1"]'), legal: get('[data-c="4"]'),
      legalLinks: links,
      switcher: { x: sr.x, y: sr.y, rightInset: innerWidth - sr.right, bottomInset: innerHeight - sr.bottom,
        width: sr.width, height: sr.height },
      curtain: { progress: cloth?.progress ?? null, target: cloth?.target ?? null },
      document: { width: document.documentElement.scrollWidth, height: document.scrollingElement.scrollHeight },
    };
  }, name);
}

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  // Remove stale captures from earlier runs, including superseded panels when a
  // long heading later needs separate heading/email scroll views.
  const oldImages = (await fs.readdir(outDir)).filter(name => /^(fr|en)-.+\.png$/.test(name));
  await Promise.all(oldImages.map(name => fs.rm(path.join(outDir, name))));
  const browser = await chromium.launch({ executablePath: browserPath, headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const records = [];
  try {
    for (const language of (process.env.REVIEW_LANGUAGE ? [process.env.REVIEW_LANGUAGE] : ['fr', 'en'])) {
      for (const entry of cases.filter(item => !process.env.REVIEW_CASE || item.id === process.env.REVIEW_CASE)) {
        const context = await browser.newContext(contextOptions(entry.input, entry.viewport));
        const page = await context.newPage();
        await qa.routes(context);
        await qa.ready(page, language);
        await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
        await page.waitForFunction(({ width, height }) => window.__kcTabletLayout?.width === width && window.__kcTabletLayout?.height === height, entry.viewport);
        // The existing controller publishes follow-up measurements at 200, 800
        // and 2000ms after load. Let that fresh-load work finish before beginning
        // the long scroll into Footer; otherwise a synthetic large jump can race
        // the controller's semantic scroll restoration and produce a false capture.
        await page.waitForTimeout(2200);
        if (!entry.short) await settleFooter(page);

        const regions = entry.short
          ? entry.input === 'mobile'
            ? [ ['heading', '#contact [data-c="0"] > span'], ['email', '#contact [data-c="0"] > a'],
              ['contacts', '#contact [data-c="1"]'], ['legal-links', '#contact [data-c="4"]'] ]
            : [ ['heading-email', '#contact [data-c="0"]'], ['contacts', '#contact [data-c="1"]'], ['legal-links', '#contact [data-c="4"]'] ]
          : [ ['composition', null] ];
        for (const [region, selector] of regions) {
          if (selector) {
            await scrollGroup(page, selector);
            await settleCurtain(page);
            // The existing section scroll choreography may finish publishing its
            // geometry while the curtain settles; take the final capture at the
            // group's current document coordinate.
            await scrollGroup(page, selector);
            await settleCurtain(page);
            const visible = await page.locator(selector).evaluate(el => {
              const r = el.getBoundingClientRect();
              return r.top >= -1 && r.bottom <= innerHeight + 1;
            });
            if (!visible) throw new Error(`${selector} shifted out of view while the Footer curtain settled.`);
          } else {
            await settleVisibleFooterCurtain(page);
          }
          const filename = `${language}-${entry.id}-${region}.png`;
          const imagePath = path.join(outDir, filename);
          await page.screenshot({ path: imagePath, scale: 'css', animations: 'disabled' });
          const record = await measurement(page, filename);
          record.profile = entry.input;
          record.region = region;
          record.image = filename;
          records.push(record);
          process.stdout.write(`${filename} ${entry.viewport.width}×${entry.viewport.height} ${record.footer.mode}\n`);
        }
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  await fs.writeFile(path.join(outDir, 'measurements.json'), JSON.stringify(records, null, 2));
  const cards = records.map(record => `
    <article class="capture">
      <h3>${record.language.toUpperCase()} · ${record.capture}</h3>
      <p>${record.viewport.width}×${record.viewport.height} CSS px · ${record.profile} · ${record.footer.mode} · ${record.region} · scrollY ${Math.round(record.scrollY)}px</p>
      <img src="${record.image}" alt="${record.language.toUpperCase()} Footer at ${record.viewport.width} by ${record.viewport.height}, ${record.region} view">
      <details><summary>Measured geometry</summary><pre>${JSON.stringify(record, null, 2)}</pre></details>
    </article>`).join('\n');
  const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M10B Footer resilience review</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f2f4f8;color:#222;font:16px/1.5 Inter,Arial,sans-serif}main{max-width:1600px;margin:auto;padding:32px}h1{margin:0 0 8px;font:700 32px/1.1 Figtree,Arial,sans-serif}p{color:#555}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,360px),1fr));gap:24px;margin-top:24px}.capture{min-width:0;padding:16px;background:#fff;border:1px solid #d9dce3;border-radius:6px}.capture h3{margin:0;font-size:18px}.capture p{font-size:13px}.capture img{display:block;max-width:100%;height:auto;background:#000;border:1px solid #bbb}.capture details{margin-top:12px}pre{max-height:320px;overflow:auto;padding:12px;background:#f5f5f5;font-size:11px;white-space:pre-wrap}code{padding:2px 4px;background:#eee;border-radius:3px}
</style><main><h1>M10B Footer resilience · local visual review</h1><p>Actual Chromium captures from the current bilingual site. Short-height panels are separate scroll positions so you can inspect the full heading/email, contact block and legal links. Normal controls show the unchanged composed Footer. Geometry is listed under each capture; no frozen visual references were updated.</p><p>Short-height modes use natural document flow inside the existing Footer owner. Use the browser’s image zoom or open any image in a new tab to inspect its full CSS-pixel resolution.</p><section>${cards}</section></main></html>`;
  await fs.writeFile(path.join(outDir, 'gallery.html'), html);
})().catch(error => { console.error(error); process.exitCode = 1; });

