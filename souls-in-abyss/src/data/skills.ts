import type { L, Mod, Save } from '../game/types';

/**
 * Skills after BWE: three tabs, ranks F E D C B A 9 8 ... 1 (15 ranks), bought with AP.
 * rank 0 = not learned. Active skills roll on every attack (COMBAT, MAGIC) or every hit taken (defensive).
 */
export const RANKS = ['-', 'F', 'E', 'D', 'C', 'B', 'A', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
export const MAX_RANK = RANKS.length - 1;
export const rankCost = (r: number): number => 1 + r; // F costs 1, rank 1 costs 15: 120 AP per skill

export type Tab = 'combat' | 'magic' | 'passive';
export type Trigger = 'attack' | 'defend';
export interface Active {
  on: Trigger;
  chance: (r: number) => number;
  /** attack: damage multiplier of ATK (or of magic for spells). defend: damage taken multiplier, or counter damage. */
  power: (r: number) => number;
  mp?: (r: number) => number;
  effect?: 'slow' | 'pierce' | 'counter' | 'block';
}
export interface SkillDef {
  key: string;
  tab: Tab;
  name: L;
  desc: (r: number) => L;
  mods?: (r: number, s: Save) => Mod[];
  act?: Active;
}

const p = (x: number) => Math.round(x * 1000) / 10 + '%';

const bolt = (key: string, zh: string, en: string, base: number, effect: Active['effect'], fx: L): SkillDef => ({
  key, tab: 'magic', name: { zh, en },
  act: { on: 'attack', chance: r => 0.06 + r * 0.008, power: r => base + r * 0.12, mp: r => 4 + r, effect },
  desc: r => ({ zh: `${p(0.06 + r * 0.008)} 機率施放，${p(base + r * 0.12)} 魔法傷害，${fx.zh}。MP ${4 + r}`, en: `${p(0.06 + r * 0.008)} chance, ${p(base + r * 0.12)} magic damage, ${fx.en}. MP ${4 + r}` }),
});

export const SKILLS: SkillDef[] = [
  // COMBAT
  {
    key: 'smash', tab: 'combat', name: { zh: '重擊', en: 'Smash' },
    act: { on: 'attack', chance: r => 0.08 + r * 0.008, power: r => 1.8 + r * 0.12 },
    desc: r => ({ zh: `${p(0.08 + r * 0.008)} 機率造成 ${p(1.8 + r * 0.12)} 傷害`, en: `${p(0.08 + r * 0.008)} chance to deal ${p(1.8 + r * 0.12)} damage` }),
  },
  {
    key: 'defense', tab: 'combat', name: { zh: '防禦', en: 'Defense' },
    act: { on: 'defend', chance: r => 0.08 + r * 0.008, power: r => Math.max(0.1, 0.5 - r * 0.025), effect: 'block' },
    desc: r => ({ zh: `被攻擊時 ${p(0.08 + r * 0.008)} 機率只受 ${p(Math.max(0.1, 0.5 - r * 0.025))} 傷害`, en: `When hit, ${p(0.08 + r * 0.008)} chance to take only ${p(Math.max(0.1, 0.5 - r * 0.025))}` }),
  },
  {
    key: 'counter', tab: 'combat', name: { zh: '反擊', en: 'Counterattack' },
    act: { on: 'defend', chance: r => 0.05 + r * 0.006, power: r => 1.5 + r * 0.15, effect: 'counter' },
    desc: r => ({ zh: `被攻擊時 ${p(0.05 + r * 0.006)} 機率擋下並反擊 ${p(1.5 + r * 0.15)}`, en: `When hit, ${p(0.05 + r * 0.006)} chance to parry and strike back for ${p(1.5 + r * 0.15)}` }),
  },
  // MAGIC
  bolt('firebolt', '火球術', 'Firebolt', 1.6, undefined, { zh: '單純的高傷害', en: 'plain high damage' }),
  bolt('icebolt', '冰箭術', 'Icebolt', 1.2, 'slow', { zh: '延遲對手下一次攻擊', en: 'delays the enemy\'s next attack' }),
  bolt('lightning', '雷擊術', 'Lightning Bolt', 1.3, 'pierce', { zh: '無視防禦與保護', en: 'ignores DEF and PRT' }),
  // PASSIVE
  {
    key: 'mastery', tab: 'passive', name: { zh: '戰鬥精通', en: 'Combat Mastery' },
    mods: r => [{ key: 'atkMax', add: r * 2 }, { key: 'atk', mul: r * 0.02 }],
    desc: r => ({ zh: `最大攻擊 +${r * 2}，攻擊 +${p(r * 0.02)}`, en: `Max ATK +${r * 2}, ATK +${p(r * 0.02)}` }),
  },
  ...(['light', 'medium', 'heavy'] as const).map(w => ({
    key: w + 'Arms', tab: 'passive' as Tab,
    name: { light: { zh: '輕兵器精通', en: 'Light Arms' }, medium: { zh: '中兵器精通', en: 'Medium Arms' }, heavy: { zh: '重兵器精通', en: 'Heavy Arms' } }[w],
    mods: (r: number, s: Save): Mod[] => (s.equip.weapon?.weight === w ? [{ key: 'atk', mul: 0.03 * r }, { key: 'speed', mul: 0.012 * r }] : []),
    desc: (r: number) => ({ zh: `使用${{ light: '輕', medium: '中', heavy: '重' }[w]}武器時 攻擊 +${p(0.03 * r)}、攻速 +${p(0.012 * r)}`, en: `With ${w} weapons: ATK +${p(0.03 * r)}, speed +${p(0.012 * r)}` }),
  } as SkillDef)),
  {
    key: 'tough', tab: 'passive', name: { zh: '鐵壁', en: 'Toughness' },
    mods: r => [{ key: 'hp', mul: 0.04 * r }, { key: 'def', add: r }],
    desc: r => ({ zh: `HP +${p(0.04 * r)}，防禦 +${r}`, en: `HP +${p(0.04 * r)}, DEF +${r}` }),
  },
  {
    key: 'meditation', tab: 'passive', name: { zh: '冥想', en: 'Meditation' },
    mods: r => [{ key: 'mp', mul: 0.05 * r }, { key: 'heal', add: 0.01 * r }],
    desc: r => ({ zh: `MP +${p(0.05 * r)}，擊倒後回復 +${p(0.01 * r)}`, en: `MP +${p(0.05 * r)}, recover +${p(0.01 * r)} after each kill` }),
  },
  {
    key: 'fortune', tab: 'passive', name: { zh: '幸運星', en: 'Lucky Star' },
    mods: r => [{ key: 'gold', mul: 0.05 * r }, { key: 'drop', mul: 0.03 * r }],
    desc: r => ({ zh: `金幣 +${p(0.05 * r)}，掉寶 +${p(0.03 * r)}`, en: `Gold +${p(0.05 * r)}, drops +${p(0.03 * r)}` }),
  },
  {
    key: 'insight', tab: 'passive', name: { zh: '求知', en: 'Insight' },
    mods: r => [{ key: 'xp', mul: 0.04 * r }],
    desc: r => ({ zh: `EXP +${p(0.04 * r)}`, en: `EXP +${p(0.04 * r)}` }),
  },
];

export const skillOf = (k: string): SkillDef | undefined => SKILLS.find(s => s.key === k);
