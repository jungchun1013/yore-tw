import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } });
test('prefixed names and the gold spirit', async ({ page }) => {
  await seed(page, 'zh');
  await page.evaluate(() => { const g = (window as any).__game; for (let i = 0; i < 60 && g.mon?.def.key !== 'hornrabbit'; i++) g.newMonster(); g.refresh(); });
  await page.waitForTimeout(800);
  console.log('name:', await page.locator('#m-name').textContent());
  await page.locator('.fight').screenshot({ path: `${OUT}/name-fawn.png` });
  await page.evaluate(() => { const g = (window as any).__game; g.fastForward(300); g.s.lvl = 90; g.s.area = 'nest'; for (let i = 0; i < 300 && g.mon?.def.key !== 'lightspirit'; i++) g.newMonster(); g.hp = g.d.hp; (g as any).down = 0; g.refresh(); });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const g = (window as any).__game; g.hp = g.d.hp; (g as any).down = 0; });
  await page.waitForTimeout(300);
  console.log('name:', await page.locator('#m-name').textContent());
  await page.locator('canvas').first().screenshot({ path: `${OUT}/mon-lightspirit.png` });
});
