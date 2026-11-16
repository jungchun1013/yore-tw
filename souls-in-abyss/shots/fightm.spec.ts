import { test } from '@playwright/test';
import { seed } from './seed';
test.use({ video: 'off', deviceScaleFactor: 1, viewport: { width: 360, height: 780 } });
test('phone fight metrics', async ({ page }) => {
  await seed(page, 'zh');
  await page.evaluate(() => { const g = (window as any).__game; g.befriend('owl', 'blue'); g.refresh(); });
  await page.waitForTimeout(300);
  console.log(await page.evaluate(() => ['.fight', '.fight .side-hero', '.fight .side-hero .kv.cp', '.fight .side-hero .kv.cp .lbl', '.fight .side-hero .kv.cp .v', '.fight .side-pal', '.fight .side-pal .kv.cp .lbl'].map(q => { const e = document.querySelector(q) as HTMLElement; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${q}: x=${b.left.toFixed(0)}..${b.right.toFixed(0)} w=${b.width.toFixed(0)} minw=${cs.minWidth} ml=${cs.marginLeft} gap=${cs.gap}`; }).join('\n')));
});
