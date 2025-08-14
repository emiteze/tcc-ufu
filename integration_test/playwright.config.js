// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'API Tests',
      testDir: './tests/api',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: process.env.API_BASE_URL || 'http://localhost:8080',
        extraHTTPHeaders: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
    },
    {
      name: 'Frontend Chrome',
      testDir: './tests/frontend',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'Frontend Firefox',
      testDir: './tests/frontend',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'Frontend Safari',
      testDir: './tests/frontend',
      use: { 
        ...devices['Desktop Safari'],
        baseURL: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'Frontend Mobile Chrome',
      testDir: './tests/frontend',
      use: { 
        ...devices['Pixel 5'],
        baseURL: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'Frontend Mobile Safari',
      testDir: './tests/frontend',
      use: { 
        ...devices['iPhone 12'],
        baseURL: process.env.FRONTEND_BASE_URL || 'http://localhost:3000',
      },
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
  
  /* Global setup and teardown for API tests */
  globalSetup: require.resolve('./tests/api/global-setup.js'),
  globalTeardown: require.resolve('./tests/api/global-teardown.js'),
});