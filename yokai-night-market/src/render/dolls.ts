// Doll definitions in the style of the user's references: clean vector cut-outs, each shape
// outlined in a darker tone of its own colour, a cel fold on its lower edge, printed
// traditional patterns, small soft shadows. Units are logical pixels; the root pin is at the feet.
import type { DollDef, Pose } from './doll';
import { type C, blob, blossom, curve, dot, ell, line, pat, poly, rr, tone } from './kit';

export const P = {
  verm: '#d65640', vermDk: '#b2402f', coral: '#ee9a8a', pink: '#f2b8bf', pinkMd: '#e996a3', pinkDk: '#d27486',
  sage: '#9fb48a', sageDk: '#7e9670', teal: '#4f8f8c', mustard: '#e3aa4a', gold: '#d9a441', goldLt: '#f0cf7e',
  cream: '#f6ecd6', paper: '#fdf6e8', indigo: '#3f4e78', indigoDk: '#2e3a5e',
  wood: '#c8874f', woodDk: '#9a5e36', roof: '#5b4b4a', roofDk: '#463938', stone: '#b9b3aa', stoneDk: '#97918a',
  hair: '#3a2a2c', hairHi: '#5e4348', skin: '#fbe3d0', maple: '#e2643a', mapleLt: '#f08a46', mapleDk: '#c24a2e',
};

// ---------------------------------------------------------------- 小滿

function sleeve(c: C, s: number): void {
  blob(c, [0, -1.5, s * 5.5, -2.5, s * 11, 4, s * 11.5, 13.5, s * 6.5, 16, s * 1.5, 12.5, s * 0.2, 4], P.verm);
  blob(c, [0, -2.5, s * 5, -3.2, s * 10, 3, s * 10.4, 12, s * 6, 14.2, s * 1.4, 11.2, 0, 3.5], P.paper);
  pat(c, 'sakura', P.pink, 2.6, 0.9);
  curve(c, s * 2, 10.5, s * 6, 12.8, s * 9.8, 10.6, P.verm, 1.2);
  ell(c, s * 5.6, 14.6, 2.6, 2.4, P.skin);
}

function foot(c: C): void {
  ell(c, 0, 1.8, 3.2, 2.4, P.paper);
  rr(c, -3.5, 3.4, 7, 1.9, 0.9, P.woodDk);
  line(c, [-1.2, 0.3, 0.4, 2.6], P.verm, 1);
}

function animeEye(c: C, x: number, y: number, s: number): void {
  ell(c, x, y, 4.2, 5.2, P.paper);
  ell(c, x, y + 0.4, 3.7, 4.7, '#a14c38');
  c.beginPath(); c.ellipse(x, y - 0.6, 3.7, 3.6, 0, Math.PI, 0); c.fillStyle = '#6a3028'; c.fill();
  ell(c, x, y + 0.9, 1.7, 2.2, '#2a1a1c', 0);
  c.beginPath(); c.ellipse(x, y + 2.8, 2.6, 1.3, 0, 0, Math.PI); c.fillStyle = '#e08a5a'; c.fill();
  dot(c, x - s * 1.3, y - 1.8, 1.6, '#fff'); dot(c, x + s * 1.3, y + 2, 0.7, '#fff');
  // lash line: follows the top of the eye itself, so the look stays round and soft
  c.beginPath(); c.ellipse(x, y + 0.2, 4.5, 5.4, 0, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 1.7; c.strokeStyle = P.hair; c.lineCap = 'round'; c.stroke();
  line(c, [x + s * 4.2, y - 2.2, x + s * 5.4, y - 3.2], P.hair, 1.1);
}

export const MIKO: DollDef = {
  parts: [
    { id: 'legL', at: [-3.6, -5.5], z: 1, box: [-5, -2, 5, 7], draw: foot },
    { id: 'legR', at: [3.6, -5.5], z: 1.2, box: [-5, -2, 5, 7], draw: foot },
    { id: 'body', at: [0, -5], z: 4, box: [-13, -19, 13, 7], draw: (c) => {
      blob(c, [-8, -9, 8, -9, 11.5, 3, 0, 5.2, -11.5, 3], P.vermDk);
      blob(c, [-8, -9, -2.6, -9, -3.6, 4.4, -11, 2.8], P.verm);
      blob(c, [2.6, -9, 8, -9, 11, 2.8, 3.6, 4.4], P.verm);
      poly(c, [-2.8, -9, 2.8, -9, 3.8, 4.6, -3.8, 4.6], '#e16a52');
      blob(c, [-6.5, -18, 6.5, -18, 8, -8.5, -8, -8.5], P.paper);
      pat(c, 'sakura', P.pink, 2.4, 0.7);
      poly(c, [-3, -18, 3, -18, 0, -12], P.verm);
      poly(c, [6.5, -18, -0.6, -18, -3.4, -10.4, 7.8, -9.2], P.paper);
      poly(c, [-6.5, -18, 1, -18, 3.5, -9.8, -7.8, -9.2], P.paper);
      rr(c, -8.6, -10.8, 17.2, 3.6, 1.6, P.gold);
      pat(c, 'seigaiha', tone(P.gold, -0.2), 1.6);
      ell(c, -3.6, -9, 3.3, 2.2, P.verm, 2, 0.45); ell(c, 3.6, -9, 3.3, 2.2, P.verm, 2, -0.45);
      ell(c, 0, -9, 1.7, 1.8, P.coral);
    } },
    { id: 'armB', parent: 'body', at: [-6.4, -17], z: 3, box: [-14, -6, 3, 19], draw: (c) => sleeve(c, -1) },
    { id: 'armF', parent: 'body', at: [6.4, -17], z: 6, box: [-3, -16, 18, 19], draw: (c) => {
      sleeve(c, 1);
      c.save(); c.translate(7, 12); c.rotate(0.3);
      rr(c, -3.4, -15.5, 6.8, 15.5, 0.8, P.paper);
      line(c, [-1.6, -12.6, 1.6, -12.6], P.verm, 1.1); line(c, [0, -12.6, 0, -4.4], P.verm, 1.1); line(c, [-1.6, -8.4, 1.6, -8.4], P.verm, 0.9);
      c.restore();
      ell(c, 5.8, 14.2, 2.5, 2.3, P.skin);
    } },
    { id: 'head', parent: 'body', at: [0, -18], z: 7, box: [-20, -35, 20, 2], draw: (c) => {
      ell(c, -16, -14, 2.5, 3.2, P.skin); ell(c, 16, -14, 2.5, 3.2, P.skin);
      ell(c, 0, -17, 17, 15.5, P.skin);
      c.globalAlpha = 0.5; ell(c, -10, -8.6, 3.4, 2, P.coral, 0); ell(c, 10, -8.6, 3.4, 2, P.coral, 0); c.globalAlpha = 1;
      animeEye(c, -6.8, -11.6, -1); animeEye(c, 6.8, -11.6, 1);
      c.beginPath(); c.moveTo(-1.6, -6.6); c.quadraticCurveTo(0, -4.2, 1.6, -6.6); c.closePath(); c.fillStyle = '#b8483e'; c.fill();
    } },
    { id: 'hairB', parent: 'head', at: [0, -17], z: 0, box: [-22, -26, 22, 14], draw: (c) => {
      blob(c, [-19.5, -1, -18.5, -14, -11, -22, 0, -24, 11, -22, 18.5, -14, 19.5, -1, 15.5, 10, 0, 9, -15.5, 10], P.hair);
    } },
    { id: 'tailL', parent: 'hairB', at: [-15.5, 4], z: 0.4, box: [-7, -4, 7, 30], draw: (c) => {
      blob(c, [-3.8, -2, 3.8, -2, 5, 12, 2.8, 26, -2.4, 23, -5, 12], P.hair);
      rr(c, -4.8, 2, 9.6, 4.6, 1.4, P.verm); pat(c, 'dots', P.paper, 1.6);
    } },
    { id: 'tailR', parent: 'hairB', at: [15.5, 4], z: 0.5, box: [-7, -4, 7, 30], draw: (c) => {
      blob(c, [-3.8, -2, 3.8, -2, 5, 12, 2.4, 23, -2.8, 26, -5, 12], P.hair);
      rr(c, -4.8, 2, 9.6, 4.6, 1.4, P.verm); pat(c, 'dots', P.paper, 1.6);
    } },
    { id: 'hairF', parent: 'head', at: [0, -17], z: 8, box: [-21, -20, 21, 14], draw: (c) => {
      poly(c, [-18.6, -6, -13.4, -6, -13, 10, -16, 13, -19, 9], P.hair); poly(c, [18.6, -6, 13.4, -6, 13, 10, 16, 13, 19, 9], P.hair);
      const pts: number[] = [];
      for (let i = 0; i <= 16; i++) { const a = Math.PI * (1.04 + (i / 16) * 0.92); pts.push(Math.cos(a) * 18.2, -1.5 + Math.sin(a) * 17.2); }
      pts.push(15, -2.5, 11.5, -10.4, 8.2, -3.2, 3.8, -10.8, 0.4, -4, -3.6, -11, -8, -3.4, -11.5, -10.6, -15, -2.8);
      poly(c, pts, P.hair);
      blob(c, [-12, -13, -5, -16.4, 4, -16.6, 12, -13, 4, -14.8, -5, -14.6], P.hairHi);
    } },
    { id: 'bow', parent: 'head', at: [0, -32], z: 9, box: [-17, -9, 17, 12], draw: (c) => {
      poly(c, [-1.5, 1, -5.5, 9.5, -2.6, 9.4, 0, 3], P.vermDk); poly(c, [1.5, 1, 5.5, 9.5, 2.6, 9.4, 0, 3], P.vermDk);
      blob(c, [0, 0, -6, -6, -13.5, -5, -15, 0, -12.5, 4.5, -5, 3.6], P.verm);
      blob(c, [0, 0, 6, -6, 13.5, -5, 15, 0, 12.5, 4.5, 5, 3.6], P.verm);
      blob(c, [-2, -0.5, -7, -3.4, -11.5, -2.4, -11, 1, -6, 1.6], P.coral);
      blob(c, [2, -0.5, 7, -3.4, 11.5, -2.4, 11, 1, 6, 1.6], P.coral);
      ell(c, 0, 0, 3, 3.2, P.vermDk); dot(c, 0, 0.3, 1.2, P.gold);
    } },
  ],
  pose: (t, moving): Pose => {
    if (moving) {
      const s = Math.sin(t * 10), lag = Math.sin(t * 10 - 1.1);
      return {
        body: { y: -Math.abs(Math.cos(t * 10)) * 1.6, r: s * 0.05 },
        legL: { r: s * 0.5, y: Math.max(0, s) * -1.2 }, legR: { r: -s * 0.5, y: Math.max(0, -s) * -1.2 },
        armB: { r: -s * 0.5 + 0.12 }, armF: { r: s * 0.4 - 0.18 },
        head: { r: -s * 0.07 }, hairB: { r: lag * 0.03 },
        tailL: { r: lag * 0.34 + 0.1 }, tailR: { r: lag * 0.34 - 0.1 }, bow: { r: lag * 0.14 },
      };
    }
    const b = Math.sin(t * 2.4), n = Math.sin(t * 1.3);
    return {
      body: { y: b * 0.6 }, head: { r: n * 0.06 },
      armB: { r: 0.1 + b * 0.04 }, armF: { r: -0.14 - b * 0.05 },
      tailL: { r: 0.06 + n * 0.07 }, tailR: { r: -0.06 + n * 0.07 }, bow: { r: n * 0.06 },
    };
  },
};

// ---------------------------------------------------------------- 提燈妖

export const CHOCHIN: DollDef = {
  parts: [
    { id: 'body', at: [0, -5], z: 2, box: [-17, -30, 17, 4], draw: (c) => {
      blob(c, [-7, -1, 7, -1, 14, -9, 15, -16, 13, -23, 7, -28, -7, -28, -13, -23, -15, -16, -14, -9], P.verm);
      for (let i = 1; i < 7; i++) { const y = -1 - i * 3.9, w = 7 + Math.sin((i / 7) * Math.PI) * 7.6; curve(c, -w, y, 0, y + 1.6, w, y, P.vermDk, 0.9); }
      blob(c, [-4, -26, 2, -27, 6, -24, 2, -24.5], tone(P.verm, 0.3));
    } },
    { id: 'capB', parent: 'body', at: [0, 0], z: 1, box: [-9, -3, 9, 6], draw: (c) => { rr(c, -6.5, -1.5, 13, 5, 1.6, P.hair); line(c, [-6, 0.9, 6, 0.9], P.gold, 1.2); } },
    { id: 'capT', parent: 'body', at: [0, -27], z: 3, box: [-10, -13, 10, 4], draw: (c) => {
      curve(c, -4.5, -3, 0, -12, 4.5, -3, P.hair, 1.6);
      rr(c, -7.5, -4, 15, 5.4, 1.6, P.hair); line(c, [-7, -0.2, 7, -0.2], P.gold, 1.2);
    } },
    { id: 'eye', parent: 'body', at: [0, -16], z: 4, box: [-8, -9, 8, 8], draw: (c) => {
      ell(c, 0, 0, 6.2, 5.8, P.paper); ell(c, 0, 0.6, 3.7, 3.7, P.mustard); ell(c, 0, 0.6, 1.9, 1.9, P.hair, 0);
      dot(c, -1.4, -1, 0.9, '#fff');
      curve(c, -6.4, -2, 0, -7.2, 6.4, -2, P.hair, 1.4);
    } },
    { id: 'tongue', parent: 'body', at: [1, -8.5], z: 5, box: [-5, -3, 5, 13], draw: (c) => {
      rr(c, -3.6, -2, 7.2, 3, 1.4, P.hair);
      rr(c, -2.8, -1, 5.6, 11, 2.8, P.coral); line(c, [0, 1.5, 0, 7], tone(P.coral, -0.3), 1);
    } },
  ],
  pose: (t): Pose => {
    const h = Math.abs(Math.sin(t * 5)), s = Math.sin(t * 5);
    return {
      body: { y: -h * 6, r: s * 0.09, sy: 1 - (1 - h) * 0.12, sx: 1 + (1 - h) * 0.05 },
      tongue: { r: Math.sin(t * 5 - 0.9) * 0.45 }, capT: { r: -s * 0.06 }, eye: { y: (1 - h) * 0.6 },
    };
  },
};

// ---------------------------------------------------------------- scenery

// One cloud tier of a canopy: a row of round lobes on a flat-ish base, like the cut-paper
// foliage in the references. Lobes are joined into a single outline so the tier is one sheet.
function tier(c: C, cx: number, cy: number, w: number, h: number, col: string): void {
  const n = Math.max(3, Math.round(w / 8)), pts: number[] = [];
  pts.push(cx + w, cy + h * 0.15);
  pts.push(cx + w * 0.55, cy + h * 0.45, cx - w * 0.55, cy + h * 0.45);
  pts.push(cx - w, cy + h * 0.15);
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n, um = (u0 + u1) / 2;
    const top = Math.sin(um * Math.PI) * h * 0.75 + h * 0.35;
    pts.push(cx - w + u0 * w * 2, cy - Math.sin(u0 * Math.PI) * h * 0.55);
    pts.push(cx - w + um * w * 2, cy - top);
  }
  blob(c, pts, col);
}

function canopyTree(cols: [string, string, string, string], flowers: string | null): DollDef {
  return {
    parts: [
      { id: 'trunk', at: [0, 0], z: 1, box: [-22, -48, 22, 2], draw: (c) => {
        blob(c, [-5.5, 0, 5.5, 0, 4, -14, 16, -32, 11, -33, 2.4, -24, 1, -44, -2.6, -24, -13, -34, -17, -32, -4, -14], P.woodDk);
        curve(c, -1.4, -3, 0.6, -10, -0.6, -18, tone(P.woodDk, -0.25), 0.9);
      } },
      { id: 't0', parent: 'trunk', at: [0, -44], z: 2, box: [-30, -26, 30, 12], draw: (c) => tier(c, 0, 0, 22, 14, cols[0]) },
      { id: 't1', parent: 'trunk', at: [0, -36], z: 3, box: [-38, -24, 38, 12], draw: (c) => tier(c, 0, 0, 30, 13, cols[1]) },
      { id: 't2', parent: 'trunk', at: [0, -28], z: 4, box: [-44, -22, 44, 12], draw: (c) => {
        tier(c, -13, 0, 21, 11, cols[2]); tier(c, 15, 1, 19, 10, cols[2]);
      } },
      { id: 't3', parent: 'trunk', at: [0, -22], z: 5, box: [-34, -18, 34, 10], draw: (c) => {
        tier(c, -3, 0, 17, 9, cols[3]);
        if (flowers) for (const [x, y] of [[-14, -6], [-2, -8], [8, -4], [-20, -1]]) blossom(c, x, y, 2.6, flowers);
      } },
    ],
    pose: (t): Pose => {
      const s = Math.sin(t * 1.3);
      return { t0: { r: s * 0.02 }, t1: { r: s * 0.025 }, t2: { r: s * 0.03 }, t3: { r: s * 0.04 } };
    },
  };
}

export const SAKURA = canopyTree([P.pinkDk, P.pinkMd, P.pink, '#f8d3d6'], '#fff4f2');
export const MAPLE = canopyTree([P.mapleDk, P.maple, P.mapleLt, '#f4a64e'], null);

// origami hills: low, wide, each folded into three facets (lit, mid, shaded), with a printed wave
function hill(c: C, x: number, w: number, h: number, cols: [string, string, string]): void {
  const lx = x - w * 0.18, rx = x + w * 0.22;
  poly(c, [x - w, 0, lx, -h * 0.82, x, -h, x - w * 0.2, 0], cols[0]);
  poly(c, [x - w * 0.2, 0, x, -h, rx, -h * 0.78, x + w * 0.4, 0], cols[1]);
  poly(c, [x + w * 0.4, 0, rx, -h * 0.78, x + w, 0], cols[2]);
  pat(c, 'seigaiha', tone(cols[2], -0.1), 3.4, 0.5);
}

export const MOUNTAINS: DollDef = {
  parts: [
    { id: 'back', at: [0, 0], z: 1, box: [-280, -80, 280, 4], draw: (c) => {
      hill(c, -170, 110, 62, ['#d8dfc0', '#c3cfa6', '#a9b98c']);
      hill(c, 30, 130, 72, ['#f1dfae', '#e3c98a', '#cfac68']);
      hill(c, 210, 100, 56, ['#d8dfc0', '#c3cfa6', '#a9b98c']);
    } },
    { id: 'front', at: [0, 0], z: 2, box: [-280, -56, 280, 4], draw: (c) => {
      hill(c, -60, 90, 40, ['#f3d79a', '#e6bf6c', '#d4a24c']);
      hill(c, 140, 80, 44, ['#c8d4ac', '#b1c290', '#94a874']);
      hill(c, -250, 70, 36, ['#f3d79a', '#e6bf6c', '#d4a24c']);
    } },
  ],
  pose: (): Pose => ({}),
};

function scallopRow(c: C, x0: number, x1: number, y: number, r: number, col: string): void {
  // a row of round tile ends: the scalloped lower edge of a tiled roof course
  const pts: number[] = [x0, y - r * 1.6];
  pts.push(x1, y - r * 1.6);
  for (let x = x1; x > x0 + 0.1; x -= r * 2) { pts.push(x, y); pts.push(x - r, y + r * 0.9); }
  pts.push(x0, y);
  blob(c, pts, col);
}

export const SHOP: DollDef = {
  parts: [
    { id: 'base', at: [0, 0], z: 1, box: [-44, -8, 44, 2], draw: (c) => {
      rr(c, -40, -6, 80, 6, 1, P.stone); pat(c, 'asanoha', P.stoneDk, 3, 0.5);
    } },
    { id: 'wall', parent: 'base', at: [0, -6], z: 2, box: [-38, -52, 38, 2], draw: (c) => {
      rr(c, -36, -48, 72, 48, 1, P.wood);
      rr(c, -36, -48, 72, 12, 1, P.cream);
      for (const x of [-30, -16, 4, 18]) { rr(c, x, -45, 10, 6, 0.5, P.paper); line(c, [x + 5, -45, x + 5, -39], P.woodDk, 0.7); }
      rr(c, -32, -30, 22, 22, 0.6, '#5a3a2a');
      for (let x = -31; x < -10; x += 2.6) line(c, [x, -29.4, x, -8.6], P.woodDk, 0.9);
      rr(c, 10, -30, 22, 22, 0.6, '#5a3a2a');
      for (let x = 11; x < 32; x += 2.6) line(c, [x, -29.4, x, -8.6], P.woodDk, 0.9);
      rr(c, -8, -32, 16, 32, 0.6, '#4a2e22');
      for (const x of [-37, -9.5, 8, 35]) rr(c, x, -49, 3, 49, 0.6, P.woodDk);
      rr(c, -38, -36.6, 76, 3, 0.6, P.woodDk);
    } },
    { id: 'roof', parent: 'base', at: [0, -54], z: 4, box: [-54, -30, 54, 10], draw: (c) => {
      blob(c, [-46, 2, -50, -4, -40, -8, 40, -8, 50, -4, 46, 2], P.roofDk);
      for (let k = 2; k >= 0; k--) scallopRow(c, -44 + k * 6, 44 - k * 6, -k * 6.5, 2.4, k % 2 ? P.roofDk : P.roof);
      rr(c, -30, -24, 60, 5, 2, P.roofDk);
      ell(c, -31, -21.5, 3.6, 3.6, P.roof); ell(c, 31, -21.5, 3.6, 3.6, P.roof);
    } },
    { id: 'sign', parent: 'base', at: [0, -66], z: 5, box: [-16, -2, 16, 14], draw: (c) => {
      rr(c, -14, 0, 28, 11, 1.2, P.hair);
      rr(c, -12, 1.6, 24, 7.8, 0.8, P.gold);
      c.font = '700 7px "Songti TC", "Hiragino Mincho ProN", serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = P.hair;
      c.fillText('甘 味', 0, 5.6);
    } },
    { id: 'noren', parent: 'base', at: [0, -38], z: 5.5, box: [-11, -1, 11, 16], draw: (c) => {
      rr(c, -10.5, -0.5, 21, 1.6, 0.6, P.woodDk);
      for (const x of [-10, -3.3, 3.4]) { rr(c, x, 0.8, 6.6, 14, 0.8, P.indigo); pat(c, 'seigaiha', P.indigoDk, 2.2); }
      ell(c, 0, 7, 3.4, 3.4, P.paper); blossom(c, 0, 7, 2.6, P.pink);
    } },
    { id: 'lanternL', parent: 'base', at: [-28, -54], z: 6, box: [-6, -1, 6, 18], draw: (c) => hanging(c) },
    { id: 'lanternR', parent: 'base', at: [28, -54], z: 6, box: [-6, -1, 6, 18], draw: (c) => hanging(c) },
    { id: 'bench', parent: 'base', at: [-22, -6], z: 7, box: [-14, -10, 14, 2], draw: (c) => {
      rr(c, -11, -7, 2, 7, 0.5, P.woodDk); rr(c, 9, -7, 2, 7, 0.5, P.woodDk);
      rr(c, -13, -9, 26, 3, 1, P.verm); pat(c, 'stripes', P.vermDk, 1.2, 0.5);
    } },
    { id: 'pot', parent: 'base', at: [30, -6], z: 7, box: [-8, -16, 8, 2], draw: (c) => {
      ell(c, -3, -10, 4, 4, P.sageDk); ell(c, 3, -11, 4.4, 4.4, P.sage); ell(c, 0, -13.5, 3.6, 3.4, P.sage);
      poly(c, [-5, -6, 5, -6, 4, 0, -4, 0], P.indigo); pat(c, 'seigaiha', P.paper, 1.6, 0.7);
    } },
  ],
  pose: (t): Pose => ({ noren: { r: Math.sin(t * 1.6) * 0.03 }, lanternL: { r: Math.sin(t * 1.9) * 0.12 }, lanternR: { r: Math.sin(t * 1.9 + 1) * 0.12 } }),
};

function hanging(c: C): void {
  line(c, [0, 0, 0, 3], P.hair, 0.8);
  rr(c, -3, 2.4, 6, 1.8, 0.6, P.hair);
  ell(c, 0, 9, 5, 6, P.verm);
  for (const y of [6.4, 9, 11.6]) curve(c, -4.2, y, 0, y + 0.8, 4.2, y, P.vermDk, 0.7);
  rr(c, -3, 14.2, 6, 1.8, 0.6, P.hair);
}

export const STONE_LANTERN: DollDef = {
  parts: [
    { id: 'base', at: [0, 0], z: 1, box: [-14, -26, 14, 2], draw: (c) => {
      rr(c, -11, -5, 22, 5, 1, P.stoneDk); rr(c, -4, -20, 8, 16, 1, P.stone); rr(c, -9, -24, 18, 5, 1.2, P.stoneDk);
    } },
    { id: 'box', parent: 'base', at: [0, -24], z: 2, box: [-10, -16, 10, 2], draw: (c) => {
      rr(c, -7.5, -13, 15, 13, 1, P.stone); rr(c, -4.2, -11, 8.4, 8.4, 0.6, '#f6d27a'); line(c, [0, -11, 0, -2.6], P.stoneDk, 0.8);
    } },
    { id: 'cap', parent: 'base', at: [0, -37], z: 3, box: [-16, -14, 16, 3], draw: (c) => {
      poly(c, [-14, 0, -8, -5, 0, -9, 8, -5, 14, 0], P.stoneDk); poly(c, [-8, -5, 0, -9, 8, -5, 0, -4], P.stone);
      ell(c, 0, -11, 2.6, 2.6, P.stoneDk);
    } },
  ],
  pose: (): Pose => ({}),
};
