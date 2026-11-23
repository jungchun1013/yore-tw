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
// Ground to sky is 5:8 on screen (user 2026-11-23: the golden ratio, as whole numbers), split at the
// foot of the temple wall (BUILD_Y). The ground is kept shallow so that holds at the usual zoom.
export const H = 500, BUILD_Y = 268, WALK_Y0 = 278, WALK_Y1 = 304, FLOOR_Y0 = 310, FLOOR_Y1 = 390, FRONT_Y = 430;
const GROUND_SHARE = 5 / 13;
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
  // the foot of the wall sits 8/13 of the way down, so ground : sky = 5 : 8; if that would push the
  // yard's lower edge off the screen (a tray open, a short window), show the whole yard instead
  void keepTop;
  const golden = (v.h - bottom) * (1 - GROUND_SHARE) - BUILD_Y * scale, fit = v.h - bottom - (FLOOR_Y1 + 4) * scale;
  offY = Math.min(golden, fit);
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
        a.ty = WALK_Y0 + 6 + ((a.tx * 5) % (FLOOR_Y1 - WALK_Y0 - 14));
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
  // like the temple silhouettes in the user's reference: the crest is solid, the lower half melts
  // into white mist, so each range stands out against the mist at the foot of the one behind it
  const g = c.createLinearGradient(0, base - amp, 0, base - amp * 0.08);
  g.addColorStop(0, col); g.addColorStop(0.35, col); g.addColorStop(0.75, foot); g.addColorStop(1, MIST);
  c.fillStyle = g; c.fill();
  const m = c.createLinearGradient(0, base - amp * 0.3, 0, base);
  m.addColorStop(0, 'rgba(240,246,244,0)'); m.addColorStop(1, 'rgba(240,246,244,0.95)');
  c.fillStyle = m; c.fillRect(-10, base - amp * 0.3, viewW + 20, H - base + amp * 0.3);
}
const MIST = '#eef4f2';

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
// path slabs (request 37): 01-03 long, 04-07 medium, 08-09 squarish, 10-12 rubble
const STEPS = Array.from({ length: 12 }, (_, i) => `slab${String(i + 1).padStart(2, '0')}`);
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

// Stone paths (user 2026-11-23, from the user's photo of a flagstone path): a lane lying on the
// ground and running away from the camera, drawn in perspective: narrow at the gate, wider toward
// the camera, the stones growing as they come nearer. Large irregular flagstones (a Voronoi split
// of jittered points on the ground) fitted together with a clear joint, and a line of long narrow
// kerb stones down both sides. The stones are worn: corners rounded off, the odd corner chipped
// away, a little moss where joints meet. Stones are cut from the paper of Codex's slabs (request 37); each
// shows the same card-thick edge on its near side. Built once per path on an offscreen canvas.
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
function clipPoly(poly: Pt[], a: number, b: number, c0: number): Pt[] {   // keep a*x + b*y <= c0
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const fp = a * P[0] + b * P[1] - c0, fq = a * Q[0] + b * Q[1] - c0;
    if (fp <= 0) out.push(P);
    if ((fp < 0) !== (fq < 0)) { const t = fp / (fp - fq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
  }
  return out;
}
const PAPERS = [4, 4, 6, 7, 9, 0, 3];           // slab pictures used as paper: mostly warm grey, some grey-green
const paving = new Map<string, { img: HTMLCanvasElement; x: number; y: number; w: number; h: number }>();
function drawPaving(c: CanvasRenderingContext2D, p: StreetPath): void {
  const key = `${p.x},${p.w}`;
  let pv = paving.get(key);
  if (!pv) {
    const slabs = STEPS.map((k) => TILES[k]);
    if (slabs.some((img) => !img || !img.complete || !img.naturalWidth)) return;
    // ground units: x across (0 on the centre line), d away from the gate. Screen: the scale grows
    // linearly down the screen, and equal ground depths take more screen the nearer they are.
    const PX = 4, W0 = p.w * 14, NEAR = 1.7, TILT = 0.62, GAP = 2.2, KERB = 4.6, S = 15.5;
    const yA = BUILD_Y + 7, yB = FLOOR_Y1 - 3, L = yB - yA, m = (NEAR - 1) / L, D = Math.log(NEAR) / (TILT * m);
    const proj = (x: number, d: number): Pt => { const y = (Math.exp(TILT * m * d) - 1) / m; return [x * (1 + m * y), y]; };
    const gw = W0 / 2 - KERB - GAP * 0.6;                                         // half width of the flagstones
    const ox = (W0 / 2) * NEAR + 2;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(ox * 2 * PX); cv.height = Math.ceil((L + 4) * PX);
    const g = cv.getContext('2d')!; g.scale(PX, PX); g.translate(ox, 1);
    // worn stones (user: 收潤, wabi-sabi): every corner is rounded off, more on some stones than others
    const trace = (q: Pt[], dy: number, round = 2): void => {
      g.beginPath();
      const n = q.length;
      for (let k = 0; k < n; k++) {
        const A = q[(k + n - 1) % n], B = q[k], C = q[(k + 1) % n];
        const la = Math.hypot(A[0] - B[0], A[1] - B[1]) || 1, lc = Math.hypot(C[0] - B[0], C[1] - B[1]) || 1;
        const ra = Math.min(round, la * 0.42), rc = Math.min(round, lc * 0.42);
        const P: Pt = [B[0] + (A[0] - B[0]) * ra / la, B[1] + (A[1] - B[1]) * ra / la], Q: Pt = [B[0] + (C[0] - B[0]) * rc / lc, B[1] + (C[1] - B[1]) * rc / lc];
        if (k) g.lineTo(P[0], P[1] + dy); else g.moveTo(P[0], P[1] + dy);
        g.quadraticCurveTo(B[0], B[1] + dy, Q[0], Q[1] + dy);
      }
      g.closePath();
    };
    const stone = (ground: Pt[], seed: number, shade: number): void => {
      const q = ground.map(([x, d]) => proj(x, d));
      const xs = q.map((v) => v[0]), ys = q.map((v) => v[1]), x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
      const thick = 0.75 * (1 + m * (y + h)), rnd = (1.6 + ((seed >>> 21) % 5) * 0.55) * (1 + m * y);
      g.lineJoin = 'round';
      trace(q, thick, rnd); g.fillStyle = '#a8977f'; g.fill();                         // the card's near edge
      const img = slabs[PAPERS[seed % PAPERS.length]], [bx, by, bw, bh] = boxOf(img);
      const ix = bx + bw * 0.1, iy = by + bh * 0.18, iw = bw * 0.8, ih = bh * 0.6;
      const sw = Math.min(iw, w * 5), sh = Math.min(ih, h * 5);
      const sx = ix + ((seed >>> 4) % 100) / 100 * (iw - sw), sy = iy + ((seed >>> 11) % 100) / 100 * (ih - sh);
      g.save(); trace(q, 0, rnd); g.clip();
      g.drawImage(img, sx, sy, sw, sh, x, y, w, h);
      g.fillStyle = `rgba(243,228,200,${0.3 + ((seed >>> 18) % 12) / 100})`; g.fillRect(x, y, w, h);
      if (shade) { g.fillStyle = `rgba(128,108,84,${shade})`; g.fillRect(x, y, w, h); }
      trace(q, 0, rnd); g.strokeStyle = 'rgba(255,252,244,0.3)'; g.lineWidth = 0.9; g.stroke();
      g.restore();
    };
    // flagstones: jittered points, three across, split by Voronoi with a joint between
    const seeds: Pt[] = [], cols = Math.max(2, Math.round((2 * gw) / S)), cw = (2 * gw) / cols, rows = Math.round(D / (S * 0.95)), rh = D / rows;
    for (let r = 0; r < rows; r++) {
      const hr = mix(r, Math.round(p.x) + 17), nc = cols - (hr % 3 === 0 ? 1 : 0), w = (2 * gw) / nc;
      for (let k = 0; k < nc; k++) {
        const h = mix(r * 41 + k, Math.round(p.x) + 3);
        seeds.push([-gw + (k + 0.5) * w + ((h % 100) / 100 - 0.5) * w * 0.5, (r + 0.5) * rh + (((h >>> 8) % 100) / 100 - 0.5) * rh * 0.6]);
      }
    }
    void cw;
    const stones: { poly: Pt[]; hs: number }[] = [];
    seeds.forEach((sd, si) => {
      let poly: Pt[] = [[-gw, 0], [gw, 0], [gw, D], [-gw, D]];
      for (const o of seeds) {
        if (o === sd || Math.abs(o[1] - sd[1]) > S * 3) continue;
        const a = o[0] - sd[0], b = o[1] - sd[1], len = Math.hypot(a, b);
        poly = clipPoly(poly, a, b, (o[0] * o[0] - sd[0] * sd[0] + o[1] * o[1] - sd[1] * sd[1]) / 2 - (GAP / 2) * len);
        if (poly.length < 3) return;
      }
      const hs = mix(si, 4711);
      // about one stone in four has lost a corner
      if (hs % 4 === 0 && poly.length >= 4) {
        const k = (hs >>> 3) % poly.length, B = poly[k], cx = poly.reduce((t, v) => t + v[0], 0) / poly.length, cy = poly.reduce((t, v) => t + v[1], 0) / poly.length;
        const nx = B[0] - cx, ny = B[1] - cy, len = Math.hypot(nx, ny) || 1, cut = 0.72 + ((hs >>> 8) % 12) / 100;
        const chipped = clipPoly(poly, nx / len, ny / len, (cx * nx + cy * ny) / len + len * cut);
        if (chipped.length >= 3) poly = chipped;
      }
      stones.push({ poly, hs });
    });
    // moss where joints meet, laid first so it shows only in the gaps (a few places, not everywhere)
    stones.forEach(({ poly, hs }) => {
      if (hs % 3) return;
      const v = poly[(hs >>> 5) % poly.length], [mx, my] = proj(v[0], v[1]), r = (1.5 + ((hs >>> 9) % 3) * 0.5) * (1 + m * my);
      if (Math.abs(v[0]) > gw - 1) return;
      g.fillStyle = `rgba(150,172,122,${0.5 + ((hs >>> 12) % 3) * 0.12})`;
      g.beginPath(); g.ellipse(mx, my, r * 1.5, r * 0.8, 0, 0, Math.PI * 2); g.fill();
    });
    stones.forEach(({ poly, hs }) => stone(poly, hs, (hs >>> 25) % 5 === 0 ? 0.1 : (hs >>> 27) % 4 === 0 ? 0.05 : 0));
    // kerbs: long narrow stones down both sides
    for (const side of [-1, 1]) {
      let d = 0, k = 0;
      const xi = side * (gw + GAP * 0.6), xo = side * (W0 / 2);
      while (d < D - 2) {
        const h = mix(k * 19 + side * 7, Math.round(p.x) + 91);
        let len = 20 + (h % 4) * 5; if (D - (d + len) < 12) len = D - d;
        stone([[xi, d], [xo, d], [xo, d + len - GAP * 0.7], [xi, d + len - GAP * 0.7]], h >>> 2, 0.15);
        d += len; k++;
      }
    }
    pv = { img: cv, x: p.x - ox, y: yA - 1, w: cv.width / PX, h: cv.height / PX };
    paving.set(key, pv);
  }
  c.drawImage(pv.img, pv.x, pv.y, pv.w, pv.h);
}

// a well-mixed hash for patterns over small integers (the plain one repeats along rows)
function mix(a: number, b: number): number {
  let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return h >>> 0;
}

function drawGround(c: CanvasRenderingContext2D, left: number): void {
  const top = BUILD_Y - 5;
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
  // grass (user 2026-11-23: every curve bulges outward; turf laid over the ground; no thin seams):
  // each patch is one convex rounded diamond (a superellipse, straight-ish sides and soft corners,
  // 2:1 like the lattice), a little lopsided. The near side of the yard is a row of large mounds
  // that overlap generously, so no sliver of sand is left between two patches. The middle of the
  // yard stays bare sand (user: loose patches there were too conspicuous).
  const turf = (cx: number, cy: number, a: number, b: number, h: number): void => {
    const e = 1.18 + (h % 16) / 100, lean = (((h >>> 6) % 9) - 4) / 4 * 0.12, wide = 1 + (((h >>> 10) % 9) - 4) / 4 * 0.1;
    c.beginPath();
    for (let k = 0; k < 48; k++) {
      const t = (k / 48) * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t);
      const x = Math.sign(ct) * Math.pow(Math.abs(ct), e) * a * (ct > 0 ? wide : 2 - wide), y = Math.sign(st) * Math.pow(Math.abs(st), e) * b;
      const px = cx + x + y * lean * 2, py = cy + y;
      if (k) c.lineTo(px, py); else c.moveTo(px, py);
    }
    c.closePath(); c.fill();
  };
  // the band by the buildings, its lower edge gently wandering
  c.beginPath(); c.moveTo(left - 2, top);
  for (let x = Math.floor(left / 18) * 18 - 18; x <= left + viewW + 18; x += 18) c.lineTo(x, top + 15 + ((mix(Math.round(x), 41) % 100) / 100) * 2.2);
  c.lineTo(left + viewW + 6, top); c.closePath(); c.fill();
  // the near side: big mounds every 64 units, each wider than the spacing so neighbours overlap
  for (let k = Math.floor(left / 64) - 2; k <= Math.ceil((left + viewW) / 64) + 2; k++) {
    const h = mix(k, 311);
    if (h % 7 === 0) continue;                                              // a break in the turf now and then
    turf(k * 64 + ((h >>> 3) % 20) - 10, FLOOR_Y1 + 4, 46 + ((h >>> 8) % 22), 15 + ((h >>> 13) % 9), h >>> 5);
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
  // two sage ranges in the demo's shapes and colours, layered in mist: the far one paler
  ridge(c, 247, 92, 170, 11, '#ccd5c0', '#e3eadf', left * 0.2);
  ridge(c, 273, 70, 130, 23, '#b6c3a2', '#dbe3d2', left * 0.4);
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
