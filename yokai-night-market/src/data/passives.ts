import type { HeroDef, HeroId, MetaDef, PassiveDef, PassiveId, Stats } from '../game/types';

export const PASSIVES: PassiveDef[] = [
  { id: 'sake', name: { zh: '神酒', en: 'Sacred Sake' }, desc: { zh: '傷害 +8%', en: 'Damage +8%' }, max: 5, per: { might: 0.08 } },
  { id: 'taiko', name: { zh: '太鼓', en: 'Taiko Drum' }, desc: { zh: '範圍 +8%', en: 'Area +8%' }, max: 5, per: { area: 0.08 } },
  { id: 'ramune', name: { zh: '彈珠汽水', en: 'Marble Soda' }, desc: { zh: '冷卻 -5%', en: 'Cooldown -5%' }, max: 5, per: { cooldown: -0.05 } },
  { id: 'incense', name: { zh: '線香', en: 'Incense' }, desc: { zh: '持續時間 +10%', en: 'Duration +10%' }, max: 5, per: { duration: 0.1 } },
  { id: 'geta', name: { zh: '木屐', en: 'Geta Clogs' }, desc: { zh: '移動速度 +7%', en: 'Move speed +7%' }, max: 5, per: { move: 0.07 } },
  { id: 'turtle', name: { zh: '紅龜粿', en: 'Red Turtle Cake' }, desc: { zh: '生命上限 +12%，每秒回復 +0.2', en: 'Max HP +12%, regen +0.2/s' }, max: 5, per: { maxHp: 0.12, regen: 0.2 } },
  { id: 'omamori', name: { zh: '劍獅', en: 'Sword Lion' }, desc: { zh: '受到的傷害 -1', en: 'Damage taken -1' }, max: 5, per: { armor: 1 } },
  { id: 'maneki', name: { zh: '虎爺', en: 'Tiger Lord' }, desc: { zh: '拾取範圍 +25%，香油錢 +10%', en: 'Pickup range +25%, coins +10%' }, max: 5, per: { magnet: 0.25, greed: 0.1 } },
  { id: 'pouch', name: { zh: '香火袋', en: 'Incense Pouch' }, desc: { zh: '經驗 +6%，運氣 +6%', en: 'Experience +6%, luck +6%' }, max: 5, per: { growth: 0.06, luck: 0.06 } },
  { id: 'crane', name: { zh: '紙鶴', en: 'Paper Crane' }, desc: { zh: '所有武器數量 +1', en: 'All weapons fire +1' }, max: 2, per: { amount: 1 } },
];
export const PASSIVE: Record<PassiveId, PassiveDef> = Object.fromEntries(PASSIVES.map((p) => [p.id, p])) as Record<PassiveId, PassiveDef>;

export const HEROES: HeroDef[] = [
  {
    id: 'miko',
    name: { zh: '小滿', en: 'Xiaoman' },
    title: { zh: '神社見習巫女', en: 'Shrine Apprentice' },
    desc: { zh: '帶著符札上路。冷卻 -8%。', en: 'Starts with Ofuda. Cooldown -8%.' },
    weapon: 'ofuda',
    bonus: { cooldown: -0.08 },
    unlockStage: 0,
  },
  {
    id: 'sayo',
    name: { zh: '小夜', en: 'Sayo' },
    title: { zh: '見習巫女・小滿的同期', en: "Shrine Apprentice, Xiaoman's classmate" },
    desc: { zh: '帶著狐火上路。持續時間 +15%。', en: 'Starts with Foxfire. Duration +15%.' },
    weapon: 'foxfire',
    bonus: { duration: 0.15 },
    unlockStage: 0,
  },
  {
    // layout preview only: name, text and ability are placeholders until the user decides them
    id: 'fox',
    name: { zh: '狐狸（暫名）', en: 'Fox (working name)' },
    title: { zh: '—', en: '—' },
    desc: { zh: '能力未定', en: 'Ability not decided' },
    weapon: 'ofuda',
    bonus: {},
    unlockStage: 0,
  },
  {
    id: 'deng',
    name: { zh: '阿燈', en: 'A-Deng' },
    title: { zh: '五條港囝仔', en: 'Five Channels Kid' },
    desc: { zh: '剛做完十六歲，口袋塞滿鞭炮。移動 +10%、範圍 +10%。', en: 'Just had his sixteenth-year rite. Starts with Firecrackers. Move +10%, area +10%.' },
    weapon: 'cracker',
    bonus: { move: 0.1, area: 0.1 },
    unlockStage: 2,
  },
  {
    id: 'unpei',
    name: { zh: '雲平', en: 'Unpei' },
    title: { zh: '武德殿的劍道生', en: 'Butokuden Kendo Student' },
    desc: { zh: '揹著桃木劍。生命 +20%、傷害 +10%。', en: 'Starts with the Peachwood Sword. HP +20%, damage +10%.' },
    weapon: 'sword',
    bonus: { maxHp: 0.2, might: 0.1 },
    unlockStage: 4,
  },
];
export const HERO: Record<HeroId, HeroDef> = Object.fromEntries(HEROES.map((h) => [h.id, h])) as Record<HeroId, HeroDef>;

// Permanent upgrades bought with coins between runs ("ema" votive plaques).
export const META: MetaDef[] = [
  { id: 'might', name: { zh: '武運', en: 'Fortune in Battle' }, desc: { zh: '傷害 +5%', en: 'Damage +5%' }, max: 5, cost: 80, per: { might: 0.05 } },
  { id: 'hp', name: { zh: '無病息災', en: 'Good Health' }, desc: { zh: '生命上限 +10%', en: 'Max HP +10%' }, max: 5, cost: 60, per: { maxHp: 0.1 } },
  { id: 'armor', name: { zh: '厄除', en: 'Ward Off Evil' }, desc: { zh: '受到的傷害 -1', en: 'Damage taken -1' }, max: 3, cost: 150, per: { armor: 1 } },
  { id: 'regen', name: { zh: '身體健康', en: 'Sound Body' }, desc: { zh: '每秒回復 +0.15', en: 'Regen +0.15/s' }, max: 4, cost: 90, per: { regen: 0.15 } },
  { id: 'move', name: { zh: '交通安全', en: 'Safe Travels' }, desc: { zh: '移動速度 +4%', en: 'Move speed +4%' }, max: 5, cost: 60, per: { move: 0.04 } },
  { id: 'cooldown', name: { zh: '技藝上達', en: 'Honed Craft' }, desc: { zh: '冷卻 -3%', en: 'Cooldown -3%' }, max: 4, cost: 120, per: { cooldown: -0.03 } },
  { id: 'magnet', name: { zh: '良緣', en: 'Good Ties' }, desc: { zh: '拾取範圍 +15%', en: 'Pickup range +15%' }, max: 3, cost: 70, per: { magnet: 0.15 } },
  { id: 'growth', name: { zh: '學業成就', en: 'Scholarship' }, desc: { zh: '經驗 +5%', en: 'Experience +5%' }, max: 5, cost: 90, per: { growth: 0.05 } },
  { id: 'greed', name: { zh: '商賣繁盛', en: 'Thriving Trade' }, desc: { zh: '香油錢 +10%', en: 'Coins +10%' }, max: 5, cost: 70, per: { greed: 0.1 } },
  { id: 'reroll', name: { zh: '重抽籤', en: 'Draw Again' }, desc: { zh: '每局多一次重抽', en: '+1 reroll per run' }, max: 3, cost: 100, per: { reroll: 1 } },
  { id: 'revive', name: { zh: '起死回生', en: 'Second Wind' }, desc: { zh: '每局可復活一次', en: 'One revive per run' }, max: 1, cost: 600, per: { revive: 1 } },
];

export function metaCost(def: MetaDef, level: number): number {
  return def.cost * (level + 1);
}

export function baseStats(): Stats {
  return { might: 1, area: 1, cooldown: 1, speed: 1, duration: 1, amount: 0, move: 1, maxHp: 1, regen: 0, armor: 0, magnet: 1, luck: 0, growth: 1, greed: 1, revive: 0 };
}

export function addStats(s: Stats, per: Partial<Stats>, times = 1): void {
  for (const k of Object.keys(per) as (keyof Stats)[]) s[k] += (per[k] ?? 0) * times;
}
