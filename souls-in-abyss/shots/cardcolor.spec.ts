import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
const VARIANTS: [string, string][] = JSON.parse(process.env.VARIANTS!);
test.use({ video: 'off', deviceScaleFactor: 1, viewport: { width: 1280, height: 800 } });
test('card colours', async ({ page }) => {
  test.setTimeout(240000);
  await seed(page, 'zh');
  await page.click('.nav [data-k="map"]'); await page.click('#view .node[data-k="forest"]'); await page.waitForTimeout(300);
  await page.click('.nav [data-k="equip"]'); await page.waitForTimeout(8000); await page.mouse.move(300, 700);
  await page.screenshot({ path: `${OUT}/card-0.png` });
  for (const [name, css] of VARIANTS) {
    await page.addStyleTag({ content: css.startsWith("--") ? `:root{${css}}` : css }); await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/card-${name}.png` });
  }
});
