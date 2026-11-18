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

interface Stack { top: C; out: C; sil: C; tmp: C | null; res: number }
let stack: Stack | null = null;

// Paper grain shared by every card part: short fibres and a fine tooth, tiled.
let grain: CanvasPattern | null = null;
function grainPattern(c: C): CanvasPattern {
  if (!grain) {
    const g = layer(160, 160);
    let seed = 7;
    const rnd = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(70,40,20,0.035)';
      g.fillRect(rnd() * 160, rnd() * 160, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
    }
    g.lineCap = 'round';
    for (let i = 0; i < 140; i++) {
      const x = rnd() * 160, y = rnd() * 160, a = rnd() * TAU, l = 4 + rnd() * 12;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.strokeStyle = rnd() < 0.6 ? 'rgba(255,250,235,0.14)' : 'rgba(90,55,30,0.05)'; g.lineWidth = 0.6 + rnd() * 0.8; g.stroke();
    }
    grain = c.createPattern(g.canvas, 'repeat')!;
  }
  return grain;
}

// Gives the sheet on `top` the look of thick card: grain inside, a lit upper edge and a shaded
// lower edge where the cut shows its thickness. Works on the sheet before it is pressed.
function finish(st: Stack): void {
  const cv = st.top.canvas, R = st.res, t = st.tmp!;
  const top = st.top;
  top.save(); top.setTransform(1, 0, 0, 1, 0, 0);
  top.globalCompositeOperation = 'source-atop';
  top.fillStyle = grainPattern(top); top.fillRect(0, 0, cv.width, cv.height);
  for (const [dx, dy, col, a] of [[-0.9, -0.9, '#3a2014', 0.22], [0.8, 0.8, '#fff6e0', 0.35]] as const) {
    // the band of the shape left over after removing a shifted copy of itself is one cut edge
    t.globalCompositeOperation = 'source-over';
    t.clearRect(0, 0, cv.width, cv.height);
    t.drawImage(cv, 0, 0);
    t.globalCompositeOperation = 'source-in';
    t.fillStyle = col; t.fillRect(0, 0, cv.width, cv.height);
    t.globalCompositeOperation = 'destination-out';
    t.drawImage(cv, dx * R, dy * R);
    top.globalAlpha = a;
    top.drawImage(t.canvas, 0, 0);
  }
  top.restore();
}

// Presses the sheet being drawn onto the stack, with its shadows, and starts a fresh one.
function press(st: Stack): void {
  const cv = st.top.canvas, sil = st.sil, R = st.res;
  if (st.tmp) finish(st);
  sil.globalCompositeOperation = 'source-over';
  sil.clearRect(0, 0, cv.width, cv.height);
  sil.drawImage(cv, 0, 0);
  sil.globalCompositeOperation = 'source-in';
  sil.fillStyle = SHADE; sil.fillRect(0, 0, cv.width, cv.height);
  if (st.tmp) {
    // card parts: a soft, warm drop shadow made of a few offset passes
    for (let i = 1; i <= 4; i++) { st.out.globalAlpha = 0.07; st.out.drawImage(sil.canvas, 0.35 * i * R, 0.6 * i * R); }
  } else {
    st.out.globalAlpha = 0.13; st.out.drawImage(sil.canvas, 0.9 * R, 1.9 * R);
    st.out.globalAlpha = 0.3; st.out.drawImage(sil.canvas, 0.35 * R, 0.75 * R);
  }
  st.out.globalAlpha = 1;
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
  stack = { top, out, sil, tmp: null, res: RES };
  draw(top);
  press(stack);
  stack = prev;
  return { c: out.canvas, w: W, h: H, ox: W / 2, oy: H - pad };
}

// One jointed part of a paper doll: drawn around its pivot (the origin), inside the given box.
export function piece(x0: number, y0: number, x1: number, y1: number, draw: (c: C) => void, res = RES): Sprite {
  const pad = 4, W = x1 - x0 + pad * 2, H = y1 - y0 + pad * 2;
  const pw = Math.ceil(W * res), ph = Math.ceil(H * res);
  const out = layer(pw, ph), top = layer(pw, ph), sil = layer(pw, ph);
  top.scale(res, res);
  top.translate(pad - x0, pad - y0);
  top.lineJoin = 'round'; top.lineCap = 'round';
  const prev = stack;
  stack = { top, out, sil, tmp: layer(pw, ph), res };
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
