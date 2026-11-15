import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 2, viewport: { width: 1280, height: 900 } });
const V: [string, string][] = [
  ['A', '.tbody{clip-path:var(--px3b)}'],
  ['B', ''],
  ['C', '.tbody{clip-path:none}'],
  ['D', '.tbody{clip-path:var(--px3b)} .nav .ttab span,.nav .ico span{clip-path:polygon(0 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 4px),0 calc(100% - 4px))}'],
];
test('tab variants', async ({ page }) => {
  await seed(page, 'zh');
  for (const [k, css] of V) {
    const h = await page.addStyleTag({ content: css || '/**/' });
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${OUT}/tab-${k}.png`, clip: { x: 10, y: 8, width: 420, height: 110 } });
    await h.evaluate(e => e.remove());
  }
});
