// Debug only: lays every sprite out on one canvas so the art can be reviewed at a glance.
import { ITEMS, PROPS } from './items';
import { groundTile, spr } from './sprites';
import { YOKAI } from './yokai';

export function contactSheet(scale = 2): HTMLCanvasElement {
  const keys = [...Object.keys(YOKAI), 'hero:miko:0', 'hero:miko:1', 'hero:deng:0', 'hero:deng:1', 'hero:unpei:0', 'hero:unpei:2', ...Object.keys(ITEMS), ...Object.keys(PROPS)];
  const W = 1200;
  let x = 10, y = 10, rowH = 0;
  const place: [string, number, number][] = [];
  for (const k of keys) {
    const s = spr(k);
    if (x + s.w + 10 > W) { x = 10; y += rowH + 22; rowH = 0; }
    place.push([k, x, y]);
    x += Math.max(s.w, 44) + 10; rowH = Math.max(rowH, s.h);
  }
  const H = y + rowH + 30;
  const cv = document.createElement('canvas');
  cv.width = W * scale; cv.height = H * scale;
  const c = cv.getContext('2d')!;
  c.scale(scale, scale);
  const grounds = ['stone', 'asphalt', 'tatami', 'gravel', 'moss', 'cobble'];
  for (let gy = 0; gy * 256 < H; gy++) for (let gx = 0; gx * 256 < W; gx++) c.drawImage(groundTile(grounds[(gx + gy) % grounds.length]), gx * 256, gy * 256, 256, 256);
  c.font = '9px sans-serif'; c.fillStyle = '#fff'; c.textAlign = 'left';
  for (const [k, px, py] of place) {
    const s = spr(k);
    c.drawImage(s.c, px, py, s.w, s.h);
    c.fillText(k.replace('hero:', ''), px, py + s.h + 9);
  }
  return cv;
}
