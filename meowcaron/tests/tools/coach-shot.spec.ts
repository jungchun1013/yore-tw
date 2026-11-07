import { test } from '@playwright/test';
/** Screenshots of each onboarding prompt. Run: COACH=1 npx playwright test tests/tools/coach-shot.spec.ts --project=desktop */
const K = 'meowcaron.save.v1';
const shots: [string, Record<string, unknown> | null, number, number][] = [
  ['pat', null, 1200, 720],
  ['pat-mobile', null, 390, 844],
  ['hire', { version: 1, macarons: 20, totalEarned: 20, allTimeEarned: 20, clicks: 20, tutorial: ['pat'], lastTick: Date.now() }, 1200, 720],
  ['upgrade', { version: 1, macarons: 300, totalEarned: 300, allTimeEarned: 300, clicks: 20, gens: { kitten: 1 }, tutorial: ['pat', 'hire'], lastTick: Date.now() }, 1200, 720],
  ['feed', { version: 1, macarons: 10, totalEarned: 5e6, allTimeEarned: 5e6, clicks: 50, gens: { kitten: 5, influencer: 1 }, upgrades: ['kitten_t1'], tutorial: ['pat', 'hire', 'upgrade'], lastTick: Date.now() }, 1200, 720],
  ['feed-mobile', { version: 1, macarons: 10, totalEarned: 5e6, allTimeEarned: 5e6, clicks: 50, gens: { kitten: 5, influencer: 1 }, upgrades: ['kitten_t1'], tutorial: ['pat', 'hire', 'upgrade'], lastTick: Date.now() }, 390, 844],
];
for (const [name, save, w, h] of shots) {
  test(`coach ${name}`, async ({ page }) => {
    test.skip(!process.env.COACH, 'set COACH=1');
    await page.addInitScript(([k, s]) => { localStorage.clear(); if (s) localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', 'zh'); }, [K, save] as const);
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await page.waitForFunction(() => !!window.__mc?.hero);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `docs/screenshots/coach-${name}.png` });
  });
}
