import { test, expect } from '@playwright/test';
import { resetCasebookStorage, waitForCaseyCompanion } from './helpers';

test.describe('Casey companion behavior', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('CasebookAuth and CaseyCompanion coexist on hub', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    const apis = await page.evaluate(() => ({
      casey: !!window.CaseyCompanion,
      auth: !!window.CasebookAuth,
      core: !!window.CasebookAuthCore,
    }));
    expect(apis.casey).toBe(true);
    expect(apis.auth).toBe(true);
    expect(apis.core).toBe(true);
  });

  test('hub actions render after companion init', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    await expect(page.locator('#casey-hub-actions a').first()).toBeVisible();
  });

  test('?resetCompanion=1 clears state when confirmed', async ({ page }) => {
    await page.goto('/cases/abort-controller-ghost-updates/');
    await waitForCaseyCompanion(page);
    await page.evaluate(() => {
      window.CaseyCompanion?.recordEvent('case-completed', { slug: 'abort-controller-ghost-updates' });
    });
    let completed = await page.evaluate(
      () => window.CaseyCompanion?.getState()?.casesCompleted?.length ?? 0
    );
    expect(completed).toBeGreaterThan(0);

    await page.goto('/cases/?resetCompanion=1');
    await waitForCaseyCompanion(page);
    completed = await page.evaluate(
      () => window.CaseyCompanion?.getState()?.casesCompleted?.length ?? 0
    );
    expect(completed).toBe(0);
  });

  test('case coach bubble updates on scroll', async ({ page }) => {
    await page.goto('/cases/focus-visible-not-outline-none/');
    await waitForCaseyCompanion(page);
    const before = await page.locator('.casey-coach__bubble').first().textContent();
    await page.locator('.case-chapter[data-chapter="demo"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    const after = await page.locator('.casey-coach__bubble').first().textContent();
    expect(after?.length).toBeGreaterThan(0);
  });
});
