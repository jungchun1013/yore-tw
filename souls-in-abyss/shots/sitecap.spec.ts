import { test } from '@playwright/test';
import * as fs from 'fs';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off' });
for (const lang of ['zh', 'en']) {
  test.describe(lang, () => {
    test.use({ deviceScaleFactor: 1, viewport: { width: 1280, height: 800 } });
    test('desktop ' + lang, async ({ page }) => {
      test.setTimeout(240000);
      await seed(page, lang, async () => { await page.screenshot({ path: `${OUT}/souls-create-${lang}.png` }); });
      await page.click('.nav [data-k="map"]'); await page.click('#view .node[data-k="forest"]'); await page.waitForTimeout(300);
      await page.click('.nav [data-k="equip"]');
      await page.waitForTimeout(22000); // let the log fill at the game's own pace
      console.log(lang, JSON.stringify(await page.evaluate(() => { const g = (window as any).__game; return { lvl: g.s.lvl, area: g.s.area, cp: g.d.cp, mon: g.mon && g.mon.cp, deaths: g.s.counters.deaths }; })));
      // ten seconds of the battle page, straight from the compositor: a frame whenever the page repaints, each with its own time
      const dir = `${OUT}/frames-${lang}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
      const cdp = await page.context().newCDPSession(page); const times: number[] = [];
      cdp.on('Page.screencastFrame', f => { times.push(f.metadata.timestamp!); fs.writeFileSync(`${dir}/${String(times.length).padStart(4, '0')}.png`, Buffer.from(f.data, 'base64')); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
      await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
      await page.waitForTimeout(11000);
      await cdp.send('Page.stopScreencast'); await page.waitForTimeout(300);
      fs.writeFileSync(`${dir}/times.json`, JSON.stringify(times));
      await page.click('.nav [data-k="map"]'); await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/souls-battle-${lang}.png` });
    });
  });
  test.describe(lang + ' phone', () => {
    test.use({ deviceScaleFactor: 1.5, viewport: { width: 360, height: 780 } });
    test('phone ' + lang, async ({ page }) => {
      test.setTimeout(240000);
      await seed(page, lang);
      await page.click('.nav [data-k="map"]'); await page.click('#view .node[data-k="forest"]'); await page.waitForTimeout(300);
      await page.click('.nav [data-k="equip"]');
      await page.waitForTimeout(15000);
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/souls-phone-${lang}.png` });
    });
  });
}
