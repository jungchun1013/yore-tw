import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './shots', timeout: 180_000, workers: 1, reporter: [['line']],
  use: { baseURL: 'http://localhost:4180', viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
    video: { mode: 'on', size: { width: 1280, height: 800 } } },
  outputDir: process.env.OUT + '/results',
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4180', reuseExistingServer: true, timeout: 120_000 },
});
