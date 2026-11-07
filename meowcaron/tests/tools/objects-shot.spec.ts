import { test, expect } from '@playwright/test';

/** Visual review of the complete object set at an integer scale. */
test('redrawn furniture and conveyor review', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.waitForFunction(() => !!window.__mc?.hero);
  const art = await page.evaluate(() => {
    const s = window.__mc!.sprites;
    const house = s.furnitureCanvas('cathouse', 4), mixer = s.propCanvas('mixer', 0, 4);
    const paw = s.patCanvas('click1'); const pixels = paw.getContext('2d')!.getImageData(0, 0, paw.width, paw.height).data;
    const remaining = new Set<number>();
    for (let i = 0; i < paw.width * paw.height; i++) if (pixels[i * 4 + 3] > 0) remaining.add(i);
    let pads = 0;
    while (remaining.size) {
      const first = remaining.values().next().value!; const queue = [first]; remaining.delete(first); pads++;
      while (queue.length) {
        const p = queue.pop()!;
        for (const n of [p - paw.width, p + paw.width, ...(p % paw.width ? [p - 1] : []), ...(p % paw.width < paw.width - 1 ? [p + 1] : [])]) if (remaining.delete(n)) queue.push(n);
      }
    }
    const basket = s.furnitureCanvas('basket');
    const originalBasket = s.overrideCanvas('furniture:basket')!;
    const scene = window.__mc!.debug!.scene() as { textures: { get(key: string): { getSourceImage(): HTMLCanvasElement } } };
    const full = scene.textures.get('furn_basket').getSourceImage();
    const front = scene.textures.get('furn_basket_front').getSourceImage();
    const split = 11 * 4;
    const upper = front.getContext('2d')!.getImageData(0, 0, front.width, split).data;
    const lower = front.getContext('2d')!.getImageData(0, split, front.width, front.height - split).data;
    const expected = full.getContext('2d')!.getImageData(0, split, full.width, full.height - split).data;
    const brokenRims: string[] = [];
    let rimSegments = 0;
    for (const name of ['cushion_round', 'bed']) {
      const disc = s.furnitureCanvas(name);
      const data = disc.getContext('2d')!.getImageData(0, 0, disc.width, disc.height).data;
      const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < disc.width && y < disc.height && data[(y * disc.width + x) * 4 + 3] > 0;
      for (let y = 0; y < disc.height; y++) for (let x = 0; x < disc.width; x++) {
        if (!opaque(x, y) || [opaque(x - 1, y), opaque(x + 1, y), opaque(x, y - 1), opaque(x, y + 1)].every(Boolean)) continue;
        const i = (y * disc.width + x) * 4;
        if (data[i] !== 90 || data[i + 1] !== 64 || data[i + 2] !== 56) brokenRims.push(`${name}:${x},${y}`);
      }
      if (name === 'cushion_round') {
        const rim = new Set<number>();
        for (let p = 0; p < disc.width * disc.height; p++) if (data[p * 4 + 3] && data[p * 4] === 90 && data[p * 4 + 1] === 64 && data[p * 4 + 2] === 56) rim.add(p);
        while (rim.size) {
          const first = rim.values().next().value!; rim.delete(first); const queue = [first]; rimSegments++;
          while (queue.length) { const p = queue.pop()!; for (const n of [p - disc.width, p + disc.width, ...(p % disc.width ? [p - 1] : []), ...(p % disc.width < disc.width - 1 ? [p + 1] : [])]) if (rim.delete(n)) queue.push(n); }
        }
      }
    }
    return { house: [house.width, house.height], mixer: [mixer.width, mixer.height], pads,
      originalBasket: basket.toDataURL() === originalBasket.toDataURL(),
      basketFront: upper.every(v => v === 0) && lower.every((v, i) => v === expected[i]),
      brokenRims, rimSegments,
    };
  });
  expect(art).toEqual({ house: [136, 120], mixer: [88, 96], pads: 5, originalBasket: true, basketFront: true, brokenRims: [], rimSegments: 1 });
  await page.evaluate(() => {
    const s = window.__mc!.sprites;
    const root = document.createElement('div'); root.id = 'objects-review';
    root.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#FFF7F0;padding:24px;color:#5A4038;font:16px sans-serif';
    for (const [title, names] of [
      ['家具', ['cushion_round', 'scratcher', 'cattree', 'basket', 'cathouse', 'tent', 'tent2', 'hangball', 'fishbowl', 'bed', 'fish']],
    ] as const) {
      const heading = document.createElement('h2'); heading.textContent = title; root.append(heading);
      const grid = document.createElement('div'); grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:24px;align-items:end';
      for (const name of names) {
        const cell = document.createElement('div'); cell.style.cssText = 'text-align:center;width:144px';
        const c = s.furnitureCanvas(name, 4);
        if (name === 'hangball') c.getContext('2d')!.drawImage(s.furnitureCanvas('hangball_ball', 4), 10 * 4, 4 * 4);
        c.style.cssText = `image-rendering:pixelated;width:${c.width}px;height:${c.height}px`;
        cell.append(c, document.createElement('br'), name); grid.append(cell);
      }
      root.append(grid);
    }
    const heading = document.createElement('h2'); heading.textContent = '輸送帶'; root.append(heading);
    const belt = s.beltCanvas(); const c = document.createElement('canvas'); c.width = 160; c.height = 8;
    const ctx = c.getContext('2d')!; for (let a = 0; a < 160; a += 8) ctx.drawImage(belt, a, 0);
    c.style.cssText = 'image-rendering:pixelated;width:640px;height:32px'; root.append(c);
    document.body.append(root);
  });
  await expect(page.locator('#objects-review canvas')).toHaveCount(12);
  await page.screenshot({ path: 'docs/screenshots/objects-redrawn.png', fullPage: true });
  expect(errors).toEqual([]);
});
