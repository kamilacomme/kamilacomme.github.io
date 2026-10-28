const { test, expect } = require('@playwright/test');

const viewports = [
  { width: 960, height: 455 },
  { width: 1422, height: 600 },
];

test('short desktop Projects keeps the heading clear and reveals full tickets before horizontal travel', async ({ page }, info) => {
  const { mode, language } = info.project.metadata;
  test.skip(mode !== 'desktop', 'This check targets the shared desktop Projects iframe geometry.');
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto(language === 'en' ? '/en/desktop-project-embedded.html' : '/desktop-project-embedded.html', { waitUntil: 'load' });
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);

    const measure = () => page.evaluate(() => {
      const heading = document.querySelector('.heading');
      const rail = document.querySelector('#rail');
      const first = rail.firstElementChild;
      const last = rail.lastElementChild;
      const rect = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
      };
      const travel = Math.max(0, rail.getBoundingClientRect().width - innerWidth + 64);
      return {
        heading: rect(heading), rail: rect(rail), first: rect(first), last: rect(last),
        headingFont: getComputedStyle(heading).fontSize,
        mode: document.querySelector('#stage').dataset.kcProjectsMode,
        headingClip: getComputedStyle(heading).clipPath,
        travel,
      };
    });
    const setScroll = async (y) => {
      await page.evaluate((value) => { scrollTo(0, value); dispatchEvent(new Event('scroll')); }, y);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    };

    const start = await measure();
    expect(start.headingFont).toBe('56px');
    expect(start.mode).toBe('compact');
    expect(start.headingClip).toBe('inset(50%)');
    expect(await page.getByRole('heading', { name: language === 'en' ? /A selection of my most recent projects/i : /Une sélection des projets/i }).count()).toBe(1);
    expect(start.first.top).toBeGreaterThanOrEqual(23.9);
    expect(start.first.bottom).toBeLessThanOrEqual(viewport.height - 31.5);
    await page.screenshot({ path: info.outputPath(`projects-short-${language}-${viewport.width}x${viewport.height}-start.png`) });

    await setScroll(start.travel / 2);
    const middle = await measure();
    expect(middle.first.top).toBeGreaterThanOrEqual(23.9);
    await page.screenshot({ path: info.outputPath(`projects-short-${language}-${viewport.width}x${viewport.height}-reflow.png`) });

    await setScroll(0);
    const settled = await measure();
    expect(settled.first.top).toBeGreaterThanOrEqual(23.9);
    expect(settled.first.bottom).toBeLessThanOrEqual(viewport.height - 31.5);
    await page.screenshot({ path: info.outputPath(`projects-short-${language}-${viewport.width}x${viewport.height}-ticket-visible.png`) });

    await setScroll(start.travel);
    const end = await measure();
    expect(end.first.top).toBeGreaterThanOrEqual(23.9);
    expect(end.last.right).toBeLessThanOrEqual(viewport.width - 31.5);
    expect(end.last.right).toBeGreaterThanOrEqual(viewport.width - 32.5);
    expect(end.first.right).toBeLessThan(end.last.right);
    await page.screenshot({ path: info.outputPath(`projects-short-${language}-${viewport.width}x${viewport.height}-rail-end.png`) });
  }
});
