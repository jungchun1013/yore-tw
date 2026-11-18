// Doll definitions. Units are logical pixels; a doll's root pin is at its feet.
// Inside a part every filled shape is its own hand-cut card sheet, drawn back to front.
// Palette (see docs/art-direction.md): warm, slightly muted washi colours.
import type { DollDef, Pose } from './doll';
import { type C, blob, curve, dot, ell, line, poly, rr } from './kit';

export const P = {
  verm: '#d4573d', vermDk: '#b4432f', coral: '#e98b7b', coralLt: '#f2b2a2',
  sage: '#9db08a', sageDk: '#7f9670', sageLt: '#b9c8a2',
  mustard: '#d9a646', cream: '#f4e8cf', creamDk: '#e6d6b4', paper: '#fbf3e2',
  indigo: '#3f4d74', indigoDk: '#2f3a5c', indigoLt: '#5a6a92',
  brown: '#8a5a3c', brownDk: '#6a4430', hair: '#3b2a2a', hairHi: '#5a403a',
  skin: '#f6dcc6', stone: '#b9ad98',
};

// ---------------------------------------------------------------- 小滿, chibi shrine apprentice

function sleeve(c: C, s: number): void {
  // furisode sleeve: red lining sheet, the cream sleeve over it, a printed cuff line, a round hand
  blob(c, [0, -1.5, s * 5.5, -2.5, s * 11, 4, s * 11.5, 13.5, s * 6.5, 16, s * 1.5, 12.5, s * 0.2, 4], P.vermDk);
  blob(c, [0, -2.5, s * 5, -3.2, s * 10, 3, s * 10.4, 12, s * 6, 14.2, s * 1.4, 11.2, 0, 3.5], P.paper);
  curve(c, s * 2, 10.5, s * 6, 12.8, s * 9.8, 10.6, P.verm, 1.3);
  ell(c, s * 5.6, 14.6, 2.7, 2.5, P.skin);
}

function foot(c: C): void {
  ell(c, 0, 1.8, 3.3, 2.5, P.paper);
  rr(c, -3.6, 3.4, 7.2, 1.9, 0.9, P.brown);
  line(c, [-1.2, 0.3, 0.4, 2.6], P.verm, 1);
}

export const MIKO: DollDef = {
  parts: [
    { id: 'legL', at: [-3.6, -5.5], z: 1, box: [-5, -2, 5, 7], draw: foot },
    { id: 'legR', at: [3.6, -5.5], z: 1.2, box: [-5, -2, 5, 7], draw: foot },
    { id: 'body', at: [0, -5], z: 4, box: [-13, -19, 13, 7], draw: (c) => {
      // hakama: back bell, two side panels, the centre pleat
      blob(c, [-8, -9, 8, -9, 11.5, 3, 0, 5.2, -11.5, 3], P.vermDk);
      blob(c, [-8, -9, -2.6, -9, -3.6, 4.4, -11, 2.8], P.verm);
      blob(c, [2.6, -9, 8, -9, 11, 2.8, 3.6, 4.4], P.verm);
      poly(c, [-2.8, -9, 2.8, -9, 3.8, 4.6, -3.8, 4.6], '#de6a50');
      // kosode: torso, red under-collar, the lapels crossing
      blob(c, [-6.5, -18, 6.5, -18, 8, -8.5, -8, -8.5], P.paper);
      poly(c, [-3, -18, 3, -18, 0, -12], P.verm);
      poly(c, [6.5, -18, -0.6, -18, -3.4, -10.4, 7.8, -9.2], '#fff8ea');
      poly(c, [-6.5, -18, 1, -18, 3.5, -9.8, -7.8, -9.2], '#fff8ea');
      // waist tie with a bow
      rr(c, -8.6, -10.8, 17.2, 3.6, 1.6, P.vermDk);
      ell(c, -3.6, -9, 3.3, 2.2, P.verm, 2, 0.45); ell(c, 3.6, -9, 3.3, 2.2, P.verm, 2, -0.45);
      ell(c, 0, -9, 1.7, 1.8, P.coral);
    } },
    { id: 'armB', parent: 'body', at: [-6.4, -17], z: 3, box: [-14, -6, 3, 19], draw: (c) => sleeve(c, -1) },
    { id: 'armF', parent: 'body', at: [6.4, -17], z: 6, box: [-3, -16, 18, 19], draw: (c) => {
      sleeve(c, 1);
      // an ofuda held up in the front hand
      c.save(); c.translate(7, 12); c.rotate(0.3);
      rr(c, -3.4, -15.5, 6.8, 15.5, 0.8, P.paper);
      line(c, [-1.6, -12.6, 1.6, -12.6], P.verm, 1.1); line(c, [0, -12.6, 0, -4.4], P.verm, 1.1); line(c, [-1.6, -8.4, 1.6, -8.4], P.verm, 0.9);
      c.restore();
      ell(c, 5.8, 14.2, 2.5, 2.3, P.skin);
    } },
    { id: 'head', parent: 'body', at: [0, -18], z: 7, box: [-20, -35, 20, 2], draw: (c) => {
      ell(c, -16, -14, 2.5, 3.2, P.skin); ell(c, 16, -14, 2.5, 3.2, P.skin);
      ell(c, 0, -17, 17, 15.5, P.skin);
      // printed cheeks, then the eyes as glossy sheets with printed irises and catchlights
      c.globalAlpha = 0.55; ell(c, -9.6, -9.6, 3.6, 2.3, P.coral, 0); ell(c, 9.6, -9.6, 3.6, 2.3, P.coral, 0); c.globalAlpha = 1;
      for (const s of [-1, 1]) {
        ell(c, s * 6.4, -13.6, 3.5, 4.6, '#35252a');
        ell(c, s * 6.4, -12, 2.5, 2.4, '#7a4a3a', 0);
        dot(c, s * 6.4 - 1.3, -15.6, 1.35, '#fff'); dot(c, s * 6.4 + 1.2, -11.6, 0.6, '#fbe0d0');
      }
      curve(c, -1.8, -7.4, 0, -6, 1.8, -7.4, '#7a3a30', 1.15);
    } },
    { id: 'hairB', parent: 'head', at: [0, -17], z: 0, box: [-22, -26, 22, 14], draw: (c) => {
      blob(c, [-19.5, -1, -18.5, -14, -11, -22, 0, -24, 11, -22, 18.5, -14, 19.5, -1, 15.5, 10, 0, 9, -15.5, 10], P.hair);
    } },
    { id: 'tailL', parent: 'hairB', at: [-15.5, 4], z: 0.4, box: [-7, -4, 7, 30], draw: (c) => {
      blob(c, [-3.8, -2, 3.8, -2, 5, 12, 2.8, 26, -2.4, 23, -5, 12], P.hair);
      rr(c, -4.8, 2, 9.6, 4.6, 1.4, P.paper); line(c, [-4.4, 4.3, 4.4, 4.3], P.verm, 1.2);
    } },
    { id: 'tailR', parent: 'hairB', at: [15.5, 4], z: 0.5, box: [-7, -4, 7, 30], draw: (c) => {
      blob(c, [-3.8, -2, 3.8, -2, 5, 12, 2.4, 23, -2.8, 26, -5, 12], P.hair);
      rr(c, -4.8, 2, 9.6, 4.6, 1.4, P.paper); line(c, [-4.4, 4.3, 4.4, 4.3], P.verm, 1.2);
    } },
    { id: 'hairF', parent: 'head', at: [0, -17], z: 8, box: [-21, -20, 21, 14], draw: (c) => {
      // side locks, the scalloped fringe, then a lighter sheet for the shine
      rr(c, -19, -6, 5.4, 18, 2.6, P.hair); rr(c, 13.6, -6, 5.4, 18, 2.6, P.hair);
      const pts: number[] = [];
      for (let i = 0; i <= 16; i++) { const a = Math.PI * (1.04 + (i / 16) * 0.92); pts.push(Math.cos(a) * 18.2, -1.5 + Math.sin(a) * 17.2); }
      pts.push(14.5, -3.6, 11, -9.6, 7.4, -4.2, 3.6, -9.8, 0, -4.6, -3.6, -9.8, -7.4, -4.2, -11, -9.6, -14.5, -3.6);
      poly(c, pts, P.hair);
      blob(c, [-11, -13.6, -4, -16.8, 4, -16.8, 11, -13.6, 4, -14.6, -4, -14.6], P.hairHi);
    } },
    { id: 'bow', parent: 'head', at: [3, -32], z: 9, box: [-16, -10, 16, 10], draw: (c) => {
      poly(c, [-2, 1.5, -6, 8, -3, 8.6], P.vermDk); poly(c, [2, 1.5, 6, 8.4, 3, 9], P.vermDk);
      ell(c, -7, -1, 7.4, 4.6, P.verm, 2, -0.32); ell(c, 7, -1, 7.4, 4.6, P.verm, 2, 0.32);
      ell(c, -6.2, -1, 4.2, 2.3, P.coral, 2, -0.32); ell(c, 6.2, -1, 4.2, 2.3, P.coral, 2, 0.32);
      ell(c, 0, 0, 2.6, 2.8, P.vermDk); dot(c, 0, 0.4, 1.1, P.mustard);
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
        tailL: { r: lag * 0.34 + 0.1 }, tailR: { r: lag * 0.34 - 0.1 },
        bow: { r: lag * 0.14 },
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

// ---------------------------------------------------------------- 提燈妖, lantern imp

export const CHOCHIN: DollDef = {
  parts: [
    { id: 'body', at: [0, -5], z: 2, box: [-17, -30, 17, 4], draw: (c) => {
      // a paper lantern is stacked hoops: each band is its own sheet, bottom to top
      const n = 7;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, y = -2 - u * 24, w = 6.5 + Math.sin(u * Math.PI) * 8;
        rr(c, -w, y - 2.7, w * 2, 5.8, 2.9, i % 2 ? P.verm : P.vermDk);
      }
    } },
    { id: 'capB', parent: 'body', at: [0, 0], z: 1, box: [-9, -3, 9, 6], draw: (c) => { rr(c, -6.5, -1.5, 13, 5, 1.6, P.brownDk); line(c, [-6, 0.9, 6, 0.9], P.mustard, 1.2); } },
    { id: 'capT', parent: 'body', at: [0, -27], z: 3, box: [-10, -13, 10, 4], draw: (c) => {
      curve(c, -4.5, -3, 0, -12, 4.5, -3, P.brownDk, 1.6);
      rr(c, -7.5, -4, 15, 5.4, 1.6, P.brownDk); line(c, [-7, -0.2, 7, -0.2], P.mustard, 1.2);
    } },
    { id: 'eye', parent: 'body', at: [0, -16], z: 4, box: [-8, -9, 8, 8], draw: (c) => {
      ell(c, 0, 0, 6.2, 5.8, P.paper); ell(c, 0, 0.6, 3.7, 3.7, P.mustard); ell(c, 0, 0.6, 1.9, 1.9, P.hair, 0);
      dot(c, -1.4, -1, 0.9, '#fff');
      poly(c, [-6.6, -1.2, -3, -6.4, 3, -6.4, 6.6, -1.2, 0, -3.8], P.vermDk);
    } },
    { id: 'tongue', parent: 'body', at: [1, -8.5], z: 5, box: [-5, -3, 5, 13], draw: (c) => {
      rr(c, -3.6, -2, 7.2, 3, 1.4, P.brownDk);
      rr(c, -2.8, -1, 5.6, 11, 2.8, P.coral); line(c, [0, 1.5, 0, 7], '#c45a5a', 1);
    } },
  ],
  pose: (t): Pose => {
    const h = Math.abs(Math.sin(t * 5)), s = Math.sin(t * 5);
    return {
      body: { y: -h * 6, r: s * 0.09, sy: 1 - (1 - h) * 0.12, sx: 1 + (1 - h) * 0.05 },
      tongue: { r: Math.sin(t * 5 - 0.9) * 0.45 },
      capT: { r: -s * 0.06 }, eye: { y: (1 - h) * 0.6 },
    };
  },
};

// ---------------------------------------------------------------- scenery: a paper tree and a paper house

function clumps(c: C, list: number[][], col: string): void {
  for (const [x, y, rx, ry] of list) ell(c, x, y, rx, ry, col);
}

export const TREE: DollDef = {
  parts: [
    { id: 'trunk', at: [0, 0], z: 1, box: [-12, -40, 12, 2], draw: (c) => {
      blob(c, [-4.5, 0, 4.5, 0, 3.2, -20, 9, -32, 3, -29, 0.5, -38, -2.4, -29, -9, -33, -3.4, -20], P.brown);
      curve(c, -1, -4, 0.5, -14, -0.6, -24, P.brownDk, 1);
    } },
    { id: 'back', parent: 'trunk', at: [0, -34], z: 2, box: [-30, -34, 30, 14], draw: (c) => clumps(c, [[-15, -6, 13, 11], [15, -8, 13, 11], [0, -19, 15, 12]], P.sageDk) },
    { id: 'mid', parent: 'trunk', at: [0, -34], z: 3, box: [-24, -24, 24, 14], draw: (c) => clumps(c, [[-10, 1, 11, 9], [11, -1, 11, 9], [0, -11, 12, 10]], P.sage) },
    { id: 'front', parent: 'trunk', at: [0, -34], z: 4, box: [-18, -20, 18, 16], draw: (c) => {
      clumps(c, [[-5, 6, 9.5, 7.5], [8, 5, 8.5, 7]], P.sageLt);
      for (const [x, y] of [[-14, -2], [3, 10], [13, 0], [-6, -14], [9, -16]]) { ell(c, x, y, 2.4, 2.4, P.coral); dot(c, x, y, 0.8, P.mustard); }
    } },
  ],
  pose: (t): Pose => {
    const s = Math.sin(t * 1.3);
    return { back: { r: s * 0.025 }, mid: { r: s * 0.035 }, front: { r: s * 0.05 } };
  },
};

function shoji(c: C, x: number, y: number, w: number, h: number): void {
  rr(c, x, y, w, h, 0.8, P.paper);
  for (let i = 1; i < 3; i++) line(c, [x + (w * i) / 3, y + 0.8, x + (w * i) / 3, y + h - 0.8], P.brown, 0.8);
  line(c, [x + 0.8, y + h / 2, x + w - 0.8, y + h / 2], P.brown, 0.8);
}

export const HOUSE: DollDef = {
  parts: [
    { id: 'base', at: [0, 0], z: 1, box: [-38, -8, 38, 2], draw: (c) => {
      rr(c, -35, -6, 70, 6, 1.6, P.stone);
      for (const x of [-26, -12, 2, 16, 28]) line(c, [x, -6, x + 1, 0], '#9a8f7a', 0.8);
    } },
    { id: 'wall', parent: 'base', at: [0, -6], z: 2, box: [-34, -40, 34, 2], draw: (c) => {
      rr(c, -30, -34, 60, 34, 1, P.cream);
      shoji(c, -26, -30, 15, 11); shoji(c, 11, -30, 15, 11);
      rr(c, -9.5, -21, 19, 21, 0.8, '#4e382c');
      for (const x of [-31, -10.5, 8.5, 28]) rr(c, x, -35, 3, 35, 0.8, P.brown);
      rr(c, -32, -17, 64, 3, 0.8, P.brownDk);
    } },
    { id: 'roof', parent: 'base', at: [0, -40], z: 4, box: [-44, -34, 44, 8], draw: (c) => {
      // tiled roof built from the top row down, each row a curved strip with upturned eaves
      rr(c, -19, -29, 38, 4.6, 2, P.indigoDk);
      ell(c, -19.5, -26.8, 3, 3, P.indigoDk); ell(c, 19.5, -26.8, 3, 3, P.indigoDk);
      for (let k = 3; k >= 0; k--) {
        const w = 82 - k * 12, y = -k * 6.4, h = w / 2;
        blob(c, [-h, y - 3.5, -h + 7, y + 2.2, h - 7, y + 2.2, h, y - 3.5, h - 9, y - 6.6, -h + 9, y - 6.6], k % 2 ? P.indigoLt : P.indigo);
        for (let x = -h + 9; x < h - 8; x += 5) line(c, [x, y - 5.2, x, y + 0.6], P.indigoDk, 0.7);
      }
      ell(c, 0, -22.5, 3.4, 3.4, P.cream); ell(c, 0, -22.5, 1.6, 1.6, P.verm);
    } },
    { id: 'sign', parent: 'base', at: [0, -44], z: 5, box: [-12, -2, 12, 9], draw: (c) => {
      rr(c, -10, 0, 20, 6.4, 1, P.brown);
      rr(c, -7.6, 1.4, 15.2, 3.6, 0.6, P.cream, 0);
      for (const x of [-4.6, -0.8, 3]) line(c, [x, 2.2, x + 1.2, 4.2], P.brownDk, 0.9);
    } },
    { id: 'noren', parent: 'base', at: [0, -27], z: 5.5, box: [-11, -1, 11, 13], draw: (c) => {
      rr(c, -10.5, -0.5, 21, 1.6, 0.6, P.brownDk);
      for (const x of [-10, -3.3, 3.4]) rr(c, x, 0.8, 6.6, 11, 0.8, P.indigo);
      ell(c, 0, 5.6, 2.8, 2.8, P.cream, 0); dot(c, 0, 5.6, 1, P.indigo);
    } },
    { id: 'lantern', parent: 'base', at: [25, -44], z: 6, box: [-6, -1, 6, 16], draw: (c) => {
      line(c, [0, 0, 0, 3], P.brownDk, 0.8);
      rr(c, -3, 2.4, 6, 1.8, 0.6, P.brownDk);
      ell(c, 0, 8.6, 4.6, 5.2, P.verm);
      for (const y of [6.2, 8.6, 11]) line(c, [-3.8, y, 3.8, y], P.vermDk, 0.7);
      rr(c, -3, 13.2, 6, 1.8, 0.6, P.brownDk);
    } },
  ],
  pose: (t): Pose => ({ noren: { r: Math.sin(t * 1.6) * 0.03 }, lantern: { r: Math.sin(t * 1.9) * 0.12 } }),
};

// backdrop: layered hills, a cloud and a sun, drawn large and low-res
export const HILLS: DollDef = {
  parts: [
    { id: 'sun', at: [-120, -150], z: 0, box: [-24, -24, 24, 24], draw: (c) => { ell(c, 0, 0, 20, 20, P.coralLt); ell(c, 0, 0, 14, 14, P.coral); } },
    { id: 'cloud', at: [90, -170], z: 0.5, box: [-44, -18, 44, 14], draw: (c) => clumps(c, [[-22, 2, 18, 9], [0, -4, 20, 12], [22, 2, 17, 9]], P.paper) },
    { id: 'far', at: [0, -40], z: 1, box: [-330, -110, 330, 44], draw: (c) => {
      const pts: number[] = [-320, 40];
      for (let i = 0; i <= 24; i++) { const x = -320 + i * (640 / 24); pts.push(x, -40 - Math.sin(i * 0.55 + 0.4) * 28 - Math.sin(i * 1.3) * 10); }
      pts.push(320, 40);
      poly(c, pts, '#c9cfae');
    } },
    { id: 'near', at: [0, -10], z: 2, box: [-330, -80, 330, 14], draw: (c) => {
      const pts: number[] = [-320, 10];
      for (let i = 0; i <= 20; i++) { const x = -320 + i * 32; pts.push(x, -24 - Math.sin(i * 0.7 + 2) * 18); }
      pts.push(320, 10);
      poly(c, pts, '#d9c48a');
    } },
  ],
  pose: (t): Pose => ({ cloud: { x: Math.sin(t * 0.2) * 12 } }),
};
