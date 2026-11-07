import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
/** Review shots: sunglasses (influencer + fan customers), the indigo Cosmic Cat, and the stardust rain. Run: LOOK=1 FRAMES_DIR=... */
const K = 'meowcaron.save.v1';
const save = { version: 1, macarons: 1e8, totalEarned: 5e10, allTimeEarned: 5e10, clicks: 400, gens: { kitten: 10, courier: 3, influencer: 2, cosmic: 2 }, upgrades: [], tutorial: ['pat', 'hire', 'upgrade', 'feed'] };
test('sprites', async ({ page }) => {
  test.skip(!process.env.LOOK, 'set LOOK=1');
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, [K, { ...save, lastTick: Date.now() }] as const);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.hero);
  const url = await page.evaluate(() => {
    const sp = window.__mc!.sprites; const S = (window as unknown as { __mcSpecies?: unknown }).__mcSpecies;
    void S;
    const imgs = [sp.catCanvas('graywhite', 'sunglasses'), sp.catCanvas('graywhite', 'sunglasses', 'happy'), sp.catCanvas('cosmic', 'crown'), sp.catCanvas('cosmic', 'crown', 'happy'), sp.catCanvas('black', 'cap', 'blink')];
    const c = document.createElement('canvas'); c.width = imgs.length * 26; c.height = 24; const x = c.getContext('2d')!; imgs.forEach((im, i) => x.drawImage(im, i * 26, 0)); return c.toDataURL();
  });
  await page.setContent(`<body style="margin:0;background:#F0D6C6"><img src="${url}" style="image-rendering:pixelated;width:${5 * 26 * 8}px;height:${24 * 8}px"></body>`);
  await page.locator('img').screenshot({ path: 'docs/screenshots/look-sprites.png' });
});
test('fan customers + rain', async ({ page }) => {
  test.skip(!process.env.LOOK, 'set LOOK=1');
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, [K, { ...save, followers: 3000, lastTick: Date.now() }] as const);
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.debug);
  await page.waitForTimeout(800);
  for (let i = 0; i < 3; i++) { await page.evaluate(() => window.__mc!.debug!.spawnCustomer()); await page.waitForTimeout(300); }
  await page.waitForTimeout(3500);
  await page.screenshot({ path: 'docs/screenshots/look-fans.png', clip: { x: 300, y: 380, width: 500, height: 340 } });
  const dir = path.join(process.env.FRAMES_DIR ?? 'test-results', 'rain-frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  await page.evaluate(() => window.__mc!.debug!.shootStar());
  const t0 = Date.now();
  for (let i = 0; i < 36; i++) { await page.screenshot({ path: path.join(dir, `f${String(i).padStart(3, '0')}_${Date.now() - t0}.png`), clip: { x: 0, y: 0, width: 800, height: 720 }, animations: 'allow' }); await new Promise((r) => setTimeout(r, 90)); }
});
