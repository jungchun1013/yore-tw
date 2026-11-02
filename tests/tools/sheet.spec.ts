import { test } from '@playwright/test';
import { CATS } from '../../src/content/cats';
import { SPECIES } from '../../src/content/customers';

/** Renders every cat (open + blink) and macaron at 8× into test-results/sheet.png for visual review. */
test('sprite sheet', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc);
  const ids = CATS.map((c) => [c.coat, c.accessory] as const);
  const animals = SPECIES.map((s) => ({ head: s.head, extra: s.extra, body: s.body, coats: s.coats }));
  await page.evaluate(([list, animals]) => {
    const S = window.__mc!.sprites;
    const Z = 8, cw = 24 * Z, ch = 24 * Z;
    const cols = 6;
    const items: HTMLCanvasElement[] = [S.catCanvas('cream', 'none'), S.catCanvas('cream', 'none', 'blink'), S.catCanvas('cream', 'none', 'happy')];
    for (const [color, acc] of list) { items.push(S.catCanvas(color, acc)); }
    for (const a of animals) for (const coat of a.coats) items.push(S.animalCanvas(a, coat));
    for (const k of ['pink', 'mint', 'lemon', 'sky']) items.push(S.macaronCanvas(k));
    items.push(S.starCanvas());
    const rows = Math.ceil(items.length / cols);
    const sheet = document.createElement('canvas');
    sheet.width = cols * cw; sheet.height = rows * ch;
    const ctx = sheet.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#FFF7F0'; ctx.fillRect(0, 0, sheet.width, sheet.height);
    items.forEach((c, i) => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      ctx.strokeStyle = '#eee'; ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
      ctx.drawImage(c, x + (cw - c.width * Z) / 2, y + (ch - c.height * Z) / 2, c.width * Z, c.height * Z);
    });
    sheet.id = 'sheet';
    sheet.style.cssText = 'position:fixed;left:0;top:0;z-index:999;';
    document.body.appendChild(sheet);
  }, [ids, animals] as const);
  await page.locator('#sheet').screenshot({ path: 'test-results/sheet.png' });
});
