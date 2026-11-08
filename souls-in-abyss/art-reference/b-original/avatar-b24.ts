/**
 * B-reference: original 24×32 drawing, reconstructed from the drawing code
 * retained in the conversation. It was not a separately committed PNG.
 * Reference only: the new 32×48 artwork must not sample or enlarge this data.
 */
export interface BPixel { x: number; y: number; color: string }
type BItem = { weight?: 'light' | 'medium' | 'heavy'; rarity: number; plus: number };
export type BOutfit = Partial<Record<'head' | 'body' | 'hands' | 'feet' | 'acc1' | 'acc2' | 'weapon', BItem>>;
export function bAvatarPixels(race: string, equip: BOutfit = {}): BPixel[] {
  const out: BPixel[] = [];
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) out.push({ x: xx, y: yy, color });
  };
  const metals = ['#83939a', '#82947b', '#839da5', '#c1ad83', '#b18c79', '#9586a4'];
  const ink = '#343842', skin = race === 'undead' ? '#c7c4ae' : '#c8ad92';
  const cloth = race === 'elf' ? '#53695e' : race === 'undead' ? '#625575' : '#697b80';
  const gear = (slot: keyof BOutfit, x: number, y: number, w: number, h: number) => {
    const it = equip[slot]; if (!it) return;
    const color = it.weight === 'light' ? '#948572' : it.weight === 'medium' ? '#788b81' : '#8899a0';
    rect(x, y, w, h, ink); rect(x + 1, y + 1, w - 2, h - 2, color);
    rect(x + 1, y + 1, Math.max(1, w - 3), 1, '#c2c8bc');
    rect(x + w - 2, y + 2, 1, Math.max(1, h - 3), metals[it.rarity]);
    if (it.plus > 0) rect(x + 1, y + h - 2, 1, 1, '#c1a775');
  };
  rect(7, 2, 10, 10, ink); rect(8, 4, 8, 7, skin);
  rect(8, 2, 8, 3, race === 'elf' ? '#b6ac88' : '#625953');
  if (race === 'elf') { rect(6, 6, 2, 2, skin); rect(16, 6, 2, 2, skin); }
  rect(10, 7, 1, 2, ink); rect(14, 7, 1, 2, ink);
  if (race === 'dwarf') rect(9, 9, 6, 4, '#827260');
  rect(6, 12, 12, 12, ink); rect(7, 13, 10, 10, cloth);
  rect(3, 13, 3, 10, skin); rect(18, 13, 3, 10, skin);
  rect(7, 23, 4, 7, ink); rect(13, 23, 4, 7, ink);
  rect(8, 24, 2, 4, cloth); rect(14, 24, 2, 4, cloth);
  rect(7, 21, 10, 2, '#725e53'); rect(11, 21, 2, 2, '#c1a775');
  gear('body', 6, 12, 12, 11);
  gear('hands', 2, 19, 5, 5); gear('hands', 17, 19, 5, 5);
  gear('feet', 6, 26, 6, 5); gear('feet', 12, 26, 6, 5);
  gear('head', 6, 1, 12, equip.head?.weight === 'heavy' ? 7 : 5);
  if (equip.head?.weight === 'heavy') { rect(7, 6, 2, 4, ink); rect(15, 6, 2, 4, ink); }
  if (equip.acc1) { rect(11, 13, 1, 4, '#c1a775'); rect(10, 16, 3, 2, metals[equip.acc1.rarity]); }
  if (equip.acc2) rect(3, 21, 2, 2, metals[equip.acc2.rarity]);
  const weapon = equip.weapon;
  if (weapon) {
    const heavy = weapon.weight === 'heavy', length = weapon.weight === 'light' ? 7 : 12;
    rect(21, 22 - length, heavy ? 3 : 2, length, ink);
    rect(21, 22 - length, 1, length - 1, metals[weapon.rarity]);
    if (heavy) rect(18, 22 - length, 5, 4, '#a7b2ac');
    rect(19, 21, 5, 1, '#c1a775'); rect(21, 22, 1, 4, '#725e53');
    if (weapon.plus) rect(21, 22 - length, 1, 2, '#e3ddc9');
  }
  return out;
}
