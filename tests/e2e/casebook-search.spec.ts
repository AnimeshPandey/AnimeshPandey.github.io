import { test, expect } from '@playwright/test';
import { resetCasebookStorage } from './helpers';

test.describe('Casebook search', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('header trigger links to the search page from the hub', async ({ page }) => {
    await page.goto('/cases/');
    const trigger = page.getByRole('link', { name: 'Search the Casebook' });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('href', /\/search\/?/);
  });

  test('typing a query shows matching results with a live count', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'flex');
    await expect(page.locator('#casebook-search-count')).toContainText('result');
    const resultCount = await page.locator('.casebook-search__result-title').count();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('idea-status cases render as non-clickable "planned" results, not dead links', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'capture vs bubble');
    const planned = page.locator('.casebook-search__result--planned');
    await expect(planned).toHaveCount(1);
    await expect(planned.locator('a')).toHaveCount(0);
  });

  test('live cases render as real links that resolve', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'identity, not index');
    const link = page.locator('a.casebook-search__result').first();
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toMatch(/^\/cases\//);
    const res = await page.request.get(href!);
    expect(res.status()).toBe(200);
  });

  test('nonsense query shows the empty state', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'zzznonexistentqueryzzz');
    await expect(page.locator('#casebook-search-empty')).toBeVisible();
  });

  test('blank query shows neither results nor the empty state', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'test');
    await page.fill('#casebook-search-input', '');
    await expect(page.locator('#casebook-search-empty')).toBeHidden();
    await expect(page.locator('.casebook-search__result-title')).toHaveCount(0);
  });

  test('?q= deep link pre-fills the input and runs the search', async ({ page }) => {
    await page.goto('/cases/search/?q=flexbox');
    await expect(page.locator('#casebook-search-input')).toHaveValue('flexbox');
    await expect(page.locator('.casebook-search__result-title').first()).toBeVisible();
  });

  test('Casey shows an idle suggestion before typing, hides it once a query is active, and it reappears after clearing', async ({ page }) => {
    await page.goto('/cases/search/');
    const bubble = page.locator('#search-casey-bubble');
    await expect(bubble.locator('.casey-about-bubble__text')).toBeVisible();

    await page.fill('#casebook-search-input', 'flexbox');
    await expect(bubble).toBeHidden();

    await page.fill('#casebook-search-input', '');
    await expect(bubble.locator('.casey-about-bubble__text')).toBeVisible();
  });

  test('Casey shows a track-affinity suggestion grounded in real progress instead of the generic idle line', async ({ page }) => {
    await page.goto('/cases/search/');
    const live = JSON.parse(await page.locator('#search-live-cases').innerText());
    const byTrack: Record<string, string[]> = {};
    for (const c of live) (byTrack[c.track] ||= []).push(c.slug);
    const track = Object.keys(byTrack).find((t) => byTrack[t].length >= 2)!;
    const twoSlugs = byTrack[track].slice(0, 2);

    await page.evaluate((slugs) => {
      const caseProgress: Record<string, { completedAt: string }> = {};
      slugs.forEach((s: string) => (caseProgress[s] = { completedAt: new Date().toISOString() }));
      localStorage.setItem(
        'casebook-companion-v1',
        JSON.stringify({
          v: 1, tone: 'junior', visitedHub: true,
          casesStarted: [], casesCompleted: slugs,
          libraryOpened: false, lastSlug: null,
          lastVisitAt: new Date().toISOString(), previousVisitAt: new Date().toISOString(),
          milestones: [], dismissedTips: [], caseyIntensity: 'full',
          caseProgress, confettiSeenSlugs: [],
        })
      );
    }, twoSlugs);
    await page.reload({ waitUntil: 'networkidle' });

    const text = await page.locator('#search-casey-bubble .casey-about-bubble__text').innerText();
    const trackLabel = track.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    expect(text).toContain(trackLabel);
  });

  test('the zero-results message is dynamic and includes the actual query', async ({ page }) => {
    await page.goto('/cases/search/');
    await page.fill('#casebook-search-input', 'zzznonexistentqueryzzz');
    await expect(page.locator('#casebook-search-empty')).toBeVisible();
    await expect(page.locator('#casebook-search-empty .hub-empty__msg')).toContainText('zzznonexistentqueryzzz');
  });
});
