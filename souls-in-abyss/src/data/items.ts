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
export const PIECE: Record<string, number> = { head: 0.2, body: 0.4, legs: 0.25, feet: 0.15, shield: 0.35 };

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
  'legs.light':  [{ zh: '布褲', en: 'Cloth Trousers' }, { zh: '旅人長褲', en: 'Traveler Pants' }, { zh: '影行褲', en: 'Shade Leggings' }, { zh: '風精褲', en: 'Sylph Leggings' }, { zh: '星塵褲', en: 'Stardust Leggings' }],
  'legs.medium': [{ zh: '皮褲', en: 'Leather Pants' }, { zh: '鱗甲裙', en: 'Scale Tassets' }, { zh: '獵人褲', en: 'Hunter Pants' }, { zh: '龍鱗腿甲', en: 'Dragonscale Legguards' }, { zh: '勇者腿甲', en: 'Hero Legguards' }],
  'legs.heavy':  [{ zh: '鐵腿甲', en: 'Iron Legplates' }, { zh: '重騎士腿甲', en: 'Knight Legplates' }, { zh: '動甲冑腿', en: 'Living Legplates' }, { zh: '古龍腿甲', en: 'Elder Legplates' }, { zh: '不朽腿甲', en: 'Undying Legplates' }],
  'feet.light':  [{ zh: '草鞋', en: 'Straw Sandals' }, { zh: '旅人靴', en: 'Traveler Boots' }, { zh: '影步靴', en: 'Shadestep Boots' }, { zh: '風精靴', en: 'Sylph Boots' }, { zh: '流星靴', en: 'Meteor Boots' }],
  'feet.medium': [{ zh: '皮靴', en: 'Leather Boots' }, { zh: '鱗靴', en: 'Scale Boots' }, { zh: '獵人靴', en: 'Hunter Boots' }, { zh: '龍鱗靴', en: 'Dragonscale Boots' }, { zh: '勇者之靴', en: 'Hero Boots' }],
  'feet.heavy':  [{ zh: '鐵靴', en: 'Iron Greaves' }, { zh: '重騎士脛甲', en: 'Knight Greaves' }, { zh: '動甲冑足', en: 'Living Greaves' }, { zh: '古龍脛甲', en: 'Elder Greaves' }, { zh: '不朽之步', en: 'Undying Stride' }],
  'shield.light':  [{ zh: '皮圓盾', en: 'Hide Buckler' }, { zh: '旅人小盾', en: 'Traveler Buckler' }, { zh: '影紋盾', en: 'Shade Buckler' }, { zh: '風精之盾', en: 'Sylph Shield' }, { zh: '星芒盾', en: 'Starburst Shield' }],
  'shield.medium': [{ zh: '鳶盾', en: 'Kite Shield' }, { zh: '鱗盾', en: 'Scale Shield' }, { zh: '獵人盾', en: 'Hunter Shield' }, { zh: '龍鱗盾', en: 'Dragonscale Shield' }, { zh: '勇者之盾', en: 'Hero Shield' }],
  'shield.heavy':  [{ zh: '鐵塔盾', en: 'Iron Tower Shield' }, { zh: '重騎士盾', en: 'Knight Tower Shield' }, { zh: '動甲冑盾', en: 'Living Bulwark' }, { zh: '古龍甲盾', en: 'Elder Shell Shield' }, { zh: '不朽壁壘', en: 'Undying Wall' }],
  'ring': [{ zh: '銅戒', en: 'Copper Ring' }, { zh: '銀月戒', en: 'Silver Moon Ring' }, { zh: '精靈之戒', en: 'Fae Ring' }, { zh: '龍眼戒', en: 'Dragoneye Ring' }, { zh: '深淵之環', en: 'Abyssal Loop' }],
  'neck': [{ zh: '麻繩護符', en: 'Twine Charm' }, { zh: '銀護符', en: 'Silver Charm' }, { zh: '風精墜飾', en: 'Sylph Pendant' }, { zh: '龍牙項鍊', en: 'Dragonfang Necklace' }, { zh: '未讀之頁', en: 'Unread Page' }],
};

export interface AffixDef { key: ModKey; kind: 'add' | 'mul'; per: number; flat: number; kinds: Kind[] }
const ALL: Kind[] = ['weapon', 'shield', 'head', 'body', 'legs', 'feet', 'ring', 'neck'];
const CHARMS: Kind[] = ['ring', 'neck'];
/** value = (flat + per * ilvl) * random(0.6..1.2) * (1 + 0.15 * rarity) */
export const AFFIXES: AffixDef[] = [
  { key: 'str', kind: 'add', flat: 2, per: 0.35, kinds: ALL },
  { key: 'dex', kind: 'add', flat: 2, per: 0.35, kinds: ALL },
  { key: 'int', kind: 'add', flat: 2, per: 0.35, kinds: ALL },
  { key: 'will', kind: 'add', flat: 2, per: 0.35, kinds: ALL },
  { key: 'luk', kind: 'add', flat: 1, per: 0.25, kinds: [...CHARMS, 'head'] },
  { key: 'atkMax', kind: 'add', flat: 2, per: 0.5, kinds: ['weapon', 'ring'] },
  { key: 'bal', kind: 'add', flat: 0.03, per: 0.0003, kinds: ['weapon', 'legs'] },
  { key: 'crit', kind: 'add', flat: 0.015, per: 0.0002, kinds: ['weapon', 'ring'] },
  { key: 'def', kind: 'add', flat: 1, per: 0.25, kinds: ['head', 'body', 'legs', 'feet', 'shield'] },
  { key: 'prt', kind: 'add', flat: 0.01, per: 0.0001, kinds: ['body', 'legs', 'shield'] },
  { key: 'hp', kind: 'mul', flat: 0.04, per: 0.0006, kinds: ['body', 'neck', 'shield'] },
  { key: 'mp', kind: 'mul', flat: 0.05, per: 0.0006, kinds: ['head', 'neck'] },
  { key: 'xp', kind: 'mul', flat: 0.05, per: 0.0008, kinds: CHARMS },
  { key: 'gold', kind: 'mul', flat: 0.06, per: 0.001, kinds: [...CHARMS, 'feet'] },
];

/** Blacksmith: +1 to +10. Each plus adds 10% of the base numbers. */
export const SMITH_MAX = 10;
export const SMITH_CHANCE = [1, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
export const SMITH_STEP = 0.1;
export const SMITH_DROP_FROM = 5;
export const smithCost = (ilvl: number, plus: number): number => Math.floor((ilvl + 8) * 4 * Math.pow(plus + 1, 2.2));

export const DROP_CHANCE = 0.14;
export const BAG_SIZE = 40;
