import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
/** Films the production line (belt items changing at each station) at packaging tier 0 and 3. Run: BELT=1 npx playwright test tests/tools/belt-shot.spec.ts --project=desktop */
const base = { version: 1, macarons: 5e6, totalEarned: 5e9, allTimeEarned: 5e9, clicks: 400, gens: { kitten: 12, apprentice: 8, baker: 5, courier: 3, patissier: 2 }, tutorial: ['pat', 'hire', 'upgrade', 'feed'] };
for (const tier of [1, 3]) {
  test(`belt tier ${tier}`, async ({ page }) => {
    test.skip(!process.env.BELT, 'set BELT=1');
    const dir = path.join(process.env.FRAMES_DIR ?? 'test-results', `belt-frames-${tier}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const ups = ['mixer', 'piping', 'oven', 'box'].flatMap((st) => [1, 2, 3].filter((t) => t <= tier).map((t) => `equip_${st}_t${t}`));
    await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, ['meowcaron.save.v1', { ...base, upgrades: ups, lastTick: Date.now() }] as const);
    await page.setViewportSize({ width: 1200, height: 720 });
    await page.goto('/');
    await page.waitForFunction(() => !!window.__mc?.hero);
    await page.waitForTimeout(1200);
    const box = (await page.locator('#game canvas').boundingBox())!;
    const pos = await page.evaluate(() => window.__mc!.hero!());
    const t0 = Date.now();
    for (let i = 0; i < 60; i++) {
      if (i % 4 === 0) await page.mouse.click(box.x + pos.x, box.y + pos.y);
      await page.screenshot({ path: path.join(dir, `f${String(i).padStart(3, '0')}_${Date.now() - t0}.png`), clip: { x: 160, y: 220, width: 560, height: 440 }, animations: 'allow' });
      await new Promise((r) => setTimeout(r, 70));
    }
  });
}
