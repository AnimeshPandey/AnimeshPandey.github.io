import { test, expect } from '@playwright/test';
import { resetCasebookStorage } from './helpers';

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

  // Token verification is server-side only now (workers/magic-link's
  // POST /verify, checked with an HMAC secret that never reaches the
  // browser) — see cases/lib/casebook-auth-core.js's header comment for
  // why. These tests mock that endpoint rather than forging a token
  // client-side, which is a closer simulation of the real flow anyway:
  // the browser never has enough information to mint a valid token itself.
  function mockVerify(page: import('@playwright/test').Page, email: string) {
    return page.route('**/casebook-magic-link.animeshpandey.workers.dev/verify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, email }),
      });
    });
  }

  test('magic link flow signs user in', async ({ page }) => {
    await mockVerify(page, 'e2e@casebook.test');

    await page.goto('/cases/account/?token=opaque-test-token');
    await expect(page.locator('#account-signed-in')).toBeVisible();
    await expect(page.locator('#account-signed-in-email')).toHaveText('e2e@casebook.test');
    const auth = await page.evaluate(() => localStorage.getItem('casebook-auth-v1'));
    expect(auth).toContain('e2e@casebook.test');
  });

  test('sign out returns to email form', async ({ page }) => {
    await mockVerify(page, 'out@test.io');

    await page.goto('/cases/account/?token=opaque-test-token');
    await expect(page.locator('#account-signed-in')).toBeVisible();
    await page.click('#account-sign-out');
    await expect(page.locator('#account-signed-out')).toBeVisible();
  });

  test('invalid token does not sign in', async ({ page }) => {
    await page.route('**/casebook-magic-link.animeshpandey.workers.dev/verify', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: false }),
      });
    });

    await page.goto('/cases/account/?token=invalid-token-xyz');
    await expect(page.locator('#account-signed-out')).toBeVisible();
  });
});
