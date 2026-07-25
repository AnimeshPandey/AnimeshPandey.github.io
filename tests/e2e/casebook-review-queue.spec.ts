import { test, expect } from '@playwright/test';
import { resetCasebookStorage } from './helpers';

const DAY = 86400000;

async function seedProgress(page: import('@playwright/test').Page, slug: string, completedAt: string) {
  await page.addInitScript(
    ({ slug, completedAt }) => {
      localStorage.setItem(
        'casebook-companion-v1',
        JSON.stringify({
          v: 1,
          tone: 'junior',
          visitedHub: true,
          casesStarted: [slug],
          casesCompleted: [slug],
          libraryOpened: false,
          lastSlug: slug,
          lastVisitAt: null,
          milestones: ['first-case-completed'],
          dismissedTips: [],
          caseyIntensity: 'full',
          caseProgress: { [slug]: { chapter: 'takeaway', pct: 1, completedAt } },
          confettiSeenSlugs: [],
        })
      );
    },
    { slug, completedAt }
  );
}

test.describe('Casebook review queue', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('a case completed 7.5 days ago triggers the hub review-due greeting', async ({ page }) => {
    await page.goto('/cases/');
    const titles = await page.evaluate(() => {
      const el = document.getElementById('hub-case-titles');
      return el ? JSON.parse(el.textContent!) : {};
    });
    const slug = Object.keys(titles)[0];
    const title = titles[slug];

    await seedProgress(page, slug, new Date(Date.now() - 7.5 * DAY).toISOString());
    await page.goto('/cases/');

    await expect(page.locator('#casey-hub-greeting')).toContainText(title);
  });

  test('a case completed just now does not trigger the review-due greeting', async ({ page }) => {
    await page.goto('/cases/');
    const titles = await page.evaluate(() => {
      const el = document.getElementById('hub-case-titles');
      return el ? JSON.parse(el.textContent!) : {};
    });
    const slug = Object.keys(titles)[0];

    await seedProgress(page, slug, new Date().toISOString());
    await page.goto('/cases/');

    await expect(page.locator('#casey-hub-greeting')).not.toContainText('worth another look');
  });

  test('window.CaseyCompanion exposes dueForReview and pickReviewDueSlug', async ({ page }) => {
    await page.goto('/cases/');
    const hasApi = await page.evaluate(() => {
      const c = (window as any).CaseyCompanion;
      return typeof c.dueForReview === 'function' && typeof c.pickReviewDueSlug === 'function';
    });
    expect(hasApi).toBe(true);
  });
});
