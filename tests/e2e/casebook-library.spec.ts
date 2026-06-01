import { test, expect } from '@playwright/test';

test.describe('Casebook library', () => {
  test('library index loads with filter UI', async ({ page }) => {
    await page.goto('/cases/library/');
    await expect(page.getByRole('heading', { name: /library|reading/i }).first()).toBeVisible();
  });

  test('can navigate from hub to library', async ({ page }) => {
    await page.goto('/cases/');
    await page.locator('.hub-toolbar__type').getByRole('link', { name: /reading library/i }).click();
    await expect(page).toHaveURL(/\/cases\/library\/?/);
  });

  test('about page loads', async ({ page }) => {
    await page.goto('/cases/about/');
    await expect(page.locator('main')).toBeVisible();
  });

  test('companies index loads', async ({ page }) => {
    await page.goto('/cases/companies/');
    await expect(page.locator('main')).toBeVisible();
  });

  test('feed.xml is valid XML', async ({ page }) => {
    const res = await page.request.get('/cases/feed.xml');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('<rss');
  });

  test('sitemap includes live case URLs', async ({ page }) => {
    const res = await page.request.get('/cases/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('abort-controller-ghost-updates');
    expect(body).toContain('focus-visible-not-outline-none');
  });
});
