// Furniture on the street floor. The floor is a 45-degree 2.5D diamond grid in front of the road:
// a cell (gx, gy) sits at x = OX + (gx - gy) * TW, y = OY + (gx + gy) * TH, so gx + gy is depth
// (bigger is nearer the camera) and things sort by it. Walls are not handled yet; `surface` in the
// saved record keeps room for them.
import { ASSET, withTag } from '../data/manifest';
import { hasArt } from './paperAtlas';
import { spr } from './sprites';
import { FLOOR_Y0, FLOOR_Y1, street, type StreetExtra } from './street';

export interface Placed { key: string; gx: number; gy: number; flip?: boolean; surface?: 'floor' | 'wall' }

export const TW = 22, TH = 11;
const OX = 0, OY = FLOOR_Y0 + 6;
const VMAX = Math.floor((FLOOR_Y1 - OY) / TH);

export const cellXY = (gx: number, gy: number): [number, number] => [OX + (gx - gy) * TW, OY + (gx + gy) * TH];
export function cellAt(x: number, y: number): [number, number] {
  const u = (x - OX) / TW, v = (y - OY) / TH;
  return [Math.round((u + v) / 2), Math.round((v - u) / 2)];
}
const footprint = (key: string): [number, number] => ASSET[key]?.footprint ?? [1, 1];

function cells(p: Placed): [number, number][] {
  const [w, d] = footprint(p.key), out: [number, number][] = [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) out.push([p.gx + i, p.gy + j]);
  return out;
}
const onFloor = (gx: number, gy: number): boolean => {
  const v = gx + gy, x = OX + (gx - gy) * TW;
  return v >= 0 && v <= VMAX && x > 20 && x < street.width - 20;
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

export const furnitureKeys = (): string[] => withTag('furniture').map((a) => a.key).filter(hasArt);

function centre(p: Placed): [number, number, number] {
  const [w, d] = footprint(p.key);
  const [x, y] = cellXY(p.gx + (w - 1) / 2, p.gy + (d - 1) / 2);
  return [x, y + TH * 0.4, cellXY(p.gx + w - 1, p.gy + d - 1)[1]];
}

// Placed things as street extras, so they sort with the walkers.
export function placedExtras(list: Placed[]): StreetExtra[] {
  return list.filter((p) => hasArt(p.key)).map((p) => {
    const [x, y, depth] = centre(p);
    return { y: depth, draw: (c: CanvasRenderingContext2D) => {
      const s = spr(p.key);
      c.fillStyle = 'rgba(106,70,50,0.18)'; c.beginPath(); c.ellipse(x, y, s.w * 0.36, s.w * 0.12, 0, 0, Math.PI * 2); c.fill();
      c.save(); c.translate(x, y); c.scale(p.flip ? -1 : 1, 1); c.drawImage(s.c, -s.ox, -s.oy, s.w, s.h); c.restore();
    } };
  });
}

// The grid, and the cells the held piece would take, drawn while arranging.
export function drawGrid(c: CanvasRenderingContext2D, left: number, right: number, list: Placed[], ghost: Placed | null): void {
  const diamond = (gx: number, gy: number): void => {
    const [x, y] = cellXY(gx, gy);
    c.beginPath(); c.moveTo(x, y - TH); c.lineTo(x + TW, y); c.lineTo(x, y + TH); c.lineTo(x - TW, y); c.closePath();
  };
  c.lineWidth = 1; c.strokeStyle = 'rgba(138,111,92,0.35)';
  const u0 = Math.floor((left - OX) / TW) - 1, u1 = Math.ceil((right - OX) / TW) + 1;
  for (let v = 0; v <= VMAX; v++) for (let u = u0; u <= u1; u++) {
    if ((u + v) % 2) continue;
    const gx = (u + v) / 2, gy = (v - u) / 2;
    if (!onFloor(gx, gy)) continue;
    diamond(gx, gy); c.stroke();
  }
  if (ghost) {
    c.fillStyle = canPlace(list, ghost) ? 'rgba(127,176,106,0.5)' : 'rgba(216,80,58,0.45)';
    for (const [gx, gy] of cells(ghost)) { diamond(gx, gy); c.fill(); }
  }
}
