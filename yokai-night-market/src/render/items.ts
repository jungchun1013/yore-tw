// Heroes, shots, pickups, weapon / passive icons and stage props.
import { type C, INK, TAU, blob, blush, curve, dot, ell, eyes, flame, fs, line, poly, rr, smile } from './kit';

type Draw = (c: C) => void;
export interface Art { w: number; h: number; draw: Draw }

interface Chibi { skin: string; top: string; bottom: string; hair: (c: C) => void; extra?: (c: C) => void; back?: (c: C) => void }

function chibi(o: Chibi, frame: number): Draw {
  return (c) => {
    o.back?.(c);
    const a = frame === 1 ? 1.6 : 0, b = frame === 2 ? 1.6 : 0;
    rr(c, -5.4, -6 - a, 4.4, 6, 1.6, '#3b3445', 1.6); rr(c, 1, -6 - b, 4.4, 6, 1.6, '#3b3445', 1.6);
    blob(c, [-6.5, -17, 6.5, -17, 9, -4.5, -9, -4.5], o.bottom);
    blob(c, [-6.5, -18.5, 6.5, -18.5, 7.6, -10.5, -7.6, -10.5], o.top, 1.8);
    line(c, [-2.6, -17.5, 0, -12.5, 2.6, -17.5], INK, 1.2);
    ell(c, -8, -12.5 + (frame === 1 ? -1 : 0), 2.5, 3.4, o.top, 1.6); ell(c, 8, -12.5 + (frame === 2 ? -1 : 0), 2.5, 3.4, o.top, 1.6);
    ell(c, 0, -26, 10, 9.4, o.skin);
    o.hair(c);
    eyes(c, 0, -24.8, 3.7, 2); blush(c, 0, -22.3, 6.4, 2); smile(c, 0, -22, 1.8, 1.2);
    o.extra?.(c);
  };
}

const HERO_STYLE: Record<string, Chibi> = {
  miko: {
    skin: '#f8e3d0', top: '#fbf6ea', bottom: '#d8493a',
    back: (c) => { blob(c, [-9, -30, -12, -14, -6, -10, -4, -20], INK, 1); blob(c, [9, -30, 12, -14, 6, -10, 4, -20], INK, 1); },
    hair: (c) => {
      c.beginPath(); c.moveTo(-10.6, -24); c.bezierCurveTo(-12.5, -39, 12.5, -39, 10.6, -24); c.lineTo(7.5, -26.5); c.bezierCurveTo(4, -30.5, -4, -30.5, -7.5, -26.5); c.closePath(); fs(c, INK, 1);
      poly(c, [0, -35.5, -6, -39.5, -5, -33], '#d8493a', 1.4); poly(c, [0, -35.5, 6, -39.5, 5, -33], '#d8493a', 1.4);
    },
  },
  deng: {
    skin: '#f3cfae', top: '#3f6fa8', bottom: '#e9dfc8',
    hair: (c) => {
      c.beginPath(); c.moveTo(-10.4, -26); c.bezierCurveTo(-11.5, -39, 11.5, -39, 10.4, -26); c.lineTo(6, -30.5); c.lineTo(2, -28.5); c.lineTo(-2, -31); c.lineTo(-6, -28.5); c.closePath(); fs(c, '#3b3445', 1);
      rr(c, -10.4, -31.5, 20.8, 3, 1, '#fbf6ea', 1.3); dot(c, 0, -30, 1.3, '#d8493a');
    },
    extra: (c) => { rr(c, 8.5, -10, 3, 7, 1, '#d8493a', 1.3); line(c, [10, -10, 11.5, -13], INK, 1.1); },
  },
  unpei: {
    skin: '#f3d9c0', top: '#3d4a66', bottom: '#5a6478',
    back: (c) => { line(c, [-12, -3, 10, -31], INK, 4.4); line(c, [-12, -3, 10, -31], '#c98a5a', 2.4); line(c, [5, -27.5, 9, -24], INK, 2.6); },
    hair: (c) => {
      c.beginPath(); c.moveTo(-10.6, -25); c.bezierCurveTo(-12.5, -39.5, 12.5, -39.5, 10.6, -25); c.lineTo(8, -28); c.lineTo(3, -30); c.lineTo(-7.5, -27); c.closePath(); fs(c, '#4a3b34', 1);
      poly(c, [-2, -37, 0, -43, 3, -37.5], '#4a3b34', 1.2);
      // fox mask pushed to the side of the head
      blob(c, [-13.5, -34, -7, -37, -4, -31, -8.5, -26.5, -13, -29], '#fbf6ea', 1.4);
      poly(c, [-13, -34, -14.5, -39, -10.5, -36], '#fbf6ea', 1.3); poly(c, [-7.5, -36.5, -5, -40.5, -4.5, -35], '#fbf6ea', 1.3);
      line(c, [-11.5, -31.5, -9.5, -32.5], '#d8493a', 1.4); line(c, [-8, -30, -6.5, -32], '#d8493a', 1.4);
    },
  },
};

export function heroArt(id: string, frame: number): Art {
  return { w: 34, h: 46, draw: chibi(HERO_STYLE[id] ?? HERO_STYLE.miko, frame) };
}

const magatama = (col: string, hi: string): Draw => (c) => {
  c.beginPath(); c.arc(0.5, -8, 4.8, -2.4, 1.9); c.bezierCurveTo(-5, -1, -7.5, -6.5, -4.6, -10.5); c.bezierCurveTo(-3.5, -6.5, -0.5, -6.2, -1.2, -10.2); c.closePath(); fs(c, col, 1.6);
  dot(c, 1.2, -8.8, 1.4, hi);
};

const paper = (c: C, x: number, y: number, w: number, h: number, fill: string, mark: string): void => {
  rr(c, x - w / 2, y - h / 2, w, h, 1.2, fill, 1.6);
  line(c, [x - w * 0.22, y - h * 0.3, x + w * 0.22, y - h * 0.3], mark, 1.4);
  line(c, [x, y - h * 0.3, x, y + h * 0.3], mark, 1.4);
  line(c, [x - w * 0.22, y + h * 0.05, x + w * 0.22, y + h * 0.05], mark, 1.2);
};

const doll: Draw = (c) => {
  ell(c, 0, -17, 4.6, 4.6, '#fbf6ea', 1.6);
  poly(c, [-9, -12.5, 9, -12.5, 8, -8.5, 4, -8.5, 5.5, -1, -5.5, -1, -4, -8.5, -8, -8.5], '#fbf6ea', 1.6);
  dot(c, 0, -17, 1.2, '#d8493a');
};

const skyLantern: Draw = (c) => {
  blob(c, [-8, -22, 0, -25, 8, -22, 6.5, -5, -6.5, -5], '#f6a13a', 1.8);
  c.globalAlpha = 0.8; ell(c, 0, -12, 3.6, 5, '#fff2b0', 0); c.globalAlpha = 1;
  rr(c, -5.5, -5.6, 11, 2.6, 1, '#8a3a34', 1.4);
};

const crescent = (c: C, x: number, y: number, r: number, rot: number, fill: string): void => {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.beginPath(); c.arc(0, 0, r, 0.15 * Math.PI, 0.85 * Math.PI); c.quadraticCurveTo(0, r * 0.15, r * Math.cos(0.15 * Math.PI), r * Math.sin(0.15 * Math.PI)); c.closePath(); fs(c, fill, 1.6);
  c.restore();
};

const cat: Draw = (c) => {
  ell(c, 0, -8.5, 9, 8.5, '#fbf6ea');
  poly(c, [-9, -22, -8.5, -29, -3.5, -25], '#fbf6ea', 1.6); poly(c, [9, -22, 8.5, -29, 3.5, -25], '#fbf6ea', 1.6);
  ell(c, 0, -19, 9.4, 7.8, '#fbf6ea');
  ell(c, 8.5, -22, 3, 4.2, '#fbf6ea', 1.6);
  rr(c, -6, -13.4, 12, 2.6, 1, '#d8493a', 1.3); dot(c, 0, -11, 2, '#e9b949');
  eyes(c, 0, -19.5, 3.6, 1.6); smile(c, 0, -17.4, 1.7, 1.1);
  ell(c, 0, -5.5, 3.6, 4.4, '#e9b949', 1.4);
};

const coin: Draw = (c) => { ell(c, 0, -7, 6.4, 6.4, '#e9b949', 1.6); rr(c, -1.8, -8.8, 3.6, 3.6, 0.4, '#8f6420', 1); };

export const ITEMS: Record<string, Art> = {
  // ---- shots ----
  ofuda: { w: 18, h: 12, draw: (c) => { c.translate(0, -6); c.rotate(Math.PI / 2); paper(c, 0, 0, 7.5, 15, '#fbf6ea', '#d8493a'); } },
  ofuda2: { w: 20, h: 13, draw: (c) => { c.translate(0, -6.5); c.rotate(Math.PI / 2); paper(c, 0, 0, 8.5, 17, '#f7e27a', '#8a3a34'); } },
  doll: { w: 20, h: 24, draw: doll },
  cracker: { w: 14, h: 22, draw: (c) => { for (const y of [-17, -11, -5]) rr(c, -2.6, y - 2.5, 5.2, 5, 1.2, '#d8493a', 1.3); line(c, [0, -20, 2, -23], INK, 1.2); dot(c, 2.5, -23.5, 1.6, '#f7e27a'); } },
  rocket: { w: 20, h: 10, draw: (c) => { c.translate(0, -5); line(c, [-9, 0, 2, 0], '#d9b77a', 1.6); rr(c, -1, -2.4, 8, 4.8, 1.4, '#d8493a', 1.3); poly(c, [7, -2.4, 10, 0, 7, 2.4], '#e9b949', 1.2); flame(c, -8, 3, 2.4, 5, '#f6a13a', '#fff2b0', 0); } },
  salt: { w: 8, h: 8, draw: (c) => { ell(c, 0, -4, 2.6, 2.6, '#fff', 1.2); } },
  skyLantern: { w: 22, h: 28, draw: skyLantern },
  poeA: { w: 22, h: 22, draw: (c) => crescent(c, 0, -15, 9, 0, '#c8483a') },
  poeB: { w: 22, h: 22, draw: (c) => crescent(c, 0, -15, 9, 0, '#e8616b') },
  pellet: { w: 14, h: 14, draw: (c) => { ell(c, 0, -7, 4.6, 4.6, '#f2a7b5', 1.6); dot(c, -1.2, -8.2, 1.4, '#fff'); } },
  orb: { w: 18, h: 18, draw: (c) => { ell(c, 0, -9, 6.2, 6.2, '#b06ad8', 1.8); dot(c, 0, -9, 3, '#f0c8ff'); } },

  // ---- pickups ----
  gem1: { w: 16, h: 16, draw: magatama('#5fb8d8', '#eafcff') },
  gem2: { w: 16, h: 16, draw: magatama('#7fcf7a', '#f0ffe0') },
  gem3: { w: 16, h: 16, draw: magatama('#e8616b', '#ffe6e0') },
  coin: { w: 16, h: 16, draw: coin },
  heal: { w: 24, h: 22, draw: (c) => { blob(c, [0, -21, 10, -4, 0, -1, -10, -4], '#fbf6ea'); rr(c, -4.6, -9, 9.2, 8, 1, '#33283c', 1.3); } },
  magnet: { w: 20, h: 26, draw: (c) => { curve(c, -3, -21, 0, -26, 3, -21, '#d8493a', 2); ell(c, 0, -11, 8, 9, '#e9b949'); line(c, [-7.4, -9, 7.4, -9], '#8f6420', 1.4); dot(c, 0, -5.5, 1.8, INK); line(c, [0, -5.5, 0, -2.5], INK, 1.6); } },
  purge: { w: 26, h: 34, draw: (c) => { line(c, [0, -2, 0, -31], INK, 4.2); line(c, [0, -2, 0, -31], '#d9b77a', 2.2); for (const s of [-1, 1]) poly(c, [s * 1.5, -29, s * 8, -26, s * 5, -22, s * 11, -18, s * 8, -13, s * 4, -17, s * 6.5, -21, s * 1.5, -24], '#fbf6ea', 1.4); } },
  chest: { w: 34, h: 28, draw: (c) => {
    rr(c, -14, -20, 28, 20, 2, '#a8683f'); rr(c, -15.5, -24, 31, 6.5, 2, '#c98a5a');
    for (const x of [-7.5, 0, 7.5]) line(c, [x, -22.5, x, -19], INK, 1.6);
    rr(c, -14, -12.5, 28, 3.4, 0.6, '#7a4a2c', 1.3);
    ell(c, 0, -8, 4.2, 4.2, '#e9b949', 1.5); rr(c, -1.2, -9.2, 2.4, 2.4, 0.3, '#8f6420', 0.9);
  } },

  // ---- weapon icons ----
  i_ofuda: { w: 36, h: 36, draw: (c) => { c.translate(0, -18); c.rotate(-0.25); paper(c, -4, 1, 11, 24, '#fbf6ea', '#d8493a'); c.rotate(0.5); paper(c, 5, 0, 11, 24, '#fbf6ea', '#d8493a'); } },
  i_shikigami: { w: 36, h: 36, draw: (c) => { c.translate(0, -5); c.scale(1.5, 1.5); doll(c); } },
  i_furin: { w: 36, h: 36, draw: (c) => {
    line(c, [0, -34, 0, -29], INK, 1.6);
    c.beginPath(); c.arc(0, -20, 10, Math.PI, 0); c.lineTo(10, -17); c.lineTo(-10, -17); c.closePath(); fs(c, '#9fd8ee');
    curve(c, -6, -22, -2, -27, 4, -26, '#e8616b', 1.6);
    line(c, [0, -17, 0, -11], INK, 1.4); dot(c, 0, -15, 1.6, '#e9b949');
    rr(c, -3.4, -11, 6.8, 10, 1, '#fbf6ea', 1.5); line(c, [0, -8.5, 0, -3.5], '#3f6fa8', 1.3);
  } },
  i_cracker: { w: 36, h: 36, draw: (c) => {
    line(c, [-8, -31, 8, -4], '#d9b77a', 1.6);
    for (let i = 0; i < 5; i++) { const x = -7 + i * 3.4, y = -28 + i * 5.6, s = i % 2 ? 1 : -1; c.save(); c.translate(x + s * 4.4, y); c.rotate(s * 0.9); rr(c, -2.6, -4.6, 5.2, 9.2, 1.4, '#d8493a', 1.4); line(c, [-2.4, -2, 2.4, -2], '#e9b949', 1.2); c.restore(); }
  } },
  i_foxfire: { w: 36, h: 36, draw: (c) => { flame(c, 0, -5, 11, 27, '#5fa7e8', '#eafcff'); eyes(c, 0, -11, 2.8, 1.5); } },
  i_salt: { w: 36, h: 36, draw: (c) => { ell(c, 0, -8, 13, 4.6, '#3f6fa8'); blob(c, [-9, -9, 0, -27, 9, -9, 0, -7], '#fff'); dot(c, -9, -22, 1.2, '#fff'); dot(c, 9, -25, 1.2, '#fff'); dot(c, 11, -17, 1, '#fff'); } },
  i_lantern: { w: 36, h: 36, draw: (c) => { c.translate(0, -1); c.scale(1.3, 1.3); skyLantern(c); } },
  i_poe: { w: 36, h: 36, draw: (c) => { crescent(c, -4, -22, 11, -0.5, '#c8483a'); crescent(c, 5, -17, 11, 2.5, '#e8616b'); } },
  i_sword: { w: 36, h: 36, draw: (c) => {
    c.translate(0, -18); c.rotate(-Math.PI / 4);
    rr(c, -10, -2.6, 24, 5.2, 2, '#c98a5a'); poly(c, [14, -2.6, 19, 0, 14, 2.6], '#c98a5a');
    rr(c, -11.5, -5, 3, 10, 1, '#8f6420', 1.5); rr(c, -17, -2, 6, 4, 1.4, '#d8493a', 1.5);
    for (const x of [-4, 1, 6]) dot(c, x, 0, 0.9, '#8a3a34');
  } },

  // ---- passive icons ----
  i_sake: { w: 36, h: 36, draw: (c) => { blob(c, [-4, -31, 4, -31, 4, -24, 10, -15, 9, -3, -9, -3, -10, -15, -4, -24], '#fbf6ea'); rr(c, -5, -33, 10, 3.4, 1, '#3f6fa8', 1.5); rr(c, -5.5, -17, 11, 10, 1, '#d8493a', 1.4); line(c, [0, -15, 0, -9], '#fbf6ea', 1.5); } },
  i_taiko: { w: 36, h: 36, draw: (c) => {
    rr(c, -12, -22, 24, 16, 6, '#a8483f');
    ell(c, 0, -22, 12, 4.4, '#fbf6ea'); for (const x of [-9, -4.5, 0, 4.5, 9]) dot(c, x, -9.5, 1.1, '#e9b949');
    line(c, [-9, -4, -13, 0], INK, 2); line(c, [9, -4, 13, 0], INK, 2);
    line(c, [6, -26, 14, -33], INK, 3.6); line(c, [6, -26, 14, -33], '#d9b77a', 1.8);
  } },
  i_ramune: { w: 36, h: 36, draw: (c) => { blob(c, [-4, -33, 4, -33, 4, -26, 2.6, -23, 7.5, -18, 7.5, -3, -7.5, -3, -7.5, -18, -2.6, -23, -4, -26], '#8fd3ec'); rr(c, -5, -34.5, 10, 3, 1, '#3f6fa8', 1.4); dot(c, 0, -24.5, 1.9, '#eafcff'); rr(c, -7.5, -15, 15, 7, 0.6, '#fbf6ea', 1.2); dot(c, -3, -7, 1, '#eafcff'); dot(c, 3, -9, 0.8, '#eafcff'); } },
  i_incense: { w: 36, h: 36, draw: (c) => {
    for (const [x, t] of [[-5, -2], [0, 0], [5, 2]]) { line(c, [x, -10, x + t, -27], '#8a3a34', 1.8); dot(c, x + t, -27.5, 1.5, '#f6a13a'); }
    curve(c, 0, -28, -5, -31, 0, -35, '#d8dbe4', 1.6);
    c.beginPath(); c.moveTo(-11, -11); c.bezierCurveTo(-10, -1, 10, -1, 11, -11); c.closePath(); fs(c, '#e9b949');
    ell(c, 0, -11, 11, 3, '#b8bac4', 1.6);
  } },
  i_geta: { w: 36, h: 36, draw: (c) => { c.translate(0, -16); c.rotate(-0.2); rr(c, -6, 2, 3.6, 9, 1, '#8a5a3a', 1.6); rr(c, 5, 2, 3.6, 9, 1, '#8a5a3a', 1.6); rr(c, -14, -4, 28, 7, 3, '#c98a5a'); curve(c, -9, -3.5, -1, -13, 2, -3.5, '#d8493a', 2.4); curve(c, 2, -3.5, 5, -12, 10, -4, '#d8493a', 2.4); } },
  i_turtle: { w: 36, h: 36, draw: (c) => { ell(c, 0, -10, 15, 8, '#7fb46a'); ell(c, 0, -13, 11.5, 8.5, '#d8392f'); ell(c, 0, -13, 5.5, 4, null, 1.3); for (const a of [0.6, 2.5, 3.8, 5.7]) line(c, [Math.cos(a) * 5.5, -13 + Math.sin(a) * 4, Math.cos(a) * 10, -13 + Math.sin(a) * 7.4], INK, 1.2); } },
  i_omamori: { w: 36, h: 36, draw: (c) => { curve(c, -3, -27, 0, -36, 3, -27, '#fbf6ea', 2); poly(c, [-8, -22, -5, -27, 5, -27, 8, -22, 8, -3, -8, -3], '#3f6fa8'); rr(c, -3.6, -19, 7.2, 12, 1, '#fbf6ea', 1.3); line(c, [0, -17, 0, -9.5], '#3f6fa8', 1.4); dot(c, 0, -25.5, 1.6, '#e9b949'); } },
  i_maneki: { w: 36, h: 36, draw: (c) => { c.translate(0, -1); c.scale(1.15, 1.15); cat(c); } },
  i_pouch: { w: 36, h: 36, draw: (c) => { curve(c, -6, -22, 0, -38, 6, -22, '#e9b949', 1.8); blob(c, [-6, -22, 6, -22, 10.5, -6, 0, -2, -10.5, -6], '#d8392f'); rr(c, -6.5, -24, 13, 3.6, 1.2, '#e9b949', 1.4); ell(c, 0, -11.5, 3.6, 3.6, '#e9b949', 1.3); } },
  i_crane: { w: 36, h: 36, draw: (c) => { poly(c, [-2, -12, -15, -27, 2, -19], '#fbf6ea'); poly(c, [-2, -12, 14, -30, 3, -12], '#f2a7b5'); poly(c, [-8, -8, 3, -19, 8, -8, 0, -5], '#fbf6ea'); poly(c, [-8, -8, -15, -3, -5, -6.5], '#fbf6ea'); poly(c, [6, -10, 12, -19, 15, -15.5, 12.5, -15.5], '#fbf6ea'); } },

  // ---- misc icons ----
  i_coin: { w: 22, h: 22, draw: (c) => { c.translate(0, -1.5); c.scale(1.35, 1.35); coin(c); } },
  i_ema: { w: 36, h: 36, draw: (c) => { curve(c, -4, -28, 0, -36, 4, -28, '#d8493a', 2); poly(c, [-13, -22, 0, -30, 13, -22, 13, -4, -13, -4], '#d9b77a'); line(c, [-7, -17, 7, -17], '#8a3a34', 1.6); line(c, [-7, -12.5, 7, -12.5], '#8a5a3a', 1.3); line(c, [-7, -8.5, 3, -8.5], '#8a5a3a', 1.3); } },
  i_heal: { w: 36, h: 36, draw: (c) => { c.translate(0, -4); c.scale(1.3, 1.3); blob(c, [0, -21, 10, -4, 0, -1, -10, -4], '#fbf6ea'); rr(c, -4.6, -9, 9.2, 8, 1, '#33283c', 1.3); } },
  i_skull: { w: 22, h: 22, draw: (c) => { flame(c, 0, -2, 7.5, 18, '#8fd3ec', '#f0fdff', 1.6); eyes(c, 0, -7, 2.3, 1.3); } },
};

// ---- stage props. `flat` props lie on the ground and are drawn under everything. ----
export interface PropArt extends Art { flat?: boolean; light?: number }

const pine = (c: C): void => { rr(c, -3, -20, 6, 20, 2, '#6a4a34'); for (const [x, y, r] of [[-12, -26, 11], [10, -30, 12], [0, -42, 13]]) blob(c, [x - r, y, x - r * 0.5, y - r * 0.7, x + r * 0.5, y - r * 0.7, x + r, y, x, y + r * 0.35], '#3f6a4f'); };

export const PROPS: Record<string, PropArt> = {
  torii: { w: 100, h: 88, draw: (c) => {
    rr(c, -34, -70, 9, 70, 2, '#c8483a', 2.4); rr(c, 25, -70, 9, 70, 2, '#c8483a', 2.4);
    rr(c, -36, -6, 13, 6, 1.5, '#33283c', 2); rr(c, 23, -6, 13, 6, 1.5, '#33283c', 2);
    rr(c, -40, -60, 80, 7, 1.5, '#c8483a', 2.4);
    blob(c, [-50, -84, 50, -84, 46, -72, -46, -72], '#33283c', 2.4);
    rr(c, -44, -76, 88, 7, 1.5, '#c8483a', 2.4);
    rr(c, -5, -70, 10, 11, 1, '#e9dfc8', 2);
  } },
  komainu: { w: 34, h: 44, light: 0, draw: (c) => {
    rr(c, -13, -10, 26, 10, 1.5, '#7c7e8a'); ell(c, 2, -17, 9.5, 8.5, '#a8aab6');
    ell(c, -3, -29, 9, 8.5, '#b4b6c2'); for (const a of [2.4, 3.3, 4.2, 5.1]) ell(c, -3 + Math.cos(a) * 9, -29 + Math.sin(a) * 8.5, 3, 3, '#9a9ca8', 1.5);
    eyes(c, -4, -30, 3.2, 1.6); line(c, [-7, -25, -1, -25], INK, 1.6); rr(c, -10, -12.5, 4.6, 4, 1.4, '#a8aab6', 1.5);
  } },
  pine: { w: 54, h: 60, draw: pine },
  slab: { w: 70, h: 40, flat: true, draw: (c) => { c.globalAlpha = 0.55; rr(c, -30, -34, 26, 14, 4, '#6d7389', 1.2); rr(c, 0, -36, 28, 15, 4, '#646a80', 1.2); rr(c, -20, -17, 30, 14, 4, '#5f657a', 1.2); c.globalAlpha = 1; } },

  stall: { w: 92, h: 78, light: 1, draw: (c) => {
    rr(c, -36, -44, 4, 44, 1, '#6a4a34', 2); rr(c, 32, -44, 4, 44, 1, '#6a4a34', 2);
    rr(c, -36, -26, 72, 22, 2, '#8a5a3a', 2.4); rr(c, -38, -30, 76, 6, 2, '#c98a5a', 2.2);
    for (const x of [-22, -6, 10, 24]) ell(c, x, -33, 5.5, 3.2, '#f2d27a', 1.5);
    c.beginPath(); c.moveTo(-44, -50); c.lineTo(-38, -70); c.lineTo(38, -70); c.lineTo(44, -50); c.closePath(); fs(c, '#fbf6ea', 2.4);
    for (const x of [-30, -10, 10, 30]) poly(c, [x - 7, -50, x - 6, -70, x + 6, -70, x + 7, -50], '#d8493a', 0);
    c.beginPath(); c.moveTo(-44, -50); c.lineTo(-38, -70); c.lineTo(38, -70); c.lineTo(44, -50); c.closePath(); fs(c, null, 2.4);
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-36.5 + i * 14.6, -50, 7.3, 0, Math.PI); fs(c, i % 2 ? '#fbf6ea' : '#d8493a', 1.8); }
    ell(c, -27, -41, 4, 5, '#f6a13a', 1.6);
  } },
  lanterns: { w: 110, h: 60, light: 1, draw: (c) => {
    rr(c, -52, -56, 4, 56, 1, '#6a4a34', 2); rr(c, 48, -56, 4, 56, 1, '#6a4a34', 2);
    curve(c, -50, -54, 0, -40, 50, -54, INK, 1.8);
    for (const [x, y] of [[-34, -48], [-17, -44.5], [0, -43], [17, -44.5], [34, -48]]) { ell(c, x, y + 7, 6, 7.5, '#e8553d', 1.8); rr(c, x - 3, y - 2, 6, 2.6, 0.8, '#33283c', 1); rr(c, x - 3, y + 13, 6, 2.6, 0.8, '#33283c', 1); }
  } },
  stool: { w: 26, h: 20, draw: (c) => { line(c, [-7, -10, -9, -1], INK, 2.6); line(c, [7, -10, 9, -1], INK, 2.6); ell(c, 0, -11, 10, 4.2, '#d8493a'); ell(c, 0, -12, 7, 2.6, '#e8616b', 0); } },
  manhole: { w: 44, h: 26, flat: true, draw: (c) => { c.globalAlpha = 0.7; ell(c, 0, -12, 18, 9.5, '#4a4d5c', 1.6); ell(c, 0, -12, 13, 6.6, null, 1.2); line(c, [-13, -12, 13, -12], INK, 1.2); line(c, [0, -18.5, 0, -5.5], INK, 1.2); c.globalAlpha = 1; } },

  shoji: { w: 84, h: 68, draw: (c) => {
    rr(c, -40, -64, 80, 64, 1.5, '#6a4a34', 2.4);
    for (const x of [-36, 2]) { rr(c, x, -60, 34, 56, 1, '#f3ead8', 1.8); for (const y of [-46, -32, -18]) line(c, [x, y, x + 34, y], '#8a6a45', 1.2); line(c, [x + 11.3, -60, x + 11.3, -4], '#8a6a45', 1.2); line(c, [x + 22.6, -60, x + 22.6, -4], '#8a6a45', 1.2); }
  } },
  chabudai: { w: 60, h: 34, draw: (c) => {
    for (const x of [-18, 18]) rr(c, x - 2.5, -12, 5, 12, 1.5, '#6a4a34', 2);
    ell(c, 0, -16, 26, 10, '#a8683f', 2.4); ell(c, 0, -17.5, 22, 7.6, '#c98a5a', 0);
    ell(c, -7, -19, 5, 2.6, '#fbf6ea', 1.4); rr(c, 5, -24, 6, 6, 1.5, '#7fb46a', 1.5);
  } },
  andon: { w: 26, h: 44, light: 1, draw: (c) => {
    rr(c, -9, -5, 18, 5, 1.2, '#33283c'); line(c, [-7, -5, -7, -38], INK, 2.4); line(c, [7, -5, 7, -38], INK, 2.4);
    rr(c, -8, -34, 16, 26, 2, '#f7e8b4'); line(c, [-8, -21, 8, -21], '#8a6a45', 1.2); line(c, [0, -34, 0, -8], '#8a6a45', 1.2);
    rr(c, -9.5, -40, 19, 4.5, 1.2, '#33283c');
  } },
  zabuton: { w: 40, h: 26, flat: true, draw: (c) => { c.globalAlpha = 0.85; rr(c, -17, -22, 34, 19, 6, '#7a5a8a', 1.8); rr(c, -12, -18, 24, 11, 4, null, 1); dot(c, 0, -12.5, 1.6, '#e9b949'); c.globalAlpha = 1; } },

  rail: { w: 130, h: 44, flat: true, draw: (c) => {
    for (let x = -56; x <= 56; x += 16) rr(c, x - 4, -38, 8, 34, 1.5, '#5a4636', 1.5);
    rr(c, -64, -33, 128, 4, 1, '#9a9ca8', 1.5); rr(c, -64, -13, 128, 4, 1, '#9a9ca8', 1.5);
  } },
  cane: { w: 50, h: 70, draw: (c) => {
    for (const [x, h, t] of [[-12, 54, -0.12], [0, 62, 0.02], [12, 50, 0.14]] as const) {
      c.save(); c.translate(x, 0); c.rotate(t);
      for (const [dx, dy] of [[-12, -8], [-6, -14], [7, -14], [12, -7]]) { curve(c, 0, -h, dx * 0.6, -h + dy, dx, -h + dy + 9, INK, 4.4); curve(c, 0, -h, dx * 0.6, -h + dy, dx, -h + dy + 9, '#7fb46a', 2.4); }
      rr(c, -3, -h, 6, h, 2.5, '#8a6aa0', 1.8);
      for (let y = -h + 11; y < -3; y += 11) line(c, [-2.6, y, 2.6, y], '#c9b0d6', 1.3);
      c.restore();
    }
  } },
  signal: { w: 30, h: 70, light: 1, draw: (c) => {
    rr(c, -2.5, -60, 5, 60, 1.5, '#4a4d5c', 2); rr(c, -8, -5, 16, 5, 1.2, '#33283c', 2);
    rr(c, -8, -68, 16, 24, 3, '#33283c', 2.2); ell(c, 0, -61, 4, 4, '#e8553d', 1.4); ell(c, 0, -51, 4, 4, '#7fcf7a', 1.4);
  } },
  crate: { w: 38, h: 32, draw: (c) => { rr(c, -16, -26, 32, 26, 2, '#c98a5a', 2.2); line(c, [-16, -17.5, 16, -17.5], INK, 1.5); line(c, [-16, -8.5, 16, -8.5], INK, 1.5); rr(c, -16, -26, 5, 26, 1, '#a8683f', 1.6); rr(c, 11, -26, 5, 26, 1, '#a8683f', 1.6); } },

  bamboo: { w: 60, h: 110, draw: (c) => {
    for (const [x, h, t, col] of [[-14, 92, -0.07, '#5f9a5a'], [2, 104, 0.02, '#7fae6a'], [16, 84, 0.1, '#6aa562']] as const) {
      c.save(); c.translate(x, 0); c.rotate(t);
      rr(c, -3.4, -h, 6.8, h, 2.5, col, 2);
      for (let y = -h + 14; y < -4; y += 15) line(c, [-3, y, 3, y], '#3f6a45', 1.5);
      for (const [y, s] of [[-h + 10, 1], [-h + 24, -1], [-h + 40, 1]]) poly(c, [s * 3, y, s * 16, y - 7, s * 11, y + 2], '#9ccf7f', 1.4);
      c.restore();
    }
  } },
  rock: { w: 46, h: 32, draw: (c) => { blob(c, [-19, -4, -16, -20, -2, -28, 14, -22, 19, -5, 0, 0], '#7c7e8a', 2.2); curve(c, -10, -18, -2, -23, 8, -19, '#a8aab6', 2); blob(c, [-19, -9, -10, -13, -3, -9, -12, -4], '#5f8a5a', 1.4); } },
  jizo: { w: 28, h: 44, draw: (c) => {
    blob(c, [-8, -24, 8, -24, 10, -1, -10, -1], '#a8aab6'); ell(c, 0, -30, 9, 8.6, '#b4b6c2');
    blob(c, [-8.5, -23, 0, -26, 8.5, -23, 6, -15, 0, -13, -6, -15], '#d8493a', 1.6);
    curve(c, -5, -31, -3.5, -29.5, -2, -31, INK, 1.4); curve(c, 2, -31, 3.5, -29.5, 5, -31, INK, 1.4); smile(c, 0, -27.6, 1.8, 1.2);
  } },
  fern: { w: 44, h: 26, flat: true, draw: (c) => { c.globalAlpha = 0.8; for (const [x, y, r] of [[-12, -10, 0.4], [0, -14, 0], [12, -10, -0.4], [-5, -6, 0.9], [7, -5, -0.9]]) ell(c, x, y, 9, 3.6, '#4f8a55', 1.2, r); c.globalAlpha = 1; } },

  noren: { w: 80, h: 66, light: 1, draw: (c) => {
    rr(c, -36, -62, 5, 62, 1.5, '#6a4a34', 2.2); rr(c, 31, -62, 5, 62, 1.5, '#6a4a34', 2.2);
    rr(c, -40, -64, 80, 5, 1.5, '#4a3b34', 2.2);
    for (let i = 0; i < 3; i++) { const x = -30 + i * 20.5; rr(c, x, -59, 19, 28, 1.5, '#3f6fa8', 2); c.beginPath(); c.arc(x + 9.5, -46, 4.6, 0, TAU); fs(c, '#fbf6ea', 0); for (const dx of [-2.6, 0, 2.6]) curve(c, x + 9.5 + dx, -51, x + 8.5 + dx, -55, x + 10.5 + dx, -57.5, '#fbf6ea', 1.2); }
  } },
  spring: { w: 80, h: 50, flat: true, light: 0, draw: (c) => {
    blob(c, [-34, -22, -22, -40, 6, -44, 30, -36, 35, -18, 18, -5, -14, -4], '#7c7e8a', 2.2);
    blob(c, [-27, -22, -18, -35, 5, -38, 25, -32, 28, -19, 14, -10, -11, -9], '#8fd3ec', 1.6);
    c.globalAlpha = 0.7; curve(c, -10, -26, -4, -30, 2, -26, '#eafcff', 1.6); curve(c, 6, -20, 12, -24, 18, -20, '#eafcff', 1.6); c.globalAlpha = 1;
  } },
  bucket: { w: 30, h: 26, draw: (c) => { poly(c, [-10, -17, 10, -17, 8, -1, -8, -1], '#d9b07a', 2); line(c, [-9.6, -13, 9.6, -13], '#8a6a45', 1.8); line(c, [-8.6, -5, 8.6, -5], '#8a6a45', 1.8); ell(c, 0, -17, 10, 3, '#cfeaf2', 1.8); rr(c, 3, -21, 9, 4, 1.5, '#fbf6ea', 1.4); } },
};
