import { test, expect } from '@playwright/test';
import { resetCasebookStorage, waitForCaseyCompanion } from './helpers';

test.describe('Casebook review sessions', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('shows a "nothing due" empty state with no submit button when no case is due', async ({ page }) => {
    await page.goto('/cases/review/');
    await expect(page.locator('#review-count-label')).toContainText('Nothing due right now');
    await expect(page.locator('#interview-setup button[type=submit]')).toBeHidden();
  });

  test('a case due for review surfaces a clickable hub action and starts a review session', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    const slug = await page.evaluate(() => {
      const link = document.querySelector('#hub-grid li[data-track] .case-card__link');
      return link ? link.getAttribute('href')!.replace(/\/+$/, '').split('/').filter(Boolean).pop() : null;
    });
    expect(slug).toBeTruthy();

    await page.evaluate((s) => {
      const completedAt = new Date(Date.now() - 7.5 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(
        'casebook-companion-v1',
        JSON.stringify({
          v: 1, tone: 'junior', visitedHub: true,
          casesStarted: [], casesCompleted: [s],
          libraryOpened: false, lastSlug: null,
          lastVisitAt: new Date().toISOString(), previousVisitAt: new Date().toISOString(),
          milestones: [], dismissedTips: [], caseyIntensity: 'full',
          caseProgress: { [s as string]: { completedAt } },
          confettiSeenSlugs: [],
        })
      );
    }, slug);
    await page.reload({ waitUntil: 'networkidle' });

    const chip = page.locator('#casey-hub-actions a', { hasText: 'Review' });
    await expect(chip).toBeVisible();
    await expect(chip).toHaveAttribute('href', '/cases/review/');

    await chip.click();
    await expect(page.locator('#review-count-label')).toContainText('1 case due for review');
    await expect(page.locator('#review-casey-bubble .casey-about-bubble__text')).toBeVisible();

    await Promise.all([
      page.waitForURL(/\?interview=/),
      page.click('#interview-setup button[type=submit]'),
    ]);
    await expect(page.locator('.casebook-interview-banner__label')).toContainText('Review: case 1 of 1');
    // Same hints-hidden contract as interview mode.
    await expect(page.locator('.casey-coach').first()).toBeHidden();
  });

  test('completing a review session redirects back to /review/ with a summary, not /interview/', async ({ page }) => {
    await page.goto('/cases/');
    await waitForCaseyCompanion(page);
    const slug = await page.evaluate(() => {
      const link = document.querySelector('#hub-grid li[data-track] .case-card__link');
      return link ? link.getAttribute('href')!.replace(/\/+$/, '').split('/').filter(Boolean).pop() : null;
    });
    await page.evaluate((s) => {
      const completedAt = new Date(Date.now() - 7.5 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(
        'casebook-companion-v1',
        JSON.stringify({
          v: 1, tone: 'junior', visitedHub: true,
          casesStarted: [], casesCompleted: [s],
          libraryOpened: false, lastSlug: null,
          lastVisitAt: new Date().toISOString(), previousVisitAt: new Date().toISOString(),
          milestones: [], dismissedTips: [], caseyIntensity: 'full',
          caseProgress: { [s as string]: { completedAt } },
          confettiSeenSlugs: [],
        })
      );
    }, slug);

    await page.goto('/cases/review/');
    await Promise.all([
      page.waitForURL(/\?interview=/),
      page.click('#interview-setup button[type=submit]'),
    ]);
    const caseUrl = page.url();

    await page.click('#casebook-interview-done');
    await Promise.all([
      page.waitForURL((url) => url.toString() !== caseUrl),
      page.click('.casebook-interview-assess button[data-result="yes"]'),
    ]);

    await expect(page).toHaveURL(/\/review\/\?session=.*done=1/);
    await expect(page.locator('#interview-summary')).toBeVisible();
    await expect(page.locator('#interview-summary-casey-bubble .casey-about-bubble__text')).toBeVisible();
  });
});
