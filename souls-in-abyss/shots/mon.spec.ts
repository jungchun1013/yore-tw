import { test } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 3 });
test('monsters', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','zh'); sessionStorage.setItem('boot','1'); } });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro');
  await page.click('[data-a="cRace"][data-k="elf"]'); await page.click('#c-go'); await page.waitForTimeout(500);
  const pets = ['owl', 'bloom', 'mimipup', 'griffy'];
  const areas = ['meadow','forest','labyrinth','mine','fen','ruins','nest','abyss'];
  for (const [ai, a] of areas.entries()) {
    const keys: string[] = await page.evaluate(([a, p]) => { const g = (window as any).__game; g.s.lvl = 300; g.s.hp = 1e9; g.refresh(); if (!g.s.pets.some((x: any) => x.key === p)) g.befriend(p); g.s.activePet = p; g.s.area = a; g.refresh();
      const ks = new Set<string>(); for (let i = 0; i < 60; i++) { g.newMonster(); ks.add(g.mon.def.key); } return [...ks]; }, [a, pets[ai % 4]]);
    for (const k of keys) {
      await page.evaluate((k) => { const g = (window as any).__game; for (let i = 0; i < 80 && g.mon.def.key !== k; i++) g.newMonster(); g.mon.hp = g.mon.maxHp = 1e12; }, k);
      await page.waitForTimeout(600);
      await page.locator('.stage').screenshot({ path: `${process.env.OUT}/m-${a}-${k}.png` });
    }
  }
  await page.click('.nav [data-k="pets"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${process.env.OUT}/pets.png` });
  await page.click('.nav [data-k="equip"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${process.env.OUT}/equip.png` });
});
