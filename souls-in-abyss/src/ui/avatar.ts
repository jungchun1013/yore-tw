import type { Item, Slot } from '../game/types';
import { PALETTE, type Pixel } from './icons';
export type Outfit = Partial<Record<Slot, Item | null>>;
export const AVATAR_WIDTH = 32, AVATAR_HEIGHT = 48;
const metals = [PALETTE.s, PALETTE.b, PALETTE.y, PALETTE.t, PALETTE.p];
/** Shared 32×48 grid. Walking changes the legs rather than scaling the sprite. */
export function avatarPixels(race: string, equip: Outfit = {}, stride = 0): Pixel[] {
  const out = new Map<string, Pixel>();
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++)
      if (xx >= 0 && xx < 32 && yy >= 0 && yy < 48) out.set(`${xx},${yy}`, { x: xx, y: yy, color });
  };
  const ink = PALETTE.o, skin = race === 'undead' ? PALETTE.h : PALETTE.T;
  const cloth = race === 'elf' ? PALETTE.G : race === 'undead' ? PALETTE.P : PALETTE.s;
  const gear = (slot: Slot, x: number, y: number, w: number, h: number) => {
    const it = equip[slot]; if (!it) return;
    const color = it.weight === 'light' ? PALETTE.t : it.weight === 'medium' ? PALETTE.g : PALETTE.b;
    rect(x, y, w, h, ink); rect(x + 1, y + 1, w - 2, h - 2, color);
    rect(x + 1, y + 1, w - 3, 1, PALETTE.h);
    rect(x + w - 2, y + 2, 1, h - 3, PALETTE.s);
    rect(x + 2, y + h - 3, w - 4, 1, metals[it.rarity]);
    if (it.weight === 'medium') for (let yy = y + 4; yy < y + h - 3; yy += 4)
      for (let xx = x + 2; xx < x + w - 2; xx += 4) rect(xx + yy % 2, yy, 1, 1, PALETTE.l);
    if (it.weight === 'heavy') { rect(x + 2, y + 3, 1, Math.max(1, h - 6), PALETTE.h); rect(x + w - 4, y + 3, 1, 1, PALETTE.w); }
    if (it.plus > 0) rect(x + 2, y + h - 2, 1, 1, PALETTE.y);
  };
  // Face, hair, ear and chin highlights.
  rect(9, 3, 13, 14, ink); rect(10, 5, 11, 11, skin);
  rect(10, 3, 11, 4, race === 'elf' ? PALETTE.y : PALETTE.d);
  rect(11, 4, 8, 1, race === 'elf' ? PALETTE.Y : PALETTE.t);
  rect(10, 7, 2, 3, PALETTE.d); rect(19, 7, 2, 2, PALETTE.d);
  if (race === 'elf') { rect(7, 9, 3, 2, skin); rect(21, 9, 3, 2, skin); }
  rect(12, 10, 2, 3, ink); rect(18, 10, 2, 3, ink);
  rect(12, 10, 1, 1, PALETTE.w); rect(18, 10, 1, 1, PALETTE.w);
  rect(15, 13, 1, 1, PALETTE.t); rect(14, 15, 4, 1, PALETTE.w);
  if (race === 'dwarf') { rect(11, 13, 9, 6, PALETTE.d); rect(13, 15, 1, 3, PALETTE.t); rect(17, 15, 1, 3, PALETTE.t); }
  rect(8, 18, 15, 17, ink); rect(9, 19, 13, 15, cloth);
  rect(10, 20, 2, 12, PALETTE.b); rect(20, 21, 2, 12, PALETTE.s);
  rect(4, 20, 4, 14, ink); rect(5, 21, 2, 11, skin);
  rect(23, 20, 4, 14, ink); rect(24, 21, 2, 11, skin);
  rect(9, 33, 13, 3, PALETTE.d); rect(14, 33, 3, 2, PALETTE.y);
  const step = Math.round(stride * 2);
  for (const [x, offset] of [[9, step], [17, -step]]) {
    rect(x, 36 + offset, 5, 9, ink); rect(x + 1, 36 + offset, 3, 7, cloth);
    rect(x - 1, 43 + offset, 6, 3, PALETTE.o);
    gear('legs', x - 1, 35 + offset, 7, 7);
    gear('feet', x - 1, 40 + offset, 6, 6);
  }
  gear('body', 8, 18, 15, 17);
  if (equip.body) { rect(14, 20, 2, 10, metals[equip.body.rarity]); rect(9, 31, 13, 2, PALETTE.d); rect(14, 31, 3, 2, PALETTE.y); }
  gear('head', 8, 2, 15, equip.head?.weight === 'heavy' ? 7 : 6);
  if (equip.head?.weight === 'heavy') { rect(8, 8, 3, 8, ink); rect(21, 8, 2, 8, ink); rect(9, 8, 1, 6, PALETTE.b); }
  if (equip.neck) { rect(14, 19, 1, 6, PALETTE.y); rect(13, 24, 3, 3, metals[equip.neck.rarity]); rect(14, 24, 1, 1, PALETTE.w); }
  if (equip.ring) rect(4, 31, 2, 2, metals[equip.ring.rarity]);
  const shield = equip.off;
  if (shield) { // held on the left arm; the lighter the shield, the smaller the board
    const h = shield.weight === 'light' ? 8 : shield.weight === 'medium' ? 11 : 14, w = shield.weight === 'light' ? 5 : 7, x = 1, y = 34 - h;
    rect(x, y, w, h, ink); rect(x + 1, y + 1, w - 2, h - 2, shield.weight === 'light' ? PALETTE.t : shield.weight === 'medium' ? PALETTE.g : PALETTE.b);
    rect(x + 1, y + 1, w - 3, 1, PALETTE.h); rect(x + 2, y + 3, w - 4, 1, metals[shield.rarity]);
    if (shield.plus > 0) rect(x + 1, y + h - 2, 1, 1, PALETTE.y);
  }
  const weapon = equip.weapon;
  if (weapon) {
    const heavy = weapon.weight === 'heavy', length = weapon.weight === 'light' ? 12 : 22;
    rect(28, 32 - length, 3, length, ink);
    rect(28, 33 - length, 1, length - 2, PALETTE.w); rect(29, 33 - length, 1, length - 2, metals[weapon.rarity]);
    if (heavy) { rect(25, 32 - length, 7, 7, ink); rect(26, 33 - length, 6, 5, PALETTE.h); rect(26, 33 - length, 1, 5, PALETTE.w); }
    rect(26, 31, 6, 2, PALETTE.y); rect(28, 33, 2, 6, PALETTE.d); rect(28, 38, 2, 1, PALETTE.y);
    if (weapon.plus) rect(28, 33 - length, 1, 3, PALETTE.w);
  }
  return [...out.values()];
}
export function avatarMarkup(race: string, equip: Outfit = {}): string {
  return avatarPixels(race, equip).map(p => `<rect x="${p.x}" y="${p.y}" width="1" height="1" fill="${p.color}"/>`).join('');
}
