import { test } from '@playwright/test';

/** Screenshot with all four furniture slots filled. */
test('furniture screenshot', async ({ page }) => {
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); },
    ['meowcaron.save.v1', { version: 1, macarons: 1e6, totalEarned: 5e6, allTimeEarned: 5e6, gens: { kitten: 8, apprentice: 6, baker: 4, courier: 2 }, furnitureOwned: ['cushion', 'cathouse', 'tent', 'fish', 'cattree'], furnitureSlots: ['cathouse', 'tent', 'fish', 'cushion'], lastTick: Date.now() }] as const);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.hero);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `test-results/shot-furn-${test.info().project.name}.png` });
});
