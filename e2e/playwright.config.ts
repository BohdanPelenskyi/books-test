import { defineConfig, devices } from '@playwright/test';

const WEB_URL = process.env.E2E_WEB_URL ?? 'http://localhost:3000';
// Locally an installed browser can be used instead of a downloaded one, e.g. E2E_BROWSER_CHANNEL=chrome.
const channel = process.env.E2E_BROWSER_CHANNEL;

/**
 * Runs against an already started stack (web, API and a seeded database); the CI workflow and
 * the README describe how to start it.
 */
export default defineConfig({
  testDir: './tests',
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: WEB_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], channel } }],
});
