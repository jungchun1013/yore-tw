import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } });
test('create desk full', async ({ page }) => {
  await seed(page, 'zh', async () => {
    await page.screenshot({ path: `${OUT}/create-desk-full.png`, fullPage: true });
    const h = await page.evaluate(() => document.documentElement.scrollHeight); console.log('scrollHeight', h);
  });
});
