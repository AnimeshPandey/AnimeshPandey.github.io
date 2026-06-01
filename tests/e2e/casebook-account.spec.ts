import { test, expect } from '@playwright/test';
import { resetCasebookStorage, waitForCasebookAuth } from './helpers';

test.describe('Casebook account', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('account page shows email form when signed out', async ({ page }) => {
    await page.goto('/cases/account/');
    await expect(page.getByRole('heading', { name: /account/i })).toBeVisible();
    await expect(page.locator('#account-signed-out')).toBeVisible();
    await expect(page.locator('#account-email')).toBeVisible();
  });

  test('magic link flow signs user in', async ({ page }) => {
    await page.goto('/cases/account/');
    await waitForCasebookAuth(page);
    await page.fill('#account-email', 'e2e@casebook.test');
    await page.locator('#account-email-form').evaluate((f: HTMLFormElement) => f.requestSubmit());
    await expect(page.locator('#account-link-sent')).toBeVisible();
    const magicUrl = await page.inputValue('#account-magic-url');
    expect(magicUrl).toContain('token=');
    await page.goto(magicUrl);
    await expect(page.locator('#account-signed-in')).toBeVisible();
    await expect(page.locator('#account-signed-in-email')).toHaveText('e2e@casebook.test');
    const auth = await page.evaluate(() => localStorage.getItem('casebook-auth-v1'));
    expect(auth).toContain('e2e@casebook.test');
  });

  test('sign out returns to email form', async ({ page }) => {
    await page.goto('/cases/account/');
    await waitForCasebookAuth(page);
    await page.fill('#account-email', 'out@test.io');
    await page.locator('#account-email-form').evaluate((f: HTMLFormElement) => f.requestSubmit());
    const magicUrl = await page.inputValue('#account-magic-url');
    await page.goto(magicUrl);
    await expect(page.locator('#account-signed-in')).toBeVisible();
    await page.click('#account-sign-out');
    await expect(page.locator('#account-signed-out')).toBeVisible();
  });

  test('invalid token does not sign in', async ({ page }) => {
    await page.goto('/cases/account/?token=invalid-token-xyz');
    await expect(page.locator('#account-signed-out')).toBeVisible();
  });
});
