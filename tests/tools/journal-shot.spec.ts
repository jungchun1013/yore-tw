import { test } from '@playwright/test';

/** Screenshot of the diary-style journal and of a petted cat, for visual review. */
test('journal screenshot', async ({ page }) => {
  await page.addInitScript(([k, s]) => { localStorage.clear(); localStorage.setItem(k as string, JSON.stringify(s)); },
    ['meowcaron.save.v1', { version: 1, macarons: 5000, totalEarned: 50_000, allTimeEarned: 50_000, gens: { kitten: 6, apprentice: 4, baker: 3 }, lastTick: Date.now() }] as const);
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.debug?.roamer());
  await page.waitForTimeout(500);
  const box = (await page.locator('#game canvas').boundingBox())!;
  const r = await page.evaluate(() => window.__mc!.debug!.roamer());
  if (r) { await page.mouse.click(box.x + r.x, box.y + r.y); await page.waitForTimeout(500); }
  await page.screenshot({ path: `test-results/shot-pet-${test.info().project.name}.png` });
  await page.locator('[data-cat="baker"] .info').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `test-results/shot-journal-${test.info().project.name}.png` });
  await page.locator('#journal-close').click();
  await page.evaluate(() => { const c = window.__mc!.ctrl; c.state.customersSeen = { cat: 3, dog: 1, bear: 1 }; c.state.customersServed = { cat: 2, bear: 1 }; });
  await page.locator('#btn-codex').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `test-results/shot-codex-${test.info().project.name}.png` });
  await page.locator('#codex-close').click();
  // feed: seed an influencer and a few moments with different backgrounds
  await page.evaluate(() => {
    const c = window.__mc!.ctrl;
    c.state.gens.influencer = 1; c.state.followers = 1280;
    c.diary('cuddle', ['kitten', 'baker'], 'Caught Kitten grooming Baker Cat. Baker Cat pretended not to enjoy it.', 'park');
    c.diary('nap', ['courier'], 'Courier Cat snuck off behind the oven for a secret nap. The oven is warm.', 'oven');
    c.diary('star', ['cosmic'], 'A shooting star fell over the shop and Cosmic Cat caught it. 3/10 collected.', 'roof');
    c.diary('rest', ['manager'], 'Manager Cat sat at the counter and watched the street for a while.', 'front');
  });
  await page.locator('#btn-feed').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `test-results/shot-feed-${test.info().project.name}.png` });
});
