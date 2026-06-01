import { test, expect } from '@playwright/test';
import { resetCasebookStorage, waitForCaseyCompanion } from './helpers';

const FLAGSHIP = '/cases/abort-controller-ghost-updates/';

test.describe('Casebook case page', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('flagship case loads with chapters and coach', async ({ page }) => {
    await page.goto(FLAGSHIP);
    await expect(page.locator('.case-cover__title')).toBeVisible();
    await expect(page.locator('.case-chapter[data-chapter="hook"]')).toBeVisible();
    await expect(page.locator('.casey-coach').first()).toBeVisible();
    await expect(page.locator('#case-continue')).toBeVisible();
  });

  test('continue CTA links to another live case', async ({ page }) => {
    await page.goto(FLAGSHIP);
    const next = page.locator('[data-case-continue-next]');
    await expect(next).toBeVisible();
    const href = await next.getAttribute('href');
    expect(href).toMatch(/\/cases\/[a-z0-9-]+\//);
    await next.click();
    await expect(page).not.toHaveURL(/abort-controller-ghost-updates/);
    await expect(page.locator('.case-cover__title')).toBeVisible();
  });

  test('tone switcher changes document tone', async ({ page }) => {
    await page.goto(FLAGSHIP);
    const mid = page.locator('.case-tone__btn[data-tone="mid"]').first();
    if (await mid.count()) {
      await mid.click();
      await expect
        .poll(async () => page.evaluate(() => localStorage.getItem('casebook-tone')))
        .toBe('mid');
    }
  });

  test('scrolling to takeaway records progress', async ({ page }) => {
    await page.goto(FLAGSHIP);
    await waitForCaseyCompanion(page);
    await page.locator('.case-chapter[data-chapter="takeaway"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    const state = await page.evaluate(() => window.CaseyCompanion?.getState());
    expect(state?.casesStarted).toContain('abort-controller-ghost-updates');
  });

  test('all sample live cases return 200', async ({ page }) => {
    const slugs = [
      'focus-visible-not-outline-none',
      'fetch-race-abort',
      'static-site-zero-backend',
      'reduced-motion-respect',
      'context-window-budget',
    ];
    for (const slug of slugs) {
      const res = await page.goto(`/cases/${slug}/`);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator('#case-continue')).toBeVisible();
    }
  });

  test('progress bar element exists', async ({ page }) => {
    await page.goto(FLAGSHIP);
    await expect(page.locator('#casebook-progress')).toBeAttached();
  });
});
