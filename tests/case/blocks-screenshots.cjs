// Evidence screenshots of the case blocks (hero-reveal, image-pair x2, ai-episode with four result frames)
// on /cases/jane/ and /en/cases/jane/ at 320, 768, 1440 and 1920 wide. JPEG quality 75.
// Usage: start `npm run test:serve`, then `node tests/case/blocks-screenshots.cjs <out-dir>`.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8000';
const out = process.argv[2];
if (!out) { console.error('Usage: node tests/case/blocks-screenshots.cjs <out-dir>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const SIZES = [[320, 640], [768, 1024], [1440, 900], [1920, 1080]];
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  for (const lang of ['fr', 'en']) for (const [w, h] of SIZES) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    await p.goto(`${BASE}${lang === 'fr' ? '' : '/en'}/cases/jane/`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const height = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 500) { await p.evaluate(v => window.scrollTo(0, v), y); await p.waitForTimeout(40); }
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForFunction(() => [...document.querySelectorAll('img')].filter(i => i.getClientRects().length).every(i => i.complete), null, { timeout: 15000 }).catch(() => {});
    await p.screenshot({ path: `${out}/${lang}-${w}-hero.jpg`, type: 'jpeg', quality: 75 });
    const blocks = [
      ['pair-vines', '#chapter-nature-to-form .kc-case-block--image-pair'],
      ['pair-art', '#chapter-beyond-the-product .kc-case-block--image-pair'],
      ['ai-episode', '#chapter-designing-with-ai .kc-case-block--ai-episode >> nth=2'],
    ];
    for (const [name, sel] of blocks) {
      const box = await p.locator(sel).boundingBox(); const sy = await p.evaluate(() => scrollY);
      await p.screenshot({ path: `${out}/${lang}-${w}-${name}.jpg`, type: 'jpeg', quality: 75, fullPage: true, clip: { x: 0, y: box.y + sy - 16, width: w, height: box.height + 32 } });
    }
    await p.close();
  }
  await b.close();
  console.log('screenshots in', out);
})();
