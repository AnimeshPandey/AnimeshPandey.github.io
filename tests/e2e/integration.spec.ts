import { test, expect } from '@playwright/test';

test.describe('Cross-site integration', () => {
  test('portfolio → casebook → case → back to hub', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /explore the casebook/i }).click();
    await expect(page).toHaveURL(/\/cases\/?/);
    await page.locator('#hub-grid a.case-card__link').first().click();
    await expect(page).toHaveURL(/\/cases\/[a-z0-9-]+\//);
    await page.getByRole('link', { name: /back to all cases|casebook/i }).first().click();
    await expect(page).toHaveURL(/\/cases\/?/);
  });

  test('casebook header returns to portfolio', async ({ page }) => {
    await page.goto('/cases/');
    await page.locator('header').getByRole('link', { name: 'Portfolio' }).click();
    await expect(page).toHaveURL(/\/(#hero)?$/);
  });

  test('critical CSS loads on casebook', async ({ page }) => {
    await page.goto('/cases/');
    const res = await page.request.get('/cases/assets/css/casebook.css');
    expect(res.ok()).toBeTruthy();
    const css = await res.text();
    expect(css).toContain('casebook-tokens');
  });

  test('casebook auth core loads before auth', async ({ page }) => {
    await page.goto('/cases/account/');
    const order = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'))
        .map((s) => (s as HTMLScriptElement).src)
        .filter((src) => src.includes('casebook-auth'));
      return scripts.map((s) => (s.includes('core') ? 'core' : 'auth'));
    });
    const coreIdx = order.indexOf('core');
    const authIdx = order.indexOf('auth');
    expect(coreIdx).toBeGreaterThanOrEqual(0);
    expect(authIdx).toBeGreaterThan(coreIdx);
  });
});
