import { test } from '@playwright/test';

/** Screenshot of the shop panel with every cat unlocked (special frames, ability tags). */
test('shop panel screenshot', async ({ page }) => {
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); },
    ['meowcaron.save.v1', { version: 1, macarons: 5e9, totalEarned: 5e10, allTimeEarned: 5e10, gens: { kitten: 20, apprentice: 15, baker: 10, courier: 8, patissier: 6, manager: 4, influencer: 2, deity: 1, timecat: 1, cosmic: 1, rainbow: 1 }, achievements: ['rainbow'], lastTick: Date.now() }] as const);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.hero);
  await page.waitForTimeout(600);
  await page.locator('[data-cat="rainbow"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `test-results/shot-shop-${test.info().project.name}.png` });
});
