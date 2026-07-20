import { test, expect } from '@playwright/test';
import { resetCasebookStorage, waitForCaseyCompanion } from './helpers';

function caseyPanel(page: import('@playwright/test').Page) {
  return page.locator('#casebook-prefs-menu');
}

test.describe('Casey settings panel', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('panel tier switch updates hub avatar and label', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);

    await page.locator('#casebook-prefs-btn').click();
    const panel = caseyPanel(page);
    await expect(panel).toBeVisible();

    await panel.locator('[data-casey-panel-tier="staff"]').click();

    await expect(page.locator('[data-casey-hub-tier-label]')).toContainText(/Staff/i);
    await expect(page.locator('[data-casey-hub-avatar]')).toHaveAttribute('src', /\/staff\//);
    await expect(panel.locator('[data-casey-panel-tier="staff"]')).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });

  test('intensity off hides greeting and uses sleep pose on hub', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);

    await page.locator('#casebook-prefs-btn').click();
    await caseyPanel(page).locator('[data-casey-intensity="off"]').click();

    await expect(page.locator('#casey-hub-greeting')).toBeHidden();
    await expect(page.locator('[data-casey-hub-avatar]')).toHaveAttribute('src', /sleep\.png/);
  });

  test('panel tier stays synced with case tone switcher', async ({ page }) => {
    await page.goto('/cases/focus-visible-not-outline-none/');
    await waitForCaseyCompanion(page);

    await page.locator('.case-tone__btn[data-tone="mid"]').first().click();
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('casebook-tone')))
      .toBe('mid');

    await page.locator('#casebook-prefs-btn').click();
    await caseyPanel(page).locator('[data-casey-panel-tier="staff"]').click();

    await expect(page.locator('.case-tone__btn[data-tone="staff"]').first()).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.locator('.casey-coach__name').first()).toContainText(/Staff/i);
  });

  test('header trigger avatar is not clipped by the header row', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);

    const trigger = page.locator('#casebook-prefs-btn');
    const frame = trigger.locator('.casey-avatar-frame');
    await expect(frame).toBeVisible();

    const [triggerBox, frameBox] = await Promise.all([trigger.boundingBox(), frame.boundingBox()]);
    if (!triggerBox || !frameBox) throw new Error('bounding box unavailable');

    // The avatar frame must sit fully inside the trigger button — a frame
    // taller than the 44px button (no per-context size override) gets
    // vertically centered by flexbox and overflows both edges, clipping
    // the avatar above the header row.
    expect(frameBox.y).toBeGreaterThanOrEqual(triggerBox.y);
    expect(frameBox.y + frameBox.height).toBeLessThanOrEqual(triggerBox.y + triggerBox.height);
  });
});
