import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 1 });
for (const [name, vp] of [['1280x800', { width: 1280, height: 800 }], ['1024x700', { width: 1024, height: 700 }], ['1920x1080', { width: 1920, height: 1080 }]] as const) {
  test(`canvas ${name}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await seed(page, 'zh');
    await page.evaluate(() => { const g = (window as any).__game; g.befriend('owl', 'blue'); g.refresh(); });
    await page.click('.nav [data-k="bag"]'); await page.waitForTimeout(400);
    const m = await page.evaluate(() => { const r = (q: string) => { const b = (document.querySelector(q) as HTMLElement).getBoundingClientRect(); return `${q} ${Math.round(b.left)},${Math.round(b.top)} ${Math.round(b.width)}x${Math.round(b.height)}`; }; return [getComputedStyle(document.documentElement).getPropertyValue('--s'), r('.game'), r('.hero'), r('.battle'), r('.scene'), r('.side'), 'scrollH ' + document.documentElement.scrollHeight + ' scrollW ' + document.documentElement.scrollWidth].join(' | '); });
    console.log(name, m);
    await page.screenshot({ path: `${OUT}/canvas-${name}.png` });
  });
}
