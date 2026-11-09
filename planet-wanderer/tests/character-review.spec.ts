import { test, expect } from '@playwright/test';

// Traveller (cape, proportions) and the spirit deer, framed by the inspect camera.
test('traveller and spirit deer review', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await page.waitForFunction(() => window.__pw?.frames() > 20, null, { timeout: 30_000 });
  await page.evaluate(() => { window.__pw.hud(false); window.__pw.look('soft', 'none'); window.__pw.teleport(5, 4, 180); window.__pw.portrait(true); });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/screenshots/traveller-front.png' });
  await page.evaluate(() => { window.__pw.portrait(false); window.__pw.teleport(5, 4, 0); window.__pw.zoom(0.95); });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'docs/screenshots/traveller-back.png' });
  const spots: [string, number, number][] = [['spirit-stag', -6, -12], ['spirit-doe', -27, 60], ['spirit-rabbit', 4, -3]];
  for (const style of ['soft', 'pixel'] as const) {
    for (const [name, lat, lon] of spots) {
      await page.evaluate(([s, n, a, b]) => { window.__pw.look(s as 'soft', 'none'); window.__pw.teleport(a as number, b as number, 0); window.__pw.inspect(n as string); }, [style, name, lat, lon]);
      await page.waitForTimeout(2200);
      await page.screenshot({ path: `docs/screenshots/${name}-${style}.png` });
    }
  }
  await page.evaluate(() => { window.__pw.inspect(null); window.__pw.look('soft', 'none'); window.__pw.teleport(1, -10, 20); window.__pw.zoom(0.9); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screenshots/deer-and-traveller.png' });
  expect(errors).toEqual([]);
});
