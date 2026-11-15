import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 2, viewport: { width: 1280, height: 900 } });
test('panel crops for the layout prototype', async ({ page }) => {
  test.setTimeout(180000);
  await seed(page, 'zh');
  await page.evaluate(() => { const g = (window as any).__game; g.fastForward(600); g.befriend('owl', 'blue'); g.befriend('bloom'); g.refresh(); });
  await page.click('.nav [data-k="map"]'); await page.click('#view .node[data-k="forest"]'); await page.waitForTimeout(300);
  await page.waitForTimeout(9000);
  await page.evaluate(() => { const g = (window as any).__game; g.hp = g.d.hp; (g as any).down = 0; g.refresh(); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/full-current.png` });
  await page.locator('#sheet').screenshot({ path: `${OUT}/sheet.png` });
  await page.locator('.monster .mhead').screenshot({ path: `${OUT}/mhead.png` });
  await page.locator('canvas').first().screenshot({ path: `${OUT}/stage.png` });
  await page.locator('.fight').screenshot({ path: `${OUT}/fight.png` });
  await page.locator('#petbox').screenshot({ path: `${OUT}/petbox.png` });
  await page.locator('#att').screenshot({ path: `${OUT}/att.png` });
  await page.locator('#log').screenshot({ path: `${OUT}/log.png` });
  for (const k of ['equip', 'skills', 'pets', 'bag', 'map', 'smith', 'titles', 'settings']) {
    await page.click(`.nav [data-k="${k}"]`); await page.waitForTimeout(400);
    await page.locator('#view').screenshot({ path: `${OUT}/view-${k}.png` });
  }
  await page.locator('.nav').screenshot({ path: `${OUT}/nav.png` });
});
