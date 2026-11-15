import { test, expect } from '@playwright/test';
import { CREATURE_DYES, creatureUrl } from '../src/data/creatures';
import { PETS } from '../src/data/pets';
import { AREAS } from '../src/data/areas';

test('pixel icons and the equipment board respond to equipping and removing armor', async ({ page }) => {
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); });
  await page.goto('/');
  await page.click('#t-play');
  await page.click('.intro');
  await page.click('#c-go');
  const avatar = page.locator('[data-avatar]');
  const before = await avatar.innerHTML();
  const head = page.locator('.doll [data-k="head"]');
  await expect(head).not.toHaveClass(/full/);
  await page.evaluate(() => {
    const g = (window as any).__game;
    g.s.bag.push({ uid: 999999, kind: 'head', weight: 'heavy', ilvl: 10, rarity: 4, plus: 3, affixes: [], name: 0 });
  });
  await page.click('.hero .ttab[data-k="equip"]'); // the figure lives on the hero card's equipment tab
  await page.click('.doll [data-k="head"]');
  await page.click('.nav [data-k="bag"]');
  await page.click('[data-a="equip"][data-uid="999999"]');
  await page.click('.nav [data-k="equip"]');
  await expect(head).toHaveClass(/full/);
  // the hero is character art for now (no equipment layers), so it stays the same
  await expect(avatar).toHaveJSProperty('innerHTML', before);
  await page.screenshot({ path: `/tmp/souls-pixel-${test.info().project.name}.png` });
  await page.click('[data-a="unequip"][data-k="head"]');
  await expect(head).not.toHaveClass(/full/);
  await expect(avatar).toHaveJSProperty('innerHTML', before);
  await page.evaluate(() => {
    const g = (window as any).__game;
    g.s.pets = ['owl', 'bloom', 'mimipup', 'griffy'].map((key, i) => ({ uid: 9000 + i, key, lvl: 1, xp: 0, bond: 1, bondT: 0, dye: ['sage', 'blue', 'gold', 'rose'][i] }));
  });
  await page.click('.nav [data-k="pets"]');
  // each pal shows its own creature art in the dye it joined with, and every image loads
  const pets = page.locator('#view .dot.art img');
  await expect(pets).toHaveCount(4);
  const srcs = await pets.evaluateAll(nodes => nodes.map(n => (n as HTMLImageElement).getAttribute('src')));
  expect(new Set(srcs).size).toBe(4);
  await expect.poll(() => pets.evaluateAll(nodes => nodes.every(n => (n as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator('#view svg path')).toHaveCount(0);
});

test('every creature dye exists and each pal is a monster with art', async ({ request }) => {
  test.setTimeout(180000); // 300+ files since the 2026-11-15 batch: fetched eight at a time
  const urls = Object.entries(CREATURE_DYES).flatMap(([art, dyes]) => dyes.map(dye => [`${art}/${dye}`, creatureUrl(art, dye).replace('./', '/')] as const));
  for (let i = 0; i < urls.length; i += 8) {
    const rs = await Promise.all(urls.slice(i, i + 8).map(async ([name, u]) => [name, (await request.get(u)).status()] as const));
    for (const [name, st] of rs) expect(st, name).toBe(200);
  }
  for (const p of PETS) {
    const mon = AREAS.find(a => a.key === p.home)!.mons.find(m => m.key === p.mon);
    expect(mon?.art, p.key).toBe(p.art);
  }
});
