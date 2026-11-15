import { test } from '@playwright/test';
test('skills', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','zh'); sessionStorage.setItem('boot','1'); } });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro');
  await page.click('[data-a="cRace"][data-k="elf"]'); await page.click('#c-go'); await page.waitForTimeout(800);
  await page.click('.nav [data-k="skills"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: process.env.OUT + '/sk.png' });
  await page.click('.nav [data-k="map"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: process.env.OUT + '/map.png' });
});
