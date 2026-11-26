// Usage: node tests/responsive-matrix-492.cjs out.csv — homepage / case / 404 paired metrics, FR+EN, 492 points.
// Reference: docs/site-fixes-1-6-review/matrix-after.csv (see docs/references.md). Start `npm run test:serve` first.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8000';
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const pts = [];
for (const h of [500, 800, 1100]) for (let w = 320; w <= 1920; w += 20) pts.push([w, h, false]);
for (const [w, h] of [[1024, 768], [1180, 820], [1366, 1024]]) pts.push([w, h, true]);
const measure = () => {
  const r = (el) => el ? el.getBoundingClientRect() : null;
  const f = (n) => n == null ? '' : Math.round(n * 100) / 100;
  const nav = document.querySelector('.kc-responsive-nav');
  const logo = r(nav?.querySelector(':scope > span'));
  const hire = r(nav?.querySelector('[data-kc-nav-hire]'));
  const pillEl = nav?.querySelector('[data-kc-nav-availability]');
  const pill = !!pillEl && getComputedStyle(pillEl).display !== 'none' && pillEl.getBoundingClientRect().width > 0;
  const cs = getComputedStyle(document.documentElement);
  const c = document.getElementById('contact'); const cr = r(c);
  const hd = c?.querySelector('[data-c="0"]'); const hr = r(hd);
  const lg = r(c?.querySelector('[data-c="4"]'));
  const h1 = document.querySelector('main h1, .kc-case h1, h1');
  return { profile: document.documentElement.dataset.kcProfile || '', logo_left: f(logo?.left), logo_top: f(logo?.top), hire_left: f(hire?.left), hire_right: f(hire?.right), pill,
    gutter_x: parseFloat(cs.getPropertyValue('--kc-page-gutter-x')) || '', gutter_bottom: parseFloat(cs.getPropertyValue('--kc-page-gutter-bottom')) || '',
    footer_heading_px: hd ? parseFloat(getComputedStyle(hd).fontSize) : '', footer_heading_left: f(hr && hr.left - cr.left), footer_heading_top: f(hr && hr.top - cr.top),
    legal_left: f(lg && lg.left - cr.left), legal_bottom: f(lg && cr.bottom - lg.bottom), h1_px: h1 ? parseFloat(getComputedStyle(h1).fontSize) : '' };
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const rows = {};
  for (const lang of ['fr', 'en']) for (const touch of [false, true]) {
    const pages = { home: lang === 'fr' ? '/' : '/en/', case: lang === 'fr' ? '/cases/_foundation/' : '/en/cases/_foundation/', p404: '/404.html' };
    for (const [key, path] of Object.entries(pages)) {
      const ctx = await b.newContext(touch ? { viewport: { width: 1024, height: 768 }, hasTouch: true, userAgent: IPAD_UA } : { viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage(); await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(1200);
      for (const [w, h, t] of pts) { if (t !== touch) continue;
        await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(220);
        const id = `${lang},${w},${h},${t}`; rows[id] = rows[id] || {}; rows[id][key] = await p.evaluate(measure);
      }
      await ctx.close();
    }
  }
  await b.close();
  const cols = ['profile','logo_left','logo_top','hire_left','hire_right','pill','gutter_x','gutter_bottom','footer_heading_px','footer_heading_left','footer_heading_top','legal_left','legal_bottom'];
  const head = ['lang','width','height','touch']; for (const c of cols) head.push(c+'_home', c+'_case', c+'_404'); head.push('case_h1_px','all_match_home_case','pill_match_404');
  const out = [head.join(',')];
  for (const [id, v] of Object.entries(rows)) { const line = [id];
    let ok = true; for (const c of cols) { line.push(v.home[c], v.case[c], v.p404[c]); if (String(v.home[c]) !== String(v.case[c])) ok = false; }
    line.push(v.case.h1_px, ok, String(v.home.pill) === String(v.p404.pill) && v.home.profile === v.p404.profile); out.push(line.join(',')); }
  fs.writeFileSync(process.argv[2], out.join('\n') + '\n');
  const bad = out.slice(1).filter(l => /,false,|,false$/.test(l.split(',').slice(-2).join(',') + ',')).length;
  console.log('rows', out.length - 1, 'rows with home/case or pill/404 mismatch', out.slice(1).filter(l => { const a = l.split(','); return a.at(-2) !== 'true' || a.at(-1) !== 'true'; }).length);
})();
