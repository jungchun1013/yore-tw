import { test, expect } from '@playwright/test';

/** Visual review of the complete object set at an integer scale. */
test('redrawn furniture and conveyor review', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.sprites);
  await page.evaluate(() => {
    const s = window.__mc!.sprites;
    const root = document.createElement('div'); root.id = 'objects-review';
    root.style.cssText = 'position:absolute;inset:0;z-index:9999;background:#FFF7F0;padding:24px;color:#5A4038;font:16px sans-serif';
    for (const [title, names] of [
      ['家具', ['cushion_round', 'scratcher', 'cattree', 'basket', 'cathouse', 'tent', 'tent2', 'hangball', 'fishbowl', 'bed', 'fish']],
    ] as const) {
      const heading = document.createElement('h2'); heading.textContent = title; root.append(heading);
      const grid = document.createElement('div'); grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px;align-items:end';
      for (const name of names) {
        const cell = document.createElement('div'); cell.style.cssText = 'text-align:center;width:144px';
        const c = s.furnitureCanvas(name); c.style.cssText = `image-rendering:pixelated;width:${c.width * 4}px;height:${c.height * 4}px`;
        cell.append(c, document.createElement('br'), name); grid.append(cell);
      }
      root.append(grid);
    }
    const heading = document.createElement('h2'); heading.textContent = '輸送帶'; root.append(heading);
    const belt = s.beltCanvas(); const c = document.createElement('canvas'); c.width = 160; c.height = 8;
    const ctx = c.getContext('2d')!; for (let a = 0; a < 160; a += 8) ctx.drawImage(belt, a, 0);
    c.style.cssText = 'image-rendering:pixelated;width:640px;height:32px'; root.append(c);
    document.body.replaceChildren(root);
  });
  await expect(page.locator('#objects-review canvas')).toHaveCount(12);
  await page.screenshot({ path: 'docs/screenshots/objects-redrawn.png', fullPage: true });
});
