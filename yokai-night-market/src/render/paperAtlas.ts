import { PENDING_ART } from '../data/art';
import type { Sprite } from './kit';

/** Runtime atlas extraction preserves generated alpha; gameplay still uses foot anchors. */
export const paperMode = new URLSearchParams(location.search).get('art') !== 'claude';
const atlas = new Map<string, Sprite>();
const entries: [string, number, number][] = [
  ['miko', 0, 50], ['fox', 1, 64], ['chochin', 2, 40],
  ['stall', 3, 106], ['shrine', 4, 110], ['torii', 5, 108],
  ['sakura', 6, 120], ['maple', 7, 120], ['stoneLantern', 8, 65],
];
export async function loadPaperAtlas(): Promise<void> {
  const img = new Image(); img.src = `${import.meta.env.BASE_URL}art/paper-atlas.png`;
  await img.decode();
  const cellW = img.naturalWidth / 3, cellH = img.naturalHeight / 3;
  for (const [key, cell, height] of entries) {
    const cv = document.createElement('canvas'); cv.width = Math.floor(cellW); cv.height = Math.floor(cellH);
    const c = cv.getContext('2d', { willReadFrequently: true })!;
    c.drawImage(img, (cell % 3) * cellW, Math.floor(cell / 3) * cellH, cellW, cellH, 0, 0, cv.width, cv.height);
    const { data } = c.getImageData(0, 0, cv.width, cv.height);
    // Ignore isolated remnants from neighbouring generated cells (e.g. a foot above a roof).
    const seen = new Uint8Array(cv.width * cv.height), queue = new Int32Array(seen.length);
    let l = cv.width, r = 0, top = cv.height, bottom = 0, largest = 0;
    for (let seed = 0; seed < seen.length; seed++) {
      if (seen[seed] || data[seed * 4 + 3] <= 24) continue;
      let head = 0, tail = 1, cl = cv.width, cr = 0, ct = cv.height, cb = 0;
      queue[0] = seed; seen[seed] = 1;
      while (head < tail) {
        const pos = queue[head++], x = pos % cv.width, y = Math.floor(pos / cv.width);
        cl = Math.min(cl,x); cr = Math.max(cr,x); ct = Math.min(ct,y); cb = Math.max(cb,y);
        for (const n of [x > 0 ? pos - 1 : -1, x < cv.width - 1 ? pos + 1 : -1, pos - cv.width, pos + cv.width]) {
          if (n >= 0 && n < seen.length && !seen[n] && data[n * 4 + 3] > 24) { seen[n] = 1; queue[tail++] = n; }
        }
      }
      if (tail > largest) { largest = tail; l = cl; r = cr; top = ct; bottom = cb; }
    }
    if (r < l) throw new Error(`Empty paper atlas cell: ${key}`);
    l = Math.max(0, l - 3); top = Math.max(0, top - 3); r = Math.min(cv.width - 1, r + 3); bottom = Math.min(cv.height - 1, bottom + 3);
    const out = document.createElement('canvas'); out.width = r - l + 1; out.height = bottom - top + 1;
    out.getContext('2d')!.drawImage(cv, l, top, out.width, out.height, 0, 0, out.width, out.height);
    const w = height * out.width / out.height;
    atlas.set(key, { c: out, w, h: height, ox: w / 2, oy: height - 1 });
  }
}
// Single sprites cut from Codex's six Tainan concept sheets (public/art/tainan, see sprites.json).
// [key, in-game height in logical px]. A key that matches an existing sprite key replaces it.
const TAINAN: [string, number][] = [
  // approved 2026-11-18: Codex redraw v3 buildings, and the ink-print sheet (buildings, decor, the two characters, food)
  ['chihkan', 150], ['shennong', 130], ['hayashi', 170], ['confucius', 120], ['machiya', 130], ['noodleStall', 84],
  ['brickHouse', 120], ['woodHouse', 100], ['swordLionWall', 46], ['lantern', 40], ['tileFlower', 22], ['censer', 30],
  ['miko', 50], ['sayo', 50], ['fox', 52],
  ['danzai', 24], ['milkfish', 24], ['wagui', 17], ['pengbing', 24], ['dango', 24],
  // monsters and trees requested 2026-11-18; used once Codex's pictures are cut into public/art/tainan
  ['kuroneko', 34], ['hebi', 26], ['fengshi', 52], ['bixi', 46], ['lurou', 24],
  ['banyan', 170], ['flameTree', 160], ['literature', 120],
];

export async function loadTainanArt(): Promise<void> {
  // One failed picture must not cost the others: it is skipped and that key keeps its drawn sprite.
  // index.json lists the pictures that exist, so nothing is requested that would 404
  let have: Set<string>;
  try { have = new Set((await (await fetch(`${import.meta.env.BASE_URL}art/tainan/index.json`)).json()) as string[]); } catch { return; }
  const results = await Promise.allSettled(TAINAN.filter(([key]) => have.has(key)).map(async ([key, height]) => {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error(`could not load ${key}`));
      im.src = `${import.meta.env.BASE_URL}art/tainan/${key}.png`;
    });
    const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
    cv.getContext('2d')!.drawImage(img, 0, 0);
    const w = height * cv.width / cv.height;
    atlas.set(key, { c: cv, w, h: height, ox: w / 2, oy: height - 1 });
    PENDING_ART.delete(key);
  }));

  const failed = results.filter((r) => r.status === 'rejected').length;
  if (failed) console.warn(`${failed} Tainan sprites did not load; their drawn versions are used instead`);
}

// Heal pickups show one of these. Coffin toast is left out: it is a postwar dish and the game is set around 1930.

export function hasArt(key: string): boolean { return atlas.has(key); }

export function atlasSprite(key: string): Sprite | undefined {
  if (key.startsWith('hero:miko:')) key = 'miko';
  else if (key.startsWith('hero:sayo:')) key = 'sayo';
  else if (key.startsWith('hero:fox:')) key = 'fox';
  // Preserve enemies' identity and building functions. Other assets retain the procedural renderer.
  const aliases: Record<string, string> = {
    phoenix: 'maple', andon: 'stoneLantern',
    // Tainan set: yokai, stage props and two passive icons
    lanterns: 'lantern', swordlion: 'swordLionWall', redgate: 'confucius',
  };
  return atlas.get(aliases[key] ?? key);
}
