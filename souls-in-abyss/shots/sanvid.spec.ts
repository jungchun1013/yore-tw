import { test } from '@playwright/test';
import * as fs from 'fs';

const OUT = process.env.OUT!;
const fresh = (lang: string) => {
  if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', lang); sessionStorage.setItem('boot', '1'); }
};

test('san video', async ({ page }) => {
  await page.addInitScript(fresh, 'zh');
  await page.goto('/');
  await page.click('#t-play');
  await page.click('.intro');
  await page.click('#c-go');
  const hold = (ms: number) => page.waitForTimeout(ms);
  const ev = (f: string) => page.evaluate(f);
  await ev(`(() => { const g = __game, s = g.s; s.lvl = 30; s.peakLvl = 30; s.xp = 0; s.gold = 12345; s.legacy.str = 3000; g.refresh(); g.hp = g.d.hp; })()`);
  await hold(2500);                                   // lucid
  await ev(`__game.setSan(45)`); await hold(3500);    // edge of madness
  await ev(`__game.setSan(25)`); await hold(2500);    // shaken
  const tip = page.locator('.sheet [data-tip^="mad:"]').first();
  if (await tip.count()) { await tip.hover(); await hold(2500); await page.mouse.move(640, 790); }
  await ev(`__game.setSan(5)`); await hold(4500);     // deep madness
  // walk into the Abyss at Lv 30: one death is enough
  await ev(`(() => { const g = __game, s = g.s; s.legacy.str = 0; g.refresh(); g.hp = Math.min(g.hp, g.d.hp); s.area = 'abyss'; g.newMonster(); })()`);
  await hold(14000);
});
