import { test } from '@playwright/test';

// Every style × outline pair, life view and planet view, for side-by-side comparison.
const LOOKS = [
  ['soft', 'none'], ['soft', 'tint'], ['soft', 'dark'],
  ['pixel', 'none'], ['pixel', 'tint'], ['pixel', 'dark'],
] as const;

test('look comparison', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/');
  await page.waitForFunction(() => window.__pw?.frames() > 20, null, { timeout: 30_000 });
  await page.waitForTimeout(2600); // let the arrival banner fade
  for (const [style, outline] of LOOKS) {
    await page.evaluate(([s, o]) => { window.__pw.look(s, o); window.__pw.teleport(5, 4, 180); window.__pw.zoom(0.82); }, [style, outline] as const);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `docs/screenshots/look-${style}-${outline}-life.png` });
    await page.evaluate(() => window.__pw.zoom(0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `docs/screenshots/look-${style}-${outline}-planet.png` });
  }
});
