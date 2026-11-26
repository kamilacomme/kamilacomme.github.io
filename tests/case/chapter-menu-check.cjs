// Chapter menu QA on /cases/jane/ and /en/cases/jane/ (docs/case-format.md).
// Usage: start `npm run test:serve`, then `node tests/case/chapter-menu-check.cjs [report.json]`.
// Uses CHROME_PATH (default: macOS Google Chrome) and BASE_URL (default http://127.0.0.1:8000).
//
// The Jane blocks are not rendered yet, so chapters are nearly empty. To exercise
// scrolling through all chapters, the check gives each chapter section a test-only
// min-height (one viewport). Nothing else is changed on the page.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8000';
const IPAD_UA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const FILL = '.kc-case-chapter{min-height:100vh}';
const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
const widths = []; for (let w = 320; w <= 1920; w += 40) widths.push(w);

const probe = () => {
  const menu = document.querySelector('[data-kc-case-menu]');
  const nav = document.querySelector('.kc-responsive-nav');
  const list = menu.querySelector('[data-kc-case-menu-list]');
  const toggle = menu.querySelector('[data-kc-case-menu-toggle]');
  const links = [...menu.querySelectorAll('[data-kc-case-menu-link]')];
  const mr = menu.getBoundingClientRect();
  const cs = getComputedStyle(menu);
  const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kc-page-gutter-x'));
  const visible = links.filter(l => l.getClientRects().length);
  const tops = new Set(visible.map(l => Math.round(l.getBoundingClientRect().top)));
  return {
    profile: document.documentElement.dataset.kcProfile,
    compact: menu.hasAttribute('data-kc-compact'),
    navBottom: nav.getBoundingClientRect().bottom, menuTop: mr.top, menuHeight: mr.height,
    padLeft: parseFloat(cs.paddingLeft), padRight: parseFloat(cs.paddingRight), gutter,
    docOverflow: document.documentElement.scrollWidth - window.innerWidth,
    listOverflow: list.scrollWidth - list.clientWidth,
    toggleVisible: !toggle.hidden && toggle.getBoundingClientRect().height > 0,
    toggleHeight: toggle.getBoundingClientRect().height,
    rows: tops.size, visibleLinks: visible.length,
    minLinkHeight: Math.min(...visible.map(l => l.getBoundingClientRect().height)),
    fontSize: parseFloat(cs.fontSize),
    inactiveOpacity: visible.filter(l => !l.hasAttribute('aria-current')).map(l => getComputedStyle(l).opacity)[0] ?? null,
    current: menu.querySelector('[aria-current]')?.dataset.kcCaseMenuLink ?? null,
    currentText: menu.querySelector('[data-kc-case-menu-current]').textContent,
    borders: ['borderTopWidth', 'borderBottomWidth'].map(k => parseFloat(cs[k])),
    ids: links.map(l => l.dataset.kcCaseMenuLink),
  };
};

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const failures = []; const rows = [];
  const fail = (where, msg) => failures.push(`${where}: ${msg}`);
  for (const lang of ['fr', 'en']) {
    const url = `${BASE}${lang === 'fr' ? '' : '/en'}/cases/jane/`;
    const contexts = [
      ...widths.map(w => ({ name: `${w}x900`, opts: { viewport: { width: w, height: 900 } } })),
      { name: 'iphone-393x852-touch', opts: { viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, userAgent: IPHONE_UA, deviceScaleFactor: 3 }, touch: true },
      { name: 'ipad-820x1180-touch', opts: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true, userAgent: IPAD_UA, deviceScaleFactor: 2 }, touch: true },
      { name: 'ipad-1180x820-touch', opts: { viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, userAgent: IPAD_UA, deviceScaleFactor: 2 }, touch: true },
    ];
    for (const c of contexts) {
      const where = `${lang} ${c.name}`;
      const ctx = await b.newContext(c.opts); const p = await ctx.newPage();
      await p.goto(url, { waitUntil: 'load' }); await p.addStyleTag({ content: FILL });
      await p.evaluate(() => document.fonts.ready); await p.evaluate(() => window.dispatchEvent(new Event('resize'))); await settle(p);
      const top = await p.evaluate(probe);
      // At the top only the chapter that starts right under the menu may be current.
      if (top.current !== null && top.current !== top.ids[0]) fail(where, `${top.current} is current at the top of the page`);
      // Scroll so the first listed chapter reaches the menu.
      await p.evaluate(() => document.getElementById('chapter-identity').scrollIntoView()); await settle(p);
      const m = await p.evaluate(probe);
      rows.push({ lang, context: c.name, ...m, ids: undefined });
      if (Math.abs(m.menuTop - m.navBottom) > 1) fail(where, `menu top ${m.menuTop} is not under the Navbar (${m.navBottom})`);
      if (m.docOverflow > 0) fail(where, `page overflows horizontally by ${m.docOverflow}px`);
      if (Math.abs(m.padLeft - m.gutter) > 0.5 || Math.abs(m.padRight - m.gutter) > 0.5) fail(where, `menu padding ${m.padLeft}/${m.padRight} ≠ page gutter ${m.gutter}`);
      if (m.compact) {
        if (!m.toggleVisible || m.visibleLinks !== 0) fail(where, 'compact menu must show only its one-row toggle');
        if (m.toggleHeight < 44) fail(where, `toggle is ${m.toggleHeight}px high (<44)`);
      } else {
        if (m.rows !== 1 || m.listOverflow > 1) fail(where, `full menu must fit one row (rows ${m.rows}, overflow ${m.listOverflow})`);
        if (m.minLinkHeight < 44) fail(where, `link target ${m.minLinkHeight}px high (<44)`);
        if (m.inactiveOpacity !== '0.64') fail(where, `inactive opacity ${m.inactiveOpacity}`);
      }
      if (m.profile === 'mobile' && !m.compact) fail(where, 'mobile menu is not compact');
      if (m.borders.some(v => v > 0)) fail(where, 'menu has a border line');
      if (m.current !== 'identity') fail(where, `current chapter is ${m.current}, expected identity`);
      // Navigate to every chapter through the menu and check the current chapter.
      for (const id of m.ids) {
        if (m.compact) {
          if (c.touch) await p.tap('[data-kc-case-menu-toggle]'); else await p.click('[data-kc-case-menu-toggle]');
          const open = await p.getAttribute('[data-kc-case-menu-toggle]', 'aria-expanded');
          if (open !== 'true') { fail(where, 'toggle did not open the list'); break; }
        }
        const sel = `[data-kc-case-menu-link="${id}"]`;
        if (c.touch) await p.tap(sel); else await p.click(sel);
        await settle(p);
        const s = await p.evaluate(probe);
        const sectionTop = await p.evaluate(x => document.getElementById(`chapter-${x}`).getBoundingClientRect().top, id);
        if (s.current !== id) fail(where, `after choosing ${id} the current chapter is ${s.current}`);
        if (Math.abs(sectionTop - (s.menuTop + s.menuHeight)) > 2) fail(where, `${id} lands at ${sectionTop}, not under the menu (${s.menuTop + s.menuHeight})`);
        if (m.compact && (await p.getAttribute('[data-kc-case-menu-toggle]', 'aria-expanded')) !== 'false') fail(where, `list stayed open after choosing ${id}`);
        if (m.compact && s.currentText !== (await p.textContent(sel))) fail(where, `toggle shows "${s.currentText}"`);
      }
      // Hover (pointer devices, full menu): opacity rises to 1.
      if (!c.touch && !m.compact) {
        await p.evaluate(() => document.getElementById('chapter-identity').scrollIntoView()); await settle(p);
        const sel = '[data-kc-case-menu-link="campaign"]';
        await p.hover(sel); await p.waitForFunction(s => getComputedStyle(document.querySelector(s)).opacity === '1', sel, { timeout: 2000 }).catch(() => fail(where, 'hover does not raise opacity to 1'));
      }
      // Compact: Escape closes and returns focus; a tap outside closes.
      if (m.compact) {
        await p.click('[data-kc-case-menu-toggle]'); await p.keyboard.press('Escape');
        if ((await p.getAttribute('[data-kc-case-menu-toggle]', 'aria-expanded')) !== 'false') fail(where, 'Escape does not close the list');
        if (!(await p.evaluate(() => document.activeElement?.hasAttribute('data-kc-case-menu-toggle')))) fail(where, 'focus does not return to the toggle');
        await p.click('[data-kc-case-menu-toggle]');
        await p.mouse.click(5, (await p.viewportSize()).height - 5);
        if ((await p.getAttribute('[data-kc-case-menu-toggle]', 'aria-expanded')) !== 'false') fail(where, 'a click outside does not close the list');
      }
      await ctx.close();
    }
  }
  await b.close();
  const summary = { points: rows.length, compact: rows.filter(r => r.compact).map(r => `${r.lang} ${r.context}`), full: rows.filter(r => !r.compact).length, failures };
  if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify({ summary, rows }, null, 2) + '\n');
  console.log(`chapter menu: ${rows.length} viewports (FR+EN), ${summary.full} full, ${summary.compact.length} compact, ${failures.length} failure(s)`);
  console.log('compact at:', summary.compact.join(', '));
  failures.forEach(f => console.log('FAIL', f));
  process.exit(failures.length ? 1 : 0);
})();
