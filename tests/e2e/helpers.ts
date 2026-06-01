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
  });
}

export async function waitForCaseyCompanion(page: Page) {
  await page.waitForFunction(() => !!(window as unknown as { CaseyCompanion?: unknown }).CaseyCompanion);
}

export async function waitForCasebookAuth(page: Page) {
  await page.waitForFunction(() => !!(window as unknown as { CasebookAuth?: unknown }).CasebookAuth);
}
