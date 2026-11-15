import { test, expect } from '@playwright/test';

test('only a friendly monster can join you as a pal', async ({ page }) => {
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go');
  // an ordinary owl never joins, however many fall
  const plain = await page.evaluate(() => { const g = (window as any).__game; g.s.lvl = 60; g.refresh();
    for (let i = 0; i < 400; i++) { g.newMonster(); if (g.mon.def.key === 'walkshroom' && !g.mon.label) { (g as any).tryBefriend(); } } return g.s.pets.length; });
  expect(plain).toBe(0);
  // a friendly one shows its label, and the first friendly kill always joins, keeping its dye
  await page.evaluate(() => { const g = (window as any).__game; for (let i = 0; i < 400 && !(g.mon.def.key === 'walkshroom' && g.mon.label); i++) g.newMonster(); });
  await expect(page.locator('#m-label')).toHaveText('友善的');
  const dye = await page.evaluate(() => (window as any).__game.mon.dye);
  await page.evaluate(() => { (window as any).__game.mon.hp = 1; });
  await expect.poll(() => page.evaluate(() => (window as any).__game.s.pets.map((p: any) => p.key + ':' + p.dye).join()), { timeout: 20000 }).toBe('owl:' + dye);
  // pals are picked up, not unlocked: the same monster still turns up friendly, and a second one joins as its own pal
  const more = await page.evaluate(() => { const g = (window as any).__game; let n = 0;
    for (let i = 0; i < 2000 && g.s.pets.length < 2; i++) { g.newMonster(); if (g.mon.def.key === 'walkshroom' && g.mon.label) { n++; g.tryBefriend(); } }
    return { n, pets: g.s.pets.map((p: any) => p.key), uids: new Set(g.s.pets.map((p: any) => p.uid)).size, active: g.s.activePet === g.s.pets[0].uid }; });
  expect(more.n).toBeGreaterThan(0);
  expect(more.pets).toEqual(['owl', 'owl']);
  expect(more.uids).toBe(2);
  expect(more.active).toBe(true);
  // the pals page lists them like the bag, with a count; the one along has no buttons, the other can be brought or parted with
  await page.click('.nav [data-k="pets"]');
  await expect(page.locator('#view .baghead')).toHaveText('夥伴 2/20');
  await expect(page.locator('#view .item')).toHaveCount(2);
  await expect(page.locator('#view [data-a="pet"]')).toHaveCount(1);
  // parting asks once, and Back keeps the pal
  await page.click('#view [data-a="palPart"]');
  await expect(page.locator('#view [data-a="palPartYes"]')).toHaveCount(1);
  await page.click('#view [data-a="disarm"]');
  await expect(page.locator('#view .item')).toHaveCount(2);
  await page.click('#view [data-a="palPart"]'); await page.click('#view [data-a="palPartYes"]');
  await expect(page.locator('#view .item')).toHaveCount(1);
  await expect(page.locator('#view .baghead')).toHaveText('夥伴 1/20');
  expect(await page.evaluate(() => { const g = (window as any).__game; return g.s.activePet === g.s.pets[0].uid; })).toBe(true);
  // with no room left, nothing spawns friendly and nothing joins
  const full = await page.evaluate(() => { const g = (window as any).__game;
    while (g.s.pets.length < 20) g.befriend('owl');
    let n = 0; for (let i = 0; i < 300; i++) { g.newMonster(); if (g.mon.label) n++; }
    g.befriend('owl'); return { n, len: g.s.pets.length }; });
  expect(full).toEqual({ n: 0, len: 20 });
});

test('an older save keeps its pals: each gets its own uid and the one along stays along', async ({ page }) => {
  // the second load starts from a v6 save (pals without uids, the active one named by its kind)
  await page.addInitScript(() => { const old = sessionStorage.getItem('v6');
    if (old) localStorage.setItem('soulsinabyss.save', old); else { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); } });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go');
  await page.evaluate(() => { const g = (window as any).__game; g.befriend('owl'); g.befriend('bloom');
    const s = JSON.parse(JSON.stringify(g.s)); s.v = 6; s.pets.forEach((p: any) => delete p.uid); s.activePet = 'bloom';
    sessionStorage.setItem('v6', JSON.stringify(s)); });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!(window as any).__game)).toBe(true);
  const got = await page.evaluate(() => { const s = (window as any).__game.s;
    return { v: s.v, keys: s.pets.map((p: any) => p.key), uids: s.pets.map((p: any) => typeof p.uid), distinct: new Set(s.pets.map((p: any) => p.uid)).size,
      active: s.pets.find((p: any) => p.uid === s.activePet)?.key, fresh: s.nextUid > Math.max(...s.pets.map((p: any) => p.uid)) }; });
  expect(got).toEqual({ v: 7, keys: ['owl', 'bloom'], uids: ['number', 'number'], distinct: 2, active: 'bloom', fresh: true });
});
