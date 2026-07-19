import { test, expect } from '@playwright/test';
import * as path from 'path';

// Design-backlog idea #49: a *shared* contrast-ratio helper, so the WCAG
// math exists in exactly one place instead of being hand-rolled again for
// every contrast-adjacent check. This is the same assets/js/contrast.js
// the theme-contrast-audit page (idea #4) loads client-side — it's a tiny
// UMD module (browser <script> + CommonJS), so a Playwright/Node test can
// `require()` it directly rather than re-deriving the formula.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ContrastUtils = require(path.join(__dirname, '../../assets/js/contrast.js'));

/**
 * These tests don't re-verify the WCAG formula itself (that's exercised by
 * sharing the one real implementation above) — they verify the *page*:
 * that it renders a card per theme, that the ratio it displays for a given
 * color pair matches what the shared helper computes from those same live
 * CSS custom-property values, and that its own pass/fail summary count
 * matches what's actually on screen.
 */
test.describe('Theme contrast audit', () => {
  test('renders one card per theme with no unavailable pairs', async ({ page }) => {
    await page.goto('/contrast-audit/');
    const cards = page.locator('.contrast-audit__theme');
    await expect(cards).toHaveCount(6);

    const unavailable = page.locator('.contrast-audit__theme td:has-text("value unavailable")');
    await expect(unavailable).toHaveCount(0);
  });

  test('every reported pair passes WCAG AA (site ships zero known contrast failures)', async ({ page }) => {
    await page.goto('/contrast-audit/');
    const failBadges = page.locator('.contrast-audit__badge--fail');
    await expect(failBadges).toHaveCount(0);
  });

  test('on-page ratio for light-theme body text matches the shared helper', async ({ page }) => {
    await page.goto('/contrast-audit/');

    // Read the real live custom-property values for the default (:root)
    // theme straight off the document, independent of the page's own
    // rendering logic.
    const liveValues = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        ink: styles.getPropertyValue('--ink').trim(),
        bg: styles.getPropertyValue('--bg').trim(),
      };
    });

    const computedRatio = ContrastUtils.contrastRatio(liveValues.ink, liveValues.bg, liveValues.bg);
    expect(computedRatio).not.toBeNull();
    expect(computedRatio).toBeGreaterThanOrEqual(4.5);

    // Anchor on the row whose label cell is exactly "Body text" — a plain
    // substring filter also matches "Accent used as body text", since
    // Playwright's hasText does case-insensitive substring matching against
    // the row's full text content.
    const onPageRatioText = await page
      .locator('.contrast-audit__theme', { hasText: 'Warm paper' })
      .locator('tbody tr')
      .filter({ has: page.locator('td', { hasText: /^Body text$/ }) })
      .locator('.contrast-audit__ratio')
      .textContent();
    const onPageRatio = parseFloat((onPageRatioText || '').replace(':1', ''));

    // Allow a hair of float/rounding slack (page displays 2 decimal places).
    expect(Math.abs(onPageRatio - computedRatio)).toBeLessThan(0.02);
  });

  test('summary count matches the number of pass badges on the page', async ({ page }) => {
    await page.goto('/contrast-audit/');
    const summaryText = await page.locator('[data-contrast-audit-summary]').textContent();
    const match = /(\d+) of (\d+) checked pairs/.exec(summaryText || '');
    expect(match).not.toBeNull();
    const [, passCount, totalCount] = match as RegExpExecArray;

    const passBadges = page.locator('.contrast-audit__badge--pass');
    const allBadges = page.locator('.contrast-audit__badge');
    await expect(passBadges).toHaveCount(Number(passCount));
    await expect(allBadges).toHaveCount(Number(totalCount));
  });
});
