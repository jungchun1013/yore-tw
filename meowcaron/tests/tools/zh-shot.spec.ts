import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/** Traditional-Chinese screenshots + a cat-tree climb frame sequence. Run: ZH_SHOT=1 npx playwright test tests/tools/zh-shot.spec.ts --project=desktop */
const FRAMES_DIR = path.join('test-results', 'climb-frames');
const save = { version: 1, macarons: 48_000, totalEarned: 2_600_000, allTimeEarned: 2_600_000, clicks: 400,
  gens: { kitten: 12, apprentice: 8, baker: 5, courier: 3, patissier: 1 }, upgrades: ['kitten_t1', 'click1', 'equip_mixer_t1'],
  furnitureOwned: ['cushion', 'cattree', 'cathouse'], furnitureSlots: ['cushion', 'cattree', 'cathouse', null], lastTick: Date.now() };

test('zh screenshots', async ({ page }) => {
  test.skip(!process.env.ZH_SHOT, 'set ZH_SHOT=1');
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, ['meowcaron.save.v1', save] as const);
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.hero);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screenshots/shot-zh-desktop.png' });
  await page.locator('[data-cat="baker"] .info').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'docs/screenshots/shot-zh-journal.png' });
  await page.locator('#journal-close').click();
  await page.locator('#btn-furniture').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'docs/screenshots/shot-zh-furniture.png' });
  await page.locator('#furniture-close').click();
  await page.setViewportSize({ width: 390, height: 780 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/screenshots/shot-zh-mobile.png' });
});

test('climb frames', async ({ page }) => {
  test.skip(!process.env.ZH_SHOT, 'set ZH_SHOT=1');
  fs.rmSync(FRAMES_DIR, { recursive: true, force: true }); fs.mkdirSync(FRAMES_DIR, { recursive: true });
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, ['meowcaron.save.v1', save] as const);
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.debug?.climber);
  await page.waitForTimeout(800);
  await page.waitForFunction(() => window.__mc!.debug!.social('rest') && !!window.__mc!.debug!.climber(), null, { timeout: 20000, polling: 400 });
  // wait until the cat reaches the foot of the tree, then film the climb, the rest and the climb down
  await page.waitForFunction(() => window.__mc!.debug!.climber()?.mode === 'climb', null, { timeout: 20000, polling: 50 });
  const stage = (await page.locator('#stage').boundingBox())!;
  const clip = { x: stage.x, y: stage.y, width: Math.min(stage.width, 520), height: Math.min(stage.height, 420) };
  const t0 = Date.now();
  for (let i = 0; i < 70; i++) {
    await page.screenshot({ path: path.join(FRAMES_DIR, `f${String(i).padStart(3, '0')}_${Date.now() - t0}.png`), clip, animations: 'allow' });
    await new Promise((r) => setTimeout(r, 90));
    const c = await page.evaluate(() => window.__mc!.debug!.climber());
    if (i > 20 && !c) break; // climbed down and left
  }
});
