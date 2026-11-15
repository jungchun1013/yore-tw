import { test } from '@playwright/test';
test.use({ video: 'off' });
for (const w of [320, 360, 393]) test('overflow ' + w, async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','en'); sessionStorage.setItem('boot','1'); } });
  await page.setViewportSize({ width: w, height: 800 });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro'); await page.waitForTimeout(300);
  const wide = () => page.evaluate(() => [document.documentElement.scrollWidth, [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().right)).slice(0, 5)]);
  console.log(w, 'create', JSON.stringify(await wide()));
  await page.click('[data-a="cRace"][data-k="giant"]'); await page.click('#c-go'); await page.waitForTimeout(800);
  console.log(w, 'game', JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.outerHTML.slice(0,120)).slice(0,3))));
  await page.screenshot({ path: `${process.env.OUT}/ovf-en-${w}.png`, fullPage: true });
});
for (const w of [360, 393]) test('views en ' + w, async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','en'); sessionStorage.setItem('boot','1'); } });
  await page.setViewportSize({ width: w, height: 800 });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go'); await page.waitForTimeout(800);
  for (const k of ['equip','bag','pets','skills','map','smith','titles','settings']) { await page.click(`.nav [data-k="${k}"]`); await page.waitForTimeout(200);
    const v = await page.evaluate(() => [document.documentElement.scrollWidth, [...document.querySelectorAll('#view *, .sheet *, .att *, .petbox *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 || e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow === 'hidden').map(e => (e.className || e.tagName) + ':' + (e.textContent || '').slice(0, 20)).slice(0, 4)]);
    console.log(w, k, JSON.stringify(v));
  }
  await page.click('.nav [data-k="equip"]'); await page.screenshot({ path: `${process.env.OUT}/en-${w}.png`, fullPage: true });
});
