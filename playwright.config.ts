import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import { getEnvironment } from './config/environments';

// Load .env file (if present) so TEST_ENV / BASE_URL are available
dotenv.config();

const env = getEnvironment();

export default defineConfig({
  testDir: './tests',

  // Run tests in serial (the booking flow has ordered steps)
  fullyParallel: false,

  // Fail the build on CI if test.only is accidentally left in
  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
    }],
    ['list'],
  ],

  use: {
    baseURL: env.baseUrl,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },

    // Evidence collected on failure and attached automatically by Allure
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Web-first timeouts — no hard-coded sleeps needed in tests
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Global per-test timeout safety net. Spec-level describe.configure({ timeout })
  // overrides this value, so suites with map interactions keep their 120 s budget.
  timeout: 60_000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
