import type { Kind, L, ModKey, Weight } from '../game/types';

/** Weapons: damage range, balance, crit, attack speed (SPD; 100 = one swing per 1.8 s). Armor: defense and protection. */
export interface WeightDef { name: L; min: number; max: number; bal: number; crit: number; spd: number; def: number; prt: number }
export const WEIGHTS: Record<Weight, WeightDef> = {
  light:  { name: { zh: '輕', en: 'Light' },  min: 0.5, max: 0.8, bal: 0.1,  crit: 0.05, spd: 150, def: 0.6, prt: 0 },
  medium: { name: { zh: '中', en: 'Medium' }, min: 0.6, max: 1.2, bal: 0,    crit: 0.02, spd: 100, def: 1.0, prt: 0.01 },
  heavy:  { name: { zh: '重', en: 'Heavy' },  min: 0.7, max: 2.0, bal: -0.1, crit: 0,    spd: 69,  def: 1.5, prt: 0.03 },
};
export const WEIGHT_KEYS: Weight[] = ['light', 'medium', 'heavy'];
/** Share of an armor set's defense carried by each piece. */
export const PIECE: Record<string, number> = { head: 0.2, body: 0.45, hands: 0.15, feet: 0.2 };

export const RARITY: { name: L; color: string; affixes: number; w: number }[] = [
  { name: { zh: '普通', en: 'Basic' },     color: '#667681', affixes: 0, w: 66 },
  { name: { zh: '魔法', en: 'Magic' },     color: '#53695e', affixes: 1, w: 22 },
  { name: { zh: '稀有', en: 'Rare' },      color: '#5f7d87', affixes: 2, w: 8 },
  { name: { zh: '完美', en: 'Perfect' },   color: '#a88a55', affixes: 3, w: 3 },
  { name: { zh: '史詩', en: 'Epic' },      color: '#b47f76', affixes: 4, w: 0.8 },
  { name: { zh: '傳說', en: 'Legendary' }, color: '#625575', affixes: 5, w: 0.2 },
];

/** Name pools by tier; an item picks by ilvl so names get grander deeper in. */
export const NAMES: Record<string, L[]> = {
  'weapon.light':  [{ zh: '剝皮小刀', en: 'Skinning Knife' }, { zh: '雙短劍', en: 'Twin Daggers' }, { zh: '細身劍', en: 'Rapier' }, { zh: '影縫', en: 'Shadowstitch' }, { zh: '星屑匕首', en: 'Stardust Dirk' }],
  'weapon.medium': [{ zh: '鐵劍', en: 'Iron Sword' }, { zh: '騎士劍', en: 'Knight Sword' }, { zh: '太刀', en: 'Tachi' }, { zh: '破魔之劍', en: 'Evilbane' }, { zh: '始源之劍', en: 'Origin Blade' }],
  'weapon.heavy':  [{ zh: '伐木斧', en: 'Woodcutter Axe' }, { zh: '戰鎚', en: 'War Hammer' }, { zh: '大劍', en: 'Greatsword' }, { zh: '斬龍刀', en: 'Wyrmcleaver' }, { zh: '星墜巨鎚', en: 'Starfall Maul' }],
  'head.light':  [{ zh: '頭巾', en: 'Bandana' }, { zh: '羽帽', en: 'Feather Cap' }, { zh: '影兜', en: 'Shade Hood' }, { zh: '風精髮飾', en: 'Sylph Circlet' }, { zh: '星冠', en: 'Star Crown' }],
  'head.medium': [{ zh: '皮盔', en: 'Leather Cap' }, { zh: '鱗盔', en: 'Scale Helm' }, { zh: '獵人帽', en: 'Hunter Cap' }, { zh: '龍鱗盔', en: 'Dragonscale Helm' }, { zh: '勇者之冠', en: 'Hero Circlet' }],
  'head.heavy':  [{ zh: '鐵盔', en: 'Iron Helm' }, { zh: '重騎士盔', en: 'Knight Helm' }, { zh: '動甲冑首', en: 'Living Helm' }, { zh: '古龍角盔', en: 'Elderhorn Helm' }, { zh: '不朽之盔', en: 'Undying Helm' }],
  'body.light':  [{ zh: '旅人斗篷', en: 'Traveler Cloak' }, { zh: '皮背心', en: 'Leather Vest' }, { zh: '影之衣', en: 'Shade Garb' }, { zh: '風精羽衣', en: 'Sylph Robe' }, { zh: '夜空外套', en: 'Nightsky Coat' }],
  'body.medium': [{ zh: '鎖子甲', en: 'Chain Mail' }, { zh: '鱗甲', en: 'Scale Mail' }, { zh: '獵人裝束', en: 'Hunter Set' }, { zh: '龍鱗甲', en: 'Dragonscale' }, { zh: '勇者之鎧', en: 'Hero Armor' }],
  'body.heavy':  [{ zh: '鐵板甲', en: 'Iron Plate' }, { zh: '重騎士鎧', en: 'Knight Plate' }, { zh: '動甲冑殼', en: 'Living Armor Shell' }, { zh: '古龍甲殼', en: 'Elder Carapace' }, { zh: '不朽城壁', en: 'Undying Bulwark' }],
  'hands.light':  [{ zh: '布手套', en: 'Cloth Gloves' }, { zh: '弓手護腕', en: 'Archer Bracers' }, { zh: '影之手', en: 'Shade Grips' }, { zh: '風精手套', en: 'Sylph Gloves' }, { zh: '星光手套', en: 'Starlight Gloves' }],
  'hands.medium': [{ zh: '皮手套', en: 'Leather Gloves' }, { zh: '鱗手甲', en: 'Scale Gauntlets' }, { zh: '獵人手甲', en: 'Hunter Gauntlets' }, { zh: '龍爪手甲', en: 'Dragonclaw' }, { zh: '勇者手甲', en: 'Hero Gauntlets' }],
  'hands.heavy':  [{ zh: '鐵手甲', en: 'Iron Gauntlets' }, { zh: '重騎士手甲', en: 'Knight Gauntlets' }, { zh: '動甲冑手', en: 'Living Gauntlets' }, { zh: '古龍手甲', en: 'Elder Gauntlets' }, { zh: '不朽之拳', en: 'Undying Fists' }],
  'feet.light':  [{ zh: '草鞋', en: 'Straw Sandals' }, { zh: '旅人靴', en: 'Traveler Boots' }, { zh: '影步靴', en: 'Shadestep Boots' }, { zh: '風精靴', en: 'Sylph Boots' }, { zh: '流星靴', en: 'Meteor Boots' }],
  'feet.medium': [{ zh: '皮靴', en: 'Leather Boots' }, { zh: '鱗靴', en: 'Scale Boots' }, { zh: '獵人靴', en: 'Hunter Boots' }, { zh: '龍鱗靴', en: 'Dragonscale Boots' }, { zh: '勇者之靴', en: 'Hero Boots' }],
  'feet.heavy':  [{ zh: '鐵靴', en: 'Iron Greaves' }, { zh: '重騎士脛甲', en: 'Knight Greaves' }, { zh: '動甲冑足', en: 'Living Greaves' }, { zh: '古龍脛甲', en: 'Elder Greaves' }, { zh: '不朽之步', en: 'Undying Stride' }],
  'acc': [{ zh: '銅戒', en: 'Copper Ring' }, { zh: '銀護符', en: 'Silver Charm' }, { zh: '精靈耳墜', en: 'Fae Earring' }, { zh: '龍眼戒', en: 'Dragoneye Ring' }, { zh: '未讀之頁', en: 'Unread Page' }],
};

export interface AffixDef { key: ModKey; kind: 'add' | 'mul'; per: number; flat: number; kinds: Kind[] }
const ALL: Kind[] = ['weapon', 'head', 'body', 'hands', 'feet', 'acc'];
/** value = (flat + per * ilvl) * random(0.6..1.2) * (1 + 0.15 * rarity) */
export const AFFIXES: AffixDef[] = [
  { key: 'str', kind: 'add', flat: 2, per: 0.35, kinds: ALL },
  { key: 'dex', kind: 'add', flat: 2, per: 0.35, kinds: ALL },
  { key: 'int', kind: 'add', flat: 2, per: 0.35, kinds: ALL },
  { key: 'will', kind: 'add', flat: 2, per: 0.35, kinds: ALL },
  { key: 'luk', kind: 'add', flat: 1, per: 0.25, kinds: ['acc', 'head'] },
  { key: 'atkMax', kind: 'add', flat: 2, per: 0.5, kinds: ['weapon', 'hands', 'acc'] },
  { key: 'bal', kind: 'add', flat: 0.03, per: 0.0003, kinds: ['weapon', 'hands'] },
  { key: 'crit', kind: 'add', flat: 0.015, per: 0.0002, kinds: ['weapon', 'acc', 'hands'] },
  { key: 'def', kind: 'add', flat: 1, per: 0.25, kinds: ['head', 'body', 'hands', 'feet'] },
  { key: 'prt', kind: 'add', flat: 0.01, per: 0.0001, kinds: ['body', 'feet'] },
  { key: 'hp', kind: 'mul', flat: 0.04, per: 0.0006, kinds: ['body', 'acc'] },
  { key: 'mp', kind: 'mul', flat: 0.05, per: 0.0006, kinds: ['head', 'acc'] },
  { key: 'xp', kind: 'mul', flat: 0.05, per: 0.0008, kinds: ['acc'] },
  { key: 'gold', kind: 'mul', flat: 0.06, per: 0.001, kinds: ['acc', 'feet'] },
];

/** Blacksmith: +1 to +10. Each plus adds 10% of the base numbers. */
export const SMITH_MAX = 10;
export const SMITH_CHANCE = [1, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
export const SMITH_STEP = 0.1;
export const SMITH_DROP_FROM = 5;
export const smithCost = (ilvl: number, plus: number): number => Math.floor((ilvl + 8) * 4 * Math.pow(plus + 1, 2.2));

export const DROP_CHANCE = 0.14;
export const BAG_SIZE = 40;
