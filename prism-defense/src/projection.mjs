import { CELL, COLS, ROWS } from './engine.mjs';

export const VIEW = Object.freeze({ width: 576, height: 384, halfWidth: 18, halfHeight: 9, originX: 234, originY: 54, depth: 16 });

// Combat remains on its square grid; drawing and pointer input share this view.
export function project(x, y, elevation = 0) {
  return { x: VIEW.originX + (x - y) / CELL * VIEW.halfWidth, y: VIEW.originY + (x + y) / CELL * VIEW.halfHeight - elevation };
}
export function unproject(x, y) {
  const across = (x - VIEW.originX) / VIEW.halfWidth, down = (y - VIEW.originY) / VIEW.halfHeight;
  return { x: (across + down) * CELL / 2, y: (down - across) * CELL / 2 };
}
export function screenToCell(x, y) {
  const p = unproject(x, y), col = Math.floor(p.x / CELL), row = Math.floor(p.y / CELL);
  return col >= 0 && col < COLS && row >= 0 && row < ROWS ? { x: col, y: row } : null;
}
export const cellCenter = (x, y) => project((x + .5) * CELL, (y + .5) * CELL);
export const groundRadius = r => ({ x: r * VIEW.halfWidth / CELL * Math.SQRT2, y: r * VIEW.halfHeight / CELL * Math.SQRT2 });
