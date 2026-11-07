import { test, expect } from '@playwright/test';

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
  await page.click('.doll [data-k="head"]');
  await page.click('.nav [data-k="bag"]');
  await page.click('[data-a="equip"][data-uid="999999"]');
  await page.click('.nav [data-k="equip"]');
  await expect(head).toHaveClass(/full/);
  await expect.poll(() => avatar.innerHTML()).not.toBe(before);
  const worn = await avatar.innerHTML();
  await page.screenshot({ path: `/tmp/souls-pixel-${test.info().project.name}.png` });
  await page.click('[data-a="unequip"][data-k="head"]');
  await expect(head).not.toHaveClass(/full/);
  await expect.poll(() => avatar.innerHTML()).not.toBe(worn);
  await expect(avatar).toHaveJSProperty('innerHTML', before);
  await page.evaluate(() => {
    const g = (window as any).__game;
    g.s.pets = ['pudding', 'potcat', 'mosskin', 'mimipup', 'ember', 'griffy', 'nameless'].map(key => ({ key, lvl: 1, xp: 0, bond: 1, bondT: 0 }));
  });
  await page.click('.nav [data-k="pets"]');
  const pets = page.locator('#view [data-icon^="pet-"]');
  await expect(pets).toHaveCount(7);
  const art = await pets.evaluateAll(nodes => nodes.map(n => n.innerHTML));
  expect(new Set(art).size).toBe(7);
  await expect(page.locator('#view svg path')).toHaveCount(0);
});
