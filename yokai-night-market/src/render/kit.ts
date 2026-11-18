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
    const S = 256, g = layer(S, S);
    let seed = 7;
    const rnd = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    // uneven pigment: soft blotches, drawn wrapped so the tile has no seam
    for (let i = 0; i < 46; i++) {
      const x = rnd() * S, y = rnd() * S, r = 10 + rnd() * 34, light = rnd() < 0.5;
      for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
        const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        gr.addColorStop(0, light ? 'rgba(255,250,235,0.07)' : 'rgba(80,45,20,0.05)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2);
      }
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(70,40,20,0.03)';
      g.fillRect(rnd() * S, rnd() * S, 1 + rnd(), 1 + rnd());
    }
    // washi fibres: long, thin, curling, mostly lighter than the sheet
    g.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const x = rnd() * S, y = rnd() * S, a = rnd() * TAU, l = 8 + rnd() * 22, bend = (rnd() - 0.5) * 1.6;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + bend) * l * 0.5, y + Math.sin(a + bend) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.strokeStyle = rnd() < 0.75 ? 'rgba(255,250,236,0.2)' : 'rgba(90,55,30,0.06)'; g.lineWidth = 0.4 + rnd() * 0.7; g.stroke();
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
  for (const [dx, dy, col, a] of [[-0.45, -0.45, '#3a2014', 0.16], [0.4, 0.4, '#fff6e0', 0.2]] as const) {
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
  const cv = st.top.canvas, sil = st.sil, R = st.res, out = st.out;
  if (st.tmp) finish(st);
  sil.globalCompositeOperation = 'source-over';
  sil.clearRect(0, 0, cv.width, cv.height);
  sil.drawImage(cv, 0, 0);
  sil.globalCompositeOperation = 'source-in';
  sil.fillStyle = SHADE; sil.fillRect(0, 0, cv.width, cv.height);
  if (st.tmp) {
    // light from the upper left. The sheet sits on a thin foam pad: a wide soft shadow
    // (a ring of faint offset copies), then a tight contact shadow right under the cut.
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      out.globalAlpha = 0.03; out.drawImage(sil.canvas, (1.1 + Math.cos(a) * 0.9) * R, (1.9 + Math.sin(a) * 0.9) * R);
    }
    out.globalAlpha = 0.16; out.drawImage(sil.canvas, 0.4 * R, 0.7 * R);
    // the cut edge of the card: the sheet's own colours, darkened, stepped down to the right
    const t = st.tmp;
    t.globalCompositeOperation = 'source-over';
    t.clearRect(0, 0, cv.width, cv.height);
    t.drawImage(cv, 0, 0);
    t.globalCompositeOperation = 'source-atop';
    t.fillStyle = 'rgba(60,32,18,0.5)'; t.fillRect(0, 0, cv.width, cv.height);
    out.globalAlpha = 1;
    for (let k = 3; k >= 1; k--) out.drawImage(t.canvas, 0.2 * k * R, 0.32 * k * R);
  } else {
    out.globalAlpha = 0.13; out.drawImage(sil.canvas, 0.9 * R, 1.9 * R);
    out.globalAlpha = 0.3; out.drawImage(sil.canvas, 0.35 * R, 0.75 * R);
  }
  out.globalAlpha = 1;
  out.drawImage(cv, 0, 0);
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
  const pad = 6, W = x1 - x0 + pad * 2, H = y1 - y0 + pad * 2;
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

// True while drawing card parts (not the old flat sprites): their sheets get hand-cut edges.
function handCut(c: C, lw: number): boolean {
  return lw > 0 && !!stack && stack.top === c && stack.tmp !== null;
}

let cutSeed = 11;
// Traces a closed outline with the small wander of a blade guided by hand. `size` scales the
// wander so small pieces (eyes) stay neat.
function roughPath(c: C, pts: number[], size: number): void {
  cutSeed = (cutSeed * 48271) % 2147483647;
  const p1 = (cutSeed % 997) / 997 * TAU, p2 = (cutSeed % 389) / 389 * TAU, p3 = (cutSeed % 173) / 173 * TAU;
  const amp = 0.34 * Math.min(1, size / 9);
  const n = pts.length / 2;
  c.beginPath();
  let s = 0, first = true;
  for (let i = 0; i < n; i++) {
    const x0 = pts[i * 2], y0 = pts[i * 2 + 1], x1 = pts[((i + 1) % n) * 2], y1 = pts[((i + 1) % n) * 2 + 1];
    const len = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(len / 1.4));
    const nx = len ? -(y1 - y0) / len : 0, ny = len ? (x1 - x0) / len : 0;
    for (let k = 0; k < steps; k++) {
      const u = k / steps, d = s + u * len;
      const w = amp * (Math.sin(d * 0.7 + p1) * 0.55 + Math.sin(d * 1.9 + p2) * 0.3 + Math.sin(d * 4.3 + p3) * 0.15);
      const x = x0 + (x1 - x0) * u + nx * w, y = y0 + (y1 - y0) * u + ny * w;
      if (first) { c.moveTo(x, y); first = false; } else c.lineTo(x, y);
    }
    s += len;
  }
  c.closePath();
}

export function ell(c: C, x: number, y: number, rx: number, ry: number, fill: string | null, lw = 2, rot = 0): void {
  if (fill && handCut(c, lw)) {
    const n = Math.max(20, Math.ceil((Math.PI * (rx + ry)) / 1.6)), pts: number[] = [];
    const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; pts.push(x + ex * cr - ey * sr, y + ex * sr + ey * cr); }
    roughPath(c, pts, Math.min(rx, ry) * 2); fs(c, fill, lw); return;
  }
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
  if (fill && handCut(c, lw)) {
    r = Math.min(r, w / 2, h / 2);
    const pts: number[] = [];
    const corner = (cx: number, cy: number, a0: number): void => { for (let i = 0; i <= 5; i++) { const a = a0 + (i / 5) * (Math.PI / 2); pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } };
    corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
    roughPath(c, pts, Math.min(w, h)); fs(c, fill, lw); return;
  }
  rrPath(c, x, y, w, h, r); fs(c, fill, lw);
}

export function poly(c: C, pts: number[], fill: string | null, lw = 2, close = true): void {
  if (fill && close && handCut(c, lw)) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    roughPath(c, pts, Math.min(x1 - x0, y1 - y0)); fs(c, fill, lw); return;
  }
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  if (close) c.closePath();
  fs(c, fill, lw);
}

// Smooth closed shape through the given points.
export function blob(c: C, pts: number[], fill: string | null, lw = 2): void {
  const n = pts.length / 2;
  if (fill && handCut(c, lw)) {
    // sample the smooth curve, then cut along it by hand
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const xp = (pts[((i + n - 1) % n) * 2] + pts[i * 2]) / 2, yp = (pts[((i + n - 1) % n) * 2 + 1] + pts[i * 2 + 1]) / 2;
      const xn = (pts[i * 2] + pts[((i + 1) % n) * 2]) / 2, yn = (pts[i * 2 + 1] + pts[((i + 1) % n) * 2 + 1]) / 2;
      for (let k = 0; k < 6; k++) { const u = k / 6, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u; out.push(a * xp + b * pts[i * 2] + d * xn, a * yp + b * pts[i * 2 + 1] + d * yn); }
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < out.length; i += 2) { x0 = Math.min(x0, out[i]); x1 = Math.max(x1, out[i]); y0 = Math.min(y0, out[i + 1]); y1 = Math.max(y1, out[i + 1]); }
    roughPath(c, out, Math.min(x1 - x0, y1 - y0)); fs(c, fill, lw); return;
  }
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

// Fills a rectangle with a colour plus the washi grain, for paper backdrops.
export function paperFill(c: C, x: number, y: number, w: number, h: number, col: string): void {
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.fillStyle = grainPattern(c); c.fillRect(x, y, w, h);
}
