import { test, devices } from '@playwright/test';
test.use({ ...devices['Pixel 5'], video: 'off' });
for (const lang of ['en', 'zh']) test('create ' + lang, async ({ page }) => {
  await page.addInitScript((l) => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', l); sessionStorage.setItem('boot','1'); } }, lang);
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.OUT}/cr-${lang}.png`, fullPage: true });
});
