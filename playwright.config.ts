import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Electron E2E tests
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Electron tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Electron tests should run one at a time
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'electron',
      testMatch: '**/*.e2e.ts',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],

  // Output directories
  outputDir: 'test-results/',
  snapshotDir: 'tests/e2e/snapshots/'
});
