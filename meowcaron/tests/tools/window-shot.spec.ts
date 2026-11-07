import { test } from '@playwright/test';
/** Sends cats to rest until one picks the window, then shoots the back-view cat at the wall. Run: WIN=1 */
test('window cat', async ({ page }) => {
  test.skip(!process.env.WIN, 'set WIN=1');
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, ['meowcaron.save.v1', { version: 1, macarons: 1e6, totalEarned: 5e6, allTimeEarned: 5e6, clicks: 100, gens: { kitten: 8, courier: 3, baker: 2 }, tutorial: ['pat', 'hire', 'upgrade', 'feed'], furnitureOwned: ['cushion', 'cattree'], furnitureSlots: ['cushion', 'cattree', null, null], lastTick: Date.now() }] as const);
  await page.setViewportSize({ width: 1200, height: 720 });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.debug);
  await page.waitForTimeout(800);
  await page.waitForFunction(() => { window.__mc!.debug!.social('rest'); return window.__mc!.ctrl.state.slack.window > 0; }, null, { timeout: 60000, polling: 500 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/screenshots/window-cat.png', clip: { x: 0, y: 0, width: 800, height: 720 } });
});
