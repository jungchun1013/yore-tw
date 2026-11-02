import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
/** Review: the two toys in use, a post photo for each spot, fans with shades bubbles. Run: TOYS=1 FRAMES_DIR=... */
const K = 'meowcaron.save.v1';
const save = { version: 1, macarons: 1e7, totalEarned: 5e7, allTimeEarned: 5e7, clicks: 400, gens: { kitten: 8, apprentice: 4, courier: 3, deity: 1, influencer: 1 }, upgrades: [], tutorial: ['pat', 'hire', 'upgrade', 'feed'], furnitureOwned: ['cushion', 'scratcher', 'hangball', 'cathouse'], furnitureSlots: ['scratcher', 'hangball', 'cushion', 'cathouse'], followers: 2000 };
test('toys in use + fans', async ({ page }) => {
  test.skip(!process.env.TOYS, 'set TOYS=1');
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, [K, { ...save, lastTick: Date.now() }] as const);
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.debug);
  await page.waitForTimeout(600);
  // a post brings a crowd of fans
  await page.evaluate(() => { const c = window.__mc!.ctrl; c.abilityReadyAt['influencer'] = 0; });
  const dir = path.join(process.env.FRAMES_DIR ?? 'test-results', 'toys-frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  for (let i = 0; i < 110; i++) { await page.screenshot({ path: path.join(dir, `f${String(i).padStart(3, '0')}_${Date.now() - t0}.png`), clip: { x: 0, y: 100, width: 800, height: 620 }, animations: 'allow' }); await new Promise((r) => setTimeout(r, 120)); }
  await page.screenshot({ path: 'docs/screenshots/toys.png', clip: { x: 0, y: 100, width: 800, height: 620 } });
});
