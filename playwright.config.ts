import { defineConfig, devices } from '@playwright/test';

/**
 * EduCoreOS Playwright E2E Configuration
 * Runs against live Angular frontend (http://localhost:4200),
 * live NestJS backend API (http://localhost:3001/api/v1),
 * and live PostgreSQL QA Database (127.0.0.1:52132 educoreos_db_qa).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env['BASE_URL'] || 'http://localhost:4201',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
});
