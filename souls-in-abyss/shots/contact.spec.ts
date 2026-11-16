import { test } from '@playwright/test';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 1, viewport: { width: 1100, height: 1000 } });
for (const l of ['zh', 'en']) test('contact ' + l, async ({ page }) => {
  await page.goto(`http://localhost:4100/${l}/contact`); await page.waitForTimeout(500);
  await page.fill('#nf-msg', l === 'zh' ? '寶箱汪卡在牆裡' : 'The mimic pup is stuck in a wall');
  await page.screenshot({ path: `${OUT}/contact-${l}.png`, fullPage: true });
});
