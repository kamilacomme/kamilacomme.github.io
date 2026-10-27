const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

async function accessibilityNode(page, selector) {
  const session = await page.context().newCDPSession(page);
  await session.send('Accessibility.enable');
  const { root } = await session.send('DOM.getDocument');
  const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  expect(nodeId, `Chromium could not find ${selector} in the DOM`).toBeTruthy();
  const { node } = await session.send('DOM.describeNode', { nodeId });
  const backendNodeId = node.backendNodeId;
  const { nodes } = await session.send('Accessibility.getPartialAXTree', { backendNodeId, fetchRelatives: false });
  await session.detach();
  return nodes.find((node) => node.backendDOMNodeId === backendNodeId) || nodes[0];
}

test('localized control names and the primary landmark are exposed by Chromium; navigation leads keyboard order', async ({ page, context }, info) => {
  const { language } = info.project.metadata;
  await qa.routes(context);
  await qa.ready(page, language);

  const expectedSwitch = language === 'en' ? 'EN' : 'FR';
  const expectedHire = language === 'en' ? 'Hire me' : 'Me recruter';
  const switchAx = await accessibilityNode(page, '[data-kc-language-switch]');
  const hireAx = await accessibilityNode(page, '.kc-responsive-nav a[href^="mailto"]');
  const navAx = await accessibilityNode(page, '.kc-responsive-nav');
  const mainAx = await accessibilityNode(page, 'main#kc-main-content');

  expect(switchAx.role.value).toBe('link');
  expect(switchAx.name.value).toContain(expectedSwitch);
  expect(switchAx.name.value).toMatch(language === 'en' ? /Current language.*Switch to French/ : /Langue actuelle.*Passer en anglais/);
  expect(hireAx.role.value).toBe('link');
  expect(hireAx.name.value).toContain(expectedHire);
  expect(hireAx.name.value).toContain('comme.kamila@gmail.com');
  expect(navAx.role.value).toBe('navigation');
  expect(navAx.name.value).toBe(language === 'en' ? 'Main navigation' : 'Navigation principale');
  expect(mainAx.role.value).toBe('main');

  await expect(page.locator('main#kc-main-content')).toHaveCount(1);
  await expect(page.locator('#kc-main-content h1').first()).toBeAttached();
  await expect(page.locator('#kc-main-content #contact')).toBeAttached();
  await expect(page.locator('#kc-main-content #apropos, #kc-main-content #apropos-t, #kc-main-content #apropos-m').first()).toBeAttached();

  // The fixed navbar is visually at the top, so its first available action should
  // lead source-order keyboard navigation. The fixed language link remains last.
  await page.keyboard.press('Tab');
  await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('.kc-responsive-nav'))).toBe(true);
  const hireLink = page.locator('.kc-responsive-nav a[href^="mailto"]');
  await hireLink.focus();
  await expect(hireLink).toBeFocused();
  await expect.poll(() => hireLink.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(202, 229, 108)');
  let switchReached = false;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    switchReached = await page.evaluate(() => document.activeElement?.matches('[data-kc-language-switch]') || false);
    if (switchReached) break;
  }
  expect(switchReached, 'fixed language switch should remain reachable after page content').toBe(true);
});
