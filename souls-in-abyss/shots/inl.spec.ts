import { test, expect } from '@playwright/test';
test('inline', async ({ page }) => {
  const errs: string[] = []; page.on('pageerror', e => errs.push(String(e))); page.on('requestfailed', r => errs.push(r.url()));
  page.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','zh'); sessionStorage.setItem('boot','1'); } });
  await page.goto('/inline.html'); await page.click('#t-play'); await page.click('.intro');
  await page.click('[data-a="cRace"][data-k="elf"]'); await page.click('#c-go'); await page.waitForTimeout(1500);
  const font = await page.evaluate(() => document.fonts.check('16px "Cubic 11"') || [...document.fonts].map(f => f.family + f.status).join());
  console.log('font', font);
  await page.screenshot({ path: process.env.OUT + '/inl.png' });
  expect(errs).toEqual([]);
});
