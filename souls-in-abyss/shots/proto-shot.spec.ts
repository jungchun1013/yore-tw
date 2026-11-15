import { test } from '@playwright/test';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 1, viewport: { width: 1280, height: 900 } });
test('proto ratios', async ({ page }) => {
  await page.goto('file:///Users/yore/.claude/jobs/37a31183/tmp/art/layout-proto.html'); await page.waitForTimeout(800);
  for (const r of ['2:1', '3:2', '1:1']) {
    await page.click(`.bar [data-r="${r}"]`); await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/proto-${r.replace(':', '-')}-info.png` });
    await page.click('#left [data-t="equip"]'); await page.waitForTimeout(200);
    await page.screenshot({ path: `${OUT}/proto-${r.replace(':', '-')}-equip.png` });
    await page.click('#left [data-t="info"]');
  }
  await page.click('.bar [data-m="pinned"]'); await page.click('.bar [data-r="3:2"]'); await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/proto-3-2-pinned.png` });
});
