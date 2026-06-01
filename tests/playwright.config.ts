import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const DEPLOY_DIR = path.join(__dirname, '_deploy');
const PORT = Number(process.env.TEST_PORT || 8765);
const BASE = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `node scripts/serve-deploy.mjs`,
    url: `${BASE}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    cwd: __dirname,
    env: {
      TEST_PORT: String(PORT),
      DEPLOY_DIR,
    },
  },
});
