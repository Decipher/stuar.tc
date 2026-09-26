import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Playwright defaults to half the host's cores, which is 9 on the runner, and
  // the log confirmed it: "Running 32 tests using 9 workers". Nine concurrent
  // Chromium instances on a shared host produced 34 test timeouts, 6 "Page
  // crashed" and 6 "Target crashed" in one run, with not a single pixel diff
  // among them - the browsers were dying, not the pages changing. Screenshot
  // comparison is timing-sensitive on top of that, so a contended worker
  // produces a spurious diff as easily as a crash. Two in CI, unconstrained
  // locally where the machine is not shared.
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['github'], ['junit', { outputFile: 'test-results/playwright-junit.xml' }], ['html', { open: 'never' }]]
    : 'list',
  expect: {
    timeout: 15_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: 'http://localhost:4000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'serve -l 4000 dist',
    url: 'http://localhost:4000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'seo',
      testMatch: /seo\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'phone',
      testMatch: /visual\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 844 } },
    },
    {
      name: 'tablet',
      testMatch: /visual\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1180 } },
    },
    {
      name: 'desktop',
      testMatch: /visual\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    {
      name: 'wide',
      testMatch: /visual\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1680, height: 900 } },
    },
  ],
})
