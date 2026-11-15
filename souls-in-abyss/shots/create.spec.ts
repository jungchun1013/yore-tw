import { test } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 2 });
test('create', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','zh'); sessionStorage.setItem('boot','1'); } });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro');
  for (const r of ['human', 'elf', 'dwarf', 'giant', 'undead']) {
    await page.click(`[data-a="cRace"][data-k="${r}"]`); await page.waitForTimeout(300);
    await page.screenshot({ path: `${process.env.OUT}/c-${r}.png` });
  }
  await page.setViewportSize({ width: 393, height: 851 }); await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.OUT}/c-mobile.png`, fullPage: true });
});
