const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');
const desktopGutter = (width, height) => {
  const fw = width / 1440, fh = height / 844;
  return 32 * Math.min(fw, Math.min(1.08, Math.max(0.72, Math.min(fw, fh))));
};

test('shared page-edge gutters align Navbar, Hero, Footer and the language switch', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  await qa.routes(context);
  await qa.ready(page, language);

  const sizes = mode === 'desktop'
    ? [[1440, 900], [1905, 963]]
    : mode === 'mobile'
      ? [[393, 852], [320, 568]]
      : [[834, 1112], [1194, 834], [716, 555]];

  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await expect.poll(() => page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return [root.getPropertyValue('--kc-page-gutter-x').trim(), root.getPropertyValue('--kc-page-gutter-bottom').trim()];
    })).toEqual(mode === 'desktop'
      ? (() => {
          const fw = width / 1440, fh = height / 844;
          const s = Math.min(fw, Math.min(1.08, Math.max(0.72, Math.min(fw, fh))));
          return [`${(32 * s).toFixed(3)}px`, `${(32 * s).toFixed(3)}px`];
        })()
      : mode === 'mobile' ? ['16.000px', '24.000px'] : ['32.000px', '32.000px']);
    await expect.poll(() => page.locator('#contact [data-c="0"]').evaluate(el => el.getBoundingClientRect().right))
      .toBeLessThanOrEqual(width - (mode === 'mobile' ? 16 : mode === 'desktop' ? desktopGutter(width, height) : 32) + 1);

    const state = await page.evaluate(mode => {
      const rect = el => {
        const r = el.getBoundingClientRect();
        return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height };
      };
      const css = el => getComputedStyle(el);
      const scale = el => {
        let value = 1;
        for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
          const transform = css(node).transform;
          if (transform !== 'none') {
            const matrix = new DOMMatrixReadOnly(transform);
            value *= Math.hypot(matrix.a, matrix.b);
          }
        }
        return value;
      };
      const mobile = mode === 'mobile';
      const tablet = mode === 'tablet-portrait' || mode === 'tablet-landscape';
      const preview = document.querySelector(mobile ? '.kc-mobile-hero-slideshow' : tablet ? '[data-kc-tablet-hero-slideshow]' : '[data-hplate]');
      const nav = document.querySelector('.kc-responsive-nav');
      const switcher = document.querySelector('[data-kc-language-switch]');
      const footer = document.querySelector('#contact');
      const heading = footer.querySelector('[data-c="0"]');
      const email = heading.querySelector('a');
      const info = footer.querySelector('[data-c="1"]');
      const legal = footer.querySelector('[data-c="4"]');
      const legalLinks = [...legal.querySelectorAll('a')];
      const lines = el => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return [...range.getClientRects()].map(r => ({ left:r.left, right:r.right, top:r.top, bottom:r.bottom }));
      };
      return {
        viewport:{ width:innerWidth, height:innerHeight, clientWidth:document.documentElement.clientWidth, scrollWidth:document.documentElement.scrollWidth },
        gutters:{ x:parseFloat(css(document.documentElement).getPropertyValue('--kc-page-gutter-x')), bottom:parseFloat(css(document.documentElement).getPropertyValue('--kc-page-gutter-bottom')), nav:parseFloat(css(nav).getPropertyValue('--kc-nav-gutter')) },
        nav:{ box:rect(nav), logo:rect(nav.querySelector(':scope > span:first-child')), hire:rect(nav.querySelector("a[href^='mailto']")) },
        preview:{ box:rect(preview), right:css(preview).right, bottom:css(preview).bottom, scale:scale(preview) },
        switcher:{ box:rect(switcher), font:css(switcher).fontSize, scale:scale(switcher) },
        footer:{ box:rect(footer), heading:{ box:rect(heading), font:css(heading).fontSize, scale:scale(heading), lines:lines(heading) }, email:{ box:rect(email), font:css(email).fontSize, scale:scale(email), lines:lines(email) }, info:{ box:rect(info), children:[...info.querySelectorAll('span')].map(el=>({ box:rect(el), font:css(el).fontSize, scale:scale(el) })) }, legal:{ box:rect(legal), links:legalLinks.map(el=>({ text:el.textContent.trim(), box:rect(el), font:css(el).fontSize, scale:scale(el) })) }, mediaCount:footer.querySelectorAll('[data-c="3"],video[data-src*="footer-walk"]').length, curtainTarget:document.querySelector('curtain-cloth')?.target },
      navProjects:nav.querySelector("a[href$='#projets']") ? rect(nav.querySelector("a[href$='#projets']")) : null,
    };
    }, mode);

    const x = mode === 'mobile' ? 16 : mode === 'desktop' ? parseFloat(state.gutters.x.toFixed(3)) : 32;
    const y = mode === 'mobile' ? 24 : mode === 'desktop' ? parseFloat(state.gutters.bottom.toFixed(3)) : 32;
    expect(state.viewport).toEqual({ width, height, clientWidth:width, scrollWidth:expect.any(Number) });
    expect(state.viewport.scrollWidth).toBeLessThanOrEqual(width + 1);
    expect(state.gutters.nav).toBeCloseTo(x, 2);
    expect(state.switcher.box.right).toBeCloseTo(width - x, 1);
    expect(state.switcher.box.bottom).toBeCloseTo(height - y, 1);
    expect(state.switcher.box.width).toBe(44);
    expect(state.switcher.box.height).toBe(44);
    expect(state.switcher.font).toBe('12px');
    expect(state.switcher.scale).toBeCloseTo(1, 4);
    // Hero art is positioned inside its long scene (and can be offscreen when
    // the page is initially loaded); verify its effective inset from its own
    // containing layout instead of comparing its document-space box to viewport.
    expect(parseFloat(state.preview.right) * state.preview.scale).toBeCloseTo(x, 0);
    expect(parseFloat(state.preview.bottom) * state.preview.scale).toBeCloseTo(y, 0);

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, document.documentElement.scrollHeight);
      window.dispatchEvent(new Event('scroll'));
    });
    await expect.poll(() => page.evaluate(() => document.querySelector('#contact').getBoundingClientRect().bottom)).toBeGreaterThan(0);
    await page.waitForTimeout(120);

    const footer = await page.evaluate(() => {
      const rect = el => { const r=el.getBoundingClientRect(); return { left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height }; };
      const f=document.querySelector('#contact'), sw=document.querySelector('[data-kc-language-switch]');
      const legal=f.querySelector('[data-c="4"]'), head=f.querySelector('[data-c="0"]'), info=f.querySelector('[data-c="1"]');
      const intersects=(a,b)=>a.width>0&&a.height>0&&b.width>0&&b.height>0&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
      const lines=el=>{const range=document.createRange();range.selectNodeContents(el);return [...range.getClientRects()].filter(r=>r.width>0&&r.height>0).map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom}));};
      return {
        viewport:[innerWidth,innerHeight], footer:rect(f), switcher:rect(sw), heading:rect(head), email:rect(head.querySelector('a')), info:rect(info), legal:rect(legal),
        headingLines:lines(head),emailLines:lines(head.querySelector('a')),
        legalLinks:[...legal.querySelectorAll('a')].map(rect), contactLinks:[...f.querySelectorAll('[data-c="0"] a')].map(rect),
        switcherHitsFooterText:[...f.querySelectorAll('[data-c="0"] a, [data-c="1"] span, [data-c="4"] a')].filter(el=>intersects(rect(el),rect(sw))).map(el=>el.textContent.trim()),
        legalBottomInset:f.getBoundingClientRect().bottom-legal.getBoundingClientRect().bottom,
        rootGutters:[parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kc-page-gutter-x')),parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kc-page-gutter-bottom'))],
        fonts:{ heading:getComputedStyle(head).fontSize,email:getComputedStyle(head.querySelector('a')).fontSize,contacts:[...info.querySelectorAll('span')].map(el=>getComputedStyle(el).fontSize),legal:[...legal.querySelectorAll('a')].map(el=>getComputedStyle(el).fontSize) },
        curtainTarget:document.querySelector('curtain-cloth')?.target,
      };
    });
    expect(footer.legalBottomInset).toBeCloseTo(y, 1);
    expect(footer.heading.left).toBeCloseTo(x, 1);
    expect(footer.heading.right).toBeLessThanOrEqual(width - x + 1);
    expect(footer.email.right).toBeLessThanOrEqual(width - x + 1);
    expect(footer.headingLines.length).toBeGreaterThan(0);
    expect(footer.emailLines.length).toBeGreaterThan(0);
    for (const line of [...footer.headingLines, ...footer.emailLines]) {
      expect(line.left).toBeGreaterThanOrEqual(x - 1);
      expect(line.right).toBeLessThanOrEqual(width - x + 1);
    }
    expect(footer.switcherHitsFooterText).toEqual([]);
    expect(footer.legalLinks).toHaveLength(2);
    expect(footer.contactLinks).toHaveLength(1);
    expect(state.footer.mediaCount).toBe(0);
    expect(footer.fonts.heading).toBe(mode === 'desktop' ? '56px' : mode === 'mobile' ? '32px' : '48px');
    expect(footer.fonts.email).toBe(footer.fonts.heading);
    expect(footer.fonts.contacts).toEqual(['14px', '14px']);
    expect(footer.fonts.legal).toEqual(mode === 'mobile' ? ['11px','11px'] : ['12px','12px']);
    if (mode === 'desktop') {
      expect(state.navProjects).not.toBeNull();
      expect(footer.legal.left).toBeCloseTo(state.navProjects.left, 1);
    }
  }
});
