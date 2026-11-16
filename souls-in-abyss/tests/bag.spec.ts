import { test, expect } from '@playwright/test';

const boot = async (page: any, lang: string) => {
  await page.addInitScript((l: string) => { localStorage.clear(); localStorage.setItem('yore.lang', l); }, lang);
  await page.goto('/');
  await page.click('#t-play');
  await page.click('.intro');
  await page.click('#c-go');
  await page.evaluate(() => {
    const g = (window as any).__game;
    g.s.bag.length = 0;
    const it = (uid: number, kind: string, rarity: number, ilvl: number) => ({ uid, kind, weight: kind === 'ring' ? undefined : 'medium', ilvl, rarity, plus: 0, affixes: [], name: 0 });
    g.s.bag.push(it(9001, 'ring', 0, 5), it(9002, 'weapon', 2, 5), it(9003, 'head', 4, 5), it(9004, 'weapon', 2, 30), it(9005, 'body', 1, 5));
    g.befriend('owl', 'sage'); g.befriend('owl', 'blue'); g.s.gold = 987654; g.refresh();
  });
};
const order = (page: any) => page.locator('#view .baglist [data-a="equip"]').evaluateAll((n: HTMLElement[]) => n.map(b => Number(b.dataset.uid)));

test('the bag sorts by pickup order, rarity, slot or CP, and a dropdown shows the pick at once', async ({ page }) => {
  await boot(page, 'zh');
  await page.click('.nav [data-k="bag"]');
  const sort = page.locator('#view .baghead .dd').first(), auto = page.locator('#view .baghead .dd').nth(1);
  expect(await order(page)).toEqual([9001, 9002, 9003, 9004, 9005]);
  const w0 = (await sort.locator('.ddbtn').boundingBox())!.width;

  await sort.locator('.ddbtn').click();
  await sort.locator('.ddopt[data-k="rarity"]').click();
  // the menu closes and the button shows the new choice without another click
  await expect(sort.locator('.ddmenu')).toBeHidden();
  await expect(sort.locator('.ddlab > span')).toHaveText('稀有度');
  expect(await order(page)).toEqual([9003, 9004, 9002, 9005, 9001]); // rarity first, then item level, then pickup order
  expect((await sort.locator('.ddbtn').boundingBox())!.width).toBe(w0); // the button keeps its width whatever is picked

  await sort.locator('.ddbtn').click();
  await sort.locator('.ddopt[data-k="slot"]').click();
  expect(await order(page)).toEqual([9003, 9005, 9001, 9004, 9002]); // head, body, ring, then the weapons

  await sort.locator('.ddbtn').click();
  await sort.locator('.ddopt[data-k="cp"]').click();
  expect(await page.evaluate(() => (window as any).__game.s.bagSort)).toBe('cp');
  expect((await order(page))[0]).toBe(9004); // the item-level 30 weapon is the biggest gain
  expect(await page.evaluate(() => (window as any).__game.s.bag.map((i: any) => i.uid))).toEqual([9001, 9002, 9003, 9004, 9005]); // the bag itself is untouched

  await auto.locator('.ddbtn').click();
  await auto.locator('.ddopt[data-k="3"]').click();
  await expect(auto.locator('.ddmenu')).toBeHidden();
  await expect(auto.locator('.ddlab > span')).toHaveText('史詩');
  expect(await page.evaluate(() => (window as any).__game.s.autoSell)).toBe(3);
});

for (const lang of ['zh', 'en']) test(`text buttons keep a fixed width (${lang})`, async ({ page }) => {
  await boot(page, lang);
  const widths = (sel: string) => page.locator(sel).evaluateAll((n: HTMLElement[]) => n.filter(b => b.offsetWidth).map(b => ({ w: Math.round(b.getBoundingClientRect().width), fits: b.scrollWidth <= b.clientWidth + 1 })));
  const all = async (sel: string, w: number) => { const got = await widths(sel); expect(got.length).toBeGreaterThan(0); for (const g of got) expect(g).toEqual({ w, fits: true }); };
  await page.click('.nav [data-k="bag"]');
  await all('#view .item .acts button', 56); // bag rows match the skill rows (2026-11-16)
  await all('#view [data-a="sellAll"]', 152);
  await page.click('.nav [data-k="pets"]');
  await all('#view .item .acts button', 52);
  await page.click('.nav [data-k="smith"]');
  await all('#view [data-a="smith"]', 80); // the price does not size the button
  await page.click('.nav [data-k="settings"]');
  await all('#view [data-a="lang"], #view [data-a="rebirthOpen"]', 88);
  await all('#view [data-a="reset"]', 152);
  await page.click('#view [data-a="reset"]');
  await all('#view [data-a="resetYes"]', 152);
  await all('#view [data-a="disarm"]', 88);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
