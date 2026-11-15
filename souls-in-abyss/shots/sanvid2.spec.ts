import { test } from '@playwright/test';
const fresh = (lang: string) => {
  if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', lang); sessionStorage.setItem('boot', '1'); }
};
test('san vignette video', async ({ page }) => {
  await page.addInitScript(fresh, 'zh');
  await page.goto('/');
  await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go');
  await page.evaluate(`(() => { const g = __game, s = g.s; s.lvl = 30; s.legacy.str = 3000; g.refresh(); g.hp = g.d.hp; })()`);
  await page.waitForTimeout(1500);
  await page.evaluate(`__game.setSan(40)`); await page.screenshot({ path: process.env.OUT + '/v40.png' }); await page.waitForTimeout(8000);
  await page.evaluate(`__game.setSan(20)`); await page.waitForTimeout(6000);
  await page.evaluate(`__game.setSan(3)`); await page.waitForTimeout(800); await page.screenshot({ path: process.env.OUT + '/v3.png' }); await page.waitForTimeout(6000);
});
