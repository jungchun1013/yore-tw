import { test, expect } from '@playwright/test';

// Reproducible views for reviewing roof intersections and the actual character mesh.
test('roof and traveller front review', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await page.waitForFunction(() => window.__pw?.frames() > 20);
  await page.evaluate(() => {
    window.__pw.hud(false);
    window.__pw.look('pixel', 'none');
    window.__pw.teleport(11, 4, 0);
    window.__pw.zoom(0.92);
    window.__pw.inspect('red-roof-timber-cabin');
  });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'docs/screenshots/review-roof.png' });
  await page.evaluate(() => {
    window.__pw.inspect(null);
    window.__pw.teleport(5, 4, 180);
    window.__pw.portrait(true);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'docs/screenshots/traveller-front.png' });
  expect(errors).toEqual([]);
});

test('independent rustic and Nordic building studies', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await page.waitForFunction(() => window.__pw?.frames() > 20);
  await page.evaluate(() => { window.__pw.hud(false); window.__pw.look('pixel','none'); });
  for (const [name, lat, lon, file] of [
    ['rustic-red-hut',24,65,'study-rustic-hut'],
    ['nordic-log-cabin',-15,105,'study-nordic-log-cabin'],
    ['norway-spruce',-15,105,'study-norway-spruce'],
  ] as const) {
    await page.evaluate(([n,a,b]) => {
      window.__pw.teleport(a,b,180); window.__pw.inspect(n);
    }, [name,lat,lon] as const);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `docs/screenshots/${file}.png` });
  }
  expect(errors).toEqual([]);
});
