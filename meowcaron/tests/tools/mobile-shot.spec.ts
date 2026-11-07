import { test } from '@playwright/test';
/** Mobile survey: common phone/tablet viewports, portrait and landscape, zh. Run: MOBILE_SHOT=1 npx playwright test tests/tools/mobile-shot.spec.ts --project=desktop */
const save = { version: 1, macarons: 48_000, totalEarned: 2_600_000, allTimeEarned: 2_600_000, clicks: 400,
  gens: { kitten: 12, apprentice: 8, baker: 5, courier: 3, patissier: 1 }, upgrades: ['kitten_t1', 'click1', 'equip_mixer_t1'],
  furnitureOwned: ['cushion', 'cattree', 'cathouse'], furnitureSlots: ['cushion', 'cattree', 'cathouse', null], lastTick: Date.now() };
const sizes: [string, number, number][] = [['se', 375, 667], ['iphone14', 390, 844], ['pixel7', 412, 915], ['land', 844, 390], ['ipad', 768, 1024], ['ipad-land', 1024, 768]];
for (const [name, w, h] of sizes) {
  test(`mobile ${name}`, async ({ page }) => {
    test.skip(!process.env.MOBILE_SHOT, 'set MOBILE_SHOT=1');
    await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, ['meowcaron.save.v1', save] as const);
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.waitForFunction(() => !!window.__mc?.hero);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `docs/screenshots/mobile-${name}.png` });
    if (name === 'iphone14') { await page.locator('[data-cat="baker"] .info').click(); await page.waitForTimeout(400); await page.screenshot({ path: `docs/screenshots/mobile-${name}-journal.png` }); }
  });
}
