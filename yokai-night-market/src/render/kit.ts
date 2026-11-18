// Paper-doll drawing kit.
//
// Nothing here is outlined. A sprite is a stack of cut paper sheets: every filled shape
// (and every thick strip) is its own sheet laid on top of the ones before it, and each sheet
// drops a tight contact shadow plus a softer one onto whatever lies beneath. Volume comes only
// from that stacking order, so a draw function should go back to front: far limbs, body,
// head, hair, then what is glued on the face. Thin lines and dots are "printed" on the sheet
// that is currently on top and cast no shadow.
export type C = CanvasRenderingContext2D;
export const TAU = Math.PI * 2;
export const INK = '#5a3a2e';
const LINE = 0.72;      // printed line weight
const SHADE = '#5a3626'; // colour of the shadow one sheet casts on the next
export const RES = 3;   // sprite supersampling

export interface Sprite { c: HTMLCanvasElement; w: number; h: number; ox: number; oy: number; flash?: HTMLCanvasElement; url?: string }

interface Stack { top: C; out: C; sil: C; res: number; rim: number }
let stack: Stack | null = null;

// Presses the sheet being drawn onto the stack, with its shadows, and starts a fresh one.
function press(st: Stack): void {
  const cv = st.top.canvas, sil = st.sil;
  sil.globalCompositeOperation = 'source-over';
  sil.clearRect(0, 0, cv.width, cv.height);
  sil.drawImage(cv, 0, 0);
  sil.globalCompositeOperation = 'source-in';
  sil.fillStyle = SHADE; sil.fillRect(0, 0, cv.width, cv.height);
  const R = st.res;
  st.out.globalAlpha = 0.13; st.out.drawImage(sil.canvas, 0.9 * R, 1.9 * R);
  st.out.globalAlpha = 0.3; st.out.drawImage(sil.canvas, 0.35 * R, 0.75 * R);
  st.out.globalAlpha = 1;
  if (st.rim > 0) {
    // the white core of the card shows as a thin rim around every cut piece
    sil.fillStyle = '#fffaf0'; sil.fillRect(0, 0, cv.width, cv.height);
    const d = st.rim * R;
    for (let i = 0; i < 12; i++) st.out.drawImage(sil.canvas, Math.cos((i / 12) * TAU) * d, Math.sin((i / 12) * TAU) * d);
  }
  st.out.drawImage(cv, 0, 0);
  st.top.save(); st.top.setTransform(1, 0, 0, 1, 0, 0); st.top.clearRect(0, 0, cv.width, cv.height); st.top.restore();
}

// Starts a new sheet above everything drawn so far. Filled shapes call this themselves;
// call it by hand only to lift a group of printed marks onto its own layer.
export function sheet(c: C): void {
  if (stack && stack.top === c) press(stack);
}

function layer(w: number, h: number): C {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  return cv.getContext('2d')!;
}

// The draw callback works in logical pixels with the origin at the feet (bottom centre), y up negative.
export function sprite(w: number, h: number, draw: (c: C) => void, pad = 5): Sprite {
  const W = w + pad * 2, H = h + pad * 2;
  const pw = Math.ceil(W * RES), ph = Math.ceil(H * RES);
  const out = layer(pw, ph), top = layer(pw, ph), sil = layer(pw, ph);
  top.scale(RES, RES);
  top.translate(W / 2, H - pad);
  top.lineJoin = 'round'; top.lineCap = 'round';
  const prev = stack;
  stack = { top, out, sil, res: RES, rim: 0 };
  draw(top);
  press(stack);
  stack = prev;
  return { c: out.canvas, w: W, h: H, ox: W / 2, oy: H - pad };
}

// One jointed part of a paper doll: drawn around its pivot (the origin), inside the given box.
export function piece(x0: number, y0: number, x1: number, y1: number, draw: (c: C) => void, res = RES, rim = 0.5): Sprite {
  const pad = 4, W = x1 - x0 + pad * 2, H = y1 - y0 + pad * 2;
  const pw = Math.ceil(W * res), ph = Math.ceil(H * res);
  const out = layer(pw, ph), top = layer(pw, ph), sil = layer(pw, ph);
  top.scale(res, res);
  top.translate(pad - x0, pad - y0);
  top.lineJoin = 'round'; top.lineCap = 'round';
  const prev = stack;
  stack = { top, out, sil, res, rim };
  draw(top);
  press(stack);
  stack = prev;
  return { c: out.canvas, w: W, h: H, ox: pad - x0, oy: pad - y0 };
}

// A flat silhouette of a sprite in the shadow colour, used for the shadow a part casts on the parts under it.
export function shadeOf(s: Sprite): HTMLCanvasElement {
  const c = layer(s.c.width, s.c.height);
  c.drawImage(s.c, 0, 0);
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = SHADE; c.fillRect(0, 0, s.c.width, s.c.height);
  return c.canvas;
}

export function flashOf(s: Sprite): HTMLCanvasElement {
  if (!s.flash) {
    const cv = document.createElement('canvas');
    cv.width = s.c.width; cv.height = s.c.height;
    const c = cv.getContext('2d')!;
    c.drawImage(s.c, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = '#ff8a6a';
    c.fillRect(0, 0, cv.width, cv.height);
    s.flash = cv;
  }
  return s.flash;
}

export function urlOf(s: Sprite): string {
  if (!s.url) s.url = s.c.toDataURL();
  return s.url;
}

// Fills the current path. A shape given a line weight is a cut sheet of its own (the weight is
// only a flag now: sheets have no outline); weight 0 prints the fill on the sheet below.
// With no fill, the path is printed as a thin line.
export function fs(c: C, fill: string | null, lw = 2): void {
  if (fill) {
    if (lw > 0) sheet(c);
    c.fillStyle = fill; c.fill();
  } else if (lw > 0) { c.lineWidth = lw * LINE; c.strokeStyle = INK; c.stroke(); }
}

// A stroke: thick coloured strokes are paper strips (their own sheet), thin ones are printed.
function strip(c: C, col: string, lw: number): void {
  if (col === INK && lw >= 4) return;          // old outline underlay, not part of the paper logic
  if (col !== INK && lw >= 2.4) sheet(c);
  c.lineWidth = col === INK ? lw * 0.85 : lw; c.strokeStyle = col; c.stroke();
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
  strip(c, col, lw);
}

export function curve(c: C, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number, col = INK, lw = 2): void {
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1);
  strip(c, col, lw);
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
