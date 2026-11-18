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

// faint paper fibres and a chiyogami wave pattern, shared by every tile
function paper(c: CanvasRenderingContext2D, r: () => number, wave: string): void {
  c.strokeStyle = wave; c.lineWidth = 1.2;
  for (let row = 0; row < 9; row++) for (let col = -1; col < 5; col++) {
    const x = col * 64 + (row % 2 ? 32 : 0), y = row * 32;
    for (const rad of [30, 20, 10]) { c.beginPath(); c.arc(x + 32, y, rad, Math.PI, 0); c.stroke(); }
  }
  for (let i = 0; i < 90; i++) {
    const x = r() * TILE, y = r() * TILE, a = r() * 6.3, len = 3 + r() * 5;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    c.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(120,84,50,0.1)'; c.lineWidth = 0.8; c.stroke();
  }
}

const GROUND: Record<string, (c: CanvasRenderingContext2D, r: () => number) => void> = {
  stone: (c, r) => {
    c.fillStyle = '#d6c39a'; c.fillRect(0, 0, TILE, TILE);
    const cols = ['#efe2c4', '#eadbb8', '#f3e8cf', '#e6d6b0'];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const x = col * 64 + (row % 2 ? 32 : 0), y = row * 64, col2 = cols[Math.floor(r() * cols.length)], j = r() * 3;
      wrap(c, x, y, () => { rrPath(c, 2 + j, 2 + j, 60 - j * 2, 60 - j * 2, 7); c.fillStyle = col2; c.fill(); });
    }
    paper(c, r, 'rgba(160,120,70,0.05)');
  },
  asphalt: (c, r) => {
    c.fillStyle = '#e7d7b4'; c.fillRect(0, 0, TILE, TILE);
    paper(c, r, 'rgba(160,120,70,0.07)');
    for (let i = 0; i < 6; i++) { const x = r() * TILE, y = r() * TILE, rx = 16 + r() * 22, ry = 7 + r() * 10; wrap(c, x, y, () => { c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.fillStyle = 'rgba(214,190,146,0.55)'; c.fill(); }); }
    c.fillStyle = 'rgba(216,80,58,0.16)'; c.fillRect(0, 122, 96, 7); c.fillRect(140, 122, 80, 7);
  },
  tatami: (c, r) => {
    c.fillStyle = '#7a5a3a'; c.fillRect(0, 0, TILE, TILE);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 2; col++) {
      const x = col * 128 + (row % 2 ? 64 : 0), y = row * 64, tone = r() < 0.5 ? '#cfc77c' : '#c4bd70';
      wrap(c, x, y, () => {
        c.fillStyle = tone; c.fillRect(2, 2, 124, 60);
        c.strokeStyle = 'rgba(120,116,50,0.3)'; c.lineWidth = 1;
        for (let yy = 6; yy < 62; yy += 4) { c.beginPath(); c.moveTo(3, yy); c.lineTo(125, yy); c.stroke(); }
        c.fillStyle = '#3f7f86'; c.fillRect(2, 2, 124, 4); c.fillRect(2, 58, 124, 4);
      });
    }
  },
  gravel: (c, r) => {
    c.fillStyle = '#dcc79c'; c.fillRect(0, 0, TILE, TILE);
    const cols = ['#c9b080', '#bfa372', '#ead8b0', '#b3955f', '#d2bb8c'];
    for (let i = 0; i < 230; i++) { const x = r() * TILE, y = r() * TILE, rx = 2.5 + r() * 3.5, ry = 2 + r() * 2.5, col = cols[Math.floor(r() * cols.length)], a = r() * 3; wrap(c, x, y, () => { c.beginPath(); c.ellipse(0, 0, rx, ry, a, 0, TAU); c.fillStyle = col; c.fill(); }); }
  },
  moss: (c, r) => {
    c.fillStyle = '#b3bd72'; c.fillRect(0, 0, TILE, TILE);
    const cols = ['#a6b264', '#bcc67e', '#9ba85a', '#aeb96c'];
    for (let i = 0; i < 40; i++) { const x = r() * TILE, y = r() * TILE, rx = 12 + r() * 26, ry = 8 + r() * 16, col = cols[Math.floor(r() * cols.length)], a = r() * 3; wrap(c, x, y, () => { c.beginPath(); c.ellipse(0, 0, rx, ry, a, 0, TAU); c.fillStyle = col; c.fill(); }); }
    paper(c, r, 'rgba(90,110,50,0.07)');
    for (let i = 0; i < 46; i++) { const x = r() * TILE, y = r() * TILE, a = r() * 3, col = r() < 0.4 ? '#e0664a' : '#7f9448'; wrap(c, x, y, () => { c.beginPath(); c.ellipse(0, 0, 3.4, 1.5, a, 0, TAU); c.fillStyle = col; c.fill(); }); }
  },
  sand: (c, r) => {
    c.fillStyle = '#ecdcb6'; c.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 9; i++) { const y = r() * TILE, a = 6 + r() * 6; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= TILE; x += 32) c.quadraticCurveTo(x + 16, y + (x / 32 % 2 ? a : -a), x + 32, y); c.strokeStyle = 'rgba(190,160,110,0.28)'; c.lineWidth = 3; c.stroke(); }
    paper(c, r, 'rgba(63,127,134,0.05)');
    for (let i = 0; i < 12; i++) { const x = r() * TILE, y = r() * TILE, a = r() * 3; wrap(c, x, y, () => { c.rotate(a); c.beginPath(); c.ellipse(0, 0, 4.2, 2.4, 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill(); }); }
    for (let i = 0; i < 3; i++) { const x = r() * TILE, y = r() * TILE, a = r() * 3; wrap(c, x, y, () => { c.rotate(a); rrPath(c, -9, -5, 18, 10, 1.5); c.fillStyle = 'rgba(201,122,90,0.45)'; c.fill(); }); }
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
