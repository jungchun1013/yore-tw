import type { L, Mod, Save } from '../game/types';

export interface Proc { chance: (lv: number) => number; mult: (lv: number) => number; scale: 'atk' | 'magic' }
export interface SkillDef {
  key: string;
  name: L;
  desc: (lv: number) => L;
  max: number;
  cost: (lv: number) => number;           // AP to go from lv to lv+1
  mods?: (lv: number, s: Save) => Mod[];  // passive part
  proc?: Proc;                            // active part, rolled on each attack
}

const ap = (lv: number) => 1 + Math.floor(lv / 3);
const p = (x: number) => Math.round(x * 100) + '%';

export const SKILLS: SkillDef[] = [
  {
    key: 'smash', name: { zh: '重擊', en: 'Smash' }, max: 20, cost: ap,
    proc: { chance: lv => (lv ? 0.1 + lv * 0.01 : 0), mult: lv => 1.6 + lv * 0.1, scale: 'atk' },
    desc: lv => ({ zh: `${p(0.1 + lv * 0.01)} 機率造成 ${p(1.6 + lv * 0.1)} 傷害`, en: `${p(0.1 + lv * 0.01)} chance to hit for ${p(1.6 + lv * 0.1)}` }),
  },
  {
    key: 'fireball', name: { zh: '火球術', en: 'Fireball' }, max: 20, cost: ap,
    proc: { chance: lv => (lv ? 0.08 + lv * 0.01 : 0), mult: lv => 1.2 + lv * 0.12, scale: 'magic' },
    desc: lv => ({ zh: `${p(0.08 + lv * 0.01)} 機率放出 ${p(1.2 + lv * 0.12)} 魔力傷害（隨智力）`, en: `${p(0.08 + lv * 0.01)} chance to deal ${p(1.2 + lv * 0.12)} magic (INT)` }),
  },
  {
    key: 'mastery', name: { zh: '戰鬥精通', en: 'Combat Mastery' }, max: 20, cost: ap,
    mods: lv => [{ key: 'atk', mul: 0.03 * lv }],
    desc: lv => ({ zh: `攻擊 +${p(0.03 * lv)}`, en: `ATK +${p(0.03 * lv)}` }),
  },
  ...(['light', 'medium', 'heavy'] as const).map(w => ({
    key: w + 'Arms',
    name: { light: { zh: '輕兵器精通', en: 'Light Arms' }, medium: { zh: '中兵器精通', en: 'Medium Arms' }, heavy: { zh: '重兵器精通', en: 'Heavy Arms' } }[w],
    max: 20, cost: ap,
    mods: (lv: number, s: Save): Mod[] => (s.equip.weapon?.weight === w ? [{ key: 'atk', mul: 0.04 * lv }, { key: 'speed', mul: 0.015 * lv }] : []),
    desc: (lv: number) => ({ zh: `使用${{ light: '輕', medium: '中', heavy: '重' }[w]}武器時 攻擊 +${p(0.04 * lv)}、攻速 +${p(0.015 * lv)}`, en: `With ${w} weapons: ATK +${p(0.04 * lv)}, speed +${p(0.015 * lv)}` }),
  } as SkillDef)),
  {
    key: 'tough', name: { zh: '鐵壁', en: 'Toughness' }, max: 20, cost: ap,
    mods: lv => [{ key: 'hp', mul: 0.04 * lv }, { key: 'def', mul: 0.02 * lv }],
    desc: lv => ({ zh: `HP +${p(0.04 * lv)}、防禦 +${p(0.02 * lv)}`, en: `HP +${p(0.04 * lv)}, DEF +${p(0.02 * lv)}` }),
  },
  {
    key: 'swift', name: { zh: '見切', en: 'Foresight' }, max: 20, cost: ap,
    mods: lv => [{ key: 'eva', add: 0.008 * lv }, { key: 'acc', add: 0.01 * lv }],
    desc: lv => ({ zh: `迴避 +${p(0.008 * lv)}、命中 +${p(0.01 * lv)}`, en: `Evade +${p(0.008 * lv)}, hit +${p(0.01 * lv)}` }),
  },
  {
    key: 'firstAid', name: { zh: '急救', en: 'First Aid' }, max: 20, cost: ap,
    mods: lv => [{ key: 'heal', add: 0.02 * lv }],
    desc: lv => ({ zh: `擊倒後回復 +${p(0.02 * lv)} HP`, en: `Heal +${p(0.02 * lv)} HP after each kill` }),
  },
  {
    key: 'fortune', name: { zh: '幸運星', en: 'Lucky Star' }, max: 20, cost: ap,
    mods: lv => [{ key: 'gold', mul: 0.06 * lv }, { key: 'drop', mul: 0.04 * lv }],
    desc: lv => ({ zh: `金幣 +${p(0.06 * lv)}、掉寶 +${p(0.04 * lv)}`, en: `Gold +${p(0.06 * lv)}, drops +${p(0.04 * lv)}` }),
  },
  {
    key: 'insight', name: { zh: '求知', en: 'Insight' }, max: 20, cost: ap,
    mods: lv => [{ key: 'xp', mul: 0.05 * lv }],
    desc: lv => ({ zh: `經驗 +${p(0.05 * lv)}`, en: `XP +${p(0.05 * lv)}` }),
  },
];

export const skillOf = (k: string): SkillDef | undefined => SKILLS.find(s => s.key === k);
