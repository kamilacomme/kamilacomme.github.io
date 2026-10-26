const { test, expect } = require('@playwright/test');
const qa = require('../qa/helpers.cjs');

test('legal dialogs contain keyboard focus and restore their opener on every close path', async ({ page, context }, info) => {
  const { language } = info.project.metadata;
  await qa.routes(context);
  await qa.ready(page, language);

  const deepActiveIs = async (locator) => locator.evaluate((target) => {
    let active = document.activeElement;
    while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
    return active === target;
  });
  const assertFocusInside = async (dialog) => {
    await expect.poll(() => page.evaluate(() => {
      let active = document.activeElement;
      while (active && active.shadowRoot && active.shadowRoot.activeElement) active = active.shadowRoot.activeElement;
      return !!active?.closest('[role="dialog"][aria-modal="true"]');
    })).toBe(true);
    await expect(dialog).toBeVisible();
  };

  const legalTrigger = page.locator('#contact [data-legal="legal"]').first();
  const legalDialog = page.locator('[data-sheet="legal"]');
  await legalTrigger.click();
  await assertFocusInside(legalDialog);
  await expect(legalDialog.locator('[data-close]')).toBeFocused();
  const initialFocusStyle = await legalDialog.locator('[data-close]').evaluate((el) => ({
    outline: getComputedStyle(el).outlineStyle,
    width: parseFloat(getComputedStyle(el).outlineWidth),
  }));
  expect(initialFocusStyle).toEqual({ outline: 'solid', width: 2 });

  // Add a temporary second tab stop so the browser test verifies forward and reverse
  // wrapping, even though current legal copy has only its close button as a tab stop.
  const probe = await legalDialog.evaluate((dialog) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Temporary focus-order probe';
    button.dataset.qaFocusProbe = '';
    dialog.append(button);
    return true;
  });
  expect(probe).toBe(true);
  const focusProbe = legalDialog.locator('[data-qa-focus-probe]');
  const triggerIsInert = await legalTrigger.evaluate((trigger) => {
    for (let node = trigger; node; node = node.parentElement) if (node.inert) return true;
    return false;
  });
  expect(triggerIsInert).toBe(true);

  await legalDialog.evaluate((dialog) => {
    const stops = [...dialog.querySelectorAll(
      'a[href], area[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
    )].filter((el) => !el.hidden && el.getClientRects().length > 0);
    stops[0].dataset.qaFirstStop = '';
    stops[stops.length - 1].dataset.qaLastStop = '';
    stops[0].focus();
  });
  await page.keyboard.press('Shift+Tab');
  await expect(focusProbe).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(legalDialog.locator('[data-qa-first-stop]')).toBeFocused();
  await legalDialog.locator('[data-qa-last-stop]').focus();
  await page.keyboard.press('Tab');
  await expect(legalDialog.locator('[data-qa-first-stop]')).toBeFocused();
  await legalDialog.locator('[data-qa-first-stop]').evaluate((el) => {
    delete el.dataset.qaFirstStop;
    delete el.dataset.qaLastStop;
  });
  await assertFocusInside(legalDialog);

  await page.keyboard.press('Escape');
  await expect(legalDialog).toBeHidden();
  expect(await deepActiveIs(legalTrigger)).toBe(true);

  // Reopening must establish a fresh opener and the explicit close button must restore it.
  await legalTrigger.press('Enter');
  await assertFocusInside(legalDialog);
  await legalDialog.locator('[data-close]').click();
  await expect(legalDialog).toBeHidden();
  expect(await deepActiveIs(legalTrigger)).toBe(true);

  // The privacy sheet uses the same owner; backdrop close also returns focus.
  const privacyTrigger = page.locator('#contact [data-legal="privacy"]').first();
  const privacyDialog = page.locator('[data-sheet="privacy"]');
  await privacyTrigger.click();
  await assertFocusInside(privacyDialog);
  await page.mouse.click(2, 2);
  await expect(privacyDialog).toBeHidden();
  expect(await deepActiveIs(privacyTrigger)).toBe(true);
});
