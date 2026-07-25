import { test, expect } from '@playwright/test';
import { resetCasebookStorage } from './helpers';

test.describe('Casebook search', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('header trigger links to the search page from the hub', async ({ page }) => {
    await page.goto('/cases/');
    const trigger = page.getByRole('link', { name: 'Search the Casebook' });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('href', /\/search\/?/);
  });

  test('typing a query shows matching results with a live count', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'flex');
    await expect(page.locator('#casebook-search-count')).toContainText('result');
    const resultCount = await page.locator('.casebook-search__result-title').count();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('idea-status cases render as non-clickable "planned" results, not dead links', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'capture vs bubble');
    const planned = page.locator('.casebook-search__result--planned');
    await expect(planned).toHaveCount(1);
    await expect(planned.locator('a')).toHaveCount(0);
  });

  test('live cases render as real links that resolve', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'identity, not index');
    const link = page.locator('a.casebook-search__result').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/cases\//);
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
  });

  test('nonsense query shows the empty state', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'zzznonexistentqueryzzz');
    await expect(page.locator('#casebook-search-empty')).toBeVisible();
  });

  test('blank query shows neither results nor the empty state', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'test');
    await page.fill('#casebook-search-input', '');
    await expect(page.locator('#casebook-search-empty')).toBeHidden();
    await expect(page.locator('.casebook-search__result-title')).toHaveCount(0);
  });

  test('?q= deep link pre-fills the input and runs the search', async ({ page }) => {
    await page.goto('/cases/search/?q=flexbox');
    await expect(page.locator('#casebook-search-input')).toHaveValue('flexbox');
    await expect(page.locator('.casebook-search__result-title').first()).toBeVisible();
  });
});
