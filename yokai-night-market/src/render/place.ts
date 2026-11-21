// Furniture in the yard. The yard in front of the buildings is a grid of square cells (CW x CH,
// seen slightly from above): cell (gx, gy) has gx counted from the left end of the scene and gy
// from the top of the yard down, so a bigger gy is nearer the camera and things sort by it. Every
// placeable piece is designed to fill whole cells (its footprint in the manifest is width x depth
// in cells). Walls are not handled yet; `surface` in the saved record keeps room for them.
import { ASSET, withTag } from '../data/manifest';
import { hasArt } from './paperAtlas';
import { spr } from './sprites';
import { CH, CW, FLOOR_Y0, FLOOR_Y1, street, type StreetExtra } from './street';

export interface Placed { key: string; gx: number; gy: number; flip?: boolean; surface?: 'floor' | 'wall' }

const ROWS = Math.floor((FLOOR_Y1 - FLOOR_Y0) / CH);

// street point of a cell's top-left corner, and the cell under a street point
export const cellXY = (gx: number, gy: number): [number, number] => [gx * CW, FLOOR_Y0 + gy * CH];
export const cellAt = (x: number, y: number): [number, number] => [Math.floor(x / CW), Math.floor((y - FLOOR_Y0) / CH)];
const footprint = (key: string): [number, number] => ASSET[key]?.footprint ?? [1, 1];

function cells(p: Placed): [number, number][] {
  const [w, d] = footprint(p.key), out: [number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([p.gx + i, p.gy + j]);
  return out;
}
const onFloor = (gx: number, gy: number): boolean => gy >= 0 && gy < ROWS && gx >= 1 && (gx + 1) * CW <= street.width - CW;

export function canPlace(list: Placed[], p: Placed): boolean {
  const mine = cells(p);
  if (!mine.every(([x, y]) => onFloor(x, y))) return false;
  for (const o of list) for (const [ox, oy] of cells(o)) if (mine.some(([x, y]) => x === ox && y === oy)) return false;
  return true;
}
export function itemAt(list: Placed[], gx: number, gy: number): number {
  return list.findIndex((o) => cells(o).some(([x, y]) => x === gx && y === gy));
}

export const furnitureKeys = (): string[] => withTag('furniture').map((a) => a.key).filter(hasArt);

// Placed things as street extras, so they sort with the walkers. A piece stands on the front
// edge of its cells, centred across its width.
export function placedExtras(list: Placed[]): StreetExtra[] {
  return list.filter((p) => hasArt(p.key) && onFloor(p.gx, p.gy)).map((p) => {
    const [w, d] = footprint(p.key), [x0, y0] = cellXY(p.gx, p.gy);
    if (ASSET[p.key]?.tags?.includes('flat')) {
      return { y: -1e6, draw: (c: CanvasRenderingContext2D) => { const s = spr(p.key); c.drawImage(s.c, x0, y0, w * CW, d * CH); } };
    }
    const x = x0 + (w * CW) / 2, y = y0 + d * CH - 3;
    return { y, draw: (c: CanvasRenderingContext2D) => {
      const s = spr(p.key);
      c.fillStyle = 'rgba(106,70,50,0.16)'; c.beginPath(); c.ellipse(x, y, s.w * 0.36, s.w * 0.1, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.translate(x, y); c.scale(p.flip ? -1 : 1, 1); c.drawImage(s.c, -s.ox, -s.oy, s.w, s.h); c.restore();
    } };
  });
}

// The grid, and the cells the held piece would take, drawn while arranging.
export function drawGrid(c: CanvasRenderingContext2D, left: number, right: number, list: Placed[], ghost: Placed | null): void {
  c.lineWidth = 1; c.strokeStyle = 'rgba(138,111,92,0.28)';
  const g0 = Math.max(1, Math.floor(left / CW)), g1 = Math.min(Math.floor((street.width - CW) / CW) - 1, Math.ceil(right / CW));
  c.beginPath();
  for (let gx = g0; gx <= g1 + 1; gx++) { c.moveTo(gx * CW, FLOOR_Y0); c.lineTo(gx * CW, FLOOR_Y0 + ROWS * CH); }
  for (let gy = 0; gy <= ROWS; gy++) { c.moveTo(g0 * CW, FLOOR_Y0 + gy * CH); c.lineTo((g1 + 1) * CW, FLOOR_Y0 + gy * CH); }
  c.stroke();
  if (ghost) {
    c.fillStyle = canPlace(list, ghost) ? 'rgba(127,176,106,0.5)' : 'rgba(216,80,58,0.45)';
    for (const [gx, gy] of cells(ghost)) { const [x, y] = cellXY(gx, gy); c.fillRect(x + 1, y + 1, CW - 2, CH - 2); }
  }
}
