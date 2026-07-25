import { test, expect } from '@playwright/test';
import { resetCasebookStorage } from './helpers';

test.describe('Casey voice playback', () => {
  test.beforeEach(async ({ page }) => {
    await resetCasebookStorage(page);
  });

  test('clicking Listen requests the pre-generated audio file for the visible chapter and tone', async ({ page }) => {
    const audioRequests: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/assets/casey/voice/')) audioRequests.push(r.url());
    });

    await page.goto('/cases/key-prop-identity/');
    const voiceBtn = page.locator('.casey-coach__voice').first();
    await expect(voiceBtn).toBeVisible();
    await expect(voiceBtn).not.toHaveAttribute('aria-pressed', 'true');

    await voiceBtn.click();
    await expect(voiceBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(voiceBtn).toHaveAttribute('aria-label', 'Stop Casey voice');

    expect(audioRequests).toHaveLength(1);
    expect(audioRequests[0]).toContain('key-prop-identity/hook-junior.mp3');
  });

  test('clicking Listen again stops playback and resets button state', async ({ page }) => {
    await page.goto('/cases/key-prop-identity/');
    const voiceBtn = page.locator('.casey-coach__voice').first();

    await voiceBtn.click();
    await expect(voiceBtn).toHaveAttribute('aria-pressed', 'true');

    await voiceBtn.click();
    await expect(voiceBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(voiceBtn).toHaveAttribute('aria-label', 'Listen with Casey (text-to-speech)');
  });

  test('falls back gracefully when the pre-generated audio file is missing', async ({ page }) => {
    await page.route('**/assets/casey/voice/**', (route) => route.fulfill({ status: 404 }));

    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/cases/key-prop-identity/');
    const voiceBtn = page.locator('.casey-coach__voice').first();
    await voiceBtn.click();
    await page.waitForTimeout(500);

    // Still reaches the "speaking" state via the speechSynthesis fallback,
    // not stuck or thrown — the whole point of the fallback path.
    await expect(voiceBtn).toHaveAttribute('aria-pressed', 'true');
    expect(pageErrors).toEqual([]);
  });
});
