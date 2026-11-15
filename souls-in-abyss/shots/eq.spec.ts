import { test } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 2 });
test('worn row', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('yore.lang', 'en'); });
  await page.goto('/');
  await page.locator('.cog').click(); await page.waitForTimeout(150);
  await page.screenshot({ path: `${process.env.OUT}/btn-title-360.png` });
  await page.click('#t-play'); await page.click('.intro'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.OUT}/btn-create-360.png` });
  await page.click('#c-go'); await page.waitForTimeout(300);
  await page.evaluate(() => { const g = (window as any).__game; g.s.bag.push({ uid: 999999, kind: 'head', weight: 'heavy', ilvl: 10, rarity: 4, plus: 3, affixes: [], name: 0 }); g.refresh(); });
  await page.click('.nav [data-k="bag"]'); await page.click('[data-a="equip"][data-uid="999999"]');
  await page.click('.nav [data-k="equip"]'); await page.click('.doll [data-k="head"]'); await page.waitForTimeout(250);
  console.log(await page.locator('#view [data-a="unequip"]').evaluateAll(n => n.map(b => b.getBoundingClientRect().width)));
  await page.locator('.side').screenshot({ path: `${process.env.OUT}/btn-equip-360.png` });
});
