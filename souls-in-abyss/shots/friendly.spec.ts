import { test, expect } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 2 });
test('friendly', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','zh'); sessionStorage.setItem('boot','1'); } });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go'); await page.waitForTimeout(600);
  await page.locator('.doll').screenshot({ path: `${process.env.OUT}/doll-empty.png` });
  // a friendly owl: the label shows, and defeating it (first pal) makes it join
  await page.evaluate(() => { const g = (window as any).__game; for (let i = 0; i < 200 && !(g.mon.def.key === 'walkshroom' && g.mon.label); i++) g.newMonster(); });
  await page.waitForTimeout(400);
  await page.locator('.monster').screenshot({ path: `${process.env.OUT}/friendly.png` });
  await expect(page.locator('#m-label')).toHaveText('友善的');
  await page.evaluate(() => { const g = (window as any).__game; g.mon.hp = 1; g.s.lvl = 50; g.refresh(); });
  await expect.poll(() => page.evaluate(() => (window as any).__game.s.pets.length), { timeout: 20000 }).toBe(1);
  // gear of several rarities: each filled slot takes its rarity colour
  const errs: string[] = []; page.on('pageerror', e => errs.push(String(e)));
  await page.evaluate(() => { const g = (window as any).__game; const e = g.s.equip;
    const clone = (src: any, kind: string, rarity: number, uid: number) => ({ ...src, uid, kind, rarity });
    if (e.weapon) e.weapon.rarity = 4; if (e.body) { e.head = clone(e.body, 'head', 1, 900001); e.legs = clone(e.body, 'legs', 3, 900003); e.body.rarity = 2; } g.refresh(); });
  await page.click('.nav [data-k="bag"]'); await page.click('.nav [data-k="equip"]'); await page.waitForTimeout(400);
  console.log('errors', errs);
  await page.locator('.doll').screenshot({ path: `${process.env.OUT}/doll-full.png` });
});
