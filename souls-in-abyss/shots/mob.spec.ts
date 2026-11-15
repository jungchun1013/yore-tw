import { test, devices } from '@playwright/test';
test.use({ ...devices['Pixel 5'], video: 'off' });
test('mobile', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','zh'); sessionStorage.setItem('boot','1'); } });
  await page.goto('/');
  await page.screenshot({ path: process.env.OUT + '/m-title.png', fullPage: true });
  await page.click('#t-play'); await page.click('.intro');
  await page.screenshot({ path: process.env.OUT + '/m-create.png', fullPage: true });
  await page.click('[data-a="cRace"][data-k="elf"]'); await page.click('#c-go');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: process.env.OUT + '/m-game.png', fullPage: true });
});
test('desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','zh'); sessionStorage.setItem('boot','1'); } });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro');
  await page.click('[data-a="cRace"][data-k="elf"]'); await page.click('#c-go');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: process.env.OUT + '/d-game.png' });
});
