import { PALETTE as C } from './icons';
/** Hand-drawn, repeatable pixel scenery. Offset is world travel, never wall time. */
const themes: Record<string, string[]> = {
  meadow: [C.h, C.l, C.g, C.G, C.g, C.Y],
  forest: [C.b, C.g, C.G, C.G, C.G, C.l],
  labyrinth: [C.o, C.P, C.s, C.o, C.s, C.y],
  mine: [C.o, C.d, C.t, C.o, C.d, C.y],
  fen: [C.h, C.b, C.G, C.G, C.g, C.h],
  ruins: [C.h, C.b, C.g, C.s, C.g, C.w],
  nest: [C.p, C.P, C.d, C.P, C.d, C.Y],
  abyss: [C.o, C.P, C.p, C.o, C.P, C.L],
};
export const LANDSCAPE_KEYS = Object.keys(themes);
export function drawLandscape(c: CanvasRenderingContext2D, key: string, offset: number, time = 0): void {
  const [sky, far, mid, dark, ground, light] = themes[key] || themes.meadow;
  const r = (x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h); };
  const poly = (points: number[][], color: string) => {
    // Rasterise slopes into two-pixel steps instead of antialiased canvas paths.
    const min = Math.min(...points.map(p => p[1])), max = Math.max(...points.map(p => p[1]));
    for (let y = min; y < max; y += 2) {
      const hits: number[] = [];
      points.forEach(([ax, ay], i) => {
        const [bx, by] = points[(i + 1) % points.length];
        if ((ay <= y && by > y) || (by <= y && ay > y)) hits.push(ax + (y - ay) * (bx - ax) / (by - ay));
      });
      hits.sort((a, b) => a - b);
      for (let i = 0; i + 1 < hits.length; i += 2) {
        const x = Math.floor(hits[i] / 2) * 2;
        r(x, y, Math.max(2, Math.ceil(hits[i + 1] / 2) * 2 - x), Math.min(2, max - y), color);
      }
    }
  };
  r(0, 0, 320, 120, sky);
  const tile = (speed: number, width: number, paint: (x: number, index: number) => void) => {
    const start = Math.floor(offset * speed / width);
    for (let i = -1; i < Math.ceil(320 / width) + 1; i++) paint(i * width - (offset * speed % width), start + i);
  };
  if (['labyrinth', 'mine', 'abyss'].includes(key)) {
    tile(.15, 64, x => {
      r(x, 0, 62, 88, far);
      for (let y = 4; y < 88; y += 13) { r(x, y, 62, 1, sky); r(x + (y % 2 ? 14 : 38), y, 1, 13, sky); }
      r(x + 13, 26, 36, 54, sky); r(x + 17, 20, 28, 6, sky); r(x + 23, 16, 16, 4, sky);
      r(x + 8, 18, 4, 64, mid); r(x + 50, 18, 4, 64, mid);
    });
    if (key === 'mine') tile(.38, 104, x => {
      poly([[x, 0], [x + 13, 0], [x + 9, 20], [x + 6, 32], [x + 3, 12]], dark);
      r(x + 36, 22, 6, 63, dark); r(x + 75, 22, 6, 63, dark); r(x + 32, 20, 53, 6, ground);
      r(x + 51, 63, 4, 12, C.p); r(x + 55, 59, 3, 16, C.L);
      r(x + 58, 68, 5, 7, C.P);
    });
    if (key === 'labyrinth') tile(.38, 120, x => {
      r(x + 24, 32, 3, 19, dark); r(x + 22, 32, 7, 3, light);
      r(x + 24, 25, 4, 8, C.y); r(x + 25, 23 + Math.floor(Math.sin(time * 7)), 2, 6, C.Y);
      r(x + 70, 76, 21, 10, mid); r(x + 75, 73, 11, 3, mid);
    });
    if (key === 'abyss') tile(.35, 120, x => {
      r(x + 20, 0, 12, 86, dark); r(x + 17, 6, 18, 5, mid); r(x + 17, 76, 18, 7, mid);
      r(x + 64, 43, 20, 6, mid); r(x + 68, 40, 12, 12, mid);
      r(x + 68, 44, 12, 4, light); r(x + 73, 42, 3, 8, dark);
      for (let n = 0; n < 4; n++) r(x + 90 + n * 3, 12 + n * 16, 1, 1, light);
    });
  } else {
    // Stepped clouds and distant mountain ridges.
    tile(.08, 180, x => { r(x + 14, 15, 51, 5, light); r(x + 25, 11, 26, 4, light); });
    tile(.15, 128, (x, i) => {
      const peak = 26 + ((i % 3 + 3) % 3) * 7;
      poly([[x - 20, 87], [x + 20, peak + 16], [x + 28, peak + 16], [x + 44, peak], [x + 57, peak + 20], [x + 68, peak + 20], [x + 128, 87]], far);
      poly([[x + 44, peak], [x + 58, peak + 26], [x + 47, peak + 22], [x + 39, peak + 29]], mid);
    });
    if (key === 'meadow') tile(.35, 128, x => {
      poly([[x - 15, 87], [x + 10, 65], [x + 34, 65], [x + 55, 57], [x + 76, 63], [x + 100, 63], [x + 140, 87]], mid);
      r(x + 83, 61, 4, 23, dark); r(x + 72, 54, 26, 11, dark); r(x + 77, 49, 16, 5, dark);
      r(x + 17, 77, 18, 9, ground); r(x + 15, 76, 22, 3, light); r(x + 22, 68, 2, 8, dark); r(x + 30, 68, 2, 8, dark); r(x + 20, 66, 14, 2, dark);
    });
    if (key === 'forest' || key === 'fen') tile(.4, 76, (x, i) => {
      const h = 40 + (Math.abs(i) % 3) * 7;
      r(x + 32, 85 - h, 8, h, dark); r(x + 34, 84 - h, 2, h, mid);
      if (key === 'forest') {
        for (let n = 0; n < 3; n++) { r(x + 9 + n * 3, 17 + n * 10, 54 - n * 5, 12, dark); r(x + 16 + n * 3, 14 + n * 10, 36 - n * 4, 4, mid); }
        r(x + 27, 79, 18, 5, dark); r(x + 15, 81, 45, 4, dark);
      } else { r(x + 23, 31, 33, 4, dark); r(x + 26, 29, 3, 20, mid); r(x + 50, 34, 2, 18, mid); }
    });
    if (key === 'ruins') tile(.4, 104, x => {
      r(x + 15, 36, 12, 48, mid); r(x + 16, 37, 3, 46, light); r(x + 11, 31, 20, 6, light); r(x + 11, 80, 20, 5, light);
      r(x + 61, 47, 13, 37, mid); r(x + 62, 48, 3, 34, light); r(x + 58, 42, 19, 6, light);
      r(x + 26, 33, 36, 5, mid); r(x + 32, 30, 23, 3, light); r(x + 68, 55, 3, 12, ground);
    });
    if (key === 'nest') tile(.4, 118, x => {
      poly([[x, 88], [x + 17, 40], [x + 25, 31], [x + 33, 65], [x + 48, 88]], dark);
      poly([[x + 20, 88], [x + 51, 61], [x + 70, 57], [x + 92, 88]], mid);
      r(x + 73, 79, 31, 5, light); r(x + 79, 75, 22, 4, light); r(x + 87, 70, 7, 10, light); r(x + 83, 82, 4, 4, dark); r(x + 98, 81, 4, 4, dark);
    });
  }
  // Ground is a separate parallax layer. The upper edge stays at the actors' feet.
  r(0, 88, 320, 32, ground); r(0, 88, 320, 2, dark);
  tile(1, 48, (x, i) => {
    r(x + 4, 94 + Math.abs(i % 3) * 3, 11, 1, light); r(x + 27, 108, 7, 2, dark); r(x + 31, 107, 3, 1, light);
    if (['meadow', 'forest', 'fen'].includes(key)) { r(x + 19, 85, 1, 5, dark); r(x + 17, 87, 5, 2, dark); r(x + 20, 83, 1, 2, light); }
    else { r(x + 18, 91, 1, 14, dark); r(x + 18, 105, 12, 1, dark); }
    if (key === 'mine') { r(x + 5, 116, 23, 2, C.t); r(x + 12, 117, 17, 1, C.Y); }
    if (key === 'fen') { r(x + 7, 98, 28, 2, C.b); r(x + 12, 102, 16, 1, C.h); }
  });
  if (key === 'fen') { c.globalAlpha = .14; tile(.1, 140, x => { r(x, 64, 95, 5, light); r(x + 24, 75, 110, 3, light); }); c.globalAlpha = 1; }
}


/** Two scroll speeds. Alternating mirrored tiles meet at identical edge pixels,
 * so a generated painting need not be destructively edited to make it repeat. */
export function drawPaintedBattle(c: CanvasRenderingContext2D, image: HTMLImageElement, travel: number): void {
  const width = 320, height = 120, floor = 88;
  const band = (y: number, h: number, speed: number) => {
    const offset = Math.max(0, travel * speed), first = Math.floor(offset / width), shift = offset % width;
    const sy = image.naturalHeight * y / height, sh = image.naturalHeight * h / height;
    for (let tile = 0; tile < 2; tile++) {
      const x = Math.round(tile * width - shift);
      c.save();
      if ((first + tile) % 2) { c.translate(x + width, 0); c.scale(-1, 1); }
      else c.translate(x, 0);
      c.drawImage(image, 0, sy, image.naturalWidth, sh, 0, y, width, h);
      c.restore();
    }
  };
  band(0, floor, .22); band(floor, height - floor, 1);
}
