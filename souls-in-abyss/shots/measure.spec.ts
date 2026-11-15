import { test } from '@playwright/test';
import { seed } from './seed';
test.use({ video: 'off', viewport: { width: 1280, height: 800 } });
test('measure', async ({ page }) => {
  await seed(page, 'zh');
  await page.evaluate(() => { const g = (window as any).__game; g.befriend('owl', 'blue'); g.refresh(); });
  await page.click('.nav [data-k="bag"]');
  const m = async () => page.evaluate(() => { const r = (q: string) => { const e = document.querySelector(q) as HTMLElement; const b = e.getBoundingClientRect(); return `${q}: h=${Math.round(b.height)} w=${Math.round(b.width)} (content ${e.scrollHeight})`; }; return [r('.hero'), r('.hero .tbody'), r('#sheet'), r('#equippane'), r('.battle'), r('.battle .tbody'), r('.scene'), r('.fight'), r('#battlepane'), r('#battlepane .stage'), r('.side'), r('.game')].join('\n'); });
  await page.click('.hero .ttab[data-k="info"]'); console.log('INFO\n' + await m());
  await page.click('.hero .ttab[data-k="equip"]'); console.log('EQUIP\n' + await m());
});
