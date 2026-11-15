import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 1, viewport: { width: 1280, height: 800 } });
test('report dialog and tabs', async ({ page }) => {
  await seed(page, 'zh');
  await page.click('.nav [data-k="settings"]'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/settings.png` });
  await page.click('[data-a="report"]'); await page.waitForTimeout(300);
  await page.fill('#rp-msg', '測試：寶箱汪卡在牆裡');
  await page.screenshot({ path: `${OUT}/report.png` });
});
