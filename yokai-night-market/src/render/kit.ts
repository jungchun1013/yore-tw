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

interface Stack { top: C; out: C; sil: C; tmp: C | null; res: number; craft: boolean; seed: number; wide?: C; near?: C }
let stack: Stack | null = null;

// Two looks for card parts. 'clean': vector cut-outs with tone outlines and a cel fold (the
// earlier version). 'craft': a handmade paper puppet as if photographed: hand-cut contours,
// washi fibres inside each sheet, a visible cardstock edge, and blurred foam-pad shadows.
export type PaperStyle = 'clean' | 'craft';
let paperStyle: PaperStyle = 'clean';
export function setPaperStyle(s: PaperStyle): void { paperStyle = s; }
export function getPaperStyle(): PaperStyle { return paperStyle; }

// Washi for the craft look: long kozo fibres, clumps, and a light tooth. Each sheet samples it
// at its own offset, so no two pieces of paper look alike.
let washi: CanvasPattern | null = null;
function washiPattern(c: C): CanvasPattern {
  if (!washi) {
    const S = 320, g = layer(S, S);
    let seed = 91;
    const rnd = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 1500; i++) {
      g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(70,40,20,0.04)';
      g.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 1.5, 1 + rnd() * 1.5);
    }
    g.lineCap = 'round';
    for (let i = 0; i < 520; i++) {
      const x = rnd() * S, y = rnd() * S, a = rnd() * TAU, l = 10 + rnd() * 46, bend = (rnd() - 0.5) * 2;
      for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
        g.beginPath(); g.moveTo(x + dx, y + dy);
        g.bezierCurveTo(x + dx + Math.cos(a + bend) * l * 0.35, y + dy + Math.sin(a + bend) * l * 0.35, x + dx + Math.cos(a - bend) * l * 0.7, y + dy + Math.sin(a - bend) * l * 0.7, x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l);
        g.strokeStyle = rnd() < 0.8 ? 'rgba(255,251,240,0.24)' : 'rgba(80,48,26,0.07)'; g.lineWidth = 0.5 + rnd() * 0.9; g.stroke();
      }
    }
    washi = c.createPattern(g.canvas, 'repeat')!;
  }
  return washi;
}

// A soft copy of a canvas: shrink it, then let smoothing stretch it back.
function blurInto(dst: C, src: HTMLCanvasElement, scratch: C, dx: number, dy: number, alpha: number): void {
  const w = scratch.canvas.width, h = scratch.canvas.height;
  scratch.clearRect(0, 0, w, h);
  scratch.imageSmoothingEnabled = true;
  scratch.drawImage(src, 0, 0, w, h);
  dst.save(); dst.imageSmoothingEnabled = true; dst.globalAlpha = alpha;
  dst.drawImage(scratch.canvas, dx, dy, src.width, src.height);
  dst.restore();
}

// Craft finish for one sheet, before it is pressed: uneven pigment, fibres, light from the
// upper left falling across the sheet, and a fine lit cut edge on its upper-left side.
function craftFinish(st: Stack): void {
  const cv = st.top.canvas, R = st.res, t = st.tmp!, top = st.top;
  st.seed = (st.seed * 48271) % 2147483647;
  const r1 = (st.seed % 1000) / 1000, r2 = (st.seed % 7919) / 7919;
  top.save(); top.setTransform(1, 0, 0, 1, 0, 0);
  top.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 5; i++) {
    const x = ((r1 * 7 + i * 0.37) % 1) * cv.width, y = ((r2 * 5 + i * 0.61) % 1) * cv.height, r = (0.15 + ((r1 + i * 0.23) % 1) * 0.3) * Math.max(cv.width, cv.height);
    const gr = top.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, i % 2 ? 'rgba(255,248,232,0.09)' : 'rgba(90,50,25,0.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    top.fillStyle = gr; top.fillRect(0, 0, cv.width, cv.height);
  }
  top.translate(-r1 * 320 * R * 0.22, -r2 * 320 * R * 0.22);
  top.scale(R * 0.22, R * 0.22);
  top.globalAlpha = 0.75;
  top.fillStyle = washiPattern(top); top.fillRect(0, 0, (cv.width / R) * 5 + 640, (cv.height / R) * 5 + 640);
  top.globalAlpha = 1;
  top.setTransform(1, 0, 0, 1, 0, 0);
  const lg = top.createLinearGradient(0, 0, cv.width, cv.height);
  lg.addColorStop(0, 'rgba(255,246,228,0.1)'); lg.addColorStop(1, 'rgba(60,32,16,0.1)');
  top.fillStyle = lg; top.fillRect(0, 0, cv.width, cv.height);
  // the cut edge facing the light catches it
  t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, cv.width, cv.height); t.drawImage(cv, 0, 0);
  t.globalCompositeOperation = 'source-in'; t.fillStyle = '#fff7e6'; t.fillRect(0, 0, cv.width, cv.height);
  t.globalCompositeOperation = 'destination-out'; t.drawImage(cv, 0.45 * R, 0.55 * R);
  top.globalAlpha = 0.32; top.drawImage(t.canvas, 0, 0);
  top.restore();
}

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
  top.globalAlpha = 0.45; top.fillStyle = grainPattern(top); top.fillRect(0, 0, cv.width, cv.height); top.globalAlpha = 1;
  for (const [dx, dy, col, a] of [[0, -1.7, '#4a2416', 0.14], [0, 0.9, '#fffaf0', 0.22]] as const) {
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
  if (st.craft) { craftPress(st); return; }
  if (st.tmp) finish(st);
  sil.globalCompositeOperation = 'source-over';
  sil.clearRect(0, 0, cv.width, cv.height);
  sil.drawImage(cv, 0, 0);
  sil.globalCompositeOperation = 'source-in';
  sil.fillStyle = SHADE; sil.fillRect(0, 0, cv.width, cv.height);
  if (st.tmp) {
    // a small, soft shadow just under the sheet, light from above
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      out.globalAlpha = 0.035; out.drawImage(sil.canvas, (0.3 + Math.cos(a) * 0.45) * R, (0.9 + Math.sin(a) * 0.45) * R);
    }
    out.globalAlpha = 0.1; out.drawImage(sil.canvas, 0.1 * R, 0.4 * R);
  } else {
    out.globalAlpha = 0.13; out.drawImage(sil.canvas, 0.9 * R, 1.9 * R);
    out.globalAlpha = 0.3; out.drawImage(sil.canvas, 0.35 * R, 0.75 * R);
  }
  out.globalAlpha = 1;
  out.drawImage(cv, 0, 0);
  st.top.save(); st.top.setTransform(1, 0, 0, 1, 0, 0); st.top.clearRect(0, 0, cv.width, cv.height); st.top.restore();
}

// Craft press: soft foam-pad shadow and contact shadow, both blurred; the cardstock edge as a
// darker band of the sheet's own colours stepped down-right; then the sheet itself.
function craftPress(st: Stack): void {
  const cv = st.top.canvas, sil = st.sil, R = st.res, out = st.out, t = st.tmp!;
  craftFinish(st);
  sil.globalCompositeOperation = 'source-over';
  sil.clearRect(0, 0, cv.width, cv.height);
  sil.drawImage(cv, 0, 0);
  sil.globalCompositeOperation = 'source-in';
  sil.fillStyle = '#3e2416'; sil.fillRect(0, 0, cv.width, cv.height);
  blurInto(out, sil.canvas, st.wide!, 0.9 * R, 1.6 * R, 0.3);
  blurInto(out, sil.canvas, st.near!, 0.3 * R, 0.55 * R, 0.32);
  t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, cv.width, cv.height); t.drawImage(cv, 0, 0);
  t.globalCompositeOperation = 'source-atop'; t.fillStyle = 'rgba(58,30,16,0.48)'; t.fillRect(0, 0, cv.width, cv.height);
  out.globalAlpha = 1;
  for (let k = 3; k >= 1; k--) out.drawImage(t.canvas, 0.17 * k * R, 0.3 * k * R);
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
  stack = { top, out, sil, tmp: null, res: RES, craft: false, seed: 1 };
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
  const craft = paperStyle === 'craft';
  stack = { top, out, sil, tmp: layer(pw, ph), res, craft, seed: 1 + Math.floor(Math.abs(x0 * 131 + y1 * 71 + x1 * 17)) };
  if (craft) {
    stack.wide = layer(Math.max(1, Math.ceil(pw / (res * 1.4))), Math.max(1, Math.ceil(ph / (res * 1.4))));
    stack.near = layer(Math.max(1, Math.ceil(pw / (res * 0.45))), Math.max(1, Math.ceil(ph / (res * 0.45))));
  }
  draw(top);
  press(stack);
  stack = prev;
  return { c: out.canvas, w: W, h: H, ox: pad - x0, oy: pad - y0 };
}

// A flat silhouette of a sprite in the shadow colour, used for the shadow a part casts on the parts under it.
export function shadeOf(s: Sprite, blur = 0): HTMLCanvasElement {
  const c = layer(s.c.width, s.c.height);
  c.drawImage(s.c, 0, 0);
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = SHADE; c.fillRect(0, 0, s.c.width, s.c.height);
  if (blur <= 1) return c.canvas;
  const small = layer(Math.max(1, Math.ceil(s.c.width / blur)), Math.max(1, Math.ceil(s.c.height / blur)));
  const out = layer(s.c.width, s.c.height);
  blurInto(out, c.canvas, small, 0, 0, 1);
  return out.canvas;
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
    if (lw > 0 && stack && stack.top === c && stack.tmp && !stack.craft) { c.lineWidth = 0.75; c.strokeStyle = tone(fill, -0.32); c.stroke(); }
  } else if (lw > 0) { c.lineWidth = lw * LINE; c.strokeStyle = INK; c.stroke(); }
}

// A stroke: thick coloured strokes are paper strips (their own sheet), thin ones are printed.
function strip(c: C, col: string, lw: number): void {
  if (col === INK && lw >= 4) return;          // old outline underlay, not part of the paper logic
  if (col !== INK && lw >= 2.4) sheet(c);
  c.lineWidth = col === INK ? lw * 0.85 : lw; c.strokeStyle = col; c.stroke();
}

function craftCut(c: C, fill: string | null, lw: number): boolean {
  return !!fill && lw > 0 && !!stack && stack.top === c && stack.craft;
}

let cutSeed = 11;
// Traces a closed outline the way a blade guided by hand wanders off the line a little.
function roughPath(c: C, pts: number[], size: number): void {
  cutSeed = (cutSeed * 48271) % 2147483647;
  const p1 = (cutSeed % 997) / 997 * TAU, p2 = (cutSeed % 389) / 389 * TAU, p3 = (cutSeed % 173) / 173 * TAU;
  const amp = 0.3 * Math.min(1, size / 9);
  const n = pts.length / 2;
  c.beginPath();
  let s = 0, first = true;
  for (let i = 0; i < n; i++) {
    const x0 = pts[i * 2], y0 = pts[i * 2 + 1], x1 = pts[((i + 1) % n) * 2], y1 = pts[((i + 1) % n) * 2 + 1];
    const len = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(len / 1.3));
    const nx = len ? -(y1 - y0) / len : 0, ny = len ? (x1 - x0) / len : 0;
    for (let k = 0; k < steps; k++) {
      const u = k / steps, d = s + u * len;
      const w = amp * (Math.sin(d * 0.6 + p1) * 0.55 + Math.sin(d * 1.7 + p2) * 0.3 + Math.sin(d * 4.1 + p3) * 0.15);
      const x = x0 + (x1 - x0) * u + nx * w, y = y0 + (y1 - y0) * u + ny * w;
      if (first) { c.moveTo(x, y); first = false; } else c.lineTo(x, y);
    }
    s += len;
  }
  c.closePath();
}

function boundsOf(pts: number[]): number {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
  return Math.min(x1 - x0, y1 - y0);
}

export function ell(c: C, x: number, y: number, rx: number, ry: number, fill: string | null, lw = 2, rot = 0): void {
  if (craftCut(c, fill, lw)) {
    const n = Math.max(20, Math.ceil((Math.PI * (rx + ry)) / 1.5)), pts: number[] = [];
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
  if (craftCut(c, fill, lw)) {
    r = Math.min(r, w / 2, h / 2);
    const pts: number[] = [];
    const corner = (cx: number, cy: number, a0: number): void => { for (let i = 0; i <= 4; i++) { const a = a0 + (i / 4) * (Math.PI / 2); pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } };
    corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
    roughPath(c, pts, Math.min(w, h)); fs(c, fill, lw); return;
  }
  rrPath(c, x, y, w, h, r); fs(c, fill, lw);
}

export function poly(c: C, pts: number[], fill: string | null, lw = 2, close = true): void {
  if (close && craftCut(c, fill, lw)) { roughPath(c, pts, boundsOf(pts)); fs(c, fill, lw); return; }
  c.beginPath();
  c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  if (close) c.closePath();
  fs(c, fill, lw);
}

// Smooth closed shape through the given points.
export function blob(c: C, pts: number[], fill: string | null, lw = 2): void {
  const n = pts.length / 2;
  if (craftCut(c, fill, lw)) {
    const out: number[] = [];
    for (let i = 0; i < n; i++) {
      const xp = (pts[((i + n - 1) % n) * 2] + pts[i * 2]) / 2, yp = (pts[((i + n - 1) % n) * 2 + 1] + pts[i * 2 + 1]) / 2;
      const xn = (pts[i * 2] + pts[((i + 1) % n) * 2]) / 2, yn = (pts[i * 2 + 1] + pts[((i + 1) % n) * 2 + 1]) / 2;
      for (let k = 0; k < 6; k++) { const u = k / 6, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u; out.push(a * xp + b * pts[i * 2] + d * xn, a * yp + b * pts[i * 2 + 1] + d * yn); }
    }
    roughPath(c, out, boundsOf(out)); fs(c, fill, lw); return;
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

// A darker or lighter version of a #rrggbb colour (k < 0 darkens), for outlines and folds.
export function tone(hex: string, k: number): string {
  if (hex[0] !== '#' || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number): number => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

// Prints a traditional pattern over the sheet being drawn, and only over it. Call right after
// the shape it decorates. `s` is the pattern scale in logical pixels.
export function pat(c: C, kind: 'seigaiha' | 'sakura' | 'stripes' | 'dots' | 'asanoha', col: string, s = 4, alpha = 1): void {
  c.save();
  c.globalCompositeOperation = 'source-atop';
  c.globalAlpha = alpha;
  c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(0.5, s * 0.12);
  const R = 140;
  if (kind === 'seigaiha') {
    for (let row = 0, y = -R; y < R; row++, y += s * 0.55) for (let x = -R + (row % 2) * s; x < R; x += s * 2) {
      for (const k of [1, 0.7, 0.4]) { c.beginPath(); c.arc(x, y, s * k, Math.PI, 0); c.stroke(); }
    }
  } else if (kind === 'sakura') {
    for (let row = 0, y = -R; y < R; row++, y += s * 2.2) for (let x = -R + (row % 2) * s * 1.6; x < R; x += s * 3.2) flower(c, x, y, s * 0.55, col);
  } else if (kind === 'stripes') {
    for (let x = -R; x < R; x += s * 2) c.fillRect(x, -R, s, R * 2);
  } else if (kind === 'dots') {
    for (let row = 0, y = -R; y < R; row++, y += s) for (let x = -R + (row % 2) * s * 0.5; x < R; x += s) { c.beginPath(); c.arc(x, y, s * 0.16, 0, TAU); c.fill(); }
  } else {
    for (let row = 0, y = -R; y < R; row++, y += s * 1.73) for (let x = -R + (row % 2) * s; x < R; x += s * 2) {
      for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); c.stroke(); }
    }
  }
  c.restore();
}

// A five-petal cherry blossom, printed (no sheet of its own).
export function flower(c: C, x: number, y: number, r: number, col: string): void {
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2, a0 = a - 0.55, a1 = a + 0.55;
    c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a0) * r * 1.2, y + Math.sin(a0) * r * 1.2, x + Math.cos(a - 0.1) * r, y + Math.sin(a - 0.1) * r);
    c.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8);
    c.lineTo(x + Math.cos(a + 0.1) * r, y + Math.sin(a + 0.1) * r);
    c.quadraticCurveTo(x + Math.cos(a1) * r * 1.2, y + Math.sin(a1) * r * 1.2, x, y);
  }
  c.fillStyle = col; c.fill();
}

// A cherry blossom as its own small cut sheet, with a printed centre.
export function blossom(c: C, x: number, y: number, r: number, col: string, eye = '#e9b949'): void {
  sheet(c);
  flower(c, x, y, r, col);
  if (stack && stack.top === c && stack.tmp && !stack.craft) { c.lineWidth = 0.5; c.strokeStyle = tone(col, -0.25); c.stroke(); }
  c.beginPath(); c.arc(x, y, r * 0.22, 0, TAU); c.fillStyle = eye; c.fill();
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
  if (paperStyle === 'craft') {
    c.fillStyle = col; c.fillRect(x, y, w, h);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); c.globalAlpha = 0.8; c.fillStyle = washiPattern(c); c.fillRect(x, y, w, h); c.restore();
    return;
  }
  c.fillStyle = col; c.fillRect(x, y, w, h);
  c.save(); c.globalAlpha = 0.5; c.fillStyle = grainPattern(c); c.fillRect(x, y, w, h); c.restore();
}

// A chibi eye as ONE cut piece: a dark eye shape whose top edge is the lash line (with a small
// flick at the outer corner), and everything inside it printed on that same sheet: an iris
// that darkens towards the top, the pupil, a lower glint and two catchlights. One sheet means
// one edge and one shadow, so it stays clean at small sizes. `s` is -1 for the left eye.
export function chibiEye(c: C, x: number, y: number, s: number, iris: string, irisDk: string, k = 1): void {
  const w = 3.9 * k, h = 4.9 * k;
  sheet(c);
  c.beginPath();
  c.moveTo(x - s * w * 1.0, y - h * 0.15);
  c.bezierCurveTo(x - s * w * 1.0, y - h * 0.95, x + s * w * 0.6, y - h * 1.15, x + s * w * 1.25, y - h * 0.85);
  c.lineTo(x + s * w * 1.0, y - h * 0.45);
  c.bezierCurveTo(x + s * w * 1.05, y + h * 0.75, x + s * w * 0.4, y + h * 1.0, x, y + h * 1.0);
  c.bezierCurveTo(x - s * w * 0.65, y + h * 1.0, x - s * w * 1.0, y + h * 0.55, x - s * w * 1.0, y - h * 0.15);
  c.closePath();
  c.fillStyle = '#2b1b1e'; c.fill();
  if (stack && stack.top === c && stack.tmp && !stack.craft) { c.lineWidth = 0.6; c.strokeStyle = '#1e1214'; c.stroke(); }
  // printed iris with a vertical gradient, inset from the dark rim
  const g = c.createLinearGradient(x, y - h * 0.55, x, y + h * 0.85);
  g.addColorStop(0, irisDk); g.addColorStop(0.55, iris); g.addColorStop(1, tone(iris, 0.35));
  c.beginPath(); c.ellipse(x, y + h * 0.18, w * 0.78, h * 0.68, 0, 0, TAU); c.fillStyle = g; c.fill();
  c.beginPath(); c.ellipse(x, y + h * 0.12, w * 0.36, h * 0.42, 0, 0, TAU); c.fillStyle = '#24161a'; c.fill();
  c.beginPath(); c.ellipse(x, y + h * 0.62, w * 0.5, h * 0.16, 0, 0, TAU); c.fillStyle = tone(iris, 0.55); c.fill();
  c.beginPath(); c.ellipse(x - s * w * 0.32, y - h * 0.22, w * 0.3, h * 0.27, -0.4 * s, 0, TAU); c.fillStyle = '#fffaf2'; c.fill();
  c.beginPath(); c.arc(x + s * w * 0.38, y + h * 0.42, w * 0.13, 0, TAU); c.fillStyle = '#fffaf2'; c.fill();
}
