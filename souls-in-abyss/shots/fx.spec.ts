import { test } from '@playwright/test';
test.use({ video: 'off', deviceScaleFactor: 2 });
for (const fx of ['none', 'ink', 'light', 'cool', 'violet', 'glow', 'cool-ink']) test('fx ' + fx, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); Math.random = () => 0.42; });
  await page.goto('/?fx=' + fx);
  await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go');
  await page.evaluate(() => { const g = (window as any).__game; g.befriend('owl', 'sage'); g.s.lvl = 60; g.refresh(); });
  for (const k of ['meadow', 'forest', 'mine']) {
    await page.evaluate(key => { const g = (window as any).__game; g.tick = () => {}; g.down = 0; g.s.area = key; g.resetLoot(); g.newMonster(); g.s.hp = g.d.hp; }, k);
    await page.waitForTimeout(1200);
    await page.locator('canvas.scene').screenshot({ path: `${process.env.OUT}/fx-${fx}-${k}.png` });
  }
});
