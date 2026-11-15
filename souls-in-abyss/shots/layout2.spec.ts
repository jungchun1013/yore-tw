import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 1 });
for (const [name, vp] of [['desk', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]] as const) {
  test(`layout ${name}`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize(vp);
    await seed(page, 'zh');
    await page.evaluate(() => { const g = (window as any).__game; g.fastForward(600); g.befriend('owl', 'blue'); g.refresh(); });
    await page.click('.nav [data-k="map"]'); await page.click('#view .node[data-k="forest"]'); await page.waitForTimeout(6000);
    await page.evaluate(() => { const g = (window as any).__game; g.hp = g.d.hp; (g as any).down = 0; g.refresh(); }); await page.waitForTimeout(500);
    await page.click('.nav [data-k="bag"]'); await page.click('.hero .ttab[data-k="info"]'); await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/l2-${name}-info.png`, fullPage: name === 'phone' });
    await page.click('.hero .ttab[data-k="equip"]'); await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/l2-${name}-equip.png`, fullPage: name === 'phone' });
    await page.click('.battle .ttab[data-k="log"]'); await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/l2-${name}-log.png`, fullPage: name === 'phone' });
  });
}
