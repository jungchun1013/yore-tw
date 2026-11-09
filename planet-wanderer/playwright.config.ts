import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PW_PORT || 4190);

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${port}` },
  webServer: { command: `npm run build && npm run preview -- --port ${port}`, url: `http://localhost:${port}`, reuseExistingServer: !process.env.PW_PORT, timeout: 120_000 },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
