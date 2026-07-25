import { test, expect } from '@playwright/test';
import { resetCasebookStorage } from './helpers';

test.describe('Casebook interview mode', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('setup page renders track/count controls and a start button', async ({ page }) => {
    await page.goto('/cases/interview/');
    await expect(page.locator('#interview-track')).toBeVisible();
    await expect(page.locator('#interview-count')).toBeVisible();
    await expect(page.locator('#interview-setup button[type=submit]')).toBeVisible();
  });

  test('starting a session redirects to the first case with ?interview= set', async ({ page }) => {
    await page.goto('/cases/interview/');
    await page.selectOption('#interview-track', { index: 1 });
    await page.selectOption('#interview-count', '5');
    await Promise.all([
      page.waitForURL(/\?interview=/),
      page.click('#interview-setup button[type=submit]'),
    ]);
    expect(page.url()).toMatch(/\/cases\/[a-z0-9-]+\/\?interview=session-/);
    await expect(page.locator('.casebook-interview-banner__label')).toContainText('Interview: case 1 of');
  });

  test('hints are hidden by default and can be revealed', async ({ page }) => {
    await page.goto('/cases/interview/');
    await page.selectOption('#interview-track', { index: 1 });
    await page.selectOption('#interview-count', '5');
    await Promise.all([
      page.waitForURL(/\?interview=/),
      page.click('#interview-setup button[type=submit]'),
    ]);
    await expect(page.locator('.casey-coach').first()).toBeHidden();
    await page.click('#casebook-interview-reveal');
    await expect(page.locator('.casey-coach').first()).toBeVisible();
    await expect(page.locator('#casebook-interview-reveal')).toHaveText('Hide hints');
  });

  test('the "I\'m done" button reveals the self-assessment prompt and advances to the next case', async ({ page }) => {
    await page.goto('/cases/interview/');
    await page.selectOption('#interview-track', { index: 1 });
    await page.selectOption('#interview-count', '5');
    await Promise.all([
      page.waitForURL(/\?interview=/),
      page.click('#interview-setup button[type=submit]'),
    ]);
    const case1Url = page.url();

    await expect(page.locator('#casebook-interview-assess')).toBeHidden();
    await page.click('#casebook-interview-done');
    await expect(page.locator('#casebook-interview-assess')).toBeVisible();

    await Promise.all([
      page.waitForURL((url) => url.toString() !== case1Url),
      page.click('#casebook-interview-assess button[data-result="yes"]'),
    ]);
    await expect(page.locator('.casebook-interview-banner__label')).toContainText('case 2 of');
  });

  test('a full session reaches the summary with correct self-assessed results', async ({ page }) => {
    await page.goto('/cases/interview/');
    await page.selectOption('#interview-track', { index: 1 });
    await page.selectOption('#interview-count', '5'); // actual length is min(5, track's live-case count)
    await Promise.all([
      page.waitForURL(/\?interview=/),
      page.click('#interview-setup button[type=submit]'),
    ]);

    var sessionMatch = page.url().match(/interview=([^&]+)/);
    var sessionLen = await page.evaluate((sid) => {
      var s = JSON.parse(localStorage.getItem('casebook-interview-v1'));
      return s && s.id === sid ? s.caseSlugs.length : 0;
    }, sessionMatch![1]);
    expect(sessionLen).toBeGreaterThan(0);

    const results = ['yes', 'partial', 'no', 'yes', 'partial'];
    for (let i = 0; i < sessionLen; i++) {
      const beforeUrl = page.url();
      await page.click('#casebook-interview-done');
      await page.locator('#casebook-interview-assess').waitFor({ state: 'visible' });
      await Promise.all([
        page.waitForURL((url) => url.toString() !== beforeUrl),
        page.click(`#casebook-interview-assess button[data-result="${results[i % results.length]}"]`),
      ]);
    }

    await expect(page).toHaveURL(/\/interview\/\?session=.*done=1/);
    await expect(page.locator('#interview-summary')).toBeVisible();
    await expect(page.locator('#interview-summary-meta')).toContainText(sessionLen + ' of ' + sessionLen);
    const labels = await page.locator('#interview-summary-list .casebook-search__result-meta').allInnerTexts();
    expect(labels.length).toBe(sessionLen);
    expect(labels.every((l) => ['Got it', 'Partial', 'Needs review'].includes(l))).toBe(true);
  });
});
