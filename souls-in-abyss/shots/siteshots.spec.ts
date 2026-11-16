import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off' });
test.describe('desk', () => {
  test.use({ deviceScaleFactor: 1, viewport: { width: 1280, height: 800 } });
  test('battle + create', async ({ page }) => {
    test.setTimeout(180000);
    await seed(page, 'zh', async () => { await page.screenshot({ path: `${OUT}/souls-create.png` }); });
    await page.evaluate(() => { const g = (window as any).__game; g.fastForward(600); g.befriend('owl', 'blue'); g.refresh(); });
    await page.click('.nav [data-k="map"]'); await page.click('#view .node[data-k="forest"]'); await page.waitForTimeout(6000);
    await page.evaluate(() => { const g = (window as any).__game; g.hp = g.d.hp; (g as any).down = 0; g.refresh(); });
    await page.click('.nav [data-k="bag"]'); await page.click('.hero .ttab[data-k="equip"]'); await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/souls-battle.png` });
  });
});
test.describe('phone', () => {
  test.use({ deviceScaleFactor: 1.5, viewport: { width: 360, height: 780 } });
  test('phone', async ({ page }) => {
    test.setTimeout(180000);
    await seed(page, 'zh');
    await page.evaluate(() => { const g = (window as any).__game; g.fastForward(600); g.befriend('owl', 'blue'); g.refresh(); });
    await page.click('.nav [data-k="map"]'); await page.click('#view .node[data-k="forest"]'); await page.waitForTimeout(6000);
    await page.click('.hero .ttab[data-k="info"]');
    await page.evaluate(() => { const g = (window as any).__game; g.hp = g.d.hp; (g as any).down = 0; g.refresh(); window.scrollTo(0, 0); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/souls-phone.png` });
  });
});
