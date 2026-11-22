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

function layout(v: StreetView, bottom = 0): void {
  scale = Math.min(v.h / (H - 40 - SKY), v.w / MIN_VIEW_W) * ZOOM;
  viewW = v.w / scale;
  // keep the yard's lower edge at the bottom of the screen, but never cut into the buildings for
  // it: on wide screens the top of the view stops just above the tallest building
  const fit = v.h - bottom - (FLOOR_Y1 + 6) * scale;
  offY = bottom > 0 ? fit : Math.max(fit, -(BUILD_Y - 150) * scale);
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

function hills(c: CanvasRenderingContext2D, base: number, amp: number, step: number, seed: number, col: string, shift: number): void {
  c.beginPath(); c.moveTo(-step, H);
  for (let x = -step - (shift % step); x <= viewW + step; x += step) {
    const wx = x + shift;
    c.quadraticCurveTo(x + step / 2, base - amp * (0.6 + 0.4 * Math.sin(wx * 0.011 + seed)), x + step, base);
  }
  c.lineTo(viewW + step, H); c.closePath();
  // aerial perspective: the ridge in its colour, fading into the warm haze toward the ground
  const g = c.createLinearGradient(0, base - amp, 0, BUILD_Y);
  g.addColorStop(0, col); g.addColorStop(1, HAZE);
  c.fillStyle = g; c.fill();
}

// plain paper ground with green laid by the buildings, along the front edge and in a few patches
const hash = (a: number, b: number): number => (Math.imul(a, 73856093) ^ Math.imul(b, 19349663)) >>> 0;
// ground tiles (public/art/tiles), each STONE logical px square
const GROUND_TILE = 128;
const STONE = 132;   // about one stone per cell (user 2026-11-22)
const TILES: Record<string, HTMLImageElement> = {};
const STEPS = ['stone1', 'stone2', 'stone3', 'stone4', 'stone5', 'stone6', 'stone7', 'stone8'];
for (const k of ['stoneFill', 'stoneEdgeL', 'stoneEdgeR', 'stoneEnd', 'groundSand', 'groundGrass', ...STEPS]) {
  if (typeof Image === 'undefined') break;
  const img = new Image(); img.src = `${import.meta.env.BASE_URL}art/tiles/${k}.png`; TILES[k] = img;
}
// Print grain (art bible 4b): an even, very faint stencil grain, fine over everything and a
// little coarser on the floor. Dots sit on a jittered grid so the density is uniform: no blotches.
const HAZE = '#f6efdf';
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

function drawGround(c: CanvasRenderingContext2D, left: number): void {
  const top = BUILD_Y - 16, rows = Math.floor((FLOOR_Y1 - FLOOR_Y0) / CH);
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
  for (let gx = Math.floor(left / CW) - 1; gx * CW < left + viewW; gx++) {
    const x = gx * CW;
    c.fillRect(x, top, CW + 0.5, 20 + (hash(gx >> 1, 3) % 3) * 6);                       // by the buildings
    const hb = 1 + (hash(gx >> 1, 9) % 3);
    c.fillRect(x, FLOOR_Y0 + (rows - hb) * CH, CW + 0.5, H);                               // front edge
    for (let gy = 2; gy < rows - 4; gy++) if (hash(gx >> 1, gy >> 1) % 17 === 0) c.fillRect(x, FLOOR_Y0 + gy * CH, CW + 0.5, CH + 0.5);
  }
  const fg = grain(c, 'floor');
  if (fg) { c.fillStyle = fg; c.fillRect(left, top, viewW, H - top); }
  // stone paths, laid from Codex's tiles (request 22): a seamless fill, a fringe of smaller stones
  // on the left and right, and one at the far end; flat stone cells until the tiles load
  for (const p of street.paths ?? []) {
    const x0 = Math.round(p.x / CW - p.w / 2) * CW, w = p.w * CW, y0 = FLOOR_Y0 - 3 * CH, y1 = FLOOR_Y0 + p.rows * CH;
    // stepping stones (request 25): one stone per cell, chosen and nudged by the cell's hash; the
    // outer columns and the far end get smaller stones and gaps, so the path frays naturally
    const steps = STEPS.map((k) => TILES[k]).filter((img) => img && img.complete && img.naturalWidth);
    if (steps.length === STEPS.length) {
      const g0 = Math.round(p.x / CW - p.w / 2);
      for (let gy = -3; gy < p.rows + 1; gy++) for (let gx = g0 - 1; gx <= g0 + p.w; gx++) {
        const h = hash(gx * 7 + 3, gy * 13 + 5), outer = gx < g0 || gx >= g0 + p.w, last = gy >= p.rows;
        if ((outer || last) && h % 3 !== 0) continue;                 // frayed edge: about a third of the outer cells
        const pick = outer || last ? [3, 6, 4][h % 3] : h % 8;         // stones 4, 7 (and 5) are the small ones
        const img = steps[pick], k = 1.85;
        const x = gx * CW + CW / 2 + ((h >> 3) % 5) - 2, y = FLOOR_Y0 + gy * CH + CH / 2 + ((h >> 6) % 5) - 2;
        c.drawImage(img, x - (CW * k) / 2, y - (CH * k) / 2, CW * k, CH * k);
      }
      continue;
    }
    const fill = TILES.stoneFill, T = STONE;
    if (fill && fill.complete && fill.naturalWidth) {
      const pat = c.createPattern(fill, 'repeat');
      if (pat) {
        pat.setTransform(new DOMMatrix([T / fill.naturalWidth, 0, 0, T / fill.naturalHeight, x0, y0]));
        c.fillStyle = pat; c.fillRect(x0, y0, w, y1 - y0);
      }
      const tile = (img: HTMLImageElement | undefined, x: number, y: number): void => { if (img && img.complete && img.naturalWidth) c.drawImage(img, x, y, T, T); };
      // the fringe tiles only show outside the fill, where their stones thin out, so no tile edge
      // ever lies across the path
      const clip = (x: number, y: number, w2: number, h2: number, draw: () => void): void => { c.save(); c.beginPath(); c.rect(x, y, w2, h2); c.clip(); draw(); c.restore(); };
      clip(x0 - T, y0, T, y1 - y0, () => { for (let y = y0; y < y1; y += T) tile(TILES.stoneEdgeL, x0 - T / 2, y); });
      clip(x0 + w, y0, T, y1 - y0, () => { for (let y = y0; y < y1; y += T) tile(TILES.stoneEdgeR, x0 + w - T / 2, y); });
      clip(x0, y1, w, T, () => { for (let x = x0; x < x0 + w; x += T) tile(TILES.stoneEnd, x, y1 - T / 2); });
      continue;
    }
    for (let gx = x0 / CW; gx < x0 / CW + p.w; gx++) for (let gy = -3; gy < p.rows; gy++) {
      const x = gx * CW, y = FLOOR_Y0 + gy * CH, tone = hash(gx, gy) % 3;
      c.fillStyle = '#e6dcc6'; c.fillRect(x, y, CW, CH);
      c.fillStyle = ['#cfc6b2', '#d6cdb9', '#c8bfab'][tone];
      c.fillRect(x + 1.5, y + 1.5, CW - 3, CH - 3);
    }
  }
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
  layout(v, opt.bottom ?? 0);
  camX = Math.max(viewW / 2, Math.min(street.width - viewW / 2, camX));
  c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
  // sky: a warm wash that grows paler toward the horizon
  const sky = c.createLinearGradient(0, offY + (BUILD_Y - 260) * scale, 0, offY + BUILD_Y * scale);
  sky.addColorStop(0, '#eadcbd'); sky.addColorStop(1, HAZE);
  c.fillStyle = sky; c.fillRect(0, 0, v.w, v.h);
  c.fillStyle = '#efe5cb'; c.fillRect(0, offY + FLOOR_Y0 * scale, v.w, v.h);
  const left = camX - viewW / 2;
  c.setTransform(v.dpr * scale, 0, 0, v.dpr * scale, 0, v.dpr * offY);
  // three ranges, farther ones paler and greyer (aerial perspective)
  hills(c, 128, 54, 260, 4, '#ddd6c6', left * 0.15);
  hills(c, 160, 58, 230, 0, '#d3d2b6', left * 0.28);
  hills(c, 200, 40, 180, 2, '#c3cca0', left * 0.45);
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
