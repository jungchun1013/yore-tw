import type { Item, Slot } from '../game/types';
import type { Pixel } from './icons';

/**
 * The hero figure: Codex's "B original" 24×32 drawing (souls-in-abyss/art-reference/b-original/avatar-b24.ts),
 * the first-version look the user chose on 2026-11-08 — single-pixel eyes, no highlights — moved to the
 * current slot model. Changes from the reference: 'hands' became 'legs' (greaves over the thighs),
 * 'acc1'/'acc2' became 'neck'/'ring', and an off-hand shield hangs on the left arm.
 */
export type Outfit = Partial<Record<Slot, Item | null>>;
export const HERO_W = 24, HERO_H = 32;
const metals = ['#83939a', '#839da5', '#c1ad83', '#b18c79', '#9586a4'];

export function heroPixels(race: string, equip: Outfit = {}): Pixel[] {
  const out = new Map<string, Pixel>();
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++)
      if (xx >= 0 && xx < HERO_W && yy >= 0 && yy < HERO_H) out.set(`${xx},${yy}`, { x: xx, y: yy, color });
  };
  const ink = '#343842', skin = race === 'undead' ? '#c7c4ae' : '#c8ad92';
  const cloth = race === 'elf' ? '#53695e' : race === 'undead' ? '#625575' : '#697b80';
  const armour = (it: Item) => it.weight === 'light' ? '#948572' : it.weight === 'medium' ? '#788b81' : '#8899a0';
  const gear = (slot: Slot, x: number, y: number, w: number, h: number) => {
    const it = equip[slot]; if (!it) return;
    rect(x, y, w, h, ink); rect(x + 1, y + 1, w - 2, h - 2, armour(it));
    rect(x + 1, y + 1, Math.max(1, w - 3), 1, '#c2c8bc');
    rect(x + w - 2, y + 2, 1, Math.max(1, h - 3), metals[it.rarity]);
    if (it.plus > 0) rect(x + 1, y + h - 2, 1, 1, '#c1a775');
  };
  // head, hair, ears, eyes, beard
  rect(7, 2, 10, 10, ink); rect(8, 4, 8, 7, skin);
  rect(8, 2, 8, 3, race === 'elf' ? '#b6ac88' : '#625953');
  if (race === 'elf') { rect(6, 6, 2, 2, skin); rect(16, 6, 2, 2, skin); }
  rect(10, 7, 1, 2, ink); rect(14, 7, 1, 2, ink);
  if (race === 'dwarf') rect(9, 9, 6, 4, '#827260');
  // torso, arms, legs, belt
  rect(6, 12, 12, 12, ink); rect(7, 13, 10, 10, cloth);
  rect(3, 13, 3, 10, skin); rect(18, 13, 3, 10, skin);
  rect(7, 23, 4, 7, ink); rect(13, 23, 4, 7, ink);
  rect(8, 24, 2, 4, cloth); rect(14, 24, 2, 4, cloth);
  rect(7, 21, 10, 2, '#725e53'); rect(11, 21, 2, 2, '#c1a775');
  gear('body', 6, 12, 12, 11);
  gear('legs', 6, 22, 6, 5); gear('legs', 12, 22, 6, 5);
  gear('feet', 6, 26, 6, 5); gear('feet', 12, 26, 6, 5);
  gear('head', 6, 1, 12, equip.head?.weight === 'heavy' ? 7 : 5);
  if (equip.head?.weight === 'heavy') { rect(7, 6, 2, 4, ink); rect(15, 6, 2, 4, ink); }
  if (equip.neck) { rect(11, 13, 1, 4, '#c1a775'); rect(10, 16, 3, 2, metals[equip.neck.rarity]); }
  if (equip.ring) rect(3, 21, 2, 2, metals[equip.ring.rarity]);
  const shield = equip.off;
  if (shield) { // on the left arm; lighter shields are smaller boards
    const h = shield.weight === 'light' ? 6 : shield.weight === 'medium' ? 8 : 10, y = 23 - h;
    rect(1, y, 5, h, ink); rect(2, y + 1, 3, h - 2, armour(shield));
    rect(2, y + 1, 2, 1, '#c2c8bc'); rect(3, y + 3, 1, 1, metals[shield.rarity]);
  }
  const weapon = equip.weapon;
  if (weapon) {
    const heavy = weapon.weight === 'heavy', length = weapon.weight === 'light' ? 7 : 12;
    rect(21, 22 - length, heavy ? 3 : 2, length, ink);
    rect(21, 22 - length, 1, length - 1, metals[weapon.rarity]);
    if (heavy) rect(18, 22 - length, 5, 4, '#a7b2ac');
    rect(19, 21, 5, 1, '#c1a775'); rect(21, 22, 1, 4, '#725e53');
    if (weapon.plus) rect(21, 22 - length, 1, 2, '#e3ddc9');
  }
  return [...out.values()];
}

export function heroMarkup(race: string, equip: Outfit = {}): string {
  return heroPixels(race, equip).map(p => `<rect x="${p.x}" y="${p.y}" width="1" height="1" fill="${p.color}"/>`).join('');
}
