import { test, expect } from '@playwright/test';

test('create a hero, fight, and open every tab', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); sessionStorage.setItem('boot', '1'); } });
  await page.goto('/');
  await page.click('[data-r="elf"]');
  await page.click('#c-go');
  await expect(page.locator('#h-race')).toHaveText('精靈');

  // fast-forward a few in-game minutes so every panel has content
  await page.evaluate(() => (window as any).__game.fastForward(600));
  await page.waitForTimeout(1500);
  const kills = await page.evaluate(() => (window as any).__game.s.counters.kills);
  expect(kills).toBeGreaterThan(20);
  await expect(page.locator('#log p').first()).toBeVisible();

  for (const k of ['char', 'equip', 'smith', 'skills', 'map', 'pets', 'titles', 'rebirth']) {
    await page.click(`.tabs [data-k="${k}"]`);
    await expect(page.locator('#panel')).not.toBeEmpty();
  }
  await page.click('.tabs [data-k="skills"]');
  const ap = await page.evaluate(() => (window as any).__game.s.ap);
  if (ap > 0) { await page.click('[data-a="learn"][data-k="smash"]'); expect(await page.evaluate(() => (window as any).__game.s.skills.smash)).toBe(1); }
  await page.click('.tabs [data-k="pets"]');
  await page.screenshot({ path: `../docs/screenshots/brave/${info.project.name}-pets.png` });
  await page.click('.tabs [data-k="equip"]');
  await page.screenshot({ path: `../docs/screenshots/brave/${info.project.name}-gear.png` });

  // save survives a reload
  await page.evaluate(() => { const g = (window as any).__game; localStorage.setItem('aeonbrave.save', JSON.stringify(g.s)); });
  await page.reload();
  await expect(page.locator('#h-race')).toHaveText('精靈');
  expect(errors).toEqual([]);
});

test('rebirth keeps gear and adds legacy', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); sessionStorage.setItem('boot', '1'); } });
  await page.goto('/');
  await page.click('#c-go');
  const r = await page.evaluate(() => {
    const g = (window as any).__game;
    g.fastForward(300);
    g.s.age = 20;
    const uid = g.s.equip.weapon.uid, lvl = g.s.lvl;
    document.querySelector<HTMLElement>('.tabs [data-k="rebirth"]')!.click();
    return { uid, lvl };
  });
  await page.click('[data-a="rbRace"][data-k="dwarf"]');
  await page.click('[data-a="rebirth"]');
  const s = await page.evaluate(() => (window as any).__game.s);
  expect(s.lvl).toBe(1);
  expect(s.race).toBe('dwarf');
  expect(s.equip.weapon.uid).toBe(r.uid);
  expect(s.counters.rebirths).toBe(1);
  expect(s.legacy.str).toBeGreaterThan(0);
});
