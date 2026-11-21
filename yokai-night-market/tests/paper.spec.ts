import { test, expect } from '@playwright/test';

test('paper atlas loads, comparison controls work, and both art modes start gameplay', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/?atelier&t=0');
  await expect(page.getByRole('button', { name: 'Codex 紙藝版' })).toBeVisible();
  expect(await page.evaluate(async () => { const im = new Image(); im.src = '/art/paper-atlas.png'; await im.decode(); return im.naturalWidth; })).toBeGreaterThan(1000);
  await page.screenshot({ path: `docs/art-review/paper-${test.info().project.name}.png` });
  await page.getByRole('button', { name: '同景對照' }).click();
  await expect(page.getByRole('slider')).toBeVisible();
  await page.getByRole('slider').fill('65');
  await page.screenshot({ path: `docs/art-review/comparison-${test.info().project.name}.png` });
  await page.getByRole('button', { name: 'Claude 素材' }).click();
  await expect(page.getByRole('slider')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const art of ['paper', 'claude']) {
    await page.goto(`/?debug&art=${art}`);
    await page.locator('[data-id=tap]').click();
    await page.locator('[data-id=start]').click();
    await page.locator('[data-id=go]').click();
    await expect(page.locator('.hud-time')).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({path:`docs/art-review/game-${art}-${test.info().project.name}.png`});
  }
  expect(errors).toEqual([]);
});
