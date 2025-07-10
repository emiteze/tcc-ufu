// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false, // Disable for API tests to avoid conflicts
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1, // Single worker for API tests
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:8080',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* API request context options */
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'API Tests',
      use: { ...devices['Desktop Chrome'] },
    }
  ],

  /* Backend server management disabled - tests assume backend is already running */
  // webServer: {
  //   command: 'cd ../backend && make run-docker && sleep 5 && make run',
  //   url: 'http://localhost:8080',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 30000,
  // },

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
  
  /* Test timeout */
  timeout: 30000,
  
  /* Global setup and teardown */
  globalSetup: require.resolve('./tests/global-setup.js'),
  globalTeardown: require.resolve('./tests/global-teardown.js'),
});