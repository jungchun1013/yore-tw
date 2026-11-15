import { test } from '@playwright/test';
import { seed } from './seed';
test.use({ video: 'off', deviceScaleFactor: 1 });
test('probe', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seed(page, 'zh');
  console.log(JSON.stringify(await page.evaluate(() => { const g = (window as any).__game; return { lvl: g.s.lvl, bag: g.s.bag.length, pets: g.s.pets.length, ap: g.s.ap, equip: Object.keys(g.s.equip || {}), skills: g.s.skills, age: g.s.age }; })));
  await page.waitForTimeout(20000);
  await page.screenshot({ path: `${process.env.OUT}/probe-battle.png` });
  for (const k of ['bag', 'skills', 'pets', 'map']) { await page.click(`.nav [data-k="${k}"]`); await page.waitForTimeout(300); await page.screenshot({ path: `${process.env.OUT}/probe-${k}.png` }); }
});
