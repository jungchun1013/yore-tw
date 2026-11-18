// ?compare : the same kind of scene in three art versions, one above the other.
// ?fox     : the fox spirit alone on a plain background, previous look beside the new craft look.
import { Doll, type DollDef } from './doll';
import { CHOCHIN, MAPLE, MIKO, MOUNTAINS, SAKURA, SHOP, STONE_LANTERN } from './dolls';
import { paperFill, setPaperStyle, type PaperStyle } from './kit';
import { groundTile, spr } from './sprites';
import { BUSH, FENCE, FOX_SPIRIT, HOUSE_CRAFT, MAPLE_TREE, SHRINE } from './village';

function build(style: PaperStyle, defs: Record<string, [DollDef, number]>): Record<string, Doll> {
  setPaperStyle(style);
  const out: Record<string, Doll> = {};
  for (const k of Object.keys(defs)) out[k] = new Doll(defs[k][0], defs[k][1]);
  setPaperStyle('clean');
  return out;
}

function caption(c: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  c.font = '800 18px system-ui, sans-serif'; c.textAlign = 'left';
  const w = c.measureText(text).width;
  c.fillStyle = 'rgba(58,36,26,0.82)'; c.beginPath(); c.roundRect(x - 10, y - 22, w + 20, 32, 8); c.fill();
  c.fillStyle = '#fbf3e2'; c.fillText(text, x, y);
}

function loop(canvas: HTMLCanvasElement, draw: (c: CanvasRenderingContext2D, t: number, w: number, h: number) => void): void {
  const c = canvas.getContext('2d')!;
  const frozen = new URLSearchParams(location.search).get('t');
  const frame = (now: number): void => {
    const t = frozen !== null ? Number(frozen) : now / 1000;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = window.innerWidth, h = window.innerHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(c, t, w, h);
    if (frozen === null) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export function comparePage(canvas: HTMLCanvasElement): void {
  const clean = build('clean', { maple: [MAPLE, 4], sakura: [SAKURA, 4], shop: [SHOP, 4], stone: [STONE_LANTERN, 5], miko: [MIKO, 6], chochin: [CHOCHIN, 6], fox: [FOX_SPIRIT, 6] });
  const craft = build('craft', {
    hills: [MOUNTAINS, 2], maple: [MAPLE_TREE, 4], house: [HOUSE_CRAFT, 4], shrine: [SHRINE, 4], fence: [FENCE, 4], bush: [BUSH, 5],
    stone: [STONE_LANTERN, 5], miko: [MIKO, 6], chochin: [CHOCHIN, 6], fox: [FOX_SPIRIT, 6],
  });
  const old = (c: CanvasRenderingContext2D, key: string, x: number, y: number, k: number): void => {
    const s = spr(key); c.drawImage(s.c, x - s.ox * k, y - s.oy * k, s.w * k, s.h * k);
  };
  loop(canvas, (c, t, w, h) => {
    const rowH = h / 3;
    // 1. the art the game uses today
    c.save(); c.beginPath(); c.rect(0, 0, w, rowH); c.clip();
    const tile = groundTile('stone');
    for (let x = 0; x < w; x += 256) for (let y = 0; y < rowH; y += 256) c.drawImage(tile, x, y, 256, 256);
    const g1 = rowH - 40;
    old(c, 'phoenix', 120, g1, 2.2); old(c, 'stall', 380, g1, 2.4); old(c, 'torii', 640, g1, 2.1); old(c, 'komainu', 830, g1, 2.2);
    old(c, 'hero:miko:0', 960, g1, 2.6); old(c, 'chochin', 1060, g1, 2.6); old(c, 'nekomata', 1170, g1, 2.6);
    caption(c, '1  現行遊戲美術', 20, 36);
    c.restore();

    // 2. the previous paper-doll version
    c.save(); c.beginPath(); c.rect(0, rowH, w, rowH); c.clip();
    setPaperStyle('clean'); paperFill(c, 0, rowH, w, rowH, '#f7efdc');
    const g2 = rowH * 2 - 34;
    clean.maple.draw(c, 110, g2, 2.4, 1, t, false); clean.sakura.draw(c, 280, g2 - 4, 2.4, 1, t, false);
    clean.shop.draw(c, 520, g2, 2.3, 1, t, false); clean.stone.draw(c, 720, g2, 2.1, 1, t, false);
    clean.miko.draw(c, 850, g2 + 6, 2.5, 1, t, true); clean.fox.draw(c, 980, g2 + 6, 2.5, 1, t, false); clean.chochin.draw(c, 1100, g2 + 6, 2.3, 1, t, true);
    caption(c, '2  Claude 前一版：向量紙偶', 20, rowH + 36);
    c.restore();

    // 3. the new handmade craft version
    c.save(); c.beginPath(); c.rect(0, rowH * 2, w, h - rowH * 2); c.clip();
    setPaperStyle('craft'); paperFill(c, 0, rowH * 2, w, rowH, '#efe3c8');
    const g3 = h - 34;
    craft.hills.draw(c, w / 2, g3 - 40, 1.6, 1, t, false);
    paperFill(c, 0, g3 - 40, w, 80, '#f3e9d2');
    craft.maple.draw(c, 90, g3 - 12, 2.4, 1, t, false);
    craft.house.draw(c, 300, g3 - 10, 2.3, 1, t, false);
    craft.shrine.draw(c, 560, g3 - 8, 2.3, 1, t, false);
    craft.stone.draw(c, 700, g3 - 4, 2, 1, t, false);
    craft.fence.draw(c, 1180, g3 - 8, 2, 1, t, false);
    craft.bush.draw(c, 1080, g3, 2.2, 1, t, false);
    craft.miko.draw(c, 820, g3 + 6, 2.5, 1, t, true); craft.fox.draw(c, 940, g3 + 6, 2.5, 1, t, false); craft.chochin.draw(c, 1230, g3 + 6, 2.2, 1, t, true);
    craft.bush.draw(c, 210, g3 + 8, 1.8, -1, t + 1, false);
    caption(c, '3  新版：手作紙偶', 20, rowH * 2 + 36);
    c.restore();
    setPaperStyle('clean');
  });
}

export function foxPage(canvas: HTMLCanvasElement): void {
  const clean = build('clean', { fox: [FOX_SPIRIT, 8] });
  const craft = build('craft', { fox: [FOX_SPIRIT, 8] });
  loop(canvas, (c, t, w, h) => {
    setPaperStyle('craft'); paperFill(c, 0, 0, w, h, '#ece4d6'); setPaperStyle('clean');
    const y = h - 90, s = Math.min(6.5, h / 70);
    clean.fox.draw(c, w * 0.27, y, s, 1, t, false);
    craft.fox.draw(c, w * 0.73, y, s, 1, t, false);
    caption(c, 'Claude 前一版：向量紙偶', w * 0.27 - 110, 50);
    caption(c, '新版：手作紙偶', w * 0.73 - 70, 50);
  });
}
