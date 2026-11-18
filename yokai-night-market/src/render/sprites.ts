// Sprite registry (built lazily) and the six ground tiles.
import { ITEMS, PROPS, heroArt, type Art } from './items';
import { type Sprite, TAU, hash, rrPath, sprite } from './kit';
import { YOKAI } from './yokai';

const cache = new Map<string, Sprite>();

function artOf(key: string): Art | undefined {
  if (key.startsWith('hero:')) { const [, id, f] = key.split(':'); return heroArt(id, Number(f)); }
  return YOKAI[key] ?? ITEMS[key] ?? PROPS[key];
}

export function spr(key: string): Sprite {
  let s = cache.get(key);
  if (!s) {
    const a = artOf(key) ?? ITEMS.salt;
    s = sprite(a.w, a.h, a.draw);
    cache.set(key, s);
  }
  return s;
}

export const TILE = 256;
const tiles = new Map<string, HTMLCanvasElement>();

function rnd(seed: number): () => number {
  let i = 0;
  return () => hash(seed, i++);
}

// Draws `fn` at (x, y) and at every wrapped copy so the tile repeats without a seam.
function wrap(c: CanvasRenderingContext2D, x: number, y: number, fn: () => void): void {
  for (const dx of [-TILE, 0, TILE]) for (const dy of [-TILE, 0, TILE]) { c.save(); c.translate(x + dx, y + dy); fn(); c.restore(); }
}

const GROUND: Record<string, (c: CanvasRenderingContext2D, r: () => number) => void> = {
  stone: (c, r) => {
    c.fillStyle = '#2c3044'; c.fillRect(0, 0, TILE, TILE);
    const cols = ['#3d435a', '#414760', '#454b64', '#3a4056'];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const x = col * 64 + (row % 2 ? 32 : 0), y = row * 64, col2 = cols[Math.floor(r() * cols.length)], j = r() * 3;
      wrap(c, x, y, () => { rrPath(c, 2 + j, 2 + j, 60 - j * 2, 60 - j * 2, 7); c.fillStyle = col2; c.fill(); });
    }
    for (let i = 0; i < 40; i++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)'; c.fillRect(r() * TILE, r() * TILE, 2, 2); }
  },
  asphalt: (c, r) => {
    c.fillStyle = '#33333f'; c.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 420; i++) { c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.14)'; const s = 1 + r() * 1.6; c.fillRect(r() * TILE, r() * TILE, s, s); }
    for (let i = 0; i < 5; i++) { const x = r() * TILE, y = r() * TILE, rx = 14 + r() * 22, ry = 6 + r() * 10; wrap(c, x, y, () => { c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fillStyle = 'rgba(20,20,34,0.22)'; c.fill(); }); }
    c.fillStyle = 'rgba(240,230,200,0.12)'; c.fillRect(0, 122, 96, 8); c.fillRect(140, 122, 80, 8);
  },
  tatami: (c, r) => {
    c.fillStyle = '#232532'; c.fillRect(0, 0, TILE, TILE);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) {
      const x = col * 128 + (row % 2 ? 64 : 0), y = row * 64, tone = r() < 0.5 ? '#5b6646' : '#606b4a';
      wrap(c, x, y, () => {
        c.fillStyle = tone; c.fillRect(2, 2, 124, 60);
        c.strokeStyle = 'rgba(40,48,30,0.28)'; c.lineWidth = 1;
        for (let yy = 6; yy < 62; yy += 4) { c.beginPath(); c.moveTo(3, yy); c.lineTo(125, yy); c.stroke(); }
        c.fillStyle = '#2f3644'; c.fillRect(2, 2, 124, 4); c.fillRect(2, 58, 124, 4);
      });
    }
  },
  gravel: (c, r) => {
    c.fillStyle = '#403c3a'; c.fillRect(0, 0, TILE, TILE);
    const cols = ['#57514c', '#4c4743', '#625b54', '#3a3634', '#55504f'];
    for (let i = 0; i < 300; i++) { const x = r() * TILE, y = r() * TILE, rx = 2.5 + r() * 3.5, ry = 2 + r() * 2.5, col = cols[Math.floor(r() * cols.length)], a = r() * 3; wrap(c, x, y, () => { c.beginPath(); c.ellipse(0, 0, rx, ry, a, 0, TAU); c.fillStyle = col; c.fill(); }); }
  },
  moss: (c, r) => {
    c.fillStyle = '#2b4436'; c.fillRect(0, 0, TILE, TILE);
    const cols = ['#31503d', '#284033', '#365a44', '#2e4a39'];
    for (let i = 0; i < 46; i++) { const x = r() * TILE, y = r() * TILE, rx = 12 + r() * 26, ry = 8 + r() * 16, col = cols[Math.floor(r() * cols.length)], a = r() * 3; wrap(c, x, y, () => { c.beginPath(); c.ellipse(0, 0, rx, ry, a, 0, TAU); c.fillStyle = col; c.fill(); }); }
    for (let i = 0; i < 70; i++) { const x = r() * TILE, y = r() * TILE, a = r() * 3, col = r() < 0.3 ? '#8a7a4a' : '#4f7a55'; wrap(c, x, y, () => { c.beginPath(); c.ellipse(0, 0, 3.4, 1.4, a, 0, TAU); c.fillStyle = col; c.fill(); }); }
  },
  cobble: (c, r) => {
    c.fillStyle = '#262e3c'; c.fillRect(0, 0, TILE, TILE);
    const cols = ['#343f51', '#313b4c', '#384456', '#2f394a'];
    for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
      const x = col * 32 + (row % 2 ? 16 : 0) + 16, y = row * 32 + 16, rx = 12.5 + r() * 2, ry = 11.5 + r() * 2, tone = cols[Math.floor(r() * cols.length)], a = r() * 0.6;
      wrap(c, x, y, () => {
        c.beginPath(); c.ellipse(0, 0, rx, ry, a, 0, TAU); c.fillStyle = tone; c.fill();
        c.beginPath(); c.ellipse(-2, -3, rx * 0.55, ry * 0.4, a, 0, TAU); c.fillStyle = 'rgba(200,225,255,0.04)'; c.fill();
      });
    }
  },
};

export function groundTile(key: string): HTMLCanvasElement {
  let t = tiles.get(key);
  if (!t) {
    t = document.createElement('canvas');
    t.width = t.height = TILE * 2;
    const c = t.getContext('2d')!;
    c.scale(2, 2);
    (GROUND[key] ?? GROUND.stone)(c, rnd(key.length * 131 + key.charCodeAt(0)));
    tiles.set(key, t);
  }
  return t;
}
