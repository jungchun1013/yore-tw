import { test, expect, type Page } from '@playwright/test';

const SAVE_KEY = 'meowcaron.save.v1';

async function fresh(page: Page, save?: Record<string, unknown>) {
  await page.addInitScript(([key, s]) => {
    // runs on every navigation; only seed once per tab so reloads keep the game's own save
    if (sessionStorage.getItem('mc-seeded')) return;
    sessionStorage.setItem('mc-seeded', '1');
    localStorage.clear();
    if (s) localStorage.setItem(key as string, JSON.stringify(s));
  }, [SAVE_KEY, save ?? null] as const);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc && document.querySelector('#game canvas'));
}

async function tapHero(page: Page, times: number) {
  const canvas = page.locator('#game canvas');
  const box = (await canvas.boundingBox())!;
  await page.waitForFunction(() => !!window.__mc?.hero);
  const pos = await page.evaluate(() => window.__mc!.hero!());
  const x = box.x + pos.x, y = box.y + pos.y;
  for (let i = 0; i < times; i++) { await page.mouse.click(x, y); }
}

const state = (page: Page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__mc!.ctrl.state)));

test('first minute: pat, hire first cat, automation starts', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('#hud-macarons')).toHaveText('0');
  await tapHero(page, 16);
  const s1 = await state(page);
  expect(s1.clicks).toBeGreaterThanOrEqual(16);
  expect(s1.macarons).toBeGreaterThanOrEqual(15);
  const buy = page.locator('[data-buy="kitten"]');
  await expect(buy).toBeEnabled();
  await buy.click();
  const s2 = await state(page);
  expect(s2.gens.kitten).toBe(1);
  await page.waitForTimeout(1200);
  const s3 = await state(page);
  expect(s3.macarons).toBeGreaterThan(s2.macarons); // automation ticking
  const names = await page.evaluate(() => window.__mc!.analytics.events.map((e) => e.name));
  expect(names).toContain('game_start');
  expect(names).toContain('click');
  expect(names).toContain('buy_gen');
});

test('save persists across reload', async ({ page }) => {
  await fresh(page);
  await page.evaluate(() => { const c = window.__mc!.ctrl; c.state.macarons = 5000; c.buyGen('apprentice', 3); c.save(); });
  await page.reload();
  await page.waitForFunction(() => !!window.__mc);
  const s = await state(page);
  expect(s.gens.apprentice).toBe(3);
  expect(s.macarons).toBeGreaterThan(4000);
});

test('offline earnings: 2 hours away at 50% rate (within the 6 h full-speed window)', async ({ page }) => {
  const twoHoursAgo = Date.now() - 2 * 3600 * 1000;
  await fresh(page, { version: 1, macarons: 0, gens: { apprentice: 10 }, lastTick: twoHoursAgo, createdAt: twoHoursAgo });
  const amount = page.locator('#offline-amount');
  await expect(amount).toBeVisible();
  // 10 apprentices × 1/s × 7200s × 0.5 × 1.03 (free cushion on the floor) = 37,080
  await expect(amount).toContainText('37');
  await page.locator('#btn-offline-claim').click();
  const s = await state(page);
  expect(s.macarons).toBeGreaterThan(36_000);
  expect(s.macarons).toBeLessThan(38_500);
});

test('offline earnings doubled via (mock) rewarded ad', async ({ page }) => {
  const ago = Date.now() - 3600 * 1000;
  await fresh(page, { version: 1, macarons: 0, gens: { apprentice: 10 }, lastTick: ago, createdAt: ago });
  await page.locator('#btn-offline-double').click();
  await expect(page.locator('#offline-amount')).toBeHidden({ timeout: 5000 });
  const s = await state(page);
  expect(s.macarons).toBeGreaterThan(35_000); // 18,000 × 2
  const names = await page.evaluate(() => window.__mc!.analytics.events.map((e) => e.name));
  expect(names).toContain('rewarded_result');
});

test('prestige resets the run and grants stars', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 1e6, totalEarned: 1e9, allTimeEarned: 2.8e16, gens: { baker: 20 }, lastTick: Date.now() }); // cbrt(28) = 3.04 → 3 stars
  const btn = page.locator('#btn-prestige');
  await expect(btn).toBeEnabled();
  await expect(btn).toContainText('+3');
  await btn.click();
  await page.locator('#btn-prestige-confirm').click();
  await page.waitForFunction(() => window.__mc!.ctrl.state.prestigeCount === 1);
  const s = await state(page);
  expect(s.stars).toBe(3);
  expect(s.macarons).toBe(0);
  expect(s.gens.baker ?? 0).toBe(0);
  await expect(page.locator('#star-shop')).toBeVisible();
  await page.locator('[data-buy-star="star_kittens"]').click();
  const s2 = await state(page);
  expect(s2.starUpgrades).toContain('star_kittens');
  expect(s2.stars).toBe(2);
});

test('late game numbers render without NaN/Infinity and max-buy works', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 1e15, totalEarned: 1e15, allTimeEarned: 1e15, gens: {}, lastTick: Date.now() });
  await page.locator('#buy-amount button[data-n="max"]').click();
  for (const id of ['kitten', 'baker', 'manager', 'deity', 'cosmic']) {
    await page.evaluate(() => { window.__mc!.ctrl.state.macarons = 1e15; });
    await page.waitForTimeout(250); // let the panel re-render affordability
    await page.locator(`[data-buy="${id}"]`).click();
  }
  await page.waitForTimeout(500);
  const s = await state(page);
  expect(s.gens.cosmic).toBeGreaterThan(0);
  const text = await page.locator('#app').innerText();
  expect(text).not.toMatch(/NaN|Infinity|undefined/);
  const upgrades = page.locator('[data-upgrade]');
  await expect(upgrades.first()).toBeVisible();
  await upgrades.first().click();
  const s2 = await state(page);
  expect(s2.upgrades.length).toBe(1);
});

test('corrupt save falls back to a fresh game', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key as string, '{not json'), SAVE_KEY);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc);
  const s = await state(page);
  expect(s.macarons).toBe(0);
});

test('layout fits the viewport with no horizontal scroll', async ({ page }) => {
  await fresh(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  await expect(page.locator('#panel')).toBeVisible();
  await expect(page.locator('[data-buy="kitten"]')).toBeVisible();
  await tapHero(page, 3);
  expect((await state(page)).clicks).toBeGreaterThanOrEqual(3);
  await page.screenshot({ path: `test-results/shot-${test.info().project.name}.png` });
});

test('mid-game screenshot: crowd, upgrades, locked teaser', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 25_000, totalEarned: 400_000, allTimeEarned: 400_000, clicks: 300,
    gens: { kitten: 12, apprentice: 8, baker: 5, courier: 2 }, upgrades: ['kitten_t1', 'click1'], lastTick: Date.now() });
  await page.waitForTimeout(800);
  await expect(page.locator('[data-upgrade]').first()).toBeVisible();
  await expect(page.locator('[data-buy="patissier"]')).toBeVisible();
  await page.screenshot({ path: `test-results/shot-mid-${test.info().project.name}.png` });
});

test('no console errors or page errors during a short session', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await fresh(page);
  await tapHero(page, 20);
  await page.locator('[data-buy="kitten"]').click();
  await page.locator('#btn-rush').click();
  await page.waitForTimeout(2000);
  await page.locator('#btn-achievements').click();
  await page.keyboard.press('Escape');
  await page.locator('#modal-root').click({ position: { x: 5, y: 5 } });
  await page.locator('#btn-settings').click();
  await page.locator('#modal-root').click({ position: { x: 5, y: 5 } });
  expect(errors).toEqual([]);
});

test('walk-in customer pays a bonus when tapped', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 10_000, totalEarned: 50_000, allTimeEarned: 50_000, gens: { apprentice: 20 }, lastTick: Date.now() });
  await page.waitForFunction(() => !!window.__mc?.debug);
  await page.evaluate(() => window.__mc!.debug!.spawnCustomer());
  await page.waitForFunction(() => window.__mc!.debug!.customer()?.mode === 'browse', null, { timeout: 20_000 });
  const before = (await state(page)).macarons;
  const box = (await page.locator('#game canvas').boundingBox())!;
  const pos = (await page.evaluate(() => window.__mc!.debug!.customer()))!;
  await page.mouse.click(box.x + pos.x, box.y + pos.y);
  await page.waitForFunction(() => window.__mc!.analytics.events.some((e) => e.name === 'customer_served'));
  const after = (await state(page)).macarons;
  expect(after).toBeGreaterThan(before + 100);
  await page.waitForFunction(() => window.__mc!.debug!.customer() === null, null, { timeout: 20_000 });
});

test('petting a roaming cat triggers a reaction', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 100, totalEarned: 5_000, allTimeEarned: 5_000, gens: { kitten: 3, baker: 2, courier: 2 }, lastTick: Date.now() });
  await page.waitForFunction(() => !!window.__mc?.debug?.roamer());
  await page.waitForTimeout(600);
  const box = (await page.locator('#game canvas').boundingBox())!;
  let petted = false;
  for (let i = 0; i < 6 && !petted; i++) {
    const r = await page.evaluate(() => window.__mc!.debug!.roamer());
    if (!r) break;
    await page.mouse.click(box.x + r.x, box.y + r.y);
    petted = await page.evaluate(() => window.__mc!.analytics.events.some((e) => e.name === 'pet'));
  }
  expect(petted).toBe(true);
});


test('customer codex records visits and orders by species', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 10_000, totalEarned: 50_000, allTimeEarned: 50_000, gens: { apprentice: 20 }, lastTick: Date.now() });
  await page.waitForFunction(() => !!window.__mc?.debug);
  await page.evaluate(() => window.__mc!.debug!.spawnCustomer());
  await page.waitForFunction(() => window.__mc!.debug!.customer()?.mode === 'browse', null, { timeout: 20_000 });
  const c = (await page.evaluate(() => window.__mc!.debug!.customer()))!;
  const box = (await page.locator('#game canvas').boundingBox())!;
  await page.mouse.click(box.x + c.x, box.y + c.y);
  await page.waitForFunction(() => window.__mc!.analytics.events.some((e) => e.name === 'customer_served'));
  const s = await state(page);
  expect(s.customersSeen[c.species]).toBe(1);
  expect(s.customersServed[c.species]).toBe(1);
  await page.locator('#btn-codex').click();
  for (let i = 0; i < 8; i++) {
    if ((await page.locator('.diary-page').getAttribute('data-id')) === c.species) break;
    await page.locator('#codex-next').click();
  }
  await expect(page.locator(`.diary-page[data-id="${c.species}"]`)).not.toHaveClass(/locked/);
  await page.locator('#codex-close').click();
});

test('influencer cat posts to Meowstagram and gains followers', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 1e8, totalEarned: 1e8, allTimeEarned: 1e8, gens: { kitten: 3, influencer: 2 }, lastTick: Date.now() });
  await page.evaluate(() => { const c = window.__mc!.ctrl; c.postPhoto('mixer', 'test post'); c.diary('post', ['influencer'], 'test post about the mixer', 'kitchen'); });
  await expect(page.locator('.post')).toBeVisible();
  const s = await state(page);
  expect(s.followers).toBeGreaterThan(0);
  expect(s.posts).toBe(1);
  await expect(page.locator('#gram-badge')).toBeVisible();
});

test('late cats have abilities: blessing, time skip, stardust rain; moments are posted to the feed', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 1e9, totalEarned: 1e9, allTimeEarned: 1e9, gens: { kitten: 4, baker: 3, influencer: 1, deity: 2, timecat: 1, cosmic: 1 }, lastTick: Date.now() });
  await page.waitForFunction(() => !!window.__mc?.debug?.bless);
  const before = (await state(page)).macarons;
  await page.evaluate(() => window.__mc!.debug!.bless());
  let s = await state(page);
  expect(s.blessedUntil).toBeGreaterThan(Date.now());
  expect(s.blessMult).toBeCloseTo(1.6, 2);
  expect(s.macarons).toBeGreaterThan(before);
  await page.evaluate(() => window.__mc!.debug!.timeSkip());
  s = await state(page);
  expect(s.warpUntil).toBeGreaterThan(Date.now());
  expect(s.warpMult).toBe(2);
  expect(s.diary.some((d: { kind: string }) => d.kind === 'timeskip')).toBe(true);
  const box = (await page.locator('#game canvas').boundingBox())!;
  const bankBefore = s.macarons;
  await page.evaluate(() => window.__mc!.debug!.shootStar()); // stardust rain: banks one stardust by itself and pays a burst
  await page.waitForFunction(() => window.__mc!.ctrl.state.starFragments === 1, null, { timeout: 5000 });
  s = await state(page);
  expect(s.starFragments).toBe(1);
  expect(s.macarons).toBeGreaterThan(bankBefore);
  void box;
  await page.evaluate(() => window.__mc!.debug!.social('cuddle'));
  await page.waitForFunction(() => window.__mc!.ctrl.state.diary.some((d) => d.kind === 'cuddle'), null, { timeout: 20_000 });
  await page.locator('#btn-feed').click();
  await expect(page.locator('.feed-post').first()).toBeVisible();
  expect(await page.locator('.feed-post').count()).toBeGreaterThanOrEqual(4);
});

test('feed stays closed until an Influencer Cat is hired', async ({ page }) => {
  await fresh(page);
  await page.locator('#btn-feed').click();
  await expect(page.locator('.feed-locked')).toBeVisible();
});

test('rainbow cat easter egg: 12 quick pats', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 100, totalEarned: 500, allTimeEarned: 500, gens: { kitten: 2 }, lastTick: Date.now() });
  await tapHero(page, 26);
  await page.waitForFunction(() => window.__mc!.analytics.events.some((e) => e.name === 'rainbow'));
  const s = await state(page);
  expect(s.achievements).toContain('rainbow');
  expect(s.diary.some((d: { kind: string }) => d.kind === 'rainbow')).toBe(true);
  // the secret cat is now for hire
  await expect(page.locator('[data-cat="rainbow"]')).toBeVisible();
  await expect(page.locator('[data-cat="rainbow"]')).toHaveClass(/tone-rainbow/);
});

test('furniture: buy, auto-place, put away; floor shows what is placed', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 200_000, totalEarned: 200_000, allTimeEarned: 200_000, gens: { kitten: 3 }, lastTick: Date.now() });
  await page.waitForFunction(() => !!window.__mc?.debug?.furniture);
  expect(await page.evaluate(() => window.__mc!.debug!.furniture())).toEqual(['cushion']); // the free cushion
  await page.locator('#btn-furniture').click();
  await page.locator('[data-buy-furniture="cattree"]').click();
  await page.locator('[data-buy-furniture="cathouse"]').click();
  let s = await state(page);
  expect(s.furnitureOwned).toEqual(expect.arrayContaining(['cushion', 'cattree', 'cathouse']));
  expect(s.furnitureSlots.filter(Boolean).length).toBe(3);
  expect(s.macarons).toBeLessThan(200_000 - 150_000 + 200); // kittens keep baking during the test
  await page.waitForTimeout(300);
  expect((await page.evaluate(() => window.__mc!.debug!.furniture())).sort()).toEqual(['cathouse', 'cattree', 'cushion']);
  // put the cushion away
  await page.locator('.furn-row[data-furniture="cushion"] .btn').click();
  s = await state(page);
  expect(s.furnitureSlots.includes('cushion')).toBe(false);
  await page.locator('#furniture-close').click();
});

test('Traditional Chinese: language toggle localizes UI, names and numbers', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 123_456, totalEarned: 123_456, allTimeEarned: 123_456, gens: { kitten: 3 }, lastTick: Date.now() });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('#btn-settings').click(); await page.locator('#btn-lang-switch').click(); // language lives in Settings; saves, flips and reloads
  await page.waitForFunction(() => !!window.__mc && document.documentElement.lang === 'zh-TW');
  await expect(page.locator('.hud-unit')).toHaveText('個馬卡龍');
  await expect(page.locator('#hud-macarons')).toContainText('萬'); // 12.35萬 (trailing zeros trimmed: 5萬 not 5.00萬)
  await expect(page.locator('.cat[data-cat="kitten"] .name')).toContainText('小奶貓');
  await expect(page.locator('.cat[data-cat="kitten"] .btn.buy')).toContainText('雇用');
  await page.locator('#btn-journal').click();
  await expect(page.locator('.journal-name')).toHaveText('麻糬');
  await page.locator('#journal-close').click();
  await page.locator('#btn-settings').click();
  await page.locator('#btn-lang-switch').click();
  await page.waitForFunction(() => !!window.__mc && document.documentElement.lang === 'en');
  await expect(page.locator('.cat[data-cat="kitten"] .name')).toContainText('Kitten');
});

test('cat tree: a resting cat climbs from the foot to the top and back down', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 100_000, totalEarned: 100_000, allTimeEarned: 100_000, gens: { kitten: 2 }, furnitureOwned: ['cushion', 'cattree'], furnitureSlots: ['cushion', 'cattree', null, null], lastTick: Date.now() });
  await page.waitForFunction(() => !!window.__mc?.debug?.climber);
  // keep asking until one cat picks the tree, then watch it rise
  await page.waitForFunction(() => window.__mc!.debug!.social('rest') && !!window.__mc!.debug!.climber(), null, { timeout: 40000, polling: 400 });
  const seen = await page.evaluate(async () => {
    const ys: number[] = []; const modes: string[] = [];
    for (let i = 0; i < 400; i++) { const c = window.__mc!.debug!.climber(); if (!c) break; ys.push(c.y); modes.push(c.mode); await new Promise((r) => setTimeout(r, 100)); if (modes.includes("climb") && c.mode === "rest") break; } // the tree sits high up now: allow a long walk
    return { ys, modes };
  });
  expect(seen.modes).toContain('climb');
  expect(seen.modes[seen.modes.length - 1]).toBe('rest');
  const climbYs = seen.ys.filter((_, i) => seen.modes[i] === 'climb');
  expect(climbYs[0]).toBeGreaterThan(climbYs[climbYs.length - 1]); // y decreases: bottom → top
});

test('onboarding: pat → hire → upgrade coach prompts, then the feed prompt with an Influencer Cat', async ({ page }) => {
  await fresh(page);
  await expect(page.locator('.coach[data-step="pat"]')).toBeVisible();
  await tapHero(page, 3);
  await expect(page.locator('.coach[data-step="pat"]')).toHaveCount(0);
  await tapHero(page, 15);
  await expect(page.locator('.coach[data-step="hire"]')).toBeVisible();
  await page.locator('[data-buy="kitten"]').click();
  await expect(page.locator('.coach[data-step="hire"]')).toHaveCount(0);
  await page.evaluate(() => { window.__mc!.ctrl.state.macarons = 500; });
  await expect(page.locator('.coach[data-step="upgrade"]')).toBeVisible();
  await page.locator('[data-upgrade]').first().click();
  await expect(page.locator('.coach[data-step="upgrade"]')).toHaveCount(0);
  const s = await state(page);
  expect(s.tutorial).toEqual(expect.arrayContaining(['pat', 'hire', 'upgrade']));
  await page.reload();
  await page.waitForFunction(() => !!window.__mc?.hero);
  await page.waitForTimeout(400);
  await expect(page.locator('.coach')).toHaveCount(0); // nothing repeats
});

test('onboarding: feed prompt appears with the Influencer Cat and ends when the feed opens', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 10, totalEarned: 5e6, allTimeEarned: 5e6, clicks: 50, gens: { kitten: 5, influencer: 1 }, upgrades: ['kitten_t1'], tutorial: ['pat', 'hire', 'upgrade'], lastTick: Date.now() });
  await expect(page.locator('.coach[data-step="feed"]')).toBeVisible();
  await page.locator('#btn-feed').click();
  await expect(page.locator('.coach')).toHaveCount(0);
  await page.locator('#feed-close').click();
  expect((await state(page)).tutorial).toContain('feed');
});

test('patting heat: after Soft paws, steady tapping lifts passive production and shows the heat pill', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 200, totalEarned: 200, allTimeEarned: 200, clicks: 10, gens: { kitten: 10 }, tutorial: ['pat', 'hire', 'upgrade'], lastTick: Date.now() });
  await expect(page.locator('#heat-badge')).toBeHidden();
  await page.locator('[data-upgrade="click1"]').click();
  await tapHero(page, 50);
  const s = await state(page);
  expect(s.heat).toBeGreaterThan(2.9); // 50 pats × 0.06 % = 3 %
  expect(s.heat).toBeLessThan(3.1);
  await expect(page.locator('#heat-badge')).toBeVisible();
  await expect(page.locator('#heat-badge')).toContainText('3');
  const cpsHot = await page.evaluate(() => window.__mc!.ctrl.cps());
  await page.waitForTimeout(6500); // 3 s grace, then it cools 1 %/s
  const s2 = await state(page);
  expect(s2.heat).toBeLessThan(s.heat);
  const cpsCool = await page.evaluate(() => window.__mc!.ctrl.cps());
  expect(cpsCool).toBeLessThan(cpsHot);
});

test('slacking: a napping cat lowers production and lights the ↓ indicator; tapping it ends the slack', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 1000, totalEarned: 300_000, allTimeEarned: 300_000, clicks: 50, gens: { kitten: 6, apprentice: 3 }, tutorial: ['pat', 'hire', 'upgrade'], furnitureOwned: ['cushion'], furnitureSlots: [null, null, 'cushion', null], lastTick: Date.now() });
  await page.waitForFunction(() => !!window.__mc?.debug?.napper);
  const cpsBefore = await page.evaluate(() => window.__mc!.ctrl.cps());
  await page.waitForFunction(() => window.__mc!.debug!.social('nap') && !!window.__mc!.debug!.napper(), null, { timeout: 40000, polling: 500 });
  await expect(page.locator('#hud-slack')).toBeVisible();
  await expect(page.locator('#hud-slack')).toContainText('↓');
  const s = await state(page);
  expect(s.slack.nap).toBeGreaterThanOrEqual(1);
  const cpsSlack = await page.evaluate(() => window.__mc!.ctrl.cps());
  expect(cpsSlack).toBeLessThan(cpsBefore);
  // tap the sleeper (another cat may be walking across it and take the tap, as it would for a player: tap again)
  const box = (await page.locator('#game canvas').boundingBox())!;
  for (let attempt = 0; attempt < 4; attempt++) {
    const n = await page.evaluate(() => window.__mc!.debug!.napper());
    if (!n) break;
    await page.mouse.click(box.x + n.x, box.y + n.y);
    await page.waitForTimeout(700);
  }
  await page.waitForFunction(() => window.__mc!.ctrl.state.slack.nap === 0, null, { timeout: 5000 });
  await expect(page.locator('#hud-slack')).toBeHidden();
});

test('rainbow energy bar: the ×2 effect drains over time and steady tapping refills it (capped at 2×)', async ({ page }) => {
  await fresh(page, { version: 1, macarons: 1e8, totalEarned: 1e9, allTimeEarned: 1e9, clicks: 400, gens: { kitten: 10, rainbow: 1 }, achievements: ['rainbow'], tutorial: ['pat', 'hire', 'upgrade', 'feed'], lastTick: Date.now() });
  await page.waitForFunction(() => !!window.__mc?.debug?.rainbow);
  const base = await page.evaluate(() => window.__mc!.ctrl.cps());
  await page.evaluate(() => window.__mc!.debug!.rainbow());
  const e0 = await page.evaluate(() => window.__mc!.ctrl.rainbowEnergy);
  expect(e0).toBeGreaterThan(0.9);
  const boosted = await page.evaluate(() => window.__mc!.ctrl.cps());
  expect(boosted).toBeGreaterThan(base * 1.9);
  await page.waitForTimeout(2000);
  const e1 = await page.evaluate(() => window.__mc!.ctrl.rainbowEnergy);
  expect(e1).toBeLessThan(e0 - 0.1); // drained about 20 %
  await tapHero(page, 12); // quick pats refill
  const e2 = await page.evaluate(() => window.__mc!.ctrl.rainbowEnergy);
  expect(e2).toBeGreaterThan(e1);
  expect(e2).toBeLessThanOrEqual(1);
});
