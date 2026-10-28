const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('narrow-tablet Projects ticket edge follows the Navbar CTA across a reserved scrollbar gutter', async ({ page, context }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'desktop', 'Use a desktop browser context resized into the narrow-tablet profile.');
  await qa.routes(context);
  await qa.seed(page);
  await qa.ready(page, language);

  // A stable scrollbar gutter reproduces desktop Chromium's classic scrollbar:
  // innerWidth remains the outer viewport width while section roots have less room.
  await page.addStyleTag({ content: 'html { scrollbar-gutter: stable; }' });
  for (const width of [500, 560, 607]) {
    await page.setViewportSize({ width, height: 800 });
    await page.clock.runFor(300);
    await expect.poll(() => page.evaluate(() => window.__kcTabletLayout?.width)).toBe(width);
    await expect.poll(() => page.locator('#kc-tablet-projets').evaluate(el => el.classList.contains('kc-narrow-ticket'))).toBe(true);
    await expect.poll(() => page.evaluate(() => {
      const section = document.querySelector('#kc-tablet-projets');
      const stage = section?.querySelector('#kc-t-stage');
      return Math.abs(section.getBoundingClientRect().width - stage.getBoundingClientRect().width);
    })).toBeLessThan(0.5);

    const geometry = await page.evaluate(() => {
      const rect = element => {
        const value = element.getBoundingClientRect();
        return { left: value.left, right: value.right, width: value.width };
      };
      const root = document.querySelector('#kc-tablet-projets');
      const hire = document.querySelector('.kc-responsive-nav a[href^="mailto"]');
      const ticket = root.querySelector('.ticket');
      return {
        viewportWidth: innerWidth,
        availableSectionWidth: rect(root).width,
        navbarCta: rect(hire),
        ticket: rect(ticket),
        profile: window.__kcTabletLayout?.tablet ? 'tablet' : 'other',
        ticketCount: root.querySelectorAll('.ticket').length,
      };
    });

    expect(geometry.profile).toBe('tablet');
    expect(geometry.ticketCount).toBe(6);
    expect(geometry.availableSectionWidth).toBeLessThan(geometry.viewportWidth);
    expect(geometry.ticket.right).toBeCloseTo(geometry.navbarCta.right, 0);
    expect(geometry.ticket.right).toBeLessThanOrEqual(geometry.availableSectionWidth - 31);
  }
});
