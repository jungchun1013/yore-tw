import { test } from '@playwright/test';

// The stag from several angles, to judge how the antlers sit on the head.
test('stag antler views', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/');
  await page.waitForFunction(() => window.__pw?.frames() > 20, null, { timeout: 30_000 });
  await page.evaluate(() => { window.__pw.hud(false); window.__pw.look('soft', 'none'); window.__pw.teleport(-6, -12, 0); window.__pw.inspect('spirit-stag'); });
  await page.waitForTimeout(2500);
  const views: [string, number, number, number][] = [
    ['front', 0, 12, 3.2], ['three-quarter', 45, 18, 3.4], ['side', 90, 8, 3.6],
    ['rear-quarter', 135, 20, 3.4], ['back', 180, 12, 3.2], ['top', 60, 70, 3.6],
  ];
  for (const [name, az, el, dist] of views) {
    await page.evaluate((o) => window.__pw.inspectOrbit(o as [number, number, number]), [az, el, dist]);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `docs/screenshots/antler-${name}.png` });
  }
  await page.evaluate(() => window.__pw.inspectOrbit(null));
});
