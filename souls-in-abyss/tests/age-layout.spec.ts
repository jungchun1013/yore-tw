import { test, expect } from '@playwright/test';
test('age figures keep their positions whichever age is picked', async ({ page }) => {
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); });
  await page.goto('/');
  await page.click('#t-play'); await page.click('.intro');
  const rects = async () => page.evaluate(() => [...document.querySelectorAll('.fig')].map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)]; }));
  const base = await rects();
  for (const a of [10, 11, 12, 13, 14, 15, 16, 17]) {
    await page.click(`[data-a="cAge"][data-k="${a}"]`); // mouse stays over the clicked figure
    expect(await rects(), `age ${a}`).toEqual(base);
  }
  // even spacing: the distance between neighbouring centres is the same everywhere
  const centres = base.map(([l, w]) => l + w / 2);
  const steps = centres.slice(1).map((c, i) => Math.round(c - centres[i]));
  expect(Math.max(...steps) - Math.min(...steps)).toBeLessThanOrEqual(1);
});
