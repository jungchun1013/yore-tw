import type { WeaponDef, WeaponId, WeaponNumbers, WeaponPatch } from '../game/types';

export const WEAPON_MAX = 6;

export const WEAPONS: WeaponDef[] = [
  {
    id: 'ofuda',
    name: { zh: '符札', en: 'Ofuda' },
    desc: { zh: '朝最近的妖怪射出紙符。', en: 'Throws paper charms at the nearest yokai.' },
    evoName: { zh: '千枚札', en: 'Thousand Charms' },
    evoDesc: { zh: '紙符連發不停，貫穿一切。', en: 'An endless stream of charms that pierce everything.' },
    pair: 'incense',
    base: { dmg: 11, cd: 1.1, amount: 1, area: 1, speed: 1, duration: 1, pierce: 1 },
    ups: [{ amount: 1 }, { dmg: 5, cdPct: -10 }, { amount: 1, pierce: 1 }, { dmg: 6, cdPct: -10 }, { amount: 1, pierce: 1 }],
    evo: { dmg: 6, cdPct: -45, pierce: 99, amount: 1 },
  },
  {
    id: 'shikigami',
    name: { zh: '紙式神', en: 'Paper Shikigami' },
    desc: { zh: '紙人偶繞著你打轉，撞開靠近的妖怪。', en: 'Paper dolls circle you and knock yokai away.' },
    evoName: { zh: '百鬼式', en: 'Hundred-Fold Shikigami' },
    evoDesc: { zh: '紙人偶不再消失，轉得更遠更快。', en: 'The dolls never fade and sweep a wider ring.' },
    pair: 'crane',
    base: { dmg: 9, cd: 5, amount: 2, area: 1, speed: 1, duration: 1, pierce: 99 },
    ups: [{ amount: 1 }, { dmg: 5, areaPct: 15 }, { amount: 1, durPct: 20 }, { dmg: 6, speedPct: 25 }, { amount: 1, areaPct: 15 }],
    evo: { dmg: 8, amount: 2, areaPct: 30 },
  },
  {
    id: 'furin',
    name: { zh: '風鈴', en: 'Wind Chime' },
    desc: { zh: '清脆一響，震開身邊的妖怪。', en: 'One clear note pushes back everything around you.' },
    evoName: { zh: '祭囃子', en: 'Festival Band' },
    evoDesc: { zh: '鈴聲化成祭典樂，範圍更大還會讓妖怪腳軟。', en: 'A festival tune: wider, and it slows what it hits.' },
    pair: 'ramune',
    base: { dmg: 8, cd: 2.6, amount: 1, area: 1, speed: 1, duration: 1, pierce: 99 },
    ups: [{ areaPct: 20 }, { dmg: 5, cdPct: -10 }, { areaPct: 20 }, { dmg: 6, cdPct: -15 }, { dmg: 6, areaPct: 25 }],
    evo: { dmg: 10, areaPct: 40, cdPct: -20 },
  },
  {
    id: 'cracker',
    name: { zh: '鞭炮', en: 'Firecrackers' },
    desc: { zh: '往妖怪堆裡丟一串鞭炮。', en: 'Lobs a string of firecrackers into the crowd.' },
    evoName: { zh: '蜂炮', en: 'Beehive Rockets' },
    evoDesc: { zh: '鹽水元宵的蜂炮，相傳是關帝爺出巡驅瘟留下的習俗，往四面八方亂竄。', en: 'The Yanshui beehive, said to date from a plague the god Guan Yu drove out. Rockets in every direction.' },
    pair: 'taiko',
    base: { dmg: 20, cd: 3.2, amount: 1, area: 1, speed: 1, duration: 1, pierce: 99 },
    ups: [{ amount: 1 }, { dmg: 10, areaPct: 15 }, { amount: 1 }, { dmg: 10, cdPct: -15 }, { amount: 1, areaPct: 20 }],
    evo: { dmg: 4, amount: 8, cdPct: -30 },
  },
  {
    id: 'foxfire',
    name: { zh: '狐火', en: 'Foxfire' },
    desc: { zh: '在妖怪腳下點起一團燒不完的藍火。', en: 'Lights a lingering blue flame under a yokai.' },
    evoName: { zh: '九尾焰', en: 'Nine-Tail Blaze' },
    evoDesc: { zh: '九團狐火一起落下，燒得更久。', en: 'Nine flames fall at once and burn far longer.' },
    pair: 'sake',
    base: { dmg: 6, cd: 4, amount: 1, area: 1, speed: 1, duration: 1, pierce: 99 },
    ups: [{ amount: 1 }, { dmg: 3, areaPct: 20 }, { amount: 1, durPct: 25 }, { dmg: 4, cdPct: -15 }, { amount: 1, areaPct: 20 }],
    evo: { dmg: 5, amount: 5, durPct: 50 },
  },
  {
    id: 'salt',
    name: { zh: '粗鹽', en: 'Coarse Salt' },
    desc: { zh: '朝面前撒出一把安順鹽田的粗鹽，近距離很痛。', en: 'A handful of coarse salt from the Anshun pans thrown ahead. Hurts up close.' },
    evoName: { zh: '結界鹽', en: 'Barrier Salt' },
    evoDesc: { zh: '鹽往四周撒成一圈結界。', en: 'Salt flies out in a full circle.' },
    pair: 'omamori',
    base: { dmg: 7, cd: 1.5, amount: 5, area: 1, speed: 1, duration: 1, pierce: 2 },
    ups: [{ amount: 2 }, { dmg: 4, pierce: 1 }, { amount: 2, cdPct: -10 }, { dmg: 4, areaPct: 20 }, { amount: 3, pierce: 1 }],
    evo: { dmg: 5, amount: 12, cdPct: -15 },
  },
  {
    id: 'lantern',
    name: { zh: '魁星筆', en: 'Kui Xing\'s Brush' },
    desc: { zh: '赤崁樓的魁星提筆一點，落在隨機的妖怪頭上。', en: 'The star god of Chihkan Tower dots his brush on a random yokai.' },
    evoName: { zh: '魁星點斗', en: 'Top of the List' },
    evoDesc: { zh: '一筆接一筆，整片點下來。', en: 'Stroke after stroke comes down across the field.' },
    pair: 'pouch',
    base: { dmg: 26, cd: 2.8, amount: 1, area: 1, speed: 1, duration: 1, pierce: 99 },
    ups: [{ amount: 1 }, { dmg: 12, areaPct: 15 }, { amount: 1, cdPct: -10 }, { dmg: 14, areaPct: 15 }, { amount: 2 }],
    evo: { dmg: 14, amount: 4, cdPct: -25 },
  },
  {
    id: 'poe',
    name: { zh: '筊杯', en: 'Moon Blocks' },
    desc: { zh: '擲出一對廟裡的筊杯，飛出去再轉回來。', en: 'A pair of temple moon blocks fly out and curve back.' },
    evoName: { zh: '三聖筊', en: 'Three Blessings' },
    evoDesc: { zh: '連三個聖筊，筊杯變大、飛得更遠。', en: 'Three yeses in a row: bigger blocks, longer flight.' },
    pair: 'maneki',
    base: { dmg: 13, cd: 3, amount: 2, area: 1, speed: 1, duration: 1, pierce: 99 },
    ups: [{ dmg: 5 }, { amount: 1, areaPct: 15 }, { dmg: 6, cdPct: -15 }, { amount: 1, speedPct: 20 }, { dmg: 8, areaPct: 20 }],
    evo: { dmg: 12, amount: 2, areaPct: 40, speedPct: 20 },
  },
  {
    id: 'sword',
    name: { zh: '桃木劍', en: 'Peachwood Sword' },
    desc: { zh: '朝最近的妖怪那一側橫掃一劍。', en: 'A wide sweep toward the side the nearest yokai is on.' },
    evoName: { zh: '七星劍', en: 'Seven-Star Sword' },
    evoDesc: { zh: '前後各一劍，砍倒妖怪時回一點血。', en: 'Sweeps both sides and heals a little on kills.' },
    pair: 'turtle',
    base: { dmg: 20, cd: 1.25, amount: 1, area: 1, speed: 1, duration: 1, pierce: 99 },
    ups: [{ dmg: 8 }, { amount: 1 }, { dmg: 8, areaPct: 20 }, { cdPct: -20 }, { dmg: 12, areaPct: 20 }],
    evo: { dmg: 16, areaPct: 30, cdPct: -15 },
  },
];

export const WEAPON: Record<WeaponId, WeaponDef> = Object.fromEntries(WEAPONS.map((w) => [w.id, w])) as Record<WeaponId, WeaponDef>;

function patch(n: WeaponNumbers, p: WeaponPatch): void {
  n.dmg += p.dmg ?? 0;
  n.amount += p.amount ?? 0;
  n.pierce += p.pierce ?? 0;
  n.cd *= 1 + (p.cdPct ?? 0) / 100;
  n.area *= 1 + (p.areaPct ?? 0) / 100;
  n.speed *= 1 + (p.speedPct ?? 0) / 100;
  n.duration *= 1 + (p.durPct ?? 0) / 100;
}

const cache = new Map<string, WeaponNumbers>();
export function weaponNumbers(id: WeaponId, level: number, evolved: boolean): WeaponNumbers {
  const key = `${id}:${level}:${evolved ? 1 : 0}`;
  let n = cache.get(key);
  if (!n) {
    const def = WEAPON[id];
    n = { ...def.base };
    for (let i = 0; i < level - 1 && i < def.ups.length; i++) patch(n, def.ups[i]);
    if (evolved) patch(n, def.evo);
    cache.set(key, n);
  }
  return n;
}
