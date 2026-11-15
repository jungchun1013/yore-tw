import { test } from '@playwright/test';
import { seed } from './seed';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 2 });
for (const [name, vp] of [['desk', { width: 1280, height: 800 }], ['phone', { width: 390, height: 844 }]] as const) {
  test(`rebirth ${name}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await seed(page, 'zh');
    await page.evaluate(() => { const g = (window as any).__game; g.fastForward(300); g.s.age = 20; g.refresh(); });
    await page.click('.nav [data-k="settings"]');
    await page.click('[data-a="rebirthOpen"]'); await page.click('[data-a="rebirthYes"]');
    await page.waitForTimeout(300);
    if (name === 'desk') await page.click('[data-a="rbPact"][data-k="0"]');
    await page.screenshot({ path: `${OUT}/rebirth-${name}.png` });
    await page.screenshot({ path: `${OUT}/rebirth-${name}-full.png`, fullPage: true });
    const fold = page.locator('[data-a="rbToggle"]');
    if (await fold.isVisible()) { await fold.scrollIntoViewIfNeeded(); await fold.click(); await page.click('[data-a="rbPact"][data-k="0"]'); await page.waitForTimeout(200); await page.screenshot({ path: `${OUT}/rebirth-${name}-open.png`, fullPage: true }); }
  });
}
