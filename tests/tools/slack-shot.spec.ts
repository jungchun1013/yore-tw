import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
/** Review shots: slack HUD, a fight, the black cat's face, the energy-ball line. Run: SLACK=1 FRAMES_DIR=... npx playwright test tests/tools/slack-shot.spec.ts --project=desktop */
const K = 'meowcaron.save.v1';
const save = { version: 1, macarons: 48_000, totalEarned: 2_600_000, allTimeEarned: 2_600_000, clicks: 400, gens: { kitten: 10, apprentice: 6, baker: 4, courier: 4, patissier: 1 }, upgrades: ['kitten_t1', 'click1', 'equip_box_t1'], tutorial: ['pat', 'hire', 'upgrade', 'feed'], furnitureOwned: ['cushion', 'cattree', 'cathouse'], furnitureSlots: ['cushion', 'cattree', 'cathouse', null] };
async function boot(page: import('@playwright/test').Page) {
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, [K, { ...save, lastTick: Date.now() }] as const);
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.debug?.napper);
  await page.waitForTimeout(800);
}
test('slack hud + fight frames', async ({ page }) => {
  test.skip(!process.env.SLACK, 'set SLACK=1');
  await boot(page);
  await page.waitForFunction(() => window.__mc!.debug!.social('nap') && !!window.__mc!.debug!.napper(), null, { timeout: 40000, polling: 500 });
  await page.evaluate(() => window.__mc!.debug!.social('rest'));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.__mc!.debug!.social('fight'));
  const dir = path.join(process.env.FRAMES_DIR ?? 'test-results', 'fight-frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  for (let i = 0; i < 70; i++) { await page.screenshot({ path: path.join(dir, `f${String(i).padStart(3, '0')}_${Date.now() - t0}.png`), clip: { x: 0, y: 0, width: 800, height: 720 }, animations: 'allow' }); await new Promise((r) => setTimeout(r, 90)); }
  await page.screenshot({ path: 'docs/screenshots/slack-hud.png', clip: { x: 0, y: 0, width: 800, height: 720 } });
});
test('black cat face', async ({ page }) => {
  test.skip(!process.env.SLACK, 'set SLACK=1');
  await boot(page);
  const url = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 24 * 4 + 8; c.height = 24; const x = c.getContext('2d')!; x.imageSmoothingEnabled = false; ['open', 'blink', 'happy', 'laugh'].forEach((f, i) => x.drawImage(window.__mc!.sprites.catCanvas('black', 'cap', f as never), i * 26, 0)); return c.toDataURL(); });
  await page.setContent(`<body style="margin:0;background:#F0D6C6"><img src="${url}" style="image-rendering:pixelated;width:${(24 * 4 + 8) * 8}px;height:${24 * 8}px"></body>`);
  await page.locator('img').screenshot({ path: 'docs/screenshots/black-cat-face.png' });
});
