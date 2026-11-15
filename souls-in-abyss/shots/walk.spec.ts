import { test, devices } from '@playwright/test';
test.use({ ...devices['Pixel 5'], video: 'off' });
test('walk', async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('boot')) { localStorage.clear(); localStorage.setItem('yore.lang','zh'); sessionStorage.setItem('boot','1'); } });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro');
  await page.click('[data-a="cRace"][data-k="elf"]'); await page.click('#c-go');
  for (let i = 0; i < 4; i++) { await page.waitForTimeout(4000);
    const k = await page.evaluate(() => (window as any).__game.s.counters.kills);
    await page.locator('.stage').screenshot({ path: process.env.OUT + `/w${i}.png` }); console.log('kills', k); }
});
