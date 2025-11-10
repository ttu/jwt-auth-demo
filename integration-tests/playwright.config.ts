import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // Disable parallel execution for integration tests
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'frontend-standalone',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3003',
      },
      testMatch: '**/frontend-standalone-*.spec.ts',
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'cd ../backend && npm run dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'cd ../oauth-server && npm run dev',
      port: 3002, // Assuming oauth-server runs on 3002
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'cd ../frontend && npm run dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: 'cd ../frontend-standalone && npm run dev',
      port: 3003,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
