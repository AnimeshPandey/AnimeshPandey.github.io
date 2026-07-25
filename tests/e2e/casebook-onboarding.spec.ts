import { test, expect } from '@playwright/test';
import { resetCasebookStorageForOnboarding, waitForCaseyCompanion } from './helpers';

test.describe('Casey first-visit onboarding tour', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorageForOnboarding(page);
  });

  test('shows for a genuine first visit, focuses the card, and Tab cycles only Skip/Next', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    const card = page.locator('.casey-onboarding__card');
    await expect(card).toBeVisible();
    await expect(card).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('.casey-onboarding__skip')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.casey-onboarding__next')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('.casey-onboarding__skip')).toBeFocused(); // wraps, doesn't escape the trap
  });

  test('advancing through all steps ends with "Start exploring" and dismisses on click', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    await expect(page.locator('.casey-onboarding__overlay')).toBeVisible();

    let guard = 0;
    while ((await page.locator('.casey-onboarding__next').innerText()) !== 'Start exploring' && guard < 10) {
      await page.click('.casey-onboarding__next');
      guard++;
    }
    await page.click('.casey-onboarding__next');
    await expect(page.locator('.casey-onboarding__overlay')).toHaveCount(0);

    const dismissed = await page.evaluate(() => JSON.parse(localStorage.getItem('casebook-companion-v1')!).dismissedTips);
    expect(dismissed).toContain('hub-onboarding-tour');
  });

  test('Escape dismisses and persists across a reload', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    await expect(page.locator('.casey-onboarding__overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.casey-onboarding__overlay')).toHaveCount(0);

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await expect(page.locator('.casey-onboarding__overlay')).toHaveCount(0);
  });

  test('does not show for a returning visitor with real progress', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    await page.evaluate(() => {
      localStorage.setItem(
        'casebook-companion-v1',
        JSON.stringify({
          v: 1, tone: 'junior', visitedHub: true,
          casesStarted: [], casesCompleted: ['skeleton-screens-perceived-speed'],
          libraryOpened: false, lastSlug: null,
          lastVisitAt: new Date().toISOString(), previousVisitAt: new Date().toISOString(),
          milestones: [], dismissedTips: [], caseyIntensity: 'full',
          caseProgress: { 'skeleton-screens-perceived-speed': { completedAt: new Date().toISOString() } },
          confettiSeenSlugs: [],
        })
      );
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await expect(page.locator('.casey-onboarding__overlay')).toHaveCount(0);
  });

  test('does not show on first visit when guide intensity is off', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    await page.evaluate(() => {
      localStorage.setItem(
        'casebook-companion-v1',
        JSON.stringify({
          v: 1, tone: 'junior', visitedHub: false,
          casesStarted: [], casesCompleted: [],
          libraryOpened: false, lastSlug: null,
          lastVisitAt: null, previousVisitAt: null,
          milestones: [], dismissedTips: [], caseyIntensity: 'off',
          caseProgress: {}, confettiSeenSlugs: [],
        })
      );
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    await expect(page.locator('.casey-onboarding__overlay')).toHaveCount(0);
  });
});
