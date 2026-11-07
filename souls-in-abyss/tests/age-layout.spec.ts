import { test, expect } from '@playwright/test';
test('age figures do not shift when a two-digit age is picked', async ({ page }) => {
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); });
  await page.goto('/');
  await page.click('#t-play'); await page.click('.intro');
  const xs = async () => page.evaluate(() => [...document.querySelectorAll('.fig .pict')].map(e => Math.round(e.getBoundingClientRect().left)));
  await page.click('[data-a="cAge"][data-k="13"]'); const a = await xs();
  await page.click('[data-a="cAge"][data-k="10"]'); const b = await xs();
  expect(b).toEqual(a);
  await page.screenshot({ path: `../docs/screenshots/souls-in-abyss/${test.info().project.name}-age10.png` });
});
