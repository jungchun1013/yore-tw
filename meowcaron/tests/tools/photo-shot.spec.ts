import { test } from '@playwright/test';
/** Renders a post photo for each spot so the picture can be checked against the furniture. Run: PHOTO=1 */
test('post photos per spot', async ({ page }) => {
  test.skip(!process.env.PHOTO, 'set PHOTO=1');
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('meowcaron.lang', 'zh'); });
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.ctrl);
  // write one diary entry per spot through the controller, then read the feed's rendered photos
  await page.evaluate(() => {
    const c = window.__mc!.ctrl;
    const spots: [string, string, string][] = [['nap', 'cushion', 'kitten'], ['nap', 'bed', 'baker'], ['nap', 'cathouse', 'courier'], ['nap', 'tent', 'apprentice'], ['nap', 'fish', 'manager'], ['rest', 'cattree', 'patissier'], ['rest', 'window', 'kitten'], ['play', 'scratcher', 'courier'], ['play', 'hangball', 'apprentice']];
    c.state.gens.influencer = 1; c.state.followers = 500;
    for (const [kind, bg, cat] of spots) c.diary(kind as never, [cat], `${kind} @ ${bg}`, bg as never);
  });
  await page.locator('#btn-feed').click();
  await page.waitForTimeout(500);
  await page.locator('.feed-list').screenshot({ path: 'docs/screenshots/post-photos.png' });
});
