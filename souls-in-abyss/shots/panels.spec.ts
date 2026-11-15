import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 2, viewport: { width: 1280, height: 860 } });
for (const lang of ['zh', 'en']) {
  test('panels ' + lang, async ({ page }) => {
    test.setTimeout(240000);
    await seed(page, lang);
    await page.click('.nav [data-k="map"]'); await page.click('#view .node[data-k="forest"]'); await page.waitForTimeout(300);
    await page.evaluate(() => { const g = (window as any).__game; for (let i = 0; i < 1800; i++) g.tick(0.1); g.refresh(); }); // three minutes in the forest, so the map statistics have something in them
    const panel = page.locator('#view').locator('xpath=..');
    console.log(lang, await panel.evaluate(e => e.tagName + '.' + e.className + ' ' + JSON.stringify(e.getBoundingClientRect()) + ' view ' + document.querySelector('#view')!.scrollHeight + '/' + document.querySelector('#view')!.clientHeight));
    await page.mouse.move(300, 500); await page.waitForTimeout(400);
    await panel.screenshot({ path: `${OUT}/souls-mappanel-${lang}.png` });
    await page.click('.nav [data-k="equip"]'); await page.mouse.move(300, 500); await page.waitForTimeout(400);
    console.log(lang, 'equip view', await page.evaluate(() => document.querySelector('#view')!.scrollHeight + '/' + document.querySelector('#view')!.clientHeight));
    await panel.screenshot({ path: `${OUT}/souls-equippanel-${lang}.png` });
  });
}
