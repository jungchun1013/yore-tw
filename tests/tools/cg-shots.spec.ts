import { test } from '@playwright/test';
/** CrazyGames store screenshots at 1920×1080, zh + en. Run: CG=1 npx playwright test tests/tools/cg-shots.spec.ts --project=desktop */
const K = 'meowcaron.save.v1';
const now = () => Date.now();
const mid = { version: 1, macarons: 48_000, totalEarned: 2_600_000, allTimeEarned: 2_600_000, clicks: 400, gens: { kitten: 12, apprentice: 8, baker: 5, courier: 3, patissier: 1 }, upgrades: ['kitten_t1', 'click1', 'equip_mixer_t1'], tutorial: ['pat', 'hire', 'upgrade', 'feed'], furnitureOwned: ['cushion', 'cattree', 'cathouse'], furnitureSlots: ['cushion', 'cattree', 'cathouse', null] };
const late = { version: 1, macarons: 3e9, totalEarned: 8e10, allTimeEarned: 8e10, clicks: 6000, gens: { kitten: 40, apprentice: 25, baker: 20, courier: 15, patissier: 10, manager: 8, influencer: 4, deity: 3, timecat: 2, cosmic: 1 }, upgrades: ['kitten_t1', 'kitten_t2', 'click1', 'click2', 'click3', 'equip_mixer_t1', 'equip_piping_t1', 'equip_oven_t1', 'equip_box_t1', 'equip_mixer_t2', 'equip_piping_t2', 'equip_oven_t2', 'equip_box_t2'], tutorial: ['pat', 'hire', 'upgrade', 'feed'], furnitureOwned: ['cushion', 'cattree', 'cathouse', 'tent', 'scratcher', 'hangball'], furnitureSlots: ['scratcher', 'cattree', 'cathouse', 'hangball'], followers: 4200, stars: 3 };

for (const lang of ['zh', 'en'] as const) {
  const boot = async (page: import('@playwright/test').Page, save: Record<string, unknown> | null) => {
    await page.addInitScript(([k, s, l]) => { localStorage.clear(); if (s) localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', l as string); }, [K, save, lang] as const);
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForFunction(() => !!window.__mc?.hero);
    await page.addStyleTag({ content: '#ad-banner{display:none!important}' }); // the dev placeholder is not part of the product
    await page.waitForTimeout(1500);
  };
  test(`cg ${lang} 1 fresh start`, async ({ page }) => {
    test.skip(!process.env.CG, 'set CG=1');
    await boot(page, null);
    await page.screenshot({ path: `docs/crazygames/screenshot-1-start-${lang}.png` });
  });
  test(`cg ${lang} 2 mid game`, async ({ page }) => {
    test.skip(!process.env.CG, 'set CG=1');
    await boot(page, { ...mid, lastTick: now() });
    await page.screenshot({ path: `docs/crazygames/screenshot-2-midgame-${lang}.png` });
  });
  test(`cg ${lang} 3 journal`, async ({ page }) => {
    test.skip(!process.env.CG, 'set CG=1');
    await boot(page, { ...mid, lastTick: now() });
    await page.locator('[data-cat="baker"] .info').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `docs/crazygames/screenshot-3-journal-${lang}.png` });
  });
  test(`cg ${lang} 4 furniture`, async ({ page }) => {
    test.skip(!process.env.CG, 'set CG=1');
    await boot(page, { ...late, lastTick: now() });
    await page.locator('#btn-furniture').click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `docs/crazygames/screenshot-4-furniture-${lang}.png` });
  });
  test(`cg ${lang} 5 late game abilities`, async ({ page }) => {
    test.skip(!process.env.CG, 'set CG=1');
    await boot(page, { ...late, lastTick: now() });
    await page.evaluate(() => { window.__mc!.debug!.bless(); window.__mc!.debug!.timeSkip(); });
    await page.waitForTimeout(900);
    await page.evaluate(() => window.__mc!.debug!.shootStar());
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `docs/crazygames/screenshot-5-lategame-${lang}.png` });
  });
}
