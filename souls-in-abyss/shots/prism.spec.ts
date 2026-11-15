import { test } from '@playwright/test';
const OUT = process.env.OUT!;
test.use({ video: 'off', locale: 'zh-TW', deviceScaleFactor: 1, viewport: { width: 1440, height: 1000 } });
const at = async (board: any, x: number, y: number) => {
  const box = await board.boundingBox();
  const cam = await board.evaluate((e: HTMLElement) => ({ zoom: Number(e.dataset.zoom) || 1, x: Number(e.dataset.panX) || 0, y: Number(e.dataset.panY) || 0 }));
  return { x: box.x + ((288 + (x - y) * 15 - 288) * cam.zoom + 288 + cam.x) / 576 * box.width, y: box.y + ((54 + (x + y + 1) * 7.5 - 192) * cam.zoom + 192 + cam.y) / 384 * box.height };
};
test('prism build preview', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('https://yore-tw.com/prism-defense/');
  await page.click('#begin'); await page.waitForSelector('#board[data-art="painted"]'); await page.waitForTimeout(800);
  const board = page.locator('#board');
  const cells: [number, number][] = JSON.parse(process.env.CELLS || '[[6,6]]');
  const builds: [string, number, number][] = JSON.parse(process.env.BUILDS || '[]');
  for (const [k, x, y] of builds) { await page.click(`[data-build="${k}"]`); const p = await at(board, x, y); await page.mouse.click(p.x, p.y); await page.waitForTimeout(250); }
  await page.click(`[data-build="${process.env.PICK || 'cannon'}"]`);
  let n = 0;
  for (const [x, y] of cells) { const p = await at(board, x, y); await page.mouse.move(p.x - 3, p.y); await page.mouse.move(p.x, p.y); await page.waitForTimeout(500); await page.screenshot({ path: `${OUT}/prism-try-${n++}.png` }); }
  console.log(JSON.stringify(await page.evaluate(() => ['#board', '.sidebar', '#details'].map(s => { const r = document.querySelector(s)!.getBoundingClientRect(); return [s, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }))));
});
