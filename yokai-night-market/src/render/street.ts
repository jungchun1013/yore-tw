// The street: the scene the player lives in between night rounds. Everything on it comes from
// data (src/data/street.json and the asset manifest); this file only lays it out and draws it.
import rawStreet from '../data/street.json';
import rawLane from '../data/lane.json';
import { ASSET, variantAt } from '../data/manifest';
import { hasArt } from './paperAtlas';
import { PUPPETS } from './puppet';
import { spr } from './sprites';

export type Lane = 'back' | 'build' | 'decor' | 'across' | 'near' | 'front' | 'fauna';
export interface StreetItem { key: string; x: number; lane: Lane; y?: number; scale?: number; flip?: boolean; action?: string }
// a path of stones laid on the ground: centred on x, w cells wide, from the buildings rows deep
export interface StreetPath { x: number; w: number; rows: number }
export interface StreetData { width: number; start?: number; paths?: StreetPath[]; items: StreetItem[] }

// logical layout, top to bottom (the street is H tall and scaled to the screen)
// buildings stand along the top; below them a walk, then the yard, which takes most of the screen
export const H = 500, BUILD_Y = 268, WALK_Y0 = 282, WALK_Y1 = 322, FLOOR_Y0 = 330, FLOOR_Y1 = 450, FRONT_Y = 492;
// empty sky above the tallest tree that the view may cut off to come closer
const SKY = 70;
// how close the camera sits (user 2026-11-22: 1.2 times closer)
const ZOOM = 1.2;
// the yard's square cells (see place.ts)
export const CW = 24, CH = 20;
// the yard's 45-degree diamond cells: half width and half height (see place.ts)
export const DW = 16, DH = 8;
const MIN_VIEW_W = 220;

export const FAUNA_Y = WALK_Y1 + 12;
export const NEAR_Y = FLOOR_Y0 + 16;
// a gate across the road: its far foot by the buildings, its near foot on the floor
const ACROSS_FAR = WALK_Y0 + 2, ACROSS_NEAR = WALK_Y1 + 14;
// Scenes are data: the main street and the places reached from it. `street` always holds the
// scene being shown; an item with action 'gate:<scene>' leads to another one.
const SCENES: Record<string, StreetData> = { street: rawStreet as unknown as StreetData, lane: rawLane as unknown as StreetData };
export const street: StreetData = { width: 0, items: [] };
let sceneName = 'street';
export const currentScene = (): string => sceneName;

// The editor (?editor) keeps its work in this browser; the game shows it until it is exported
// into the scene's json or reverted.
const LOCAL = 'tainan-gazetteer.street.edit';
const localKey = (): string => (sceneName === 'street' ? LOCAL : `${LOCAL}.${sceneName}`);
function loadScene(name: string): void {
  sceneName = SCENES[name] ? name : 'street';
  let data = JSON.parse(JSON.stringify(SCENES[sceneName])) as StreetData;
  try { const own = localStorage.getItem(localKey()); if (own) data = JSON.parse(own) as StreetData; } catch { /* no storage */ }
  street.width = data.width; street.start = data.start; street.paths = data.paths; street.items = data.items;
}
loadScene('street');
export function saveStreetLocal(): void { try { localStorage.setItem(localKey(), JSON.stringify(street)); } catch { /* no storage */ } }
export function revertStreet(): void { try { localStorage.removeItem(localKey()); } catch { /* no storage */ } loadScene(sceneName); }
export function hasLocalStreet(): boolean { try { return !!localStorage.getItem(localKey()); } catch { return false; } }

const laneY = (it: StreetItem): number => (it.lane === 'back' ? BUILD_Y - 6 : it.lane === 'build' ? BUILD_Y : it.lane === 'decor' ? BUILD_Y + 8 : it.lane === 'fauna' ? it.y ?? FAUNA_Y : it.lane === 'near' ? it.y ?? NEAR_Y : it.lane === 'across' ? ACROSS_NEAR : FRONT_Y + 14);
const laneScale = (it: StreetItem): number => (it.scale ?? 1) * (it.lane === 'front' ? 1.2 : 1);
// bounds of an item in street coordinates: [left, top, right, bottom]
export function itemBox(it: StreetItem): [number, number, number, number] {
  const k = laneScale(it), y = laneY(it);
  if (it.lane === 'across') { const h = (hasArt(it.key) ? spr(it.key).h : ASSET[it.key]?.height ?? 100) * k; return [it.x - 50, ACROSS_NEAR - h, it.x + 50, ACROSS_NEAR]; }
  if (hasArt(it.key)) { const s = spr(it.key); return [it.x - (s.w / 2) * k, y - s.h * k, it.x + (s.w / 2) * k, y]; }
  const h = (ASSET[it.key]?.height ?? 100) * k;
  return [it.x - h * 0.43, y - h, it.x + h * 0.43, y];
}
// topmost item under a street point, front lane first
export function itemAtPoint(x: number, y: number): number {
  for (const lane of ['front', 'near', 'across', 'fauna', 'decor', 'build', 'back'] as Lane[]) {
    for (let i = street.items.length - 1; i >= 0; i--) {
      const it = street.items[i]; if (it.lane !== lane) continue;
      const [x0, y0, x1, y1] = itemBox(it);
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return i;
    }
  }
  return -1;
}

interface Actor { id: string; x: number; y: number; face: number; tx: number; ty: number; clip: string; clipT: number; wait: number; bubble: number; player: boolean; next: string }
const actors: Actor[] = [];
let camX = 0, camFree = false;
export interface StreetView { w: number; h: number; dpr: number }
let scale = 1, offY = 0, viewW = MIN_VIEW_W;

const HOP = 0.45;
const critters = new Map<StreetItem, { dx: number; hop: number; dir: number }>();

const spreadX = (i: number): number => 90 + ((i * 0.41 * street.width) % Math.max(1, street.width - 180));

// Walks through a gate: shows the other scene with the player standing at its gate back.
export function enterScene(name: string): void {
  const from = sceneName;
  loadScene(name);
  const px = street.items.find((it) => it.action === `gate:${from}`)?.x ?? 100;
  actors.forEach((a, i) => {
    a.x = a.tx = i === 0 ? px : spreadX(i);
    a.y = a.ty = i === 0 ? (WALK_Y0 + WALK_Y1) / 2 : (WALK_Y0 + WALK_Y1) / 2 + (i % 2 ? 10 : -6);
    a.clip = 'idle'; a.clipT = 0; a.next = ''; a.bubble = 0; a.wait = 1 + i;
  });
  camX = px; camFree = false;
}
// The gate the player is standing at, with the screen point above it for the prompt.
export function nearGate(): { to: string; sx: number; sy: number; below: boolean } | null {
  const p = actors[0]; if (!p) return null;
  for (const it of street.items) {
    if (!it.action?.startsWith('gate:') || Math.abs(p.x - it.x) > 44) continue;
    // a signpost on the near side shows its prompt under its foot, clear of the heroine's head
    const [, top, , foot] = itemBox(it), below = it.lane === 'near';
    return { to: it.action.slice(5), sx: (it.x - (camX - viewW / 2)) * scale, sy: offY + (below ? foot + 8 : top) * scale, below };
  }
  return null;
}

export function setupStreet(hero: string): void {
  actors.length = 0;
  const ids = [hero, ...[...PUPPETS.keys()].filter((k) => k !== hero)];
  ids.forEach((id, i) => {
    const x = i === 0 ? street.start ?? Math.min(560, street.width / 2) : spreadX(i);
    actors.push({ id, x, y: (WALK_Y0 + WALK_Y1) / 2 + (i % 2 ? 10 : -6), face: 1, tx: x, ty: 0, clip: 'idle', clipT: 0, wait: 1 + i, bubble: 0, player: i === 0, next: '' });
  });
  for (const a of actors) a.ty = a.y;
  camX = actors[0].x; camFree = false;
}

function layout(v: StreetView, bottom = 0, keepTop = true): void {
  scale = Math.min(v.h / (H - 40 - SKY), v.w / MIN_VIEW_W) * ZOOM;
  viewW = v.w / scale;
  // keep the yard's lower edge at the bottom of the screen, but never cut into the buildings for
  // it: on wide screens the top of the view stops just above the tallest building
  const fit = v.h - bottom - (FLOOR_Y1 + 6) * scale;
  offY = keepTop ? Math.max(fit, -(BUILD_Y - 150) * scale) : fit;
}

export function updateStreet(dt: number): void {
  for (const a of actors) {
    a.clipT += dt;
    if (a.bubble > 0) a.bubble -= dt;
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d > 2) {
      const sp = (a.player || a.next ? 95 : 42) * dt;
      a.x += (dx / d) * Math.min(d, sp); a.y += (dy / d) * Math.min(d, sp);
      if (Math.abs(dx) > 1) a.face = dx > 0 ? 1 : -1;
      if (a.clip !== 'walk') { a.clip = 'walk'; a.clipT = 0; }
    } else if (a.clip === 'walk') { a.clip = a.next || 'idle'; a.next = ''; a.clipT = 0; }
    else if (a.clip !== 'idle' && a.clipT > (PUPPETS.get(a.id)?.clipLength(a.clip) ?? 1) * (a.clip === 'eat' ? 3 : 1)) { a.clip = 'idle'; a.clipT = 0; }
    if (!a.player && a.clip === 'idle') {
      a.wait -= dt;
      if (a.wait <= 0) {
        a.wait = 3 + ((a.x * 7 + a.clipT * 13) % 4);
        a.tx = Math.max(80, Math.min(street.width - 80, a.x + (((a.x * 13 + a.clipT * 31) % 2) < 1 ? -1 : 1) * (80 + ((a.x * 3) % 140))));
        a.ty = WALK_Y0 + 6 + ((a.tx * 5) % 150);
      }
    }
  }
  // animals stand where the data puts them and hop aside when the player walks up
  for (const it of street.items) {
    if (it.lane !== 'fauna') continue;
    let m = critters.get(it);
    if (!m) critters.set(it, (m = { dx: 0, hop: 0, dir: 1 }));
    const near = actors[0] ? actors[0].x - (it.x + m.dx) : 999;
    if (m.hop > 0) { m.hop -= dt; m.dx += m.dir * 70 * dt; }
    else if (Math.abs(near) < 30 && Math.abs((actors[0]?.y ?? 0) - laneY(it)) < 40) { m.hop = HOP; m.dir = Math.abs(m.dx) > 90 ? -Math.sign(m.dx) : near > 0 ? -1 : 1; }
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
    if (it.lane === 'near' || it.lane === 'across') {
      // a gate: walk up to it; the prompt appears on arrival
      const [x0, y0, x1, y1] = itemBox(it);
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) { const p = actors[0]; p.tx = it.lane === 'near' ? it.x + 26 : it.x; p.ty = it.lane === 'across' ? (WALK_Y0 + WALK_Y1) / 2 : it.lane === 'near' ? laneY(it) + 12 : WALK_Y1 - 4; camFree = false; return null; }
      continue;
    }
    if (!it.action || it.lane === 'front' || it.lane === 'fauna' || it.lane === 'back') continue;
    const h = (ASSET[it.key]?.height ?? 100) * (it.scale ?? 1), w = h * 0.9;
    if (Math.abs(x - it.x) < w / 2 && y < BUILD_Y + 4 && y > BUILD_Y - h) {
      const p = actors[0]; p.tx = it.x; p.ty = WALK_Y0 + 4; camFree = false;
      return it.action;
    }
  }
  const p = actors[0];
  if (p) { p.tx = Math.max(30, Math.min(street.width - 30, x)); p.ty = Math.max(WALK_Y0, Math.min(FLOOR_Y1 - 6, y)); camFree = false; }
  return null;
}

// A range of mountains like the paper street demo: straight folded slopes between peaks, one flat
// colour from the demo palette, given only a vertical gradient that pales into haze at the foot.
function ridge(c: CanvasRenderingContext2D, base: number, amp: number, span: number, seed: number, col: string, foot: string, shift: number): void {
  const x0 = Math.floor((shift - span) / span) * span;
  c.beginPath(); c.moveTo(x0 - shift, H);
  for (let wx = x0; wx <= shift + viewW + span; wx += span) {
    const h = hash(Math.round(wx / span), seed);
    const peak = base - amp * (0.55 + (h % 100) / 220), dip = base - amp * (0.12 + ((h >> 8) % 100) / 500);
    const px = wx + span * (0.35 + ((h >> 4) % 30) / 100);
    c.lineTo(wx - shift, dip); c.lineTo(px - shift, peak);
  }
  c.lineTo(shift + viewW + span - shift, H); c.closePath();
  const g = c.createLinearGradient(0, base - amp, 0, BUILD_Y);
  g.addColorStop(0, col); g.addColorStop(1, foot);
  c.fillStyle = g; c.fill();
}

// faint washi fibres for the sky, as in the demo
let fibres: CanvasPattern | null = null;
function skyFibres(c: CanvasRenderingContext2D): CanvasPattern | null {
  if (fibres) return fibres;
  const S = 512, g = document.createElement('canvas'); g.width = g.height = S;
  const x = g.getContext('2d')!;
  let r = 424242;
  const rnd = (): number => ((r = (Math.imul(r, 1103515245) + 12345) >>> 0) / 4294967296);
  x.lineWidth = 1.2; x.lineCap = 'round';
  for (let i = 0; i < 60; i++) {
    const sx = rnd() * S, sy = rnd() * S, len = 40 + rnd() * 110, a = rnd() * Math.PI * 2;
    x.strokeStyle = `rgba(170,150,120,${0.06 + rnd() * 0.06})`;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
      x.beginPath(); x.moveTo(sx + ox, sy + oy);
      x.bezierCurveTo(sx + ox + Math.cos(a) * len * 0.4 + (rnd() - 0.5) * 40, sy + oy + Math.sin(a) * len * 0.4 + (rnd() - 0.5) * 40,
        sx + ox + Math.cos(a + 0.6) * len * 0.8, sy + oy + Math.sin(a + 0.6) * len * 0.8,
        sx + ox + Math.cos(a + 0.3) * len, sy + oy + Math.sin(a + 0.3) * len);
      x.stroke();
    }
  }
  fibres = c.createPattern(g, 'repeat');
  fibres?.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0]));
  return fibres;
}

// plain paper ground with green laid by the buildings, along the front edge and in a few patches
const hash = (a: number, b: number): number => (Math.imul(a, 73856093) ^ Math.imul(b, 19349663)) >>> 0;
// ground tiles (public/art/tiles), each STONE logical px square
const GROUND_TILE = 128;
const TILES: Record<string, HTMLImageElement> = {};
const STEPS = ['stone1', 'stone2', 'stone3', 'stone4', 'stone5', 'stone6', 'stone7', 'stone8'];
for (const k of ['stoneFill', 'stoneEdgeL', 'stoneEdgeR', 'stoneEnd', 'groundSand', 'groundGrass', ...STEPS]) {
  if (typeof Image === 'undefined') break;
  const img = new Image(); img.src = `${import.meta.env.BASE_URL}art/tiles/${k}.png`; TILES[k] = img;
}
// Print grain (art bible 4b): an even, very faint stencil grain, fine over everything and a
// little coarser on the floor. Dots sit on a jittered grid so the density is uniform: no blotches.
const grains = new Map<string, CanvasPattern | null>();
function grain(c: CanvasRenderingContext2D, kind: 'fine' | 'floor'): CanvasPattern | null {
  if (grains.has(kind)) return grains.get(kind)!;
  const PX = 4, S = 256, g = document.createElement('canvas'); g.width = g.height = S;   // 4 px per unit
  const x = g.getContext('2d')!;
  let r = kind === 'fine' ? 97531 : 24680;
  const rnd = (): number => ((r = (Math.imul(r, 1103515245) + 12345) >>> 0) / 4294967296);
  const step = kind === 'fine' ? 7 : 9, dot = kind === 'fine' ? [0.8, 1.3] : [1.2, 2.0], dark = kind === 'fine' ? 0.035 : 0.045;
  for (let gy = 0; gy < S; gy += step) for (let gx = 0; gx < S; gx += step) {
    const px = gx + rnd() * step, py = gy + rnd() * step, rad = dot[0] + rnd() * (dot[1] - dot[0]), light = rnd() < 0.3;
    x.fillStyle = light ? `rgba(255,251,240,${0.1 + rnd() * 0.08})` : `rgba(74,52,36,${dark + rnd() * 0.025})`;
    for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { x.beginPath(); x.arc(px + ox, py + oy, rad / 2, 0, Math.PI * 2); x.fill(); }
  }
  const pat = c.createPattern(g, 'repeat');
  pat?.setTransform(new DOMMatrix([1 / PX, 0, 0, 1 / PX, 0, 0]));
  grains.set(kind, pat);
  return pat;
}

// Stone paths (user 2026-11-23): Codex's single stepping stones (request 25), all about the same
// size, laid evenly in staggered rows like brick bond, the outer ones a little smaller, with a
// clear gap so none overlap. Each picture's own stone is measured once so they can be matched.
type Pt = [number, number];
const stoneBox = new Map<HTMLImageElement, [number, number, number, number]>();
function boxOf(img: HTMLImageElement): [number, number, number, number] {
  let b = stoneBox.get(img);
  if (b) return b;
  const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight;
  const g = cv.getContext('2d')!; g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, cv.width, cv.height).data;
  let x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
  for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 120) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  b = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
  stoneBox.set(img, b);
  return b;
}
function drawPaving(c: CanvasRenderingContext2D, p: StreetPath): void {
  const stones = STEPS.map((k) => TILES[k]).filter((img) => img && img.complete && img.naturalWidth);
  if (stones.length < STEPS.length) return;
  const W = Math.max(60, p.w * CW * 1.15), y0 = BUILD_Y + 6, y1 = FLOOR_Y0 + p.rows * CH;
  // stones the size of the first layout, rows staggered by a random amount, each stone a little
  // different in size and place; outer stones smaller, a few missing, a few small strays outside
  const SX = 22, SY = 14.5, cols = Math.max(2, Math.round(W / SX)), rows = Math.floor((y1 - y0) / SY);
  const lay = (img: HTMLImageElement, cx: number, cy: number, tw: number, flip: boolean): void => {
    const [bx, by, bw, bh] = boxOf(img), sc = Math.min(tw / bw, (SY * 0.95) / bh), dw = bw * sc, dh = bh * sc;
    c.save(); c.translate(cx, cy); if (flip) c.scale(-1, 1); c.drawImage(img, bx, by, bw, bh, -dw / 2, -dh / 2, dw, dh); c.restore();
  };
  for (let r = 0; r < rows; r++) {
    const hr = mix(r, 77), shift = ((hr % 100) / 100) * SX * 0.5, n = cols - (hr % 3 === 0 ? 1 : 0), last = r === rows - 1;
    const span = (n - 1) * SX + shift;
    for (let k = 0; k < n; k++) {
      const h = mix(r * 31 + k, 1234), edge = k === 0 || k === n - 1;
      if ((last || r === 0) && edge && h % 2) continue;        // the ends fray
      if (edge && h % 7 === 0) continue;
      const tw = SX * (edge ? 0.74 + ((h >>> 3) % 10) / 100 : 0.9 + ((h >>> 3) % 8) / 100);
      const cx = p.x - span / 2 + shift + k * SX + ((h >>> 8) % 5 - 2) * 0.7;
      const cy = y0 + r * SY + SY / 2 + ((h >>> 11) % 5 - 2) * 0.6;
      lay(stones[(h >>> 14) % stones.length], cx, cy, tw, ((h >>> 17) & 1) === 1);
    }
    const hs = mix(r, 909);
    if (hs % 4 === 0) lay(stones[3], p.x + ((hs >>> 4) & 1 ? 1 : -1) * (span / 2 + SX * 0.75), y0 + r * SY + SY / 2, SX * 0.45, false);
  }
}

// a well-mixed hash for patterns over small integers (the plain one repeats along rows)
function mix(a: number, b: number): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return h >>> 0;
}

function drawGround(c: CanvasRenderingContext2D, left: number): void {
  const top = BUILD_Y - 16;
  // ground papers (request 35): fine-sand paper for the floor, kozo paper for grass; one tile is
  // GROUND_TILE units wide. Flat colours stand in until they load.
  const paper = (key: string, fallback: string): string | CanvasPattern => {
    const img = TILES[key];
    if (!img || !img.complete || !img.naturalWidth) return fallback;
    const pat = c.createPattern(img, 'repeat');
    if (!pat) return fallback;
    pat.setTransform(new DOMMatrix([GROUND_TILE / img.naturalWidth, 0, 0, GROUND_TILE / img.naturalHeight, 0, 0]));
    return pat;
  };
  c.fillStyle = paper('groundSand', '#efe5cb'); c.fillRect(left, top, viewW, H - top);
  c.fillStyle = paper('groundGrass', '#b7c38a');
  // grass (user 2026-11-23: edges a little random, not straight sharp lines, not a carpet): the same
  // diamond cells, but every lattice corner is nudged and every edge bends through two jittered
  // points. Corners and bends are hashed from their position, so neighbouring grass cells share
  // them exactly (no gaps) while the outer edge wanders.
  const key = (x: number, y: number): number => Math.round(x * 2) * 7919 + Math.round(y * 2);
  const corner = (x: number, y: number): Pt => { const h = mix(Math.round(x * 2), Math.round(y * 2)); return [x + ((h % 100) / 100 - 0.5) * DW * 0.7, y + (((h >> 8) % 100) / 100 - 0.5) * DH * 0.7]; };
  const edge = (A: Pt, B: Pt, ka: number, kb: number, out: Pt[]): void => {
    // walk from the smaller key so both cells bend the shared edge the same way
    const flip = ka > kb, P = flip ? B : A, Q = flip ? A : B, h = mix(Math.min(ka, kb), Math.max(ka, kb));
    const nx = -(Q[1] - P[1]), ny = Q[0] - P[0], len = Math.hypot(nx, ny) || 1;
    const pts: Pt[] = [1 / 3, 2 / 3].map((t, i) => { const off = ((((h >> (i * 9)) % 100) / 100) - 0.5) * 3.2; return [P[0] + (Q[0] - P[0]) * t + nx / len * off, P[1] + (Q[1] - P[1]) * t + ny / len * off]; });
    if (flip) pts.reverse();
    out.push(...pts, B);
  };
  const blob = (x: number, y: number): void => {
    const L: Pt[] = [[x, y - DH], [x + DW, y], [x, y + DH], [x - DW, y]];
    const C = L.map(([px, py]) => corner(px, py)), K = L.map(([px, py]) => key(px, py)), out: Pt[] = [C[0]];
    for (let i = 0; i < 4; i++) edge(C[i], C[(i + 1) % 4], K[i], K[(i + 1) % 4], out);
    c.beginPath(); out.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.fill();
  };
  // the band by the buildings, its lower edge wandering
  c.beginPath(); c.moveTo(left - 2, top);
  for (let x = Math.floor(left / 6) * 6 - 6; x <= left + viewW + 6; x += 6) c.lineTo(x, top + 14 + ((mix(Math.round(x), 41) % 100) / 100) * 5);
  c.lineTo(left + viewW + 6, top); c.closePath(); c.fill();
  const vMax = Math.ceil((FLOOR_Y1 - FLOOR_Y0) / DH);
  for (let v = 0; v <= vMax + 2; v++) for (let u = Math.floor(left / DW) - 2; u <= Math.ceil((left + viewW) / DW) + 2; u++) {
    if ((u + v) % 2) continue;
    const fromFront = vMax - v, bu = Math.floor(u / 7), bv = Math.floor(v / 5);
    // a patch: some 7x5 blocks hold a small diamond cluster around their own centre
    const pm = mix(bu, bv), pu = bu * 7 + 3, pv = bv * 5 + 2;
    const patch = pm % 4 === 0 && Math.abs(u - pu) + Math.abs(v - pv) <= 2 + (pm >> 4) % 2;
    const grass = fromFront < 1 + (mix(u >> 1, 9) % 4) || (patch && fromFront > 3 && v > 1);
    if (grass) blob(u * DW, FLOOR_Y0 + (v + 1) * DH);
  }
  c.fillRect(left, FLOOR_Y1, viewW, H - FLOOR_Y1);
  const fg = grain(c, 'floor');
  if (fg) { c.fillStyle = fg; c.fillRect(left, top, viewW, H - top); }
  for (const p of street.paths ?? []) drawPaving(c, p);
}

function drawItem(c: CanvasRenderingContext2D, it0: StreetItem, y: number, alpha = 1): void {
  const it = { ...it0, key: variantAt(it0.key, Math.round(it0.x), 7, hasArt) };
  const asset = ASSET[it.key], k = it.scale ?? 1;
  c.globalAlpha = alpha;
  if (hasArt(it.key)) {
    const s = spr(it.key);
    c.save(); c.translate(it.x, y); c.scale((it.flip ? -1 : 1) * k, k);
    c.drawImage(s.c, -s.ox, -s.oy, s.w, s.h);
    c.restore();
  } else {
    // not drawn yet: a paper card with the working name, so the layout can still be judged
    const h = Math.max(30, (asset?.height ?? 100) * k), w = h * 0.86, small = w < 60;
    c.save(); c.translate(it.x, y);
    c.fillStyle = '#f6ecd2'; c.strokeStyle = '#b89a78'; c.lineWidth = 1.5; c.setLineDash([6, 4]);
    c.beginPath(); c.roundRect(-w / 2, -h, w, h, 6); c.fill(); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#8a6f5c'; c.textAlign = 'center'; c.font = `700 ${small ? 9 : 12}px "jf open huninn", system-ui, sans-serif`;
    const name = (asset?.name ?? it.key).replace(/（.*$/, ''), per = small ? 2 : 5, lh = small ? 10 : 15;
    for (let i = 0, n = Math.ceil(name.length / per); i < n; i++) c.fillText(name.slice(i * per, i * per + per), 0, -h / 2 + (i - (n - 1) / 2) * lh + lh / 3.5);
    c.restore();
  }
  c.globalAlpha = 1;
}

// A gate that spans the road. Its picture is drawn at a three-quarter angle, near end at the
// lower left and far end at the upper right; it is shown as drawn, never transformed. The far
// (right) half goes behind the walkers and the near (left) half in front, so they pass through.
// flip mirrors it for a gate at the right end of a scene.
function drawAcross(c: CanvasRenderingContext2D, it: StreetItem, nearHalf: boolean): void {
  if (!hasArt(it.key)) { if (nearHalf) drawItem(c, it, ACROSS_NEAR); return; }
  const s = spr(it.key), k = it.scale ?? 1;
  c.save();
  c.translate(it.x, ACROSS_NEAR); c.scale((it.flip ? -1 : 1) * k, k);
  const cw = s.c.width, ch = s.c.height;
  if (nearHalf) c.drawImage(s.c, 0, 0, cw / 2, ch, -s.w / 2, -s.h, s.w / 2, s.h);
  else c.drawImage(s.c, cw / 2, 0, cw / 2, ch, 0, -s.h, s.w / 2, s.h);
  c.restore();
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
export interface DrawOptions { select?: number; dim?: number; bottom?: number; fadeFront?: boolean; extras?: StreetExtra[]; underlay?: (c: CanvasRenderingContext2D) => void }

export function drawStreet(c: CanvasRenderingContext2D, v: StreetView, opt: DrawOptions = {}): void {
  layout(v, opt.bottom ?? 0, !opt.fadeFront);
  camX = Math.max(viewW / 2, Math.min(street.width - viewW / 2, camX));
  c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
  // sky: the demo's cream, slightly deeper at the top, with faint washi fibres
  const sky = c.createLinearGradient(0, offY + (BUILD_Y - 260) * scale, 0, offY + BUILD_Y * scale);
  sky.addColorStop(0, '#d5e4e4'); sky.addColorStop(1, '#e7f1f1');   // the demo's lightness, pale celadon hue
  c.fillStyle = sky; c.fillRect(0, 0, v.w, v.h);
  c.fillStyle = '#e8d8b6'; c.fillRect(0, offY + FLOOR_Y0 * scale, v.w, v.h);
  const left = camX - viewW / 2;
  c.setTransform(v.dpr * scale, 0, 0, v.dpr * scale, 0, v.dpr * offY);
  const fib = skyFibres(c);
  if (fib) { c.save(); c.translate(-left * 0.1, 0); c.fillStyle = fib; c.fillRect(left * 0.1, -offY / scale, viewW, BUILD_Y + offY / scale); c.restore(); }
  // the sun: the demo's mustard disc, a little lighter at its lower edge
  { const sx = viewW * 0.68 - (left * 0.05) % 80, sy = 150, sr = 22, sg = c.createLinearGradient(0, sy - sr, 0, sy + sr);
    sg.addColorStop(0, '#e3b863'); sg.addColorStop(1, '#ecca85'); c.fillStyle = sg; c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); c.fill(); }
  // two sage ranges in the demo's shapes and colours, each fading into haze at its foot
  ridge(c, 246, 92, 170, 11, '#c9d1b8', '#efeadb', left * 0.2);
  ridge(c, 264, 66, 130, 23, '#bcc8a6', '#e9e6d0', left * 0.4);
  c.translate(-left, 0);
  drawGround(c, left);
  const vis = (it: StreetItem): boolean => it.x > left - 160 && it.x < left + viewW + 160;
  for (const it of street.items) if (it.lane === 'back' && vis(it)) drawItem(c, it, BUILD_Y - 6);
  for (const it of street.items) if (it.lane === 'build' && vis(it)) drawItem(c, it, BUILD_Y);
  for (const it of street.items) if (it.lane === 'decor' && vis(it)) drawItem(c, it, BUILD_Y + 8);
  opt.underlay?.(c);
  const list: StreetExtra[] = [...(opt.extras ?? []), ...actors.map((a) => ({ y: a.y, draw: (cc: CanvasRenderingContext2D) => drawActor(cc, a) }))];
  for (const it of street.items) {
    if (it.lane !== 'fauna' || !vis(it)) continue;
    const m = critters.get(it), y = laneY(it), up = m && m.hop > 0 ? Math.sin((1 - m.hop / HOP) * Math.PI) * 9 : 0;
    list.push({ y, draw: (cc) => {
      cc.fillStyle = 'rgba(106,70,50,0.18)'; cc.beginPath(); cc.ellipse(it.x + (m?.dx ?? 0), y, (ASSET[it.key]?.height ?? 20) * 0.3, 2.5, 0, 0, Math.PI * 2); cc.fill();
      drawItem(cc, { ...it, x: it.x + (m?.dx ?? 0), flip: m ? m.dir < 0 !== !!it.flip : it.flip }, y - up);
    } });
  }
  for (const it of street.items) if (it.lane === 'near' && vis(it)) {
    // see-through while the player stands behind it
    const [x0, , x1] = itemBox(it), p = actors[0], behind = !!p && p.x > x0 && p.x < x1 && p.y < WALK_Y1 - 10;
    list.push({ y: laneY(it), draw: (cc) => drawItem(cc, it, laneY(it), behind ? 0.5 : 1) });
  }
  for (const it of street.items) if (it.lane === 'across' && vis(it)) {
    list.push({ y: ACROSS_FAR, draw: (cc) => drawAcross(cc, it, false) }, { y: ACROSS_NEAR, draw: (cc) => drawAcross(cc, it, true) });
  }
  list.sort((p, q) => p.y - q.y);
  for (const e of list) e.draw(c);
  const px = actors[0]?.x ?? -999;
  for (const it of street.items) if (it.lane === 'front' && vis(it)) drawItem(c, { ...it, scale: (it.scale ?? 1) * 1.2 }, FRONT_Y + 14, opt.fadeFront ? 0.12 : Math.abs(it.x - px) < 90 ? 0.3 : 0.9);

  if (opt.select !== undefined && street.items[opt.select]) {
    const [x0, y0, x1, y1] = itemBox(street.items[opt.select]);
    c.setLineDash([5, 4]); c.lineWidth = 1.5; c.strokeStyle = '#d8503a'; c.strokeRect(x0, y0, x1 - x0, y1 - y0); c.setLineDash([]);
  }

  const noise = grain(c, 'fine');
  if (noise) { c.save(); c.setTransform(v.dpr * scale, 0, 0, v.dpr * scale, v.dpr * (-left * scale), v.dpr * offY); c.fillStyle = noise; c.fillRect(left, -offY / scale, viewW, v.h / scale + 1); c.restore(); }
  if (opt.dim) { c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0); c.fillStyle = `rgba(74,47,40,${opt.dim})`; c.fillRect(0, 0, v.w, v.h); }
}

// screen px -> street coordinates, for the placement mode and the editor
export function toStreet(sx: number, sy: number): [number, number] { return [sx / scale + camX - viewW / 2, (sy - offY) / scale]; }
export function streetScale(): number { return scale; }
export function playerX(): number { return actors[0]?.x ?? 0; }
// Sends a character to a spot and has it play a clip on arrival.
export function callActor(id: string, x: number, clip: string): void {
  const a = actors.find((q) => q.id === id); if (!a) return;
  // from far away it comes in from just outside the view instead of crossing the whole street
  if (Math.abs(a.x - x) > viewW * 0.7) a.x = x + (a.x < x ? -1 : 1) * viewW * 0.7;
  a.tx = x; a.ty = WALK_Y0 + 4; a.wait = 8; a.next = clip; a.bubble = 0;
  if (Math.abs(a.x - x) < 3) { a.clip = clip; a.clipT = 0; a.next = ''; }
  camFree = false;
}
export function walkPlayer(x: number, y?: number): void { const p = actors[0]; if (p) { p.x = p.tx = x; if (y !== undefined) p.y = p.ty = y; camFree = false; } }
export const actorIds = (): string[] => actors.map((q) => q.id);
export const stallX = (): number => street.items.find((it) => it.action === 'stall')?.x ?? 0;
export function lookAt(x: number): void { camFree = true; camX = x; }
