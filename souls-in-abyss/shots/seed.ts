import type { Page } from '@playwright/test';
const cp = (page: Page) => page.evaluate(() => (window as any).__game.d.cp as number);
/** Wear what is better (bag sorted by CP gain, first row, until CP stops rising) and spend the skill points, all through the UI. */
async function gearUp(page: Page): Promise<void> {
  await page.evaluate(() => { const g = (window as any).__game; g.s.bagSort = 'cp'; g.refresh(); });
  await page.click('.nav [data-k="bag"]');
  for (let i = 0; i < 10; i++) {
    const b = page.locator('#view [data-a="equip"]').first(); if (!(await b.count())) break;
    const before = await cp(page); await b.click(); await page.waitForTimeout(80);
    if (await cp(page) <= before) { await page.locator('#view [data-a="equip"]').first().click(); await page.waitForTimeout(80); break; } // not better: put the old one back
  }
  await page.click('.nav [data-k="skills"]');
  for (const tab of ['combat', 'magic', 'passive']) {
    await page.click(`#view .stab[data-k="${tab}"]`); await page.waitForTimeout(60);
    for (let i = 0; i < 6; i++) { const bs = page.locator('#view .skill [data-a="learn"]:not([disabled])'); const n = await bs.count(); if (!n) break; await bs.nth(i % n).click(); await page.waitForTimeout(50); }
  }
  await page.click('#view .stab[data-k="combat"]');
}
const play = (page: Page, minutes: number) => page.evaluate(m => { const g = (window as any).__game; for (let i = 0; i < m * 600; i++) g.tick(0.1); g.refresh(); }, minutes);
/** A character about an hour in: plays the real engine forward, gearing up twice on the way. */
export async function seed(page: Page, lang: string, beforeGo?: () => Promise<void>): Promise<void> {
  await page.addInitScript(l => { localStorage.clear(); localStorage.setItem('yore.lang', l); }, lang);
  await page.goto('/');
  await page.click('#t-play'); await page.click('.intro'); await page.waitForTimeout(500);
  if (beforeGo) await beforeGo();
  await page.click('#c-go');
  await page.evaluate(() => { (window as any).__game.s.autoSell = 0; });
  await play(page, 20); await gearUp(page);
  await play(page, 40); await gearUp(page);
  await page.evaluate(() => { const g = (window as any).__game; if (!g.s.pets.length) g.befriend('owl', 'sage'); g.refresh(); });
  await play(page, 1);
  await page.click('.nav [data-k="equip"]');
}
