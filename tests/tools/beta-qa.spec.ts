import { test, expect, type Page } from '@playwright/test';
/** Beta hardening pass: stress scenarios that must run without console/page errors. Run: QA=1 npx playwright test tests/tools/beta-qa.spec.ts --project=desktop */
const SAVE = 'meowcaron.save.v1';
const errors: string[] = [];
async function boot(page: Page, save?: Record<string, unknown>, lang = 'zh') {
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.addInitScript(([k, s, l]) => { if (sessionStorage.getItem('qa-seeded')) return; sessionStorage.setItem('qa-seeded', '1'); localStorage.clear(); if (s) localStorage.setItem(k as string, JSON.stringify(s)); localStorage.setItem('meowcaron.lang', l as string); }, [SAVE, save ?? null, lang] as const);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.hero);
}
const rich = { version: 1, macarons: 1e12, totalEarned: 1e12, allTimeEarned: 1e12, clicks: 5000, gens: { kitten: 60, apprentice: 40, baker: 30, courier: 20, patissier: 15, manager: 10, influencer: 5, deity: 3, timecat: 2, cosmic: 1 }, upgrades: [], furnitureOwned: ['cushion', 'cattree', 'cathouse', 'tent', 'bed', 'fish'], furnitureSlots: ['cushion', 'cattree', 'cathouse', 'tent'], lastTick: Date.now() };
test.beforeEach(() => { errors.length = 0; });
test.afterEach(() => { expect(errors, errors.join('\n')).toEqual([]); });

test('resize storm: desktop → phone → landscape → tablet with a full shop', async ({ page }) => {
  test.skip(!process.env.QA, 'set QA=1');
  await boot(page, rich);
  for (const [w, h] of [[1280, 800], [390, 844], [844, 390], [768, 1024], [1024, 768], [375, 667], [1440, 900]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(700);
    const bad = await page.evaluate(() => { const c = document.querySelector('#game canvas') as HTMLCanvasElement; const r = c.getBoundingClientRect(); return { w: r.width, h: r.height, roamer: window.__mc!.debug!.roamer() }; });
    expect(bad.w).toBeGreaterThan(100); expect(bad.h).toBeGreaterThan(100);
    if (bad.roamer) { expect(bad.roamer.x).toBeGreaterThan(-50); expect(bad.roamer.x).toBeLessThan(bad.w + 50); }
  }
});

test('rapid taps, max buys, every upgrade, prestige: numbers stay finite', async ({ page }) => {
  test.skip(!process.env.QA, 'set QA=1');
  await boot(page, rich);
  const box = (await page.locator('#game canvas').boundingBox())!;
  const pos = await page.evaluate(() => window.__mc!.hero!());
  for (let i = 0; i < 60; i++) await page.mouse.click(box.x + pos.x, box.y + pos.y, { delay: 5 });
  await page.locator('#buy-amount [data-n="max"]').click();
  // the list re-renders while buying, so drive it through the controller like rapid taps would
  for (let round = 0; round < 3; round++) {
    await page.evaluate(() => { const c = window.__mc!.ctrl; for (const g of window.__mc!.content.CATS) c.buyGen(g.id, 'max'); });
    await page.waitForTimeout(250);
    for (let k = 0; k < 40; k++) { const u = page.locator('[data-upgrade]:not(.cant)').first(); if (!(await u.count())) break; await u.click({ timeout: 2000 }).catch(() => undefined); await page.waitForTimeout(120); }
  }
  const s = await page.evaluate(() => JSON.parse(JSON.stringify(window.__mc!.ctrl.state)));
  for (const [k, v] of Object.entries(s)) if (typeof v === 'number') expect(Number.isFinite(v), k).toBe(true);
  await expect(page.locator('#hud-macarons')).not.toContainText('NaN');
  await page.locator('#btn-prestige').click();
  await page.locator('#btn-prestige-confirm').click();
  await page.waitForTimeout(1500);
  const s2 = await page.evaluate(() => JSON.parse(JSON.stringify(window.__mc!.ctrl.state)));
  expect(s2.stars).toBeGreaterThan(0);
  expect(s2.furnitureOwned.length).toBe(6);
});

test('old save without new fields migrates; huge offline gap is capped', async ({ page }) => {
  test.skip(!process.env.QA, 'set QA=1');
  await boot(page, { version: 1, macarons: 500, totalEarned: 500, allTimeEarned: 500, gens: { kitten: 5 }, lastTick: Date.now() - 1000 * 3600 * 24 * 400 });
  await expect(page.locator('#offline-amount')).toBeVisible();
  const txt = await page.locator('#offline-amount').textContent();
  expect(txt).not.toContain('NaN');
  await page.locator('#btn-offline-claim').click();
  const s = await page.evaluate(() => JSON.parse(JSON.stringify(window.__mc!.ctrl.state)));
  expect(s.macarons).toBeLessThan(5 * 0.2 * 3600 * 8 * 2 + 500 + 1); // 5 kittens, 8h cap at ≤100%
  expect(Array.isArray(s.furnitureSlots)).toBe(true);
});

test('frame rate with a crowded floor stays playable', async ({ page }) => {
  test.skip(!process.env.QA, 'set QA=1');
  await boot(page, rich);
  await page.waitForTimeout(1500);
  const fps = await page.evaluate(() => new Promise<number>((res) => { let n = 0; const t0 = performance.now(); const tick = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res(n / 3); }; requestAnimationFrame(tick); }));
  console.log('fps', fps);
  expect(fps).toBeGreaterThan(25);
});

test('language switch mid-game keeps the save', async ({ page }) => {
  test.skip(!process.env.QA, 'set QA=1');
  await boot(page, rich, 'en');
  await page.locator('#btn-lang').click();
  await page.waitForFunction(() => !!window.__mc && document.documentElement.lang === 'zh-TW');
  const s = await page.evaluate(() => JSON.parse(JSON.stringify(window.__mc!.ctrl.state)));
  expect(s.gens.kitten).toBe(60);
});
