import { test } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 2 });
for (const lang of ['en', 'zh']) for (const w of [320, 393]) test(`c ${lang} ${w}`, async ({ page }) => {
  await page.setViewportSize({ width: w, height: 760 });
  await page.addInitScript((l) => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang', l); sessionStorage.setItem('boot','1'); } }, lang);
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro'); await page.click('[data-a="cRace"][data-k="undead"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.OUT}/cr3-${lang}-${w}.png` });
  await page.click('#c-go'); await page.evaluate(() => { const g = (window as any).__game; for (let i = 0; i < 40 && g.mon.def.key !== 'walkshroom'; i++) g.newMonster(); });
  await page.waitForTimeout(500);
  await page.locator('.monster').screenshot({ path: `${process.env.OUT}/mh-${lang}-${w}.png` });
});
