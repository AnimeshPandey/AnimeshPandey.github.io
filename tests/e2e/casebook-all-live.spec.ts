import { test, expect } from '@playwright/test';
import liveSlugs from '../fixtures/live-slugs.json' assert { type: 'json' };

test.describe('All live cases smoke', () => {
  for (const slug of liveSlugs) {
    test(`GET /cases/${slug}/ returns 200 with continue CTA`, async ({ page }) => {
      const res = await page.goto(`/cases/${slug}/`);
      expect(res?.status()).toBeLessThan(400);
      await expect(page.locator('#case-continue')).toBeVisible();
      await expect(page.locator('.casey-coach').first()).toBeVisible();
      await expect(page.locator('script#casey-data')).toBeAttached();
    });
  }
});
