import { test, expect } from '@playwright/test';
test('editor', async ({ page }) => {
  const errs: string[] = []; page.on('pageerror', e => errs.push(String(e)));
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('file://' + process.env.PE + '/souls-pixel-editor.html');
  await page.waitForTimeout(500);
  const g = page.locator('#grid'); const box = (await g.boundingBox())!; const s = box.width / 16;
  const at = (x: number, y: number) => ({ x: box.x + (x + .5) * s, y: box.y + (y + .5) * s });
  // rect select head area, move right by 2
  await page.click('[data-tool="rect"]');
  let p = at(3, 2); await page.mouse.move(p.x, p.y); await page.mouse.down(); p = at(13, 12); await page.mouse.move(p.x, p.y, { steps: 4 }); await page.mouse.up();
  p = at(7, 7); await page.mouse.move(p.x, p.y); await page.mouse.down(); p = at(5, 9); await page.mouse.move(p.x, p.y, { steps: 4 }); await page.mouse.up();
  await page.screenshot({ path: process.env.PE + '/s1.png' });
  // lasso
  await page.keyboard.press('Escape'); await page.click('[data-tool="lasso"]');
  for (const [i, [x, y]] of [[2,2],[8,1],[14,6],[8,14],[2,10],[2,2]].entries()) { const q = at(x, y); if (!i) { await page.mouse.move(q.x, q.y); await page.mouse.down(); } else await page.mouse.move(q.x, q.y, { steps: 3 }); }
  await page.mouse.up();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
  await page.screenshot({ path: process.env.PE + '/s2.png' });
  await page.keyboard.press('Meta+z');
  await page.setViewportSize({ width: 400, height: 860 }); await page.waitForTimeout(200);
  await page.screenshot({ path: process.env.PE + '/s3.png', fullPage: true });
  expect(errs).toEqual([]);
});
