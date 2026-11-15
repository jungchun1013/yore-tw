import { test, expect } from '@playwright/test';
test('the age stepper keeps the number and the figure in place whichever age is picked', async ({ page }) => {
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); });
  await page.goto('/');
  await page.click('#t-play'); await page.click('.intro');
  const rects = async () => page.evaluate(() => ['.agerow', '.sttable'].map(q => { const r = document.querySelector(q)!.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width)]; }));
  const base = await rects();
  await expect(page.locator('.agev')).toHaveText('13');
  // up to 17: the right arrow then goes dark
  for (const a of [14, 15, 16, 17]) {
    await page.click(`[data-a="cAge"][data-k="${a}"]`);
    await expect(page.locator('.agev')).toHaveText(String(a));
    expect(await rects(), `age ${a}`).toEqual(base);
  }
  await expect(page.locator('[data-a="cAge"][data-k="18"]')).toBeDisabled();
  // down to 10: the left arrow goes dark
  for (const a of [16, 15, 14, 13, 12, 11, 10]) await page.click(`[data-a="cAge"][data-k="${a}"]`);
  await expect(page.locator('.agev')).toHaveText('10');
  await expect(page.locator('[data-a="cAge"][data-k="9"]')).toBeDisabled();
  expect(await rects()).toEqual(base);
  // the figure grows with age
  const h = async () => page.locator('.fig .pict').evaluate(e => e.getBoundingClientRect().height);
  const h10 = await h();
  await page.click('[data-a="cAge"][data-k="11"]');
  expect(await h()).toBeGreaterThan(h10);
});
