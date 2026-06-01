import { test, expect } from '@playwright/test';

test.describe('Portfolio home', () => {
  test('loads with main landmarks and title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Animesh Pandey/i);
    await expect(page.locator('main, #hero').first()).toBeVisible();
    await expect(page.locator('.platform-header, header').first()).toBeVisible();
  });

  test('links to Casebook', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: /casebook|explore the casebook/i }).first();
    await expect(link).toHaveAttribute('href', /\/cases\/?/);
  });

  test('navigates to Casebook hub', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /explore the casebook/i }).click();
    await expect(page).toHaveURL(/\/cases\/?/);
    await expect(page.getByRole('heading', { name: /frontend casebook/i })).toBeVisible();
  });

  test('theme control exists in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#theme-pick-btn-header, .theme-pick-btn').first()).toBeVisible();
  });

  test('sw-migrate script is present', async ({ page }) => {
    await page.goto('/');
    const res = await page.request.get('/assets/sw-migrate.js');
    expect(res.ok()).toBeTruthy();
  });

  test('404 page loads', async ({ page }) => {
    const res = await page.goto('/this-route-does-not-exist-xyz');
    expect(res?.status()).toBe(404);
  });
});
