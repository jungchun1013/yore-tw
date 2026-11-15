import { test } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 1 });
test('site galleries', async ({ page }) => {
  for (const [lang, w, game] of [['zh', 1100, 'souls-in-abyss'], ['en', 1100, 'souls-in-abyss'], ['zh', 390, 'souls-in-abyss'], ['zh', 1100, 'prism-defense']] as [string, number, string][]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(`http://localhost:4191/${lang}/games/${game}.html`);
    await page.evaluate(async () => { for (const i of Array.from(document.images)) { i.loading = 'eager'; } await Promise.all(Array.from(document.images).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); });
    const bad = await page.evaluate(() => Array.from(document.images).filter(i => !i.naturalWidth).map(i => i.src));
    const sx = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    console.log(game, lang, w, 'scrollW', sx[0], 'inner', sx[1], 'broken', JSON.stringify(bad));
    await page.locator('.gallery').screenshot({ path: `${process.env.OUT}/gal-${game}-${lang}-${w}.png` });
  }
});
