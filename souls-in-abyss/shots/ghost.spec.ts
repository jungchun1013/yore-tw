import { test } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 2 });
test('ghost', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','zh'); sessionStorage.setItem('boot','1'); } });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go'); await page.waitForTimeout(800);
  await page.locator('.doll').screenshot({ path: `${process.env.OUT}/ghost.png` });
});
