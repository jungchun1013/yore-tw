import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 2 });
for (const [name, vp] of [['desk', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]] as const) {
  test(`create ${name}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await seed(page, 'zh', async () => {
      await page.locator('.picker').screenshot({ path: `${OUT}/picker-${name}-13.png` });
      for (const a of [14, 15, 16, 17]) await page.click(`[data-a="cAge"][data-k="${a}"]`);
      await page.click('[data-a="cRace"][data-k="giant"]');
      await page.locator('.picker').screenshot({ path: `${OUT}/picker-${name}-17-orc.png` });
      await page.screenshot({ path: `${OUT}/create-${name}.png` });
    });
  });
}
