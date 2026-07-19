import { test, expect } from '@playwright/test';

test.describe('Portfolio home', () => {
  test('loads with main landmarks and title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Animesh Pandey/i);
    await expect(page.locator('main, #hero').first()).toBeVisible();
    await expect(page.locator('.platform-header, header').first()).toBeVisible();
  });

  test('links to Casebook', async ({ page }) => {
    await page.goto('/');
    const link = page.getByRole('link', { name: /casebook|explore the casebook/i }).first();
    await expect(link).toHaveAttribute('href', /\/cases\/?/);
  });

  test('navigates to Casebook hub', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /explore the casebook/i }).click();
    await expect(page).toHaveURL(/\/cases\/?/);
    await expect(page.getByRole('heading', { name: /frontend casebook/i })).toBeVisible();
  });

  test('theme control exists in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#theme-pick-btn-header, .theme-pick-btn').first()).toBeVisible();
  });

  test('sw-migrate script is present', async ({ page }) => {
    await page.goto('/');
    const res = await page.request.get('/assets/sw-migrate.js');
    expect(res.ok()).toBeTruthy();
  });

  test('404 page loads', async ({ page }) => {
    const res = await page.goto('/this-route-does-not-exist-xyz');
    expect(res?.status()).toBe(404);
  });
});

// design-backlog idea #5: #skills chips for unambiguously-mapped skills get
// upgraded, client-side, to real Casebook links + article counts sourced from
// assets/casebook-stats.json (itself generated at build time from the
// casebook's own hub-facets.json) — never a hand-typed number.
test.describe('Skill chip Casebook cross-links', () => {
  test('mapped skill chip becomes a real, counted Casebook link', async ({ page }) => {
    const statsRes = await page.request.get('/assets/casebook-stats.json');
    expect(statsRes.ok()).toBeTruthy();
    const stats = await statsRes.json();
    const reactCount = stats.categories.react.count;
    expect(reactCount).toBeGreaterThan(0);

    await page.goto('/');
    // "React", "React Native" and "React Query" all map to the same
    // Casebook category, so scope to the chip whose .sv-chip-text is
    // exactly "React" — a plain hasText filter on the chip itself also
    // matches the appended count span's text (e.g. "React" + "66").
    const reactLink = page
      .locator('a.sv-chip')
      .filter({ has: page.locator('.sv-chip-text', { hasText: /^React$/ }) });
    await expect(reactLink).toHaveAttribute('href', '/cases/library/?category=react');
    await expect(reactLink).toHaveAttribute('data-skill-casebook-link', 'react');
    await expect(reactLink.locator('.sv-chip-text')).toHaveText('React');
    await expect(reactLink.locator('.sv-chip-count')).toHaveText(String(reactCount));
  });

  test('unmapped skill chip is left as plain text, not a link', async ({ page }) => {
    await page.goto('/');
    // "Design Systems" spans multiple ambiguous Casebook categories and is
    // deliberately excluded from SKILL_TO_CATEGORY — it must stay a <span>.
    const chip = page.locator('.sv-chip', { hasText: 'Design Systems' });
    await expect(chip).toBeVisible();
    await expect(page.locator('a.sv-chip', { hasText: 'Design Systems' })).toHaveCount(0);
  });
});
