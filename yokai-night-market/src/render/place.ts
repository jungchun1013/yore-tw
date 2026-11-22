// Furniture in the yard. The yard in front of the buildings is a 45-degree grid of diamond cells
// (2*DW wide, 2*DH tall), like the yards in Moon Rabbit and Star Acres. Cell (gx, gy): gx runs
// down to the right, gy down to the left, so gx + gy is depth (bigger is nearer the camera) and
// things sort by it. A piece's footprint in the manifest is width x depth in cells. Walls are not
// handled yet; `surface` in the saved record keeps room for them.
import { ASSET, variantAt, withTag } from '../data/manifest';
import { hasArt } from './paperAtlas';
import { spr } from './sprites';
import { DH, DW, FLOOR_Y0, FLOOR_Y1, street, type StreetExtra } from './street';

export interface Placed { key: string; gx: number; gy: number; flip?: boolean; surface?: 'floor' | 'wall' }

// centre of a cell in street units, and the cell under a street point
export const cellXY = (gx: number, gy: number): [number, number] => [(gx - gy) * DW, FLOOR_Y0 + (gx + gy + 1) * DH];
export function cellAt(x: number, y: number): [number, number] {
  const u = x / DW, v = (y - FLOOR_Y0) / DH - 1;
  return [Math.round((u + v) / 2), Math.round((v - u) / 2)];
}
const footprint = (key: string): [number, number] => ASSET[key]?.footprint ?? [1, 1];

function cells(p: Placed): [number, number][] {
  const [w, d] = footprint(p.key), out: [number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([p.gx + i, p.gy + j]);
  return out;
}
const onFloor = (gx: number, gy: number): boolean => {
  const [x, y] = cellXY(gx, gy);
  return y - DH >= FLOOR_Y0 - 0.1 && y + DH <= FLOOR_Y1 + 0.1 && x - DW >= DW && x + DW <= street.width - DW;
};

export function canPlace(list: Placed[], p: Placed): boolean {
  const mine = cells(p);
  if (!mine.every(([x, y]) => onFloor(x, y))) return false;
  for (const o of list) for (const [ox, oy] of cells(o)) if (mine.some(([x, y]) => x === ox && y === oy)) return false;
  return true;
}
export function itemAt(list: Placed[], gx: number, gy: number): number {
  return list.findIndex((o) => cells(o).some(([x, y]) => x === gx && y === gy));
}

// the picture that stands for a piece in the tray: a joining family shows its post
export const trayArt = (key: string): string => (ASSET[key]?.tags?.includes('join') ? `${key}Post` : key);
export const furnitureKeys = (): string[] => withTag('furniture').map((a) => a.key).filter((k) => hasArt(trayArt(k)));

// Pieces that join their neighbours (art bible 12b), like fences in Minecraft: the piece's key is
// the family; its art is `<key>Post` (drawn in every cell) and `<key>Rail`, drawn from a post to
// the next post along either diagonal (gx + 1 or gy + 1) when that cell holds the same family.
const isJoin = (key: string): boolean => !!ASSET[key]?.tags?.includes('join');
// Clumps (art bible 12a) are drawn larger than their cell so neighbours overlap into one mass.
const CLUMP = 1.2;

function joinExtras(list: Placed[]): StreetExtra[] {
  const at = new Map(list.map((p) => [`${p.gx},${p.gy}`, p.key]));
  const out: StreetExtra[] = [];
  for (const p of list) {
    if (!isJoin(p.key) || !onFloor(p.gx, p.gy)) continue;
    const [x, cy] = cellXY(p.gx, p.gy), y = cy + DH * 0.5;
    const post = `${p.key}Post`, rail = `${p.key}Rail`;
    for (const [nx, ny, dx] of [[p.gx + 1, p.gy, DW], [p.gx, p.gy + 1, -DW]] as [number, number, number][]) {
      if (at.get(`${nx},${ny}`) !== p.key || !hasArt(rail)) continue;
      // a rail sheared along the diagonal from this post to the next one
      out.push({ y: y + DH / 2, draw: (c) => {
        const r = spr(rail);
        c.save(); c.translate(x, y); c.transform(dx / r.w, DH / r.w, 0, 1, 0, 0); c.drawImage(r.c, 0, -r.h, r.w, r.h); c.restore();
      } });
    }
    if (hasArt(post)) out.push({ y, draw: (c) => {
      // each post a little taller or shorter and slightly off true, so a row is not mechanical
      const s = spr(post), h = ((p.gx * 73856093) ^ (p.gy * 19349663)) >>> 0, k = 0.9 + (h % 7) * 0.03, tilt = ((h >> 4) % 5 - 2) * 0.018;
      c.save(); c.translate(x, y); c.rotate(tilt); c.drawImage(s.c, -s.w / 2, -s.h * k, s.w, s.h * k); c.restore();
    } });
  }
  return out;
}

const diamond = (c: CanvasRenderingContext2D, x: number, y: number): void => {
  c.beginPath(); c.moveTo(x, y - DH); c.lineTo(x + DW, y); c.lineTo(x, y + DH); c.lineTo(x - DW, y); c.closePath();
};

// Placed things as street extras, so they sort with the walkers. A piece stands at the middle of
// its footprint, a little toward the front corner.
export function placedExtras(list: Placed[]): StreetExtra[] {
  return joinExtras(list).concat(list.filter((p) => !isJoin(p.key) && hasArt(p.key) && onFloor(p.gx, p.gy)).map((p) => {
    const [w, d] = footprint(p.key), [x, cy] = cellXY(p.gx + (w - 1) / 2, p.gy + (d - 1) / 2), y = cy + DH * 0.55;
    if (ASSET[p.key]?.tags?.includes('clump')) {
      return { y, draw: (c: CanvasRenderingContext2D) => {
        const s = spr(variantAt(p.key, p.gx, p.gy, hasArt)), k = CLUMP;
        c.save(); c.translate(x, y + DH * 0.35); c.scale((p.flip ? -1 : 1) * k, k); c.drawImage(s.c, -s.w / 2, -s.h, s.w, s.h); c.restore();
      } };
    }
    if (ASSET[p.key]?.tags?.includes('flat')) {
      return { y: -1e6, draw: (c: CanvasRenderingContext2D) => {
        const s = spr(p.key); c.save(); diamond(c, x, cy); c.clip(); c.drawImage(s.c, x - DW, cy - DH, 2 * DW, 2 * DH); c.restore();
      } };
    }
    return { y, draw: (c: CanvasRenderingContext2D) => {
      const s = spr(variantAt(p.key, p.gx, p.gy, hasArt));
      // a small contact shadow, never wider than the piece's own cells
      const r = Math.min(s.w * 0.36, (w + d) * DW * 0.42);
      c.fillStyle = 'rgba(106,70,50,0.14)'; c.beginPath(); c.ellipse(x, y, r, Math.min(r * 0.3, 5), 0, 0, Math.PI * 2); c.fill();
      c.save(); c.translate(x, y); c.scale(p.flip ? -1 : 1, 1); c.drawImage(s.c, -s.ox, -s.oy, s.w, s.h); c.restore();
    } };
  }));
}

// The grid, and the cells the held piece would take, drawn while arranging.
export function drawGrid(c: CanvasRenderingContext2D, left: number, right: number, list: Placed[], ghost: Placed | null): void {
  c.lineWidth = 0.8; c.strokeStyle = 'rgba(138,111,92,0.3)';
  const vMax = Math.ceil((FLOOR_Y1 - FLOOR_Y0) / DH);
  for (let v = 0; v <= vMax; v++) for (let u = Math.floor(left / DW) - 2; u <= Math.ceil(right / DW) + 2; u++) {
    if ((u + v) % 2) continue;
    const gx = (u + v) / 2, gy = (v - u) / 2;
    if (!onFloor(gx, gy)) continue;
    const [x, y] = cellXY(gx, gy); diamond(c, x, y); c.stroke();
  }
  if (ghost) {
    c.fillStyle = canPlace(list, ghost) ? 'rgba(127,176,106,0.5)' : 'rgba(216,80,58,0.45)';
    for (const [gx, gy] of cells(ghost)) { const [x, y] = cellXY(gx, gy); diamond(c, x, y); c.fill(); }
  }
}
