// Small vector drawing kit. Every sprite is drawn once into an offscreen canvas in a
// "paper sticker" style: flat fills, one dark outline, round joins.
export type C = CanvasRenderingContext2D;
export const TAU = Math.PI * 2;
export const INK = '#2b2333';
export const RES = 3; // sprite supersampling

export interface Sprite { c: HTMLCanvasElement; w: number; h: number; ox: number; oy: number; flash?: HTMLCanvasElement; url?: string }

// The draw callback works in logical pixels with the origin at the feet (bottom centre), y up negative.
export function sprite(w: number, h: number, draw: (c: C) => void, pad = 4): Sprite {
  const cv = document.createElement('canvas');
  const W = w + pad * 2, H = h + pad * 2;
  cv.width = Math.ceil(W * RES); cv.height = Math.ceil(H * RES);
  const c = cv.getContext('2d')!;
  c.scale(RES, RES);
  c.translate(W / 2, H - pad);
  c.lineJoin = 'round'; c.lineCap = 'round';
  draw(c);
  return { c: cv, w: W, h: H, ox: W / 2, oy: H - pad };
}

export function flashOf(s: Sprite): HTMLCanvasElement {
  if (!s.flash) {
    const cv = document.createElement('canvas');
    cv.width = s.c.width; cv.height = s.c.height;
    const c = cv.getContext('2d')!;
    c.drawImage(s.c, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = '#fff6e8';
    c.fillRect(0, 0, cv.width, cv.height);
    s.flash = cv;
  }
  return s.flash;
}

export function urlOf(s: Sprite): string {
  if (!s.url) s.url = s.c.toDataURL();
  return s.url;
}

export function fs(c: C, fill: string | null, lw = 2): void {
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw > 0) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}

export function ell(c: C, x: number, y: number, rx: number, ry: number, fill: string | null, lw = 2, rot = 0): void {
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); fs(c, fill, lw);
}

export function rrPath(c: C, x: number, y: number, w: number, h: number, r: number): void {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

export function rr(c: C, x: number, y: number, w: number, h: number, r: number, fill: string | null, lw = 2): void {
  rrPath(c, x, y, w, h, r); fs(c, fill, lw);
}

export function poly(c: C, pts: number[], fill: string | null, lw = 2, close = true): void {
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  if (close) c.closePath();
  fs(c, fill, lw);
}

// Smooth closed shape through the given points.
export function blob(c: C, pts: number[], fill: string | null, lw = 2): void {
  const n = pts.length / 2;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const x0 = pts[i * 2], y0 = pts[i * 2 + 1], x1 = pts[((i + 1) % n) * 2], y1 = pts[((i + 1) % n) * 2 + 1];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    if (i === 0) c.moveTo((pts[(n - 1) * 2] + x0) / 2, (pts[(n - 1) * 2 + 1] + y0) / 2);
    c.quadraticCurveTo(x0, y0, mx, my);
  }
  c.closePath();
  fs(c, fill, lw);
}

export function line(c: C, pts: number[], col = INK, lw = 2): void {
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.lineWidth = lw; c.strokeStyle = col; c.stroke();
}

export function curve(c: C, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, col = INK, lw = 2): void {
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1);
  c.lineWidth = lw; c.strokeStyle = col; c.stroke();
}

export function dot(c: C, x: number, y: number, r: number, col: string): void {
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill();
}

export function eye(c: C, x: number, y: number, r = 2.1): void {
  dot(c, x, y, r, INK);
  dot(c, x - r * 0.35, y - r * 0.4, r * 0.38, '#fff');
}

export function eyes(c: C, x: number, y: number, gap: number, r = 2.1): void {
  eye(c, x - gap, y, r); eye(c, x + gap, y, r);
}

export function bigEye(c: C, x: number, y: number, r: number, iris = '#c8483a'): void {
  ell(c, x, y, r, r * 0.92, '#fffaf0', 1.6);
  dot(c, x, y + r * 0.08, r * 0.58, iris);
  dot(c, x, y + r * 0.08, r * 0.3, INK);
  dot(c, x - r * 0.28, y - r * 0.25, r * 0.2, '#fff');
}

export function blush(c: C, x: number, y: number, gap: number, r = 2.4): void {
  c.globalAlpha = 0.55;
  ell(c, x - gap, y, r, r * 0.65, '#f08a8a', 0); ell(c, x + gap, y, r, r * 0.65, '#f08a8a', 0);
  c.globalAlpha = 1;
}

export function smile(c: C, x: number, y: number, w: number, lw = 1.5): void {
  c.beginPath(); c.arc(x, y - w * 0.3, w, 0.2 * Math.PI, 0.8 * Math.PI);
  c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
}

export function tongue(c: C, x: number, y: number, w: number, h: number): void {
  rr(c, x - w / 2, y, w, h, w / 2, '#e8616b', 1.4);
  line(c, [x, y + 1.5, x, y + h - 2.5], '#b8404c', 1);
}

export function flame(c: C, x: number, y: number, w: number, h: number, outer: string, inner: string, lw = 2): void {
  c.beginPath();
  c.moveTo(x, y - h);
  c.bezierCurveTo(x + w * 0.2, y - h * 0.6, x + w, y - h * 0.5, x + w * 0.62, y - h * 0.08);
  c.bezierCurveTo(x + w * 0.4, y + h * 0.12, x - w * 0.4, y + h * 0.12, x - w * 0.62, y - h * 0.08);
  c.bezierCurveTo(x - w, y - h * 0.5, x - w * 0.35, y - h * 0.55, x, y - h);
  c.closePath();
  fs(c, outer, lw);
  c.beginPath();
  c.ellipse(x, y - h * 0.22, w * 0.3, h * 0.26, 0, 0, TAU);
  c.fillStyle = inner; c.fill();
}

export function glow(c: C, x: number, y: number, r: number, col: string, a = 0.5): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = a; c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.globalAlpha = 1;
}

// deterministic 0..1 from two integers
export function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
