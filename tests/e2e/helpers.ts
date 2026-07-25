import { type Page } from '@playwright/test';

/** Fresh companion + auth state once per browser context (survives reloads). */
export async function resetCasebookStorage(page: Page) {
  await page.addInitScript(() => {
    const key = '__casebook_test_reset__';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    localStorage.removeItem('casebook-companion-v1');
    localStorage.removeItem('casebook-auth-v1');
    localStorage.removeItem('casebook-visited');
    localStorage.setItem('casebook-tone', 'junior');
    // Pre-dismiss the first-visit onboarding tour (casey-onboarding.js) —
    // an "empty progress" reset here is meant to give every other test a
    // clean baseline, not opt every hub visit in this suite into also
    // being a first-time visitor. loadState() merges this against
    // defaultState() (Object.assign), so a partial object is safe; tests
    // that specifically want a genuine first visit (casebook-onboarding.spec.ts)
    // clear this key themselves instead of using this helper.
    localStorage.setItem('casebook-companion-v1', JSON.stringify({ dismissedTips: ['hub-onboarding-tour'] }));
  });
}

/** Like resetCasebookStorage, but leaves the onboarding tour eligible to fire (a genuine first visit). */
export async function resetCasebookStorageForOnboarding(page: Page) {
  await page.addInitScript(() => {
    const key = '__casebook_test_reset_onboarding__';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    localStorage.removeItem('casebook-companion-v1');
    localStorage.removeItem('casebook-auth-v1');
    localStorage.removeItem('casebook-visited');
    localStorage.setItem('casebook-tone', 'junior');
  });
}

export async function waitForCaseyCompanion(page: Page) {
  await page.waitForFunction(() => !!(window as unknown as { CaseyCompanion?: unknown }).CaseyCompanion);
}

export async function waitForCasebookAuth(page: Page) {
  await page.waitForFunction(() => !!(window as unknown as { CasebookAuth?: unknown }).CasebookAuth);
}
