import { test } from '@playwright/test';
const OUT = process.env.OUT!;
test.use({ video: 'off', deviceScaleFactor: 1, viewport: { width: 1280, height: 800 } });
test('planet shots', async ({ page }) => {
  test.setTimeout(240000);
  await page.goto('https://yore-tw.com/planet-wanderer/');
  await page.waitForFunction(() => (window as any).__pw?.frames() > 20, null, { timeout: 60_000 });
  await page.waitForTimeout(2600);
  await page.evaluate(() => (window as any).__pw.hud(false));
  const shot = async (name: string, style: string, lat: number, lon: number, zoom: number) => {
    await page.evaluate(([s, a, b, z]) => { const w = (window as any).__pw; w.look(s, 'tint'); w.teleport(a, b, 0); w.zoom(z); }, [style, lat, lon, zoom] as any);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${OUT}/${name}.png` });
  };
  for (const [n, st, a, b, z] of JSON.parse(process.env.SHOTS!)) await shot(n, st, a, b, z);
});
