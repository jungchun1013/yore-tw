import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } });
test('create screen', async ({ page }) => {
  await seed(page, 'zh', async () => { await page.screenshot({ path: `${OUT}/create.png` }); });
});
test('battle per race', async ({ page }) => {
  test.setTimeout(240000);
  await seed(page, 'zh');
  await page.click('.nav [data-k="map"]'); await page.click('#view .node[data-k="forest"]'); await page.waitForTimeout(300);
  await page.evaluate(() => { const g = (window as any).__game; for (let i = 0; i < 600; i++) g.tick(0.1); g.refresh(); });
  const cv = page.locator('canvas').first();
  for (const race of ['human', 'elf', 'dwarf', 'giant', 'undead']) {
    await page.evaluate(r => { const g = (window as any).__game; g.s.race = r; g.refresh(); g.hp = g.d.hp; (g as any).down = 0; }, race);
    await page.waitForTimeout(400);
    await page.evaluate(() => { const g = (window as any).__game; g.hp = g.d.hp; (g as any).down = 0; });
    await page.waitForTimeout(900);
    await cv.screenshot({ path: `${OUT}/battle-${race}.png` });
  }
});
