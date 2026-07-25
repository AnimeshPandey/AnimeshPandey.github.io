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
    // Record speechSynthesis.speak calls instead of asserting the button
    // stays "speaking" for some duration: CI's headless Chromium has no
    // TTS voices installed, so an utterance can error/end essentially
    // immediately — correct behavior when nothing can actually speak, not
    // a bug. What actually matters here is that the fallback path fires
    // and nothing throws, not how long a voice-less utterance "runs".
    await page.addInitScript(() => {
      (window as any).__speakCalls = 0;
      const realSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = (utterance) => {
        (window as any).__speakCalls++;
        return realSpeak(utterance);
      };
    });
    await page.route('**/assets/casey/voice/**', (route) => route.fulfill({ status: 404 }));

    const pageErrors: string[] = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await page.goto('/cases/key-prop-identity/');
    const voiceBtn = page.locator('.casey-coach__voice').first();
    await voiceBtn.click();

    await expect.poll(() => page.evaluate(() => (window as any).__speakCalls)).toBeGreaterThan(0);
    expect(pageErrors).toEqual([]);

    // Whatever state speechSynthesis leaves it in, the button must reflect
    // a real, stable value — not stuck, not throwing.
    await expect(voiceBtn).toHaveAttribute('aria-pressed', /^(true|false)$/);
  });
});
