import { test } from '@playwright/test';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 1, viewport: { width: 1280, height: 1250 } });
test('proto tall', async ({ page }) => {
  await page.goto('file:///Users/yore/.claude/jobs/37a31183/tmp/art/layout-proto.html'); await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/proto-tall-a.png` });
  await page.click('.bar [data-m="pinned"]'); await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/proto-tall-b.png` });
});
