import { expect, test, type Page } from '@playwright/test';

interface Hook {
  run: { t: number; over: string | null; coins: number; kills: number; player: { x: number; y: number; xp: number; xpNext: number; level: number; hp: number }; weapons: unknown[]; passives: unknown[]; choices: unknown[] | null; enemies: unknown[]; stageIndex: number } | null;
  save: { coins: number; best: ({ time: number } | null)[]; cleared: boolean[]; seen: string[] };
  screen: string;
  bot(on: boolean): void;
  fast(seconds: number): void;
  give(coins: number): void;
  unlock(): void;
}
declare global { interface Window { __ynm: Hook } }

async function open(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?debug');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('[data-id=tap]')).toBeVisible();
  await expect(page.locator('.logo h1')).toHaveText('府城夜巡地圖');
  await page.click('[data-id=tap]');
  await expect(page.locator('[data-id=start]')).toBeVisible();
  return errors;
}

test('title leads to stage select with only the first stage open', async ({ page }) => {
  const errors = await open(page);
  await page.click('[data-id=start]');
  await expect(page.locator('.map-node')).toHaveCount(6);
  await expect(page.locator('[data-id=stage-0]')).toBeEnabled();
  for (let i = 1; i < 6; i++) await expect(page.locator(`[data-id=stage-${i}]`)).toBeDisabled();
  await expect(page.locator('[data-id=hero-miko]')).toBeEnabled();
  await expect(page.locator('[data-id=hero-deng]')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('a run starts, the player moves, and a level-up choice is applied', async ({ page }) => {
  const errors = await open(page);
  await page.click('[data-id=start]');
  await page.click('[data-id=go]');
  await expect(page.locator('.hud-time')).toBeVisible();
  const box = page.viewportSize()!;
  const before = await page.evaluate(() => window.__ynm.run!.player.x);
  await page.mouse.move(box.width / 2, box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.width / 2 + 80, box.height / 2, { steps: 4 });
  await page.waitForTimeout(500);
  await page.mouse.up();
  const after = await page.evaluate(() => window.__ynm.run!.player.x);
  expect(after).toBeGreaterThan(before + 20);

  await page.evaluate(() => { const pl = window.__ynm.run!.player; pl.xp = pl.xpNext; });
  await expect(page.locator('.choice')).toHaveCount(3, { timeout: 5000 }).catch(async () => expect(page.locator('.choice')).toHaveCount(4));
  const t0 = await page.evaluate(() => window.__ynm.run!.t);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__ynm.run!.t)).toBe(t0); // the run waits while choosing
  await page.click('[data-id=choice-0]');
  await expect(page.locator('#overlay')).not.toHaveClass(/open/);
  const owned = await page.evaluate(() => { const r = window.__ynm.run!; return r.weapons.length + r.passives.length + (r.weapons as { level: number }[])[0].level; });
  expect(owned).toBeGreaterThanOrEqual(3);

  await page.keyboard.press('Escape');
  await expect(page.locator('[data-id=resume]')).toBeVisible();
  await page.click('[data-id=resume]');
  await expect(page.locator('#overlay')).not.toHaveClass(/open/);
  expect(errors).toEqual([]);
});

test('a full bot run ends on the result screen and banks coins', async ({ page }) => {
  const errors = await open(page);
  await page.click('[data-id=start]');
  await page.click('[data-id=go]');
  await page.evaluate(() => { for (let i = 0; i < 15 && !window.__ynm.run!.over; i++) window.__ynm.fast(60); });
  await expect(page.locator('.result, #overlay.result')).toBeVisible();
  const info = await page.evaluate(() => ({ over: window.__ynm.run!.over, t: window.__ynm.run!.t, coins: window.__ynm.run!.coins, saved: window.__ynm.save.coins, best: window.__ynm.save.best[0], seen: window.__ynm.save.seen.length }));
  expect(['clear', 'dead']).toContain(info.over);
  expect(info.t).toBeGreaterThan(60);
  expect(info.saved).toBe(info.coins);
  expect(info.best!.time).toBeGreaterThan(60);
  expect(info.seen).toBeGreaterThan(0);
  await page.click('[data-id=title]');
  await expect(page.locator('[data-id=start]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('every stage plays for three minutes without errors', async ({ page }) => {
  const errors = await open(page);
  await page.evaluate(() => window.__ynm.unlock());
  for (let i = 0; i < 6; i++) {
    await page.click('[data-id=start]');
    await page.click(`[data-id=stage-${i}]`);
    await page.click('[data-id=go]');
    await page.evaluate(() => { window.__ynm.bot(true); window.__ynm.fast(180); });
    await page.waitForTimeout(250);
    const info = await page.evaluate(() => ({ stage: window.__ynm.run!.stageIndex, t: window.__ynm.run!.t, kills: window.__ynm.run!.kills }));
    expect(info.stage).toBe(i);
    expect(info.t).toBeGreaterThan(20);
    if (!(await page.locator('[data-id=title]').isVisible())) { await page.keyboard.press('Escape'); await page.click('[data-id=quit]'); }
    await page.click('[data-id=title]');
  }
  expect(errors).toEqual([]);
});

test('ema upgrades cost coins and persist', async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.__ynm.give(100));
  await page.click('[data-id=shrine]');
  await expect(page.locator('[data-id=meta-hp]')).toBeEnabled();
  await expect(page.locator('[data-id=meta-revive]')).toBeDisabled();
  await page.click('[data-id=meta-hp]');
  expect(await page.evaluate(() => window.__ynm.save.coins)).toBe(40);
  await page.reload();
  await page.click('[data-id=tap]');
  await page.click('[data-id=shrine]');
  await expect(page.locator('[data-id=meta-hp] .pips i.on')).toHaveCount(1);
});

test('English mode shows no Chinese text', async ({ page }) => {
  await open(page);
  await page.click('[data-id=settings]');
  await page.click('[data-id=lang]');
  await page.reload();
  await expect(page.locator('.logo h1')).toHaveText('Tainan Gazetteer');
  await page.click('[data-id=tap]');
  const cjk = /[㐀-鿿]/;
  const visible = async (): Promise<string> => page.evaluate(() => {
    const clone = document.getElementById('app')!.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('[data-id=lang]').forEach((el) => el.remove());
    return clone.textContent ?? '';
  });
  expect(await visible()).not.toMatch(cjk);
  await page.evaluate(() => { window.__ynm.unlock(); window.__ynm.give(5000); });
  for (const id of ['shrine', 'codex']) {
    await page.click(`[data-id=${id}]`);
    expect(await visible()).not.toMatch(cjk);
    await page.click('[data-id=back]');
  }
  await page.click('[data-id=start]');
  expect(await visible()).not.toMatch(cjk);
  await page.click('[data-id=go]');
  await page.evaluate(() => { const pl = window.__ynm.run!.player; pl.xp = pl.xpNext; });
  await expect(page.locator('.choice').first()).toBeVisible();
  expect(await visible()).not.toMatch(cjk);
});

test('the street leads to a run and back, and placed furniture is kept', async ({ page }) => {
  const errors = await open(page);
  // arrange: hold the stone lantern and set it on the floor in front of the road
  await page.click('[data-id=furniture]');
  await page.click('[data-id=furn-stoneLantern]');
  const cell = await page.evaluate(() => (window as unknown as { __ynm: { floorPoint(): [number, number] } }).__ynm.floorPoint());
  await page.mouse.click(cell[0], cell[1]);
  await page.click('[data-id=done]');
  expect(await page.evaluate(() => (window as unknown as { __ynm: { save: { placed: unknown[] } } }).__ynm.save.placed.length)).toBe(1);
  // night rounds and back to the street
  await page.click('[data-id=start]');
  await page.click('[data-id=go]');
  await page.evaluate(() => { for (let i = 0; i < 15 && !window.__ynm.run!.over; i++) window.__ynm.fast(60); });
  await page.click('[data-id=title]');
  await expect(page.locator('[data-id=start]')).toBeVisible();
  expect(await page.evaluate(() => window.__ynm.screen)).toBe('street');
  await page.reload();
  expect(await page.evaluate(() => (window as unknown as { __ynm: { save: { placed: unknown[] } } }).__ynm.save.placed.length)).toBe(1);
  expect(errors).toEqual([]);
});

test('treating someone at the stall sends them over to eat and counts once', async ({ page }) => {
  const errors = await open(page);
  type Hook = { __ynm: { give(n: number): void; stall(): void; screen: string; save: { bond: Record<string, number>; pack: string[] } } };
  await page.evaluate(() => { const y = (window as unknown as Hook).__ynm; y.give(500); y.stall(); });
  await page.click('[data-id=eater-sayo]');
  await page.click('[data-id^=food-]:not([disabled])');
  const after = await page.evaluate(() => { const y = (window as unknown as Hook).__ynm; return { screen: y.screen, bond: y.save.bond, pack: y.save.pack.length }; });
  expect(after).toEqual({ screen: 'street', bond: { sayo: 1 }, pack: 1 });
  expect(errors).toEqual([]);
});

test('the stone arch leads into the flower lane and back', async ({ page }) => {
  const errors = await open(page);
  type Hook = { __ynm: { walkTo(x: number): void; scene: string } };
  await expect(page.locator('[data-id=gate]')).toBeHidden();
  await page.evaluate(() => (window as unknown as Hook).__ynm.walkTo(1830));
  await page.click('[data-id=gate]');
  expect(await page.evaluate(() => (window as unknown as Hook).__ynm.scene)).toBe('lane');
  await page.click('[data-id=gate]');
  expect(await page.evaluate(() => (window as unknown as Hook).__ynm.scene)).toBe('street');
  expect(errors).toEqual([]);
});
