const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('mobile Footer keeps readable text, usable links and curtain scroll behavior', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'mobile', 'Mobile Footer runs in the mobile browser profile only.');
  await qa.routes(context);

  async function scrollToSettledFooter() {
    // A resize publishes viewport dimensions before all section owners finish
    // updating preceding section heights. Entering the final scroll interval may
    // also publish one more geometry update. Re-measure after each settled scroll
    // instead of reusing the pre-resize document coordinate.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await page.clock.runFor(300);
      await page.waitForFunction(async () => {
        await new Promise(requestAnimationFrame);
        const footer = document.querySelector('#contact');
        const r = footer.getBoundingClientRect();
        const layout = window.__kcTabletLayout;
        const signature = `${layout?.width}x${layout?.height}:${r.top + scrollY}:${r.height}:${document.scrollingElement.scrollHeight}`;
        const previous = window.__qaFooterGeometry || { signature: '', count: 0 };
        const count = previous.signature === signature ? previous.count + 1 : 0;
        window.__qaFooterGeometry = { signature, count };
        const bottom = r.top + scrollY + r.height;
        return count >= 2 && document.scrollingElement.scrollHeight >= bottom - 1;
      });
      const footer = await qa.documentBox(page, '#contact');
      const currentTop = await page.locator('#contact').evaluate(el => el.getBoundingClientRect().top);
      if (Math.abs(currentTop) <= 1) {
        await qa.waitForCurtain(page);
        return;
      }
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), footer.top);
    }
    await expect.poll(() => page.locator('#contact').evaluate(el => el.getBoundingClientRect().top)).toBeCloseTo(0, 0);
    await qa.waitForCurtain(page);
  }

  async function openAt(width, height) {
    await page.setViewportSize({ width, height });
    await qa.ready(page, language);
    // The shared controller intentionally performs its final startup geometry pass
    // at 2000ms. Wait for that pass before measuring document-space Footer bounds.
    await page.waitForFunction(() => performance.now() >= 2200);
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.scrollingElement.scrollTop = 0; });
    const curtainTargetAtTop = await page.evaluate(() => document.querySelector('curtain-cloth')?.target ?? 0);
    await scrollToSettledFooter();
    return curtainTargetAtTop;
  }

  async function inspect(width, height, curtainTargetAtTop = 0) {
    const state = await page.evaluate(() => {
      const footer = document.querySelector('#contact');
      const head = footer.querySelector('[data-c="0"]');
      const info = footer.querySelector('[data-c="1"]');
      const legal = footer.querySelector('[data-c="4"]');
      const legalRow = legal.querySelector(':scope > div');
      const email = head.querySelector('a');
      const rect = element => {
        const r = element.getBoundingClientRect();
        return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height };
      };
      const scale = element => {
        let result = 1;
        for (let node = element; node && node.nodeType === 1; node = node.parentElement) {
          const value = getComputedStyle(node).transform;
          if (value !== 'none') {
            const matrix = new DOMMatrixReadOnly(value);
            result *= Math.hypot(matrix.a, matrix.b);
          }
        }
        return result;
      };
      const lines = element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        return [...range.getClientRects()].map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom}));
      };
      const links = [...legal.querySelectorAll('a')];
      return {
        viewport:[innerWidth,innerHeight], pageWidth:document.documentElement.scrollWidth,
        footer:rect(footer), head:{...rect(head),font:parseFloat(getComputedStyle(head).fontSize),scale:scale(head),scrollWidth:head.scrollWidth,clientWidth:head.clientWidth,lines:lines(head)},
        email:{...rect(email),font:parseFloat(getComputedStyle(email).fontSize),scale:scale(email),lines:lines(email),href:email.getAttribute('href')},
        contacts:[...info.querySelectorAll('span')].map(el=>({ ...rect(el),font:parseFloat(getComputedStyle(el).fontSize),scale:scale(el) })),
        info:rect(info),footerMediaCount:footer.querySelectorAll('[data-c="3"],video[data-src*="footer-walk"]').length,legal:{...rect(legal),direction:getComputedStyle(legal).flexDirection,rowDirection:getComputedStyle(legalRow).flexDirection,rowGap:getComputedStyle(legalRow).rowGap,links:links.map(el=>({ ...rect(el),font:parseFloat(getComputedStyle(el).fontSize),scale:scale(el),href:el.getAttribute('href') }))},
        navBottom:document.querySelector('.kc-responsive-nav').getBoundingClientRect().bottom,
        curtainProgress:document.querySelector('curtain-cloth')?.progress,
        curtainTarget:document.querySelector('curtain-cloth')?.target,
        footerWalkResource:document.querySelector('meta[data-resource-id="footerWalkVid"]') !== null,
      };
    });

    expect(state.viewport).toEqual([width,height]);
    expect(state.pageWidth).toBeLessThanOrEqual(width+1);
    expect(state.footer.left).toBeCloseTo(0,1);
    expect(state.footer.width).toBeCloseTo(width,1);
    expect(state.head.left).toBeCloseTo(16,1);
    expect(state.head.right).toBeCloseTo(width-16,1);
    expect(state.head.font).toBe(32);
    expect(state.head.scale).toBeCloseTo(1,4);
    expect(state.head.scrollWidth).toBeLessThanOrEqual(state.head.clientWidth+1);
    expect(state.head.top).toBeGreaterThanOrEqual(state.navBottom+23);
    expect(state.head.top).toBeLessThan(state.navBottom+70);
    expect(state.email.font).toBe(32);
    expect(state.email.scale).toBeCloseTo(1,4);
    expect(state.email.href).toContain('mailto:comme.kamila@gmail.com');
    expect(state.contacts).toHaveLength(2);
    for (const contact of state.contacts) {
      expect(contact.font).toBe(14);
      expect(contact.scale).toBeCloseTo(1,4);
      expect(contact.left).toBeCloseTo(16,1);
      expect(contact.right).toBeLessThanOrEqual(width-15);
    }
    expect(state.info.top).toBeGreaterThanOrEqual(state.head.bottom);
    expect(state.legal.left).toBeCloseTo(16,1);
    expect(state.legal.right).toBeCloseTo(width-16,1);
    expect(state.legal.links).toHaveLength(2);
    expect(state.legal.direction).toBe('column');
    expect(state.legal.rowDirection).toBe('column');
    expect(parseFloat(state.legal.rowGap)).toBe(8);
    expect(state.legal.links[0].left).toBeCloseTo(state.legal.links[1].left,1);
    expect(state.legal.links[1].top - state.legal.links[0].bottom).toBeCloseTo(8,1);
    expect(state.legal.top - state.info.bottom).toBeCloseTo(32,1);
    for (const link of state.legal.links) {
      expect(link.font).toBe(11);
      expect(link.scale).toBeCloseTo(1,4);
      expect(link.href).toMatch(/^(#|\/en\/#)/);
      expect(link.left).toBeGreaterThanOrEqual(15);
      expect(link.right).toBeLessThanOrEqual(width-15);
    }
    expect(state.info.bottom).toBeLessThanOrEqual(state.legal.top);
    expect(state.footerMediaCount).toBe(0);
    expect(state.footerWalkResource).toBe(false);
    expect(state.curtainTarget).toBeGreaterThan(0.05);
    expect(state.curtainTarget).toBeGreaterThan(curtainTargetAtTop);
    expect(state.curtainProgress).toBeGreaterThanOrEqual(0);
    expect(state.curtainProgress).toBeLessThanOrEqual(1);
    return state;
  }

  for (const [width,height] of [[320,568],[375,844],[390,667],[430,932]]) {
    const curtainTarget = await openAt(width,height);
    await inspect(width,height,curtainTarget);
  }

  await openAt(320,568);
  for (const [width,height] of [[430,740],[390,568],[375,932],[320,700]]) {
    await page.setViewportSize({width,height});
    // Wait for the profile and its new document extent before measuring the section.
    await page.waitForFunction(({ width, height }) => {
      const layout = window.__kcTabletLayout;
      return layout && layout.width === width && layout.height === height;
    }, { width, height });
    await scrollToSettledFooter();
    await inspect(width,height);
  }
});
