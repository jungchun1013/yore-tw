import type { L, Mod, StatKey } from '../game/types';

export interface Race {
  key: string;
  name: L;
  desc: L;
  base: Record<StatKey, number>;
  growth: Record<StatKey, number>;   // per level, before the age curve
  birthday: Record<StatKey, number>; // per year of age
  mods: Mod[];
  color: string;                     // placeholder sprite tint
}

export const RACES: Race[] = [
  {
    key: 'human', name: { zh: '人族', en: 'Human' },
    desc: { zh: '樣樣通。經驗 +10%。', en: 'Even at everything. XP +10%.' },
    base: { str: 6, dex: 6, int: 6, vit: 6, agi: 6, luk: 6 },
    growth: { str: 1.6, dex: 1.6, int: 1.6, vit: 1.6, agi: 1.6, luk: 1.0 },
    birthday: { str: 1, dex: 1, int: 1, vit: 1, agi: 1, luk: 1 },
    mods: [{ key: 'xp', mul: 0.1 }], color: '#d9a066',
  },
  {
    key: 'elf', name: { zh: '精靈', en: 'Elf' },
    desc: { zh: '敏捷與智力成長高，魔法 +15%。', en: 'Quick and clever. Magic +15%.' },
    base: { str: 4, dex: 8, int: 8, vit: 4, agi: 7, luk: 5 },
    growth: { str: 1.0, dex: 2.0, int: 2.2, vit: 1.0, agi: 1.9, luk: 1.0 },
    birthday: { str: 0, dex: 1, int: 2, vit: 0, agi: 1, luk: 1 },
    mods: [{ key: 'magic', mul: 0.15 }], color: '#9bd36a',
  },
  {
    key: 'dwarf', name: { zh: '矮人', en: 'Dwarf' },
    desc: { zh: '力量與體力成長高，鍛造成功率 +5%。', en: 'Strong and sturdy. Smithing +5% success.' },
    base: { str: 8, dex: 5, int: 4, vit: 9, agi: 3, luk: 6 },
    growth: { str: 2.2, dex: 1.3, int: 0.8, vit: 2.3, agi: 0.8, luk: 0.9 },
    birthday: { str: 2, dex: 0, int: 0, vit: 2, agi: 0, luk: 1 },
    mods: [], color: '#b86f50',
  },
  {
    key: 'beast', name: { zh: '獸人', en: 'Beastkin' },
    desc: { zh: '敏捷與力量成長高，爆擊 +5%。', en: 'Fast and fierce. Crit +5%.' },
    base: { str: 7, dex: 6, int: 3, vit: 6, agi: 9, luk: 5 },
    growth: { str: 1.9, dex: 1.5, int: 0.6, vit: 1.5, agi: 2.3, luk: 1.0 },
    birthday: { str: 1, dex: 1, int: 0, vit: 1, agi: 2, luk: 0 },
    mods: [{ key: 'crit', add: 0.05 }], color: '#c9a35b',
  },
];

export const raceOf = (k: string): Race => RACES.find(r => r.key === k) || RACES[0];
export const SMITH_BONUS: Record<string, number> = { dwarf: 0.05 };

/** Age curve: young heroes grow luck and agility, older ones strength and vitality. */
export function ageFactor(age: number, k: StatKey): number {
  const y = Math.min(age, 25);
  if (k === 'luk') return Math.max(0.5, 1 + (17 - y) * 0.12);
  if (k === 'agi') return 1 + (15 - y) * 0.03;
  if (k === 'str' || k === 'vit') return 0.8 + (y - 10) * 0.04;
  return 1;
}
