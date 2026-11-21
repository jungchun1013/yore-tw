// The street: the scene the player lives in between night rounds. Everything on it comes from
// data (src/data/street.json and the asset manifest); this file only lays it out and draws it.
import raw from '../data/street.json';
import { ASSET } from '../data/manifest';
import { hasArt } from './paperAtlas';
import { PUPPETS } from './puppet';
import { spr } from './sprites';

export type Lane = 'build' | 'decor' | 'front';
export interface StreetItem { key: string; x: number; lane: Lane; scale?: number; flip?: boolean; action?: string }
export interface StreetData { width: number; items: StreetItem[] }

// logical layout, top to bottom (the street is H tall and scaled to the screen)
export const H = 420, BUILD_Y = 268, WALK_Y0 = 282, WALK_Y1 = 322, FLOOR_Y0 = 330, FLOOR_Y1 = 398, FRONT_Y = 432;
const MIN_VIEW_W = 260;

export const street: StreetData = JSON.parse(JSON.stringify(raw)) as StreetData;

interface Actor { id: string; x: number; y: number; face: number; tx: number; ty: number; clip: string; clipT: number; wait: number; bubble: number; player: boolean }
const actors: Actor[] = [];
let camX = 0, camFree = false;
export interface StreetView { w: number; h: number; dpr: number }
let scale = 1, offY = 0, viewW = MIN_VIEW_W;

export function setupStreet(hero: string): void {
  actors.length = 0;
  const ids = [hero, ...[...PUPPETS.keys()].filter((k) => k !== hero)];
  ids.forEach((id, i) => {
    const x = i === 0 ? 560 : 300 + i * 520;
    actors.push({ id, x, y: (WALK_Y0 + WALK_Y1) / 2 + (i % 2 ? 10 : -6), face: 1, tx: x, ty: 0, clip: 'idle', clipT: 0, wait: 1 + i, bubble: 0, player: i === 0 });
  });
  for (const a of actors) a.ty = a.y;
  camX = actors[0].x; camFree = false;
}

function layout(v: StreetView): void {
  scale = Math.min(v.h / H, v.w / MIN_VIEW_W);
  viewW = v.w / scale;
  offY = (v.h - H * scale) * 0.8;
}

export function updateStreet(dt: number): void {
  for (const a of actors) {
    a.clipT += dt;
    if (a.bubble > 0) a.bubble -= dt;
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d > 2) {
      const sp = (a.player ? 95 : 42) * dt;
      a.x += (dx / d) * Math.min(d, sp); a.y += (dy / d) * Math.min(d, sp);
      if (Math.abs(dx) > 1) a.face = dx > 0 ? 1 : -1;
      if (a.clip !== 'walk') { a.clip = 'walk'; a.clipT = 0; }
    } else if (a.clip === 'walk') { a.clip = 'idle'; a.clipT = 0; }
    else if (a.clip !== 'idle' && a.clipT > (PUPPETS.get(a.id)?.clipLength(a.clip) ?? 1)) { a.clip = 'idle'; a.clipT = 0; }
    if (!a.player && a.clip === 'idle') {
      a.wait -= dt;
      if (a.wait <= 0) {
        a.wait = 3 + ((a.x * 7 + a.clipT * 13) % 4);
        a.tx = Math.max(80, Math.min(street.width - 80, a.x + (((a.x * 13 + a.clipT * 31) % 2) < 1 ? -1 : 1) * (80 + ((a.x * 3) % 140))));
        a.ty = WALK_Y0 + 6 + ((a.tx * 5) % (WALK_Y1 - WALK_Y0 - 12));
      }
    }
  }
  const p = actors[0];
  if (p && !camFree) camX += (p.x - camX) * Math.min(1, dt * 5);
  camX = Math.max(viewW / 2, Math.min(street.width - viewW / 2, camX));
}

export function panStreet(dxScreen: number): void { camFree = true; camX -= dxScreen / scale; }

// A tap in screen px. Returns the action of whatever was hit ('stall', ...), 'npc', or null after
// sending the player walking to that spot.
export function tapStreet(sx: number, sy: number): string | null {
  const x = sx / scale + camX - viewW / 2, y = (sy - offY) / scale;
  for (const a of actors) {
    if (!a.player && Math.abs(x - a.x) < 20 && y < a.y + 6 && y > a.y - 62) {
      a.face = actors[0].x > a.x ? 1 : -1; a.tx = a.x; a.ty = a.y;
      a.clip = 'wave'; a.clipT = 0; a.bubble = 2.4; a.wait = 4;
      return 'npc';
    }
  }
  for (const it of street.items) {
    if (!it.action || it.lane === 'front') continue;
    const h = (ASSET[it.key]?.height ?? 100) * (it.scale ?? 1), w = h * 0.9;
    if (Math.abs(x - it.x) < w / 2 && y < BUILD_Y + 4 && y > BUILD_Y - h) {
      const p = actors[0]; p.tx = it.x; p.ty = WALK_Y0 + 4; camFree = false;
      return it.action;
    }
  }
  const p = actors[0];
  if (p) { p.tx = Math.max(30, Math.min(street.width - 30, x)); p.ty = Math.max(WALK_Y0, Math.min(WALK_Y1, y)); camFree = false; }
  return null;
}

function hills(c: CanvasRenderingContext2D, base: number, amp: number, step: number, seed: number, col: string, shift: number): void {
  c.beginPath(); c.moveTo(-step, H);
  for (let x = -step - (shift % step); x <= viewW + step; x += step) {
    const wx = x + shift;
    c.quadraticCurveTo(x + step / 2, base - amp * (0.6 + 0.4 * Math.sin(wx * 0.011 + seed)), x + step, base);
  }
  c.lineTo(viewW + step, H); c.closePath(); c.fillStyle = col; c.fill();
}

function drawItem(c: CanvasRenderingContext2D, it: StreetItem, y: number, alpha = 1): void {
  const asset = ASSET[it.key], k = it.scale ?? 1;
  c.globalAlpha = alpha;
  if (hasArt(it.key)) {
    const s = spr(it.key);
    c.save(); c.translate(it.x, y); c.scale((it.flip ? -1 : 1) * k, k);
    c.drawImage(s.c, -s.ox, -s.oy, s.w, s.h);
    c.restore();
  } else {
    // not drawn yet: a paper card with the working name, so the layout can still be judged
    const h = (asset?.height ?? 100) * k, w = h * 0.86;
    c.save(); c.translate(it.x, y);
    c.fillStyle = '#f6ecd2'; c.strokeStyle = '#b89a78'; c.lineWidth = 1.5; c.setLineDash([6, 4]);
    c.beginPath(); c.roundRect(-w / 2, -h, w, h, 6); c.fill(); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#8a6f5c'; c.textAlign = 'center'; c.font = '700 12px "jf open huninn", system-ui, sans-serif';
    const name = (asset?.name ?? it.key).replace(/（.*$/, '');
    for (let i = 0, n = Math.ceil(name.length / 5); i < n; i++) c.fillText(name.slice(i * 5, i * 5 + 5), 0, -h / 2 + (i - (n - 1) / 2) * 15 + 4);
    c.restore();
  }
  c.globalAlpha = 1;
}

function drawActor(c: CanvasRenderingContext2D, a: Actor): void {
  c.fillStyle = 'rgba(106,70,50,0.2)'; c.beginPath(); c.ellipse(a.x, a.y, 13, 4.5, 0, 0, Math.PI * 2); c.fill();
  const pup = PUPPETS.get(a.id);
  if (pup) pup.draw(c, a.x, a.y, 1.15, a.face, a.clipT, a.clip);
  else { const s = spr(`hero:${a.id}:0`); c.save(); c.translate(a.x, a.y); c.scale(a.face * 1.15, 1.15); c.drawImage(s.c, -s.ox, -s.oy, s.w, s.h); c.restore(); }
  if (a.bubble > 0) {
    // speech bubble with three dots: what they say is not written yet
    const bx = a.x + a.face * 20, by = a.y - 72;
    c.globalAlpha = Math.min(1, a.bubble * 3);
    c.fillStyle = '#fffaf0'; c.strokeStyle = '#8a6f5c'; c.lineWidth = 1.2;
    c.beginPath(); c.roundRect(bx - 17, by - 10, 34, 20, 9); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(bx - a.face * 6, by + 9); c.lineTo(bx - a.face * 12, by + 17); c.lineTo(bx - a.face * 1, by + 10); c.fill();
    c.fillStyle = '#8a6f5c'; for (const dx of [-7, 0, 7]) { c.beginPath(); c.arc(bx + dx, by, 2, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  }
}

// Extra things drawn in the walking area by other systems (placed furniture), sorted with the actors.
export interface StreetExtra { y: number; draw: (c: CanvasRenderingContext2D) => void }
export interface DrawOptions { dim?: number; extras?: StreetExtra[]; underlay?: (c: CanvasRenderingContext2D) => void }

export function drawStreet(c: CanvasRenderingContext2D, v: StreetView, opt: DrawOptions = {}): void {
  layout(v);
  camX = Math.max(viewW / 2, Math.min(street.width - viewW / 2, camX));
  c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
  c.fillStyle = '#f3e6c9'; c.fillRect(0, 0, v.w, v.h);
  c.fillStyle = '#e4d2aa'; c.fillRect(0, offY + FLOOR_Y0 * scale, v.w, v.h);
  const left = camX - viewW / 2;
  c.setTransform(v.dpr * scale, 0, 0, v.dpr * scale, 0, v.dpr * offY);
  hills(c, 150, 60, 230, 0, '#e2d3ae', left * 0.25);
  hills(c, 196, 40, 180, 2, '#cdd3a4', left * 0.45);
  c.fillStyle = '#ead9b6'; c.fillRect(0, BUILD_Y - 14, viewW, H);
  // the road: a paved band with a dotted centre line, then the open floor in front
  c.fillStyle = '#dcc79c'; c.fillRect(0, WALK_Y0 - 8, viewW, WALK_Y1 - WALK_Y0 + 16);
  c.fillStyle = '#e4d2aa'; c.fillRect(0, FLOOR_Y0, viewW, H);
  c.fillStyle = '#f6ead0';
  for (let x = -((left) % 26); x < viewW; x += 26) c.fillRect(x, (WALK_Y0 + WALK_Y1) / 2 - 1, 12, 2);

  c.translate(-left, 0);
  const vis = (it: StreetItem): boolean => it.x > left - 160 && it.x < left + viewW + 160;
  for (const it of street.items) if (it.lane === 'build' && vis(it)) drawItem(c, it, BUILD_Y);
  for (const it of street.items) if (it.lane === 'decor' && vis(it)) drawItem(c, it, BUILD_Y + 8);
  opt.underlay?.(c);
  const list: StreetExtra[] = [...(opt.extras ?? []), ...actors.map((a) => ({ y: a.y, draw: (cc: CanvasRenderingContext2D) => drawActor(cc, a) }))];
  list.sort((p, q) => p.y - q.y);
  for (const e of list) e.draw(c);
  const px = actors[0]?.x ?? -999;
  for (const it of street.items) if (it.lane === 'front' && vis(it)) drawItem(c, { ...it, scale: (it.scale ?? 1) * 1.2 }, FRONT_Y + 14, Math.abs(it.x - px) < 90 ? 0.3 : 0.9);

  if (opt.dim) { c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0); c.fillStyle = `rgba(74,47,40,${opt.dim})`; c.fillRect(0, 0, v.w, v.h); }
}

// screen px -> street coordinates, for the placement mode and the editor
export function toStreet(sx: number, sy: number): [number, number] { return [sx / scale + camX - viewW / 2, (sy - offY) / scale]; }
export function streetScale(): number { return scale; }
export function playerX(): number { return actors[0]?.x ?? 0; }
export function callActor(id: string, x: number, clip: string): void {
  const a = actors.find((q) => q.id === id); if (!a) return;
  a.tx = x; a.ty = WALK_Y0 + 6; a.wait = 6; a.clip = clip; a.clipT = 0;
}
