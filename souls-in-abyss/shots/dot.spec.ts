import { test } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 4 });
test('pal thumbnail close-up', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); sessionStorage.setItem('boot', '1'); } });
  await page.goto(process.env.URL || '/');
  if (await page.locator('#t-play').count()) { await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go'); }
  await page.waitForTimeout(500);
  await page.evaluate(() => { const g = (window as any).__game; g.befriend('owl', 'earth'); g.befriend('owl', 'sage'); g.befriend('bloom'); g.befriend('mimipup', 'gold'); g.refresh(); });
  await page.click('.nav [data-k="pets"]'); await page.waitForTimeout(300);
  const info = await page.evaluate(() => Array.from(document.querySelectorAll('#view .item')).slice(0, 2).map(r => { const d = r.querySelector('.dot') as HTMLElement, i = d.querySelector('img') as HTMLImageElement;
    const cs = getComputedStyle(d), ci = getComputedStyle(i);
    return { row: getComputedStyle(r).backgroundColor, dot: cs.backgroundColor, dotW: d.offsetWidth, clip: cs.clipPath, img: [i.naturalWidth, i.naturalHeight, i.width, i.height], filter: ci.filter, rend: ci.imageRendering, src: i.src.slice(0, 40) }; }));
  console.log(JSON.stringify(info, null, 1));
  await page.locator('#view .item').first().screenshot({ path: `${process.env.OUT}/dot-row0.png` });
  await page.locator('#view .item').nth(1).screenshot({ path: `${process.env.OUT}/dot-row1.png` });
});
