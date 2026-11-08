import { test, expect } from '@playwright/test';

test('a learned skill is clicked off and on; off skills stop acting', async ({ page }) => {
  await page.addInitScript(() => { localStorage.clear(); localStorage.setItem('yore.lang', 'zh'); });
  await page.goto('/'); await page.click('#t-play'); await page.click('.intro'); await page.click('#c-go');
  await page.click('.nav [data-k="skills"]');
  const row = page.locator('.view .skill').first();
  await expect(row).not.toHaveAttribute('data-a', 'sktoggle'); // not learned: nothing to toggle
  await row.locator('.up-btn').click();
  await expect(row).toHaveAttribute('data-a', 'sktoggle');
  const key = await row.getAttribute('data-k');
  const off = () => page.evaluate(k => ((window as any).__game.s.skillsOff || []).includes(k), key);
  // a mouse clicks once; a finger's first tap only opens the tooltip, the next one toggles
  const hasTouch = test.info().project.use.hasTouch;
  const press = async () => {
    const name = page.locator('.view .skill').first().locator('.sname');
    const before = await off();
    if (!hasTouch) return name.click();
    await name.tap(); // opens the tooltip, unless it was already open for this row
    if (await off() === before) await name.tap();
  };
  await press();
  await expect(page.locator('.view .skill').first()).toHaveClass(/\boff\b/);
  expect(await off()).toBe(true);
  await press();
  await expect(page.locator('.view .skill').first()).not.toHaveClass(/\boff\b/);
  expect(await off()).toBe(false);
});
