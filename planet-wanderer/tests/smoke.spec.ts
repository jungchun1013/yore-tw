import { test, expect } from '@playwright/test';

// window.__pw is declared in src/main.ts.

test('planet renders in both views without errors', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await page.waitForFunction(() => window.__pw?.frames() > 20, null, { timeout: 30_000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `docs/screenshots/life-${info.project.name}.png` });
  await page.evaluate(() => window.__pw.zoom(0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: `docs/screenshots/planet-${info.project.name}.png` });
  await page.keyboard.down('d');
  await page.waitForTimeout(900);
  await page.keyboard.up('d');
  expect(errors).toEqual([]);
});

// Close-ups of each landmark, for eyeballing the art (desktop only). The traveller
// stands just south of the landmark; the camera looks north past him at it.
export const SPOTS: [name: string, lat: number, lon: number, zoom: number][] = [
  ['cabin', 11, 4, 0.92],
  ['fence', 12, -10, 0.95],
  ['trees', 21, -22, 0.9],
  ['pond-rocks', -17, -27, 0.85],
  ['ruin', -24, 25, 0.84],
  ['ruin-inside', -18, 24, 0.95],
  ['marker-path', 0, 8, 0.95],
  ['cobble-path', 2, -10, 0.95],
  ['ship', 5, 41, 0.92],
];
test('landmark close-ups', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/');
  await page.waitForFunction(() => window.__pw?.frames() > 20, null, { timeout: 30_000 });
  await page.waitForTimeout(2600);
  for (const style of ['soft', 'pixel'] as const) {
    await page.evaluate((s) => window.__pw.look(s, 'tint'), style);
    for (const [name, lat, lon, zoom] of SPOTS) {
      await page.evaluate(([a, b, z]) => { window.__pw.teleport(a, b, 0); window.__pw.zoom(z); }, [lat, lon, zoom]);
      await page.waitForTimeout(1300);
      await page.screenshot({ path: `docs/screenshots/spot-${style}-${name}.png` });
    }
  }
});

// Board the ship on the meadow, land on the rose moon, fly back; nothing leaks.
test('travel between scenes by ship', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await page.waitForFunction(() => window.__pw?.frames() > 20, null, { timeout: 30_000 });
  await page.waitForTimeout(500);
  const baseline = await page.evaluate(() => window.__pw.geometries());
  expect(await page.evaluate(() => window.__pw.scene())).toBe('meadow');

  // Walk up to the ship: the prompt appears and E boards it.
  await page.evaluate(() => window.__pw.teleport(8, 36, 0));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__pw.nearExit())).toBe('rose-moon');
  await page.screenshot({ path: 'docs/screenshots/travel-prompt.png' });
  await page.keyboard.press('e');
  await page.waitForTimeout(1300);
  await page.screenshot({ path: 'docs/screenshots/travel-lift.png' });
  await page.waitForFunction(() => window.__pw.scene() === 'rose-moon' && !window.__pw.busy(), null, { timeout: 10_000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screenshots/rose-moon-life.png' });
  await page.evaluate(() => window.__pw.zoom(0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'docs/screenshots/rose-moon-planet.png' });

  const roundTrip = async () => {
    await page.evaluate(() => window.__pw.travel('meadow'));
    await page.waitForFunction(() => window.__pw.scene() === 'meadow' && !window.__pw.busy(), null, { timeout: 10_000 });
    await page.waitForTimeout(800);
    const n = await page.evaluate(() => window.__pw.geometries());
    await page.evaluate(() => window.__pw.travel('rose-moon'));
    await page.waitForFunction(() => window.__pw.scene() === 'rose-moon' && !window.__pw.busy(), null, { timeout: 10_000 });
    return n;
  };
  // Same arrival spot and camera each time, so the GPU should hold the same geometry.
  // (The very first count is lower only because unseen objects upload lazily.)
  const first = await roundTrip();
  const second = await roundTrip();
  expect(second).toBeLessThanOrEqual(first + 3);
  void baseline;
  expect(errors).toEqual([]);
});
