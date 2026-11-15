import { test } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 2 });
for (const lang of ['zh', 'en']) test('bag, smith, settings ' + lang, async ({ page }) => {
  for (const w of [1280, 360]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.addInitScript(l => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', l); sessionStorage.setItem('boot', '1'); } }, lang);
    await page.goto('/');
    if (await page.locator('#t-play').count()) { await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go'); }
    await page.waitForTimeout(400);
    await page.evaluate(() => { const g = (window as any).__game; if (g.s.bag.some((i: any) => i.uid > 900000)) return;
      const kinds = ['head', 'weapon', 'ring', 'body', 'shield', 'feet', 'neck', 'legs', 'weapon'];
      kinds.forEach((kind, i) => g.s.bag.push({ uid: 900001 + i, kind, weight: ['ring', 'neck'].includes(kind) ? undefined : ['light', 'medium', 'heavy'][i % 3], ilvl: 4 + i * 3, rarity: [0, 3, 1, 4, 0, 2, 1, 0, 2][i], plus: i % 4, affixes: [], name: 0 }));
      g.befriend('owl', 'sage'); g.befriend('bloom'); g.s.gold = 123456; g.refresh(); });
    const shot = async (n: string) => { await page.waitForTimeout(250); await page.locator('.side').screenshot({ path: `${process.env.OUT}/btn-${n}-${lang}-${w}.png` }); };
    await page.click('.nav [data-k="bag"]'); await shot('bag');
    if (w === 1280) {
      for (const k of ['rarity', 'slot', 'cp']) {
        await page.locator('#view .baghead .ddbtn').first().click(); if (k === 'rarity') await shot('bag-menu');
        await page.click(`#view .ddopt[data-a="bagSort"][data-k="${k}"]`); await page.waitForTimeout(100);
        console.log(lang, k, await page.locator('#view .baghead .ddbtn').first().innerText(), '|', (await page.locator('#view .baglist .iname').allInnerTexts()).join(', '));
        if (k === 'rarity') await shot('bag-rarity');
      }
      await page.locator('#view .baghead .ddbtn').nth(1).click(); await page.click('#view .ddopt[data-a="autoSell"][data-k="4"]'); await shot('bag-legend');
      console.log(lang, 'dd widths', (await page.locator('#view .ddbtn').evaluateAll(n => n.map(b => Math.round(b.getBoundingClientRect().width)))).join(' '));
      await page.locator('#view .baghead .ddbtn').nth(1).click(); await page.click('#view .ddopt[data-a="autoSell"][data-k="0"]');
      console.log(lang, 'dd widths', (await page.locator('#view .ddbtn').evaluateAll(n => n.map(b => Math.round(b.getBoundingClientRect().width)))).join(' '));
    }
    await page.click('.nav [data-k="smith"]'); await shot('smith');
    await page.click('.nav [data-k="pets"]'); await shot('pets');
    await page.click('.nav [data-k="settings"]'); await shot('settings');
    await page.click('#view [data-a="reset"]'); await shot('settings-ask'); await page.click('#view [data-a="disarm"]');
    await page.click('.nav [data-k="equip"]'); await page.waitForTimeout(200);
    const over = await page.locator('button').evaluateAll(n => n.filter(b => (b as HTMLElement).offsetWidth && b.scrollWidth > b.clientWidth + 1).map(b => b.className + '|' + (b.textContent || '').trim()));
    console.log(lang, w, 'scrollW', await page.evaluate(() => document.documentElement.scrollWidth), 'overflowing', over.join(' ; ') || 'none');
  }
});
