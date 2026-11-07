import type { L, ModKey, Slot, Weight } from '../game/types';

export interface WeightDef { name: L; atk: number; interval: number; def: number; eva: number; speedPenalty: number }
export const WEIGHTS: Record<Weight, WeightDef> = {
  light:  { name: { zh: '輕', en: 'Light' },  atk: 0.62, interval: 1.2, def: 0.55, eva: 0.06, speedPenalty: 0 },
  medium: { name: { zh: '中', en: 'Medium' }, atk: 1.0,  interval: 1.8, def: 1.0,  eva: 0.02, speedPenalty: 0 },
  heavy:  { name: { zh: '重', en: 'Heavy' },  atk: 1.65, interval: 2.6, def: 1.6,  eva: 0,    speedPenalty: 0.1 },
};
export const WEIGHT_KEYS: Weight[] = ['light', 'medium', 'heavy'];

export const RARITY: { name: L; color: string; affixes: number; w: number }[] = [
  { name: { zh: '普通', en: 'Common' },    color: '#c8c3b8', affixes: 0, w: 70 },
  { name: { zh: '魔法', en: 'Magic' },     color: '#6fa8ff', affixes: 1, w: 22 },
  { name: { zh: '稀有', en: 'Rare' },      color: '#ffd166', affixes: 2, w: 6 },
  { name: { zh: '史詩', en: 'Epic' },      color: '#c77dff', affixes: 3, w: 1.8 },
  { name: { zh: '傳說', en: 'Legendary' }, color: '#ff8c42', affixes: 4, w: 0.2 },
];

/** Name pools by tier; an item picks by ilvl so names get grander deeper in. */
export const NAMES: Record<string, L[]> = {
  'weapon.light':  [{ zh: '剝皮小刀', en: 'Skinning Knife' }, { zh: '雙短劍', en: 'Twin Daggers' }, { zh: '細身劍', en: 'Rapier' }, { zh: '影縫', en: 'Shadowstitch' }, { zh: '星屑匕首', en: 'Stardust Dirk' }],
  'weapon.medium': [{ zh: '鐵劍', en: 'Iron Sword' }, { zh: '騎士劍', en: 'Knight Sword' }, { zh: '太刀', en: 'Tachi' }, { zh: '破魔之劍', en: 'Evilbane' }, { zh: '始源之劍', en: 'Origin Blade' }],
  'weapon.heavy':  [{ zh: '伐木斧', en: 'Woodcutter Axe' }, { zh: '戰鎚', en: 'War Hammer' }, { zh: '大劍', en: 'Greatsword' }, { zh: '斬龍刀', en: 'Wyrmcleaver' }, { zh: '星墜巨鎚', en: 'Starfall Maul' }],
  'armor.light':   [{ zh: '旅人斗篷', en: 'Traveler Cloak' }, { zh: '皮甲', en: 'Leather Vest' }, { zh: '影之衣', en: 'Shade Garb' }, { zh: '風精羽衣', en: 'Sylph Robe' }, { zh: '夜空外套', en: 'Nightsky Coat' }],
  'armor.medium':  [{ zh: '鎖子甲', en: 'Chain Mail' }, { zh: '鱗甲', en: 'Scale Mail' }, { zh: '獵人裝束', en: 'Hunter Set' }, { zh: '龍鱗甲', en: 'Dragonscale' }, { zh: '勇者之鎧', en: 'Hero Armor' }],
  'armor.heavy':   [{ zh: '鐵板甲', en: 'Iron Plate' }, { zh: '重騎士鎧', en: 'Heavy Knight Plate' }, { zh: '動甲冑殼', en: 'Living Armor Shell' }, { zh: '古龍甲殼', en: 'Elder Carapace' }, { zh: '不朽城壁', en: 'Undying Bulwark' }],
  'ring':          [{ zh: '銅戒', en: 'Copper Ring' }, { zh: '銀戒', en: 'Silver Ring' }, { zh: '精靈戒', en: 'Fae Ring' }, { zh: '龍眼戒', en: 'Dragoneye Ring' }, { zh: '環蛇之戒', en: 'Ouroboros Ring' }],
  'amulet':        [{ zh: '木護符', en: 'Wood Charm' }, { zh: '聖印', en: 'Holy Sigil' }, { zh: '月光墜', en: 'Moonlight Pendant' }, { zh: '英雄徽章', en: 'Hero Crest' }, { zh: '未讀之頁', en: 'Unread Page' }],
};

export interface AffixDef { key: ModKey; kind: 'add' | 'mul'; per: number; flat: number; slots: Slot[] }
/** value = (flat + per * ilvl) * random(0.6..1.2) * (1 + 0.15 * rarity) */
export const AFFIXES: AffixDef[] = [
  { key: 'str', kind: 'add', flat: 2, per: 0.45, slots: ['weapon', 'armor', 'ring', 'amulet'] },
  { key: 'dex', kind: 'add', flat: 2, per: 0.45, slots: ['weapon', 'armor', 'ring', 'amulet'] },
  { key: 'int', kind: 'add', flat: 2, per: 0.45, slots: ['weapon', 'armor', 'ring', 'amulet'] },
  { key: 'vit', kind: 'add', flat: 2, per: 0.45, slots: ['weapon', 'armor', 'ring', 'amulet'] },
  { key: 'agi', kind: 'add', flat: 2, per: 0.45, slots: ['weapon', 'armor', 'ring', 'amulet'] },
  { key: 'luk', kind: 'add', flat: 1, per: 0.3, slots: ['ring', 'amulet'] },
  { key: 'atk', kind: 'mul', flat: 0.04, per: 0.0006, slots: ['weapon', 'ring'] },
  { key: 'def', kind: 'mul', flat: 0.04, per: 0.0006, slots: ['armor', 'amulet'] },
  { key: 'hp', kind: 'mul', flat: 0.04, per: 0.0006, slots: ['armor', 'amulet'] },
  { key: 'speed', kind: 'mul', flat: 0.03, per: 0.0004, slots: ['weapon', 'ring'] },
  { key: 'crit', kind: 'add', flat: 0.015, per: 0.0002, slots: ['weapon', 'ring', 'amulet'] },
  { key: 'xp', kind: 'mul', flat: 0.05, per: 0.0008, slots: ['ring', 'amulet'] },
  { key: 'gold', kind: 'mul', flat: 0.06, per: 0.001, slots: ['ring', 'amulet'] },
  { key: 'drop', kind: 'mul', flat: 0.05, per: 0.0008, slots: ['ring', 'amulet'] },
];

/** Blacksmith: +1 to +10. Each plus adds 10% of the base atk/def. */
export const SMITH_MAX = 10;
export const SMITH_CHANCE = [1, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
export const SMITH_STEP = 0.1;
export const SMITH_DROP_FROM = 5;
export const smithCost = (ilvl: number, plus: number): number => Math.floor((ilvl + 8) * 6 * Math.pow(plus + 1, 2.2));

export const DROP_CHANCE = 0.12;
export const BAG_SIZE = 30;
