import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  timeout: 120_000,
  expect: { timeout: 12_000 },
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'test-report' }]],
  use: { baseURL: process.env.CLOSELY_BASE_URL ?? 'http://127.0.0.1:3091', channel: process.env.CLOSELY_BROWSER_CHANNEL ?? 'chrome', reducedMotion: 'reduce', actionTimeout: 12_000, trace: 'retain-on-failure' },
});
