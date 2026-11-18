// The fox spirit and the village pieces from the user's character and environment briefs.
import type { DollDef, Pose } from './doll';
import { MAPLE, P, hanging, tier } from './dolls';
import { type C, blob, blossom, chibiEye, curve, dot, ell, line, pat, poly, rr, tone } from './kit';

// ---------------------------------------------------------------- 狐狸精

const FOX = { fur: '#f2a35c', furDk: '#d9803e', furLt: '#fbe6cc', hair: '#f6ead6', hairDk: '#e3d2b6', kimono: '#3f4e78', kimonoLt: '#5a6a96', lining: '#ee9a8a' };

function foxSleeve(c: C, s: number): void {
  blob(c, [0, -1.5, s * 5.5, -2.5, s * 11.5, 4, s * 12, 14, s * 6.5, 16.5, s * 1.5, 12.5, s * 0.2, 4], FOX.lining);
  blob(c, [0, -2.5, s * 5, -3.2, s * 10.6, 3, s * 11, 12.4, s * 6, 14.6, s * 1.4, 11.2, 0, 3.5], FOX.kimono);
  pat(c, 'seigaiha', FOX.kimonoLt, 2.2, 0.8);
  ell(c, s * 5.8, 15, 2.6, 2.4, P.skin);
}

function zori(c: C): void {
  ell(c, 0, 1.8, 3.2, 2.4, P.paper);
  rr(c, -3.5, 3.4, 7, 1.9, 0.9, P.woodDk);
  line(c, [-1.2, 0.3, 0.4, 2.6], P.verm, 1);
}

export const FOX_SPIRIT: DollDef = {
  parts: [
    { id: 'tail', at: [6, -7], z: 0.5, box: [-6, -26, 30, 8], draw: (c) => {
      // a fluffy tail sweeping out from behind the hips and curling up at the side
      blob(c, [-2, 3, 8, 2, 18, -2, 25, -10, 24, -20, 18, -23, 14, -16, 10, -8, 2, -5], FOX.fur);
      blob(c, [8, -3, 16, -6, 21, -12, 19, -17, 14, -12, 9, -7], FOX.furDk);
      blob(c, [17, -17, 22, -18, 24, -21, 20, -24, 16, -21], FOX.furLt);
    } },
    { id: 'legL', at: [-3.6, -5.5], z: 1, box: [-5, -2, 5, 7], draw: zori },
    { id: 'legR', at: [3.6, -5.5], z: 1.2, box: [-5, -2, 5, 7], draw: zori },
    { id: 'body', at: [0, -5], z: 4, box: [-13, -19, 13, 7], draw: (c) => {
      blob(c, [-7.5, -18, 7.5, -18, 11, 3.5, 0, 5.2, -11, 3.5], FOX.kimono);
      pat(c, 'seigaiha', FOX.kimonoLt, 2.2, 0.8);
      poly(c, [-3, -18, 3, -18, 0, -11], FOX.lining);
      poly(c, [7, -18, -0.4, -18, -3, -8, 8.6, -7], FOX.kimono);
      poly(c, [-7, -18, 0.8, -18, 3, -7.6, -8.6, -7], FOX.kimonoLt);
      rr(c, -9, -10.6, 18, 4.2, 1.4, P.verm); pat(c, 'stripes', P.vermDk, 1, 0.5);
      rr(c, -2.4, -11.2, 4.8, 5.4, 1, P.gold);
    } },
    { id: 'armB', parent: 'body', at: [-6.6, -17], z: 3, box: [-15, -6, 3, 20], draw: (c) => foxSleeve(c, -1) },
    { id: 'armF', parent: 'body', at: [6.6, -17], z: 6, box: [-3, -6, 15, 20], draw: (c) => foxSleeve(c, 1) },
    { id: 'head', parent: 'body', at: [0, -18], z: 7, box: [-20, -34, 20, 2], draw: (c) => {
      ell(c, 0, -17, 17, 15.5, P.skin);
      c.globalAlpha = 0.5; ell(c, -10, -8.4, 3.4, 2, P.coral, 0); ell(c, 10, -8.4, 3.4, 2, P.coral, 0); c.globalAlpha = 1;
      // fox markings at the outer corners of the eyes
      poly(c, [-13.8, -10, -10.6, -12.6, -12.2, -7.8], P.verm, 0); poly(c, [13.8, -10, 10.6, -12.6, 12.2, -7.8], P.verm, 0);
      chibiEye(c, -6.6, -11.4, -1, '#d08a2e', '#6a3814'); chibiEye(c, 6.6, -11.4, 1, '#d08a2e', '#6a3814');
      c.beginPath(); c.moveTo(-2.2, -6.2); c.quadraticCurveTo(-1.1, -4.6, 0, -6); c.quadraticCurveTo(1.1, -4.6, 2.2, -6.2); c.lineWidth = 1; c.strokeStyle = '#7a3a30'; c.stroke();
    } },
    { id: 'hairB', parent: 'head', at: [0, -17], z: 0, box: [-22, -24, 22, 16], draw: (c) => {
      blob(c, [-19, -2, -18, -14, -10, -21, 0, -23, 10, -21, 18, -14, 19, -2, 17, 12, 9, 8, 0, 11, -9, 8, -17, 12], FOX.hair);
    } },
    { id: 'earL', parent: 'head', at: [-10, -30], z: 0.5, box: [-9, -16, 9, 4], draw: (c) => {
      poly(c, [-7, 2, -3, -14, 6, 1], FOX.fur); poly(c, [-4.5, 0.5, -2.6, -9.5, 3, 0], FOX.lining);
    } },
    { id: 'earR', parent: 'head', at: [10, -30], z: 0.5, box: [-9, -16, 9, 4], draw: (c) => {
      poly(c, [7, 2, 3, -14, -6, 1], FOX.fur); poly(c, [4.5, 0.5, 2.6, -9.5, -3, 0], FOX.lining);
    } },
    { id: 'hairF', parent: 'head', at: [0, -17], z: 8, box: [-21, -20, 21, 14], draw: (c) => {
      poly(c, [-18.6, -6, -13.4, -6, -13.6, 9, -16.4, 12, -19, 8], FOX.hair); poly(c, [18.6, -6, 13.4, -6, 13.6, 9, 16.4, 12, 19, 8], FOX.hair);
      const pts: number[] = [];
      for (let i = 0; i <= 16; i++) { const a = Math.PI * (1.04 + (i / 16) * 0.92); pts.push(Math.cos(a) * 18.4, -1.5 + Math.sin(a) * 17.4); }
      pts.push(15, -3, 10.5, -9.6, 6, -4, 1.5, -11, -3, -4.6, -7.6, -10.4, -11.6, -3.8, -15, -8);
      poly(c, pts, FOX.hair);
      blob(c, [-11, -12.6, -4, -16, 4, -16.2, 11, -12.6, 4, -14.2, -4, -14], FOX.hairDk);
    } },
    { id: 'mask', parent: 'head', at: [-13, -26], z: 9, box: [-9, -11, 9, 9], draw: (c) => {
      blob(c, [-6, -2, -4, -6.5, 0, -5, 4, -6.5, 6, -2, 4.4, 4, 0, 6, -4.4, 4], P.paper);
      line(c, [-3.6, -1.6, -1.4, -0.6], P.verm, 1); line(c, [3.6, -1.6, 1.4, -0.6], P.verm, 1); dot(c, 0, 2.8, 0.9, P.verm);
      poly(c, [-4, -6, -3, -9, -1.4, -5.6], P.verm); poly(c, [4, -6, 3, -9, 1.4, -5.6], P.verm);
    } },
    { id: 'bell', parent: 'body', at: [0, -15.5], z: 8, box: [-4, -2, 4, 6], draw: (c) => { line(c, [-3, 0, 3, 0], P.verm, 1.2); ell(c, 0, 2.4, 2.4, 2.4, P.gold); line(c, [-1.4, 2.6, 1.4, 2.6], P.woodDk, 0.6); } },
  ],
  pose: (t, moving): Pose => {
    const n = Math.sin(t * 1.3), w = Math.sin(t * 2.2);
    if (moving) {
      const s = Math.sin(t * 10), lag = Math.sin(t * 10 - 1.1);
      return {
        body: { y: -Math.abs(Math.cos(t * 10)) * 1.6, r: s * 0.05 },
        legL: { r: s * 0.5 }, legR: { r: -s * 0.5 }, armB: { r: -s * 0.5 + 0.12 }, armF: { r: s * 0.45 - 0.12 },
        head: { r: -s * 0.07 }, tail: { r: lag * 0.25 }, earL: { r: lag * 0.12 }, earR: { r: -lag * 0.12 }, bell: { r: lag * 0.3 },
      };
    }
    return { body: { y: Math.sin(t * 2.4) * 0.6 }, head: { r: n * 0.06 }, tail: { r: w * 0.14 }, earL: { r: Math.max(0, Math.sin(t * 3.1)) * -0.2 }, earR: { r: n * 0.05 }, bell: { r: n * 0.2 } };
  },
};

// ---------------------------------------------------------------- village

function mapleLeaf(c: C, x: number, y: number, r: number, rot: number, col: string): void {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) { const a = rot + (i / 10) * Math.PI * 2 - Math.PI / 2, k = i % 2 ? r * 0.45 : r; pts.push(x + Math.cos(a) * k, y + Math.sin(a) * k); }
  poly(c, pts, col);
}

export const MAPLE_TREE: DollDef = {
  parts: [
    ...MAPLE.parts.filter((p) => p.id !== 't3'),
    { id: 't3', parent: 'trunk', at: [0, -22], z: 5, box: [-34, -20, 34, 12], draw: (c) => {
      tier(c, -3, 0, 17, 9, '#f4a64e');
      const leaves: [number, number, number, number, string][] = [[-16, -6, 3.6, 0.2, P.mapleDk], [-5, -9, 3.2, -0.4, P.maple], [7, -6, 3.6, 0.5, P.mapleDk], [16, -1, 3, 0.1, P.maple], [-22, 0, 3, -0.2, '#f08a46']];
      for (const [x, y, r, a, col] of leaves) mapleLeaf(c, x, y, r, a, col);
    } },
  ],
  pose: MAPLE.pose,
};

export const BUSH: DollDef = {
  parts: [
    { id: 'back', at: [0, 0], z: 1, box: [-20, -22, 20, 2], draw: (c) => { ell(c, -8, -7, 9, 7.5, P.sageDk); ell(c, 8, -7.5, 9, 7.5, P.sageDk); ell(c, 0, -12, 10, 8, P.sageDk); } },
    { id: 'front', at: [0, 0], z: 2, box: [-18, -18, 18, 2], draw: (c) => {
      ell(c, -6, -5, 8, 5.5, P.sage); ell(c, 7, -5, 7.5, 5.2, P.sage);
      for (const [x, y] of [[-10, -12], [-2, -15], [8, -12], [13, -6], [-14, -5], [2, -7]]) blossom(c, x, y, 2.6, P.coral, P.gold);
    } },
  ],
  pose: (t): Pose => ({ front: { r: Math.sin(t * 1.5) * 0.02 } }),
};

export const FENCE: DollDef = {
  parts: [
    { id: 'posts', at: [0, 0], z: 1, box: [-34, -18, 34, 2], draw: (c) => {
      for (let x = -30; x <= 30; x += 10) rr(c, x - 1.6, -16, 3.2, 16, 1, x % 20 ? '#c8a46a' : '#b8925a');
    } },
    { id: 'rails', at: [0, 0], z: 2, box: [-34, -16, 34, 2], draw: (c) => {
      rr(c, -32, -12, 64, 2.4, 1, '#a07a46'); rr(c, -32, -6, 64, 2.4, 1, '#a07a46');
    } },
  ],
  pose: (): Pose => ({}),
};

export const SHRINE: DollDef = {
  parts: [
    { id: 'step', at: [0, 0], z: 1, box: [-24, -9, 24, 2], draw: (c) => { rr(c, -20, -4, 40, 4, 1, P.stone); rr(c, -14, -7, 28, 3.4, 1, P.stoneDk); } },
    { id: 'hokora', parent: 'step', at: [0, -7], z: 2, box: [-14, -20, 14, 2], draw: (c) => {
      rr(c, -9, -16, 18, 16, 1, P.wood); rr(c, -5, -13, 10, 10, 0.6, '#5a3a2a');
      line(c, [0, -13, 0, -3], P.wood, 0.8);
    } },
    { id: 'roof', parent: 'step', at: [0, -23], z: 3, box: [-18, -14, 18, 4], draw: (c) => {
      blob(c, [-16, 1, -12, -4, 0, -8.6, 12, -4, 16, 1, 8, -1, 0, -2, -8, -1], P.verm);
      blob(c, [-12, -3, 0, -8, 12, -3, 0, -5], tone(P.verm, 0.18));
      rr(c, -2.4, -11, 4.8, 3, 1, P.gold);
    } },
    { id: 'rope', parent: 'hokora', at: [0, -16.5], z: 4, box: [-11, -2, 11, 9], draw: (c) => {
      curve(c, -9.6, 0, 0, 3, 9.6, 0, '#e8d9a8', 1.6);
      for (const x of [-5, 0, 5]) poly(c, [x - 1.2, 1.6, x + 1.2, 1.6, x + 1.6, 4, x, 7, x - 1.6, 4], P.paper);
    } },
    { id: 'torii', at: [-34, 0], z: 4, box: [-17, -36, 17, 2], draw: (c) => {
      rr(c, -10, -28, 3.4, 28, 1, P.verm); rr(c, 6.6, -28, 3.4, 28, 1, P.verm);
      rr(c, -12, -24, 24, 3, 1, P.verm);
      blob(c, [-15, -28, -11, -32, 11, -32, 15, -28, 11, -29.4, -11, -29.4], P.hair);
      rr(c, -13, -31, 26, 3, 1, P.verm);
      rr(c, -2.6, -27, 5.2, 4, 0.6, P.gold);
    } },
  ],
  pose: (t): Pose => ({ rope: { r: Math.sin(t * 1.7) * 0.03 } }),
};

export const HOUSE_CRAFT: DollDef = {
  parts: [
    { id: 'base', at: [0, 0], z: 1, box: [-40, -8, 40, 2], draw: (c) => { rr(c, -36, -6, 72, 6, 1.2, P.stone); } },
    { id: 'wall', parent: 'base', at: [0, -6], z: 2, box: [-34, -40, 34, 2], draw: (c) => {
      rr(c, -30, -36, 60, 36, 1, P.cream);
      rr(c, -30, -14, 60, 14, 1, P.wood);
      for (let x = -28; x < 28; x += 4) line(c, [x, -13, x, -1], P.woodDk, 0.7);
      rr(c, -25, -32, 16, 12, 0.6, P.paper); line(c, [-17, -32, -17, -20], P.woodDk, 0.7); line(c, [-25, -26, -9, -26], P.woodDk, 0.7);
      rr(c, 9, -32, 16, 12, 0.6, P.paper); line(c, [17, -32, 17, -20], P.woodDk, 0.7); line(c, [9, -26, 25, -26], P.woodDk, 0.7);
      rr(c, -7, -24, 14, 24, 0.6, '#5a3a2a');
      for (const x of [-31, 28]) rr(c, x, -37, 3, 37, 0.6, P.woodDk);
    } },
    { id: 'roofB', parent: 'base', at: [0, -42], z: 3, box: [-50, -18, 50, 8], draw: (c) => {
      blob(c, [-46, 4, -42, -2, -26, -10, 0, -14, 26, -10, 42, -2, 46, 4, 30, 0, 0, -4, -30, 0], P.indigoDk);
    } },
    { id: 'roofF', parent: 'base', at: [0, -40], z: 4, box: [-50, -20, 50, 8], draw: (c) => {
      blob(c, [-44, 3, -40, -3, -24, -10, 0, -13, 24, -10, 40, -3, 44, 3, 28, -0.4, 0, -4, -28, -0.4], P.indigo);
      for (let x = -32; x <= 32; x += 6) line(c, [x, -9.5 + Math.abs(x) * 0.12, x * 1.04, -1.4], P.indigoDk, 0.7);
      rr(c, -22, -17, 44, 4, 2, P.indigoDk);
    } },
    { id: 'lantern', parent: 'base', at: [-22, -44], z: 5, box: [-6, -1, 6, 18], draw: (c) => hanging(c) },
    { id: 'noren', parent: 'base', at: [0, -30], z: 5, box: [-9, -1, 9, 12], draw: (c) => {
      for (const x of [-8, -2.6, 2.8]) rr(c, x, 0, 5.2, 10, 0.6, P.verm);
      ell(c, 0, 5, 2.4, 2.4, P.paper, 0);
    } },
  ],
  pose: (t): Pose => ({ lantern: { r: Math.sin(t * 1.9) * 0.12 }, noren: { r: Math.sin(t * 1.6) * 0.03 } }),
};
