const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

const profiles = {
  desktop: {
    normal: [{ width: 1440, height: 900 }],
    short: [{ width: 1707, height: 188 }],
    heading: 56, legal: 12, x: null, bottom: null,
  },
  'tablet-portrait': {
    normal: [{ width: 834, height: 1112 }, { width: 1194, height: 834 }, { width: 716, height: 555 }],
    short: [],
    heading: 48, legal: 12, x: 32, bottom: 32,
  },
  'tablet-landscape': {
    normal: [{ width: 1194, height: 834 }, { width: 716, height: 555 }],
    short: [],
    heading: 48, legal: 12, x: 32, bottom: 32,
  },
  mobile: {
    normal: [{ width: 393, height: 852 }],
    short: [{ width: 320, height: 188 }],
    heading: 32, legal: 11, x: 16, bottom: 24,
  },
};

async function waitForLayout(page, viewport) {
  await page.setViewportSize(viewport);
  await page.waitForFunction(({ width, height }) => {
    const layout = window.__kcTabletLayout;
    return layout && layout.width === width && layout.height === height;
  }, viewport);
  await page.waitForTimeout(80);
}

async function goToFooter(page) {
  const footer = await qa.documentBox(page, '#contact');
  await page.evaluate((top) => {
    const root = document.scrollingElement;
    root.scrollTop = Math.min(top, root.scrollHeight - innerHeight);
    window.dispatchEvent(new Event('scroll'));
  }, footer.top);
  await page.waitForTimeout(40);
}

async function footerState(page) {
  return page.evaluate(() => {
    const footer = document.querySelector('#contact');
    const head = footer.querySelector('[data-c="0"]');
    const info = footer.querySelector('[data-c="1"]');
    const legal = footer.querySelector('[data-c="4"]');
    const rect = (el) => {
      const r = el.getBoundingClientRect(), fr = footer.getBoundingClientRect();
      return { left:r.left, right:r.right, top:r.top - fr.top, bottom:r.bottom - fr.top,
        viewportTop:r.top, viewportBottom:r.bottom, width:r.width, height:r.height };
    };
    const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const root = getComputedStyle(document.documentElement);
    const email = head.querySelector('a');
    const legalLinks = [...legal.querySelectorAll('a')];
    const textRects = (el) => {
      const range = document.createRange(); range.selectNodeContents(el);
      return [...range.getClientRects()].filter(r => r.width && r.height).map(r => ({
        left:r.left, right:r.right, top:r.top, bottom:r.bottom,
      }));
    };
    return {
      viewport:{ width:innerWidth, height:innerHeight, scrollWidth:document.documentElement.scrollWidth },
      footer:{ ...rect(footer), height:footer.getBoundingClientRect().height,
        scrollHeight:footer.scrollHeight, overflow:getComputedStyle(footer).overflow,
        mode:footer.dataset.kcFooterMode || 'regular' },
      head:{ ...rect(head), font:getComputedStyle(head).fontSize,
        email:{ ...rect(email), font:getComputedStyle(email).fontSize }, text:textRects(head) },
      info:{ ...rect(info), font:getComputedStyle(info.querySelector('span')).fontSize },
      legal:{ ...rect(legal), direction:getComputedStyle(legal).flexDirection,
        links:legalLinks.map(a => ({ ...rect(a), font:getComputedStyle(a).fontSize, href:a.getAttribute('href') })) },
      gutters:{ x:parseFloat(root.getPropertyValue('--kc-page-gutter-x')),
        bottom:parseFloat(root.getPropertyValue('--kc-page-gutter-bottom')) },
      collisions:{ headInfo:overlap(rect(head),rect(info)), headLegal:overlap(rect(head),rect(legal)), infoLegal:overlap(rect(info),rect(legal)) },
      switcher:{ ...rect(document.querySelector('[data-kc-language-switch]')),
        href:document.querySelector('[data-kc-language-switch]').getAttribute('href') },
      curtain:{ progress:document.querySelector('curtain-cloth')?.progress,
        target:document.querySelector('curtain-cloth')?.target },
    };
  });
}

for (const [mode, policy] of Object.entries(profiles)) {
  for (const language of ['fr', 'en']) {
    test(`${language} ${mode} Footer grows only when its authored composition cannot fit`, async ({ page, context }, info) => {
      const project = info.project.metadata;
      test.skip(project.mode !== mode || project.language !== language, 'Run once under the matching real input/profile emulation.');
      await qa.routes(context);
      await qa.seed(page);
      await qa.ready(page, language);
      await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

      for (const viewport of policy.normal) {
        await waitForLayout(page, viewport);
        await goToFooter(page);
        const state = await footerState(page);
        expect(state.footer.mode, `normal control ${viewport.width}×${viewport.height}`).toBe('regular');
        expect(state.footer.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(state.viewport.scrollWidth).toBeLessThanOrEqual(viewport.width + 1);
        expect(state.head.font).toBe(`${policy.heading}px`);
        expect(state.head.email.font).toBe(`${policy.heading}px`);
        expect(state.info.font).toBe('14px');
        expect(state.legal.links.map(link => link.font)).toEqual([`${policy.legal}px`,`${policy.legal}px`]);
        expect(state.legal.links).toHaveLength(2);
        expect(state.collisions).toEqual({ headInfo:false, headLegal:false, infoLegal:false });
      }

      for (const shortViewport of policy.short) {
        await waitForLayout(page, shortViewport);
        await goToFooter(page);
        const shortState = await footerState(page);
        expect(shortState.footer.mode).toBe('natural-flow');
        expect(shortState.footer.height).toBeGreaterThan(shortViewport.height);
        expect(shortState.footer.overflow).toBe('visible');
        expect(shortState.viewport.scrollWidth).toBeLessThanOrEqual(shortViewport.width + 1);
        expect(shortState.head.font).toBe(`${policy.heading}px`);
        expect(shortState.head.email.font).toBe(`${policy.heading}px`);
        expect(shortState.info.font).toBe('14px');
        expect(shortState.legal.links.map(link => link.font)).toEqual([`${policy.legal}px`,`${policy.legal}px`]);
        expect(shortState.legal.links).toHaveLength(2);
        expect(shortState.collisions).toEqual({ headInfo:false, headLegal:false, infoLegal:false });
        expect(shortState.head.top).toBeGreaterThanOrEqual(0);
        expect(shortState.legal.bottom).toBeLessThanOrEqual(shortState.footer.height + 1);
        expect(shortState.footer.height - shortState.legal.bottom).toBeCloseTo(shortState.gutters.bottom, 0);
        if (policy.x !== null) expect(shortState.gutters.x).toBe(policy.x);
        if (policy.bottom !== null) expect(shortState.gutters.bottom).toBe(policy.bottom);

        // Visit each content group at its own readable scroll position so no part relies
        // on a taller viewport or on text being clipped inside the section.
        for (const selector of ["[data-c='0']", "[data-c='1']", "[data-c='4']"]) {
          let visible = false;
          // Let the existing scroll choreography publish its final section
          // geometry, then use a fresh document coordinate for the readable view.
          for (let attempt = 0; attempt < 5 && !visible; attempt += 1) {
            const box = await qa.documentBox(page, `#contact ${selector}`);
            await page.evaluate((top) => window.scrollTo(0, top), box.top);
            await page.clock.runFor(100);
            visible = await page.locator(`#contact ${selector}`).evaluate(el => {
              const r=el.getBoundingClientRect();
              return r.top >= -1 && r.bottom <= innerHeight + 1;
            });
          }
          expect(visible, `${selector} is reachable in a viewport scroll`).toBe(true);
        }

        const firstLegal = page.locator('#contact [data-legal="legal"]');
        const secondLegal = page.locator('#contact [data-legal="privacy"]');
        await firstLegal.focus();
        await page.keyboard.press('Tab');
        await expect(secondLegal).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await expect(firstLegal).toBeFocused();

        // The ordinary language link remains a direct route switch while the visitor
        // is in the expanded Footer, retaining its existing #contact section anchor.
        const switcher = page.locator('[data-kc-language-switch]');
        await expect(switcher).toBeVisible();
        await switcher.focus();
        await page.keyboard.press('Enter');
        await page.waitForURL(language === 'fr' ? /\/en\/#contact/ : /\/#contact/);
        await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(language === 'fr' ? 'en' : 'fr');

        // Resize back to a fitting layout; the normal Footer composition must return.
        const returnViewport = policy.normal[0];
        await waitForLayout(page, returnViewport);
        await goToFooter(page);
        const returned = await footerState(page);
        expect(returned.footer.mode).toBe('regular');
        expect(returned.footer.height).toBeLessThanOrEqual(returnViewport.height + 1);
        expect(returned.head.font).toBe(`${policy.heading}px`);
      }
    });
  }
}
