import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } });
const WANT: [string, string][] = [['nest', 'starfox'], ['nest', 'starwhale'], ['ruins', 'starstag'], ['ruins', 'scales'], ['abyss', 'reachinghand'], ['abyss', 'thegap'], ['labyrinth', 'tome'], ['mine', 'emberfox'], ['fen', 'shadowwolf'], ['forest', 'direbear']];
test('new monsters in battle', async ({ page }) => {
  test.setTimeout(300000);
  await seed(page, 'zh');
  await page.evaluate(() => { const g = (window as any).__game; g.fastForward(300); g.s.lvl = 120; g.refresh(); });
  const cv = page.locator('canvas').first();
  for (const [area, key] of WANT) {
    await page.evaluate(([a, k]) => { const g = (window as any).__game; g.s.area = a; for (let i = 0; i < 200 && g.mon?.def.key !== k; i++) g.newMonster(); g.hp = g.d.hp; (g as any).down = 0; g.refresh(); }, [area, key]);
    await page.waitForTimeout(1200);
    await page.evaluate(() => { const g = (window as any).__game; g.hp = g.d.hp; (g as any).down = 0; if (g.mon) g.mon.hp = g.mon.maxHp || g.mon.hp; });
    await cv.screenshot({ path: `${OUT}/mon-${key}.png` });
  }
});
