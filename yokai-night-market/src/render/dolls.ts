// Doll definitions. Units are logical pixels; a doll's root pin is between its feet.
// Inside a part, shapes with a line weight are separate cut sheets, back to front.
import type { DollDef, Pose } from './doll';
import { type C, blob, curve, dot, ell, line, poly, rr, sheet } from './kit';

const SKIN = '#f8e3d0', HAIR = '#4a3530', HAIR_HI = '#6a4a40', WHITE = '#fbf6ea', RED = '#d8503a', RED_DK = '#b83c2c', GOLD = '#e0a93a';

function sleeve(c: C, s: number): void {
  // furisode sleeve hanging from the shoulder pin, with an inner red lining sheet and the hand
  poly(c, [0, -2, s * 3, -3, s * 12, 3, s * 13, 16, s * 3, 17, s * 1, 6], RED_DK);
  poly(c, [0, -3, s * 3, -4, s * 11, 1, s * 12, 14, s * 3, 15, 0, 5], WHITE);
  line(c, [s * 3.5, 12.5, s * 11.5, 11.5], RED, 1);
  ell(c, s * 7, 16.5, 2.6, 2.4, SKIN);
}

export const MIKO: DollDef = {
  parts: [
    { id: 'body', at: [0, -15], z: 4, box: [-15, -19, 15, 12], draw: (c) => {
      // hakama: a back sheet and three pleat sheets folded over it
      poly(c, [-9, -6, 9, -6, 14, 10, -14, 10], RED_DK);
      poly(c, [-9, -6, -3, -6, -5.5, 10, -14, 10], RED);
      poly(c, [3, -6, 9, -6, 14, 10, 5.5, 10], RED);
      poly(c, [-3.4, -6, 3.4, -6, 5, 10, -5, 10], '#e4664e');
      // kosode: torso, the under-collar, then the two lapels crossing left over right
      poly(c, [-8, -17, 8, -17, 9.5, -5, -9.5, -5], WHITE);
      poly(c, [-3.4, -17, 3.4, -17, 0, -10.5], RED);
      poly(c, [8, -17, -1, -17, -4.5, -8, 9.5, -5.5], '#fffdf6');
      poly(c, [-8, -17, 1.4, -17, 4.5, -7, -9.5, -5.5], '#fffdf6');
      // waist tie and its bow
      rr(c, -10, -8, 20, 4, 1.5, RED_DK);
      ell(c, -3.4, -6, 3.4, 2.4, RED, 2, 0.5); ell(c, 3.4, -6, 3.4, 2.4, RED, 2, -0.5);
      rr(c, -1.5, -7.6, 3, 3.4, 1, '#e4664e');
    } },
    { id: 'legL', at: [-4.5, -9], z: 1, box: [-5, -1, 5, 11], draw: (c) => {
      rr(c, -2.6, 0, 5.2, 6.5, 2, SKIN); rr(c, -3.6, 5.5, 7.8, 3.6, 1.6, WHITE); line(c, [-1.5, 5.8, 1, 8.8], RED, 1.1);
    } },
    { id: 'legR', at: [4.5, -9], z: 2, box: [-5, -1, 5, 11], draw: (c) => {
      rr(c, -2.6, 0, 5.2, 6.5, 2, SKIN); rr(c, -3.6, 5.5, 7.8, 3.6, 1.6, WHITE); line(c, [-1.5, 5.8, 1, 8.8], RED, 1.1);
    } },
    { id: 'armB', parent: 'body', at: [-8, -15], z: 3, box: [-15, -6, 3, 20], draw: (c) => sleeve(c, -1) },
    { id: 'armF', parent: 'body', at: [8, -15], z: 6, box: [-3, -14, 20, 20], draw: (c) => {
      sleeve(c, 1);
      // an ofuda held up in the front hand
      c.save(); c.translate(8.5, 9); c.rotate(0.35);
      rr(c, -3.6, -17, 7.2, 17, 1, '#fffdf6');
      line(c, [-1.8, -13.5, 1.8, -13.5], RED, 1.2); line(c, [0, -13.5, 0, -5], RED, 1.2); line(c, [-1.8, -9, 1.8, -9], RED, 1);
      c.restore();
      ell(c, 7.4, 16, 2.4, 2.2, SKIN);
    } },
    { id: 'hairB', parent: 'head', at: [0, -13], z: 0, box: [-19, -18, 19, 16], draw: (c) => {
      blob(c, [-16, 6, -17.5, -6, -11, -16, 0, -18, 11, -16, 17.5, -6, 16, 6, 9, 13, 0, 11, -9, 13], HAIR);
    } },
    { id: 'tailL', parent: 'hairB', at: [-11, 7], z: 0.5, box: [-7, -3, 7, 28], draw: (c) => {
      blob(c, [-3.5, -1, 3.5, -1, 4.6, 14, 2.4, 25, -2.6, 22, -4.8, 12], HAIR);
      rr(c, -4.6, 3, 9.2, 5, 1.2, WHITE); rr(c, -4.6, 4.6, 9.2, 1.8, 0.6, RED, 0);
    } },
    { id: 'tailR', parent: 'hairB', at: [11, 7], z: 0.6, box: [-7, -3, 7, 28], draw: (c) => {
      blob(c, [-3.5, -1, 3.5, -1, 4.8, 12, 2.6, 22, -2.4, 25, -4.6, 14], HAIR);
      rr(c, -4.6, 3, 9.2, 5, 1.2, WHITE); rr(c, -4.6, 4.6, 9.2, 1.8, 0.6, RED, 0);
    } },
    { id: 'head', parent: 'body', at: [0, -17], z: 7, box: [-17, -29, 17, 3], draw: (c) => {
      ell(c, -13.6, -11, 2.6, 3.2, SKIN); ell(c, 13.6, -11, 2.6, 3.2, SKIN);
      ell(c, 0, -13, 14, 13, SKIN);
      c.globalAlpha = 0.6; ell(c, -8.2, -8, 3.2, 2, '#f29a8e', 0); ell(c, 8.2, -8, 3.2, 2, '#f29a8e', 0); c.globalAlpha = 1;
      // eyes are their own glossy sheets
      ell(c, -5.6, -11.5, 2.9, 3.8, '#3a2a28'); ell(c, 5.6, -11.5, 2.9, 3.8, '#3a2a28');
      dot(c, -6.5, -13, 1.1, '#fff'); dot(c, 4.7, -13, 1.1, '#fff'); dot(c, -4.8, -9.8, 0.6, '#f6c8b8'); dot(c, 6.4, -9.8, 0.6, '#f6c8b8');
      curve(c, -2, -5.4, 0, -4, 2, -5.4, HAIR, 1.1);
    } },
    { id: 'hairF', parent: 'head', at: [0, -13], z: 8, box: [-18, -18, 18, 12], draw: (c) => {
      // side locks first, then the fringe sheet, then a lighter sheet for the shine
      poly(c, [-15.5, -5, -11, -6, -11.5, 8, -14.2, 6], HAIR); poly(c, [15.5, -5, 11, -6, 11.5, 8, 14.2, 6], HAIR);
      c.beginPath(); c.moveTo(-15, -2); c.bezierCurveTo(-18, -21, 18, -21, 15, -2);
      for (const [x, y] of [[11.5, -6.5], [8, -2.5], [4, -7], [0, -2.5], [-4, -7], [-8, -2.5], [-11.5, -6.5]]) c.lineTo(x, y);
      c.closePath(); sheetFill(c, HAIR);
      c.beginPath(); c.moveTo(-10, -11.5); c.quadraticCurveTo(0, -17.5, 10, -11.5); c.quadraticCurveTo(0, -14.4, -10, -11.5); c.closePath(); sheetFill(c, HAIR_HI);
    } },
    { id: 'bow', parent: 'head', at: [0, -28.5], z: 9, box: [-13, -9, 13, 7], draw: (c) => {
      poly(c, [0, 0, -11, -7, -12, 4], RED_DK); poly(c, [0, 0, 11, -7, 12, 4], RED_DK);
      poly(c, [0, 0, -9, -4.6, -9.8, 2.4], RED); poly(c, [0, 0, 9, -4.6, 9.8, 2.4], RED);
      rr(c, -2.4, -2.6, 4.8, 5.2, 1.4, '#e4664e'); dot(c, 0, 0, 0.9, GOLD);
    } },
  ],
  pose: (t, moving): Pose => {
    if (moving) {
      const s = Math.sin(t * 10), lag = Math.sin(t * 10 - 1.1);
      return {
        body: { y: -Math.abs(Math.cos(t * 10)) * 1.4, r: s * 0.045 },
        legL: { r: s * 0.6 }, legR: { r: -s * 0.6 },
        armB: { r: -s * 0.55 + 0.12 }, armF: { r: s * 0.45 - 0.18 },
        head: { r: -s * 0.06 }, hairB: { r: lag * 0.03 },
        tailL: { r: lag * 0.32 + 0.08 }, tailR: { r: lag * 0.32 - 0.08 },
        bow: { r: lag * 0.12 },
      };
    }
    const b = Math.sin(t * 2.4), n = Math.sin(t * 1.3);
    return {
      body: { y: b * 0.6 }, head: { r: n * 0.05 },
      armB: { r: 0.1 + b * 0.04 }, armF: { r: -0.14 - b * 0.05 },
      tailL: { r: 0.06 + n * 0.07 }, tailR: { r: -0.06 + n * 0.07 }, bow: { r: n * 0.05 },
    };
  },
};

function sheetFill(c: C, col: string): void {
  // fills the path already on the context as a new sheet (for shapes the helpers cannot express)
  sheet(c);
  c.fillStyle = col; c.fill();
}

const LAN = '#e8553d', LAN_DK = '#cf4330', CAP = '#4a3028';

export const CHOCHIN: DollDef = {
  parts: [
    { id: 'body', at: [0, -5], z: 2, box: [-16, -30, 16, 4], draw: (c) => {
      // a paper lantern is literally stacked hoops: each band is one sheet, bottom to top
      const n = 7;
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / n, y = -2 - u * 24, w = 6.5 + Math.sin(u * Math.PI) * 7.5;
        rr(c, -w, y - 2.6, w * 2, 5.6, 2.8, i % 2 ? LAN : LAN_DK);
      }
    } },
    { id: 'capB', parent: 'body', at: [0, 0], z: 1, box: [-9, -3, 9, 6], draw: (c) => { rr(c, -6.5, -1.5, 13, 5, 1.6, CAP); rr(c, -6.5, 0.2, 13, 1.4, 0.5, GOLD, 0); } },
    { id: 'capT', parent: 'body', at: [0, -27], z: 3, box: [-10, -12, 10, 4], draw: (c) => {
      curve(c, -4.5, -3, 0, -12, 4.5, -3, CAP, 1.6);
      rr(c, -7.5, -4, 15, 5.4, 1.6, CAP); rr(c, -7.5, -0.6, 15, 1.4, 0.5, GOLD, 0);
    } },
    { id: 'eye', parent: 'body', at: [0, -16], z: 4, box: [-8, -8, 8, 8], draw: (c) => {
      ell(c, 0, 0, 6.2, 5.8, '#fffaf0'); ell(c, 0, 0.6, 3.6, 3.6, GOLD); ell(c, 0, 0.6, 1.9, 1.9, CAP);
      dot(c, -1.4, -1, 0.9, '#fff');
      c.beginPath(); c.moveTo(-6.4, -1.5); c.quadraticCurveTo(0, -9, 6.4, -1.5); c.quadraticCurveTo(0, -4.6, -6.4, -1.5); c.closePath(); sheetFill(c, LAN_DK);
    } },
    { id: 'tongue', parent: 'body', at: [1, -8.5], z: 5, box: [-5, -3, 5, 13], draw: (c) => {
      rr(c, -3.6, -2, 7.2, 3, 1.4, CAP);
      rr(c, -2.8, -1, 5.6, 11, 2.8, '#e8616b'); line(c, [0, 1.5, 0, 7], '#b8404c', 1);
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
