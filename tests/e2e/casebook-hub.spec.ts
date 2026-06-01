import { test, expect } from '@playwright/test';
import { resetCasebookStorage, waitForCaseyCompanion } from './helpers';

test.describe('Casebook hub', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('hub loads with grid and Casey panel', async ({ page }) => {
    await page.goto('/cases/');
    await expect(page.getByRole('heading', { name: /frontend casebook/i })).toBeVisible();
    await expect(page.locator('[data-casey-hub]')).toBeVisible();
    await expect(page.locator('#hub-grid')).toBeVisible();
    await expect(page.locator('#track-filter')).toBeVisible();
  });

  test('progress strip shows live total', async ({ page }) => {
    await page.goto('/cases/');
    await expect(page.locator('[data-casebook-hub-progress]')).toBeVisible();
    await expect(page.locator('[data-casebook-progress-meta]')).toContainText(/live cases/i);
  });

  test('Casey companion API is available', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    const state = await page.evaluate(() => window.CaseyCompanion?.getState());
    expect(state).toBeTruthy();
    expect(state.v).toBe(1);
  });

  test('clicking Casey avatar does not break greeting', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    const greeting = page.locator('#casey-hub-greeting');
    await expect(greeting).not.toBeEmpty();
    await page.locator('[data-casey-hub-play]').click();
    await expect(greeting).not.toBeEmpty();
  });

  test('track filter hides empty state when all tracks selected', async ({ page }) => {
    await page.goto('/cases/');
    await page.selectOption('#track-filter', '');
    await expect(page.locator('#hub-grid-empty')).toBeHidden();
    const visibleCards = page.locator('#hub-grid > li:not([hidden])');
    await expect(visibleCards.first()).toBeVisible();
  });

  test('track filter with no live cases shows empty only', async ({ page }) => {
    await page.goto('/cases/');
    const options = await page.locator('#track-filter option').allTextContents();
    let picked = '';
    for (const opt of options) {
      const m = opt.match(/\((\d+)\)\s*$/);
      if (m && m[1] === '0') {
        picked = await page.locator('#track-filter option', { hasText: opt }).getAttribute('value');
        break;
      }
    }
    test.skip(!picked, 'No zero-count track in current manifest');
    await page.selectOption('#track-filter', picked!);
    await expect(page.locator('#hub-grid-empty')).toBeVisible();
    await expect(page.locator('#hub-grid')).toBeHidden();
  });

  test('clear filter button appears when track selected', async ({ page }) => {
    await page.goto('/cases/');
    const firstTrack = await page.locator('#track-filter option').nth(1).getAttribute('value');
    if (!firstTrack) return;
    await page.selectOption('#track-filter', firstTrack);
    await expect(page.locator('#hub-clear-filter')).toBeVisible();
    await page.click('#hub-clear-filter');
    await expect(page.locator('#track-filter')).toHaveValue('');
  });

  test('header nav includes Cases, About, Sign in', async ({ page }) => {
    await page.goto('/cases/');
    const header = page.locator('header.platform-header, .platform-header').first();
    await expect(header.getByRole('link', { name: 'Cases' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(header.getByRole('link', { name: /sign in|account/i })).toBeVisible();
  });
});
