import { test } from '@playwright/test';

// Clean frames (no HUD) for the entry site: cover and gallery.
test('site shots', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/');
  await page.waitForFunction(() => window.__pw?.frames() > 20, null, { timeout: 30_000 });
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.__pw.hud(false));
  const shot = async (name: string, style: 'soft' | 'sky' | 'pixel', lat: number, lon: number, zoom: number) => {
    await page.evaluate(([s, a, b, z]) => { window.__pw.look(s as 'soft', 'tint'); window.__pw.teleport(a as number, b as number, 0); window.__pw.zoom(z as number); }, [style, lat, lon, zoom]);
    await page.waitForTimeout(1400);
    await page.screenshot({ path: `docs/screenshots/site-${name}.png` });
  };
  await shot('soft-planet', 'soft', 5, 4, 0);
  await shot('cabin', 'soft', 11, 4, 0.92);
  await shot('pixel-planet', 'pixel', 5, 4, 0);
});
