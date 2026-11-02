import { test } from '@playwright/test';

/**
 * Records a short scripted session as video (saved under test-results/ as video.webm) for the README GIF.
 * Run on demand:  RECORD_GIF=1 npx playwright test tests/tools/gif.spec.ts --project=desktop
 */
import * as fs from 'fs';
import * as path from 'path';

test.use({ viewport: { width: 960, height: 600 } });

const FRAMES_DIR = process.env.GIF_FRAMES_DIR ?? path.join('test-results', 'gif-frames');

test('record gameplay video', async ({ page }) => {
  test.skip(!process.env.RECORD_GIF, 'set RECORD_GIF=1 to record');
  // Frame capture loop: screenshots at ~8 fps with timestamps; a script assembles them into a GIF with PIL.
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAMES_DIR, { recursive: true });
  let recording = true;
  const t0 = Date.now();
  const capture = (async () => {
    let i = 0;
    while (recording) {
      const t = Date.now() - t0;
      try { await page.screenshot({ path: path.join(FRAMES_DIR, `f${String(i++).padStart(4, '0')}_${t}.png`), type: 'png', animations: 'allow' }); } catch { /* page closing */ }
      await new Promise((r) => setTimeout(r, 60));
    }
  })();
  const save = { version: 1, macarons: 9_000, totalEarned: 300_000, allTimeEarned: 300_000, clicks: 200,
    gens: { kitten: 10, apprentice: 6, baker: 4, courier: 2 }, upgrades: ['kitten_t1'], lastTick: Date.now() };
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); }, ['meowcaron.save.v1', save] as const);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.hero);
  const box = (await page.locator('#game canvas').boundingBox())!;
  const pos = await page.evaluate(() => window.__mc!.hero!());
  const hx = box.x + pos.x, hy = box.y + pos.y;
  await page.waitForTimeout(1200);
  for (let i = 0; i < 10; i++) { await page.mouse.click(hx + (Math.random() - 0.5) * 30, hy + (Math.random() - 0.5) * 20); await page.waitForTimeout(140); }
  await page.waitForTimeout(600);
  await page.locator('[data-buy="kitten"]').click();
  await page.waitForTimeout(700);
  await page.locator('[data-buy="baker"]').click();
  await page.waitForTimeout(700);
  await page.locator('[data-upgrade]').first().click();
  await page.waitForTimeout(900);
  for (let i = 0; i < 6; i++) { await page.mouse.click(hx, hy); await page.waitForTimeout(120); }
  await page.locator('[data-cat="baker"] .info').click();
  await page.waitForTimeout(1800);
  await page.locator('#journal-next').click();
  await page.waitForTimeout(1400);
  await page.locator('#journal-close').click();
  await page.waitForTimeout(500);
  await page.evaluate(() => { const c = window.__mc!.ctrl; c.state.totalEarned = 1e9; });
  await page.waitForTimeout(400);
  await page.locator('#btn-prestige').click();
  await page.waitForTimeout(900);
  await page.locator('#btn-prestige-confirm').click();
  await page.waitForTimeout(2600);
  recording = false;
  await capture;
});
