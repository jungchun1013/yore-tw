import type { L, Mod, StatKey } from '../game/types';

/**
 * Races, after BWE: each has initial stats and an "age growth" that depends on the
 * age you are. A birthday grants the full age growth of the new age; every level-up
 * grants a quarter of the current age's growth.
 */
export interface Race {
  key: string;
  name: L;
  desc: L;
  icon: string;                       // placeholder glyph for the race list
  base: Record<StatKey, number>;
  growth: Record<StatKey, number>;    // age growth at age 13, shaped by AGE_CURVE
  mods: Mod[];
  color: string;                      // placeholder sprite tint
}

export const RACES: Race[] = [
  {
    key: 'human', name: { zh: '人族', en: 'Human' }, icon: '人',
    desc: { zh: '樣樣通。經驗 +10%。', en: 'Even at everything. XP +10%.' },
    base: { str: 18, dex: 18, int: 18, will: 18, luk: 14 },
    growth: { str: 2, dex: 2, int: 2, will: 2, luk: 1 },
    mods: [{ key: 'xp', mul: 0.1 }], color: '#d9a066',
  },
  {
    key: 'elf', name: { zh: '精靈', en: 'Elf' }, icon: '精',
    desc: { zh: '靈巧出眾。平衡 +5%。', en: 'Deft. Balance +5%.' },
    base: { str: 15, dex: 26, int: 16, will: 14, luk: 15 },
    growth: { str: 1, dex: 4, int: 2, will: 2, luk: 1 },
    mods: [{ key: 'bal', add: 0.05 }], color: '#9bd36a',
  },
  {
    key: 'dwarf', name: { zh: '矮人', en: 'Dwarf' }, icon: '矮',
    desc: { zh: '鍛造的民族。強化成功率 +5%。', en: 'Born smiths. Upgrade success +5%.' },
    base: { str: 22, dex: 18, int: 12, will: 20, luk: 16 },
    growth: { str: 3, dex: 2, int: 1, will: 2, luk: 1 },
    mods: [], color: '#b86f50',
  },
  {
    key: 'giant', name: { zh: '巨人', en: 'Giant' }, icon: '巨',
    desc: { zh: '力量與意志。HP +15%。', en: 'Strength and will. HP +15%.' },
    base: { str: 30, dex: 12, int: 10, will: 22, luk: 12 },
    growth: { str: 4, dex: 1, int: 1, will: 3, luk: 0 },
    mods: [{ key: 'hp', mul: 0.15 }], color: '#8f7a5a',
  },
  {
    key: 'undead', name: { zh: '不死族', en: 'Undead' }, icon: '骸',
    desc: { zh: '曾經死過一次。魔法 +15%。', en: 'Has died once already. Magic +15%.' },
    base: { str: 14, dex: 16, int: 24, will: 20, luk: 10 },
    growth: { str: 1, dex: 2, int: 4, will: 2, luk: 1 },
    mods: [{ key: 'magic', mul: 0.15 }], color: '#9aa3b5',
  },
];

export const raceOf = (k: string): Race => RACES.find(r => r.key === k) || RACES[0];
export const SMITH_BONUS: Record<string, number> = { dwarf: 0.05 };
export const START_AGES = [10, 11, 12, 13, 14, 15, 16, 17];

/** Young heroes grow luck and dexterity, older ones strength and will. Age 13 = 1. */
const AGE_CURVE: Record<StatKey, (age: number) => number> = {
  str: a => 0.7 + (a - 10) * 0.1,
  dex: a => 1.15 - (a - 10) * 0.05,
  int: () => 1,
  will: a => 0.85 + (a - 10) * 0.05,
  luk: a => 1.9 - (a - 10) * 0.3,
};

/** Whole-number age growth, as shown on the creation screen. Ages past 17 use 17. */
export function ageGrowth(r: Race, age: number): Record<StatKey, number> {
  const a = Math.min(17, Math.max(10, age));
  const out = {} as Record<StatKey, number>;
  for (const k of Object.keys(r.growth) as StatKey[]) {
    const v = r.growth[k] * AGE_CURVE[k](a);
    out[k] = Math.max(r.growth[k] > 0 ? 1 : 0, Math.round(v));
  }
  return out;
}
export const LEVEL_SHARE = 0.25;
