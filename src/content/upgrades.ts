import type { UpgradeDef } from '../core/types';
import { CATS } from './cats';
import { TIER_SUFFIX_ZH, CLICK_UPGRADE_ZH, PCT_UPGRADE_ZH, EQUIP_NAME_ZH, EQUIP_FLAVOUR_ZH, EQUIP_EFFECT_ZH, STAR_UPGRADE_ZH } from './zh';

const upgrades: UpgradeDef[] = [];

// Per-cat tier upgrades. Each cat has its own ladder: when it unlocks (owned count), how much it multiplies that cat,
// and the price as a multiple of the cat's base cost. Kittens get many cheap small steps, late cats fewer, bigger ones.
type Tier = [count: number, mult: number, costX: number];
const TIERS: Record<string, Tier[]> = {
  kitten:     [[1, 1.5, 5],  [5, 1.5, 24],  [15, 2, 110],  [40, 2, 820],   [100, 3, 7600]],
  apprentice: [[1, 1.5, 9],  [10, 2, 46],   [25, 2, 430],  [60, 2.5, 5400], [100, 3, 36000]],
  baker:      [[1, 2, 12],   [10, 2, 58],   [25, 2, 520],  [50, 3, 6800],  [100, 3, 51000]],
  courier:    [[1, 1.5, 10], [10, 2, 54],   [25, 2.5, 640], [50, 2.5, 7200], [100, 3, 62000]],
  patissier:  [[1, 2, 11],   [10, 2, 72],   [25, 2, 560],  [50, 3, 9300],  [100, 3, 74000]],
  manager:    [[1, 1.5, 9],  [10, 2.5, 84], [25, 2, 720],  [50, 3, 11500], [100, 3, 92000]],
  influencer: [[1, 2, 12],   [10, 2, 95],   [25, 2.5, 830], [50, 3, 12500], [100, 3, 105000]],
  deity:      [[1, 2, 14],   [10, 2, 105],  [25, 3, 1050], [50, 3, 14500], [100, 4, 125000]],
  timecat:    [[1, 2, 15],   [10, 2.5, 115], [25, 3, 1250], [50, 3, 16500], [100, 4, 150000]],
  cosmic:     [[1, 2, 18],   [10, 3, 135],  [25, 3, 1550], [50, 4, 21000], [100, 4, 210000]],
  rainbow:    [[1, 2, 10],   [10, 2, 60],   [25, 2, 500],  [50, 3, 5000],  [100, 3, 50000]],
};
const TIER_SUFFIX = ['warm paws', 'better whisk', 'secret recipe', 'golden oven', 'legendary nap'];
const round2 = (n: number) => Number(n.toPrecision(2));
for (const cat of CATS) {
  (TIERS[cat.id] ?? TIERS.rainbow).forEach(([count, mult, costX], i) => {
    upgrades.push({
      id: `${cat.id}_t${i + 1}`,
      name: `${cat.name}: ${TIER_SUFFIX[i]}`,
      desc: `${cat.name}s produce ×${mult}.`,
      cost: round2(cat.baseCost * costX),
      currency: 'macarons',
      effect: { type: 'genMult', gen: cat.id, mult },
      requires: { gen: cat.id, count },
      icon: cat.color,
      zh: { name: `${cat.zh?.name ?? cat.name}：${TIER_SUFFIX_ZH[i]}`, desc: `${cat.zh?.name ?? cat.name}的產量 ×${mult}。` },
    });
  });
}

// Patting upgrades. Each doubles (or triples) a pat; the 1st, 3rd and 5th also raise the heat cap,
// so steady tapping lifts passive production by up to 20 / 30 / 40 %.
const CLICKS: { id: string; name: string; cost: number; clicks: number; mult: number; heat: number }[] = [
  { id: 'click1', name: 'Soft paws',       cost: 120,   clicks: 10,   mult: 2, heat: 20 },
  { id: 'click2', name: 'Toe beans',       cost: 1800,  clicks: 100,  mult: 2, heat: 0 },
  { id: 'click3', name: 'Double pat',      cost: 28000, clicks: 500,  mult: 2, heat: 30 },
  { id: 'click4', name: 'Purr resonance',  cost: 6.5e5, clicks: 1500, mult: 3, heat: 0 },
  { id: 'click5', name: 'Zoomies',         cost: 2.4e7, clicks: 5000, mult: 3, heat: 40 },
];
for (const c of CLICKS) {
  upgrades.push({
    id: c.id, name: c.name, desc: `Patting gives ×${c.mult} macarons.${c.heat ? ` Steady tapping now heats passive production up to +${c.heat}%.` : ''}`,
    cost: c.cost, currency: 'macarons', effect: { type: 'clickMult', mult: c.mult },
    requires: { clicks: c.clicks }, icon: `pat:${c.id}`,
    zh: { name: CLICK_UPGRADE_ZH[c.id], desc: `拍店長得到 ×${c.mult} 馬卡龍。${c.heat ? `連拍會累積熱度，被動產量最多 +${c.heat}%。` : ''}` },
  });
}
/** Heat cap (percent) granted by each patting upgrade; the highest owned one applies. */
export const HEAT_CAPS: Record<string, number> = Object.fromEntries(CLICKS.filter((c) => c.heat).map((c) => [c.id, c.heat]));

// Click scales with production (keeps clicking relevant late game).
const PCT: { id: string; name: string; cost: number; pct: number; earned: number }[] = [
  { id: 'pct1', name: 'Whisker sense',  cost: 1.5e5, pct: 0.01,  earned: 6e4 },
  { id: 'pct2', name: 'Kitchen sync',   cost: 1.2e7, pct: 0.015, earned: 5e6 },
  { id: 'pct3', name: 'Nine lives',     cost: 1.5e9, pct: 0.025, earned: 6e8 },
];
for (const p of PCT) {
  upgrades.push({
    id: p.id, name: p.name, desc: `Each pat also gives ${p.pct * 100}% of your macarons per second.`,
    cost: p.cost, currency: 'macarons', effect: { type: 'clickPct', pct: p.pct },
    requires: { earned: p.earned }, icon: `pat:${p.id}`,
    zh: { name: PCT_UPGRADE_ZH[p.id], desc: `每次拍擊額外給每秒產量的 ${p.pct * 100}%。` },
  });
}

// Kitchen equipment: four stations × three tiers. Each tier is a visible upgrade on the factory floor
// and a global production multiplier. Costs climb one order of magnitude per step across the whole game.
export const STATIONS = ['mixer', 'piping', 'oven', 'box'] as const;
export type Station = typeof STATIONS[number];
/** Each station strengthens one system, so the machine you see glowing tells you what got better. */
const EQUIPMENT_EFFECT: Record<Station, UpgradeDef['effect']> = {
  mixer:  { type: 'clickMult', mult: 1.6 },      // patting the cat
  piping: { type: 'globalMult', mult: 1.25 },    // every cat's output
  oven:   { type: 'offlineRate', add: 0.15 },    // offline earnings rate 50% → 95%
  box:    { type: 'customerMult', mult: 1.6 },   // walk-in customer orders
};
const EQUIPMENT_EFFECT_TEXT: Record<Station, string> = {
  mixer: 'Patting gives +60% more macarons.',
  piping: 'All cats produce +25% more.',
  oven: 'Offline earnings +15% of full rate.',
  box: 'Customer orders pay +60% more.',
};
// Each tier is one real step of making macarons, in order: the kitchen teaches the recipe as it grows.
const EQUIPMENT_NAMES: Record<Station, [string, string, string]> = {
  mixer:  ['Flour sifter', 'Meringue mixer', 'Macaronage station'],
  piping: ['Parchment trays', 'Silicone template mat', 'Resting rack with fan'],
  oven:   ['Baking stone', 'Convection oven', 'Deck oven + cooling rack'],
  box:    ['Ganache filling', 'Gift box inserts', 'Ripening fridge'],
};
const EQUIPMENT_FLAVOUR_TIER: Record<Station, [string, string, string]> = {
  mixer: ['Almond flour and icing sugar sifted together: no lumps, smooth shells.', 'Stiff peaks every time, no tired paws.', 'Fold until the batter flows like a ribbon. The cats call it "the slow part".'],
  piping: ['Lined trays: every round the same size, nothing sticks.', 'Printed circles on the mat, so every row lines up.', 'A gentle fan dries the rounds until a skin forms: that skin becomes the feet.'],
  oven: ['A stone keeps the heat steady from below: no cracked tops.', 'A fan keeps the heat even, so every shell bakes alike.', 'Two decks baking, baked shells cooling on the wire rack above.'],
  box: ['A swirl of ganache, two shells pressed together.', 'A kraft insert keeps each macaron in its own slot.', 'A day in the cold: the shell softens into the filling. Customers can tell.'],
};
// Costs climb through the game but not in lockstep: each step is a different jump, so there is always one that is "next".
const EQUIPMENT_COST: Record<Station, [number, number, number]> = {
  mixer:  [4.5e3, 3.8e7, 1.2e11],
  piping: [6.2e4, 3.5e8, 9e11],
  oven:   [4.6e5, 2.6e9, 6.5e12],
  box:    [3.3e6, 1.9e10, 4.4e13],
};
for (let tier = 0; tier < 3; tier++) {
  for (const st of STATIONS) {
    const cost = EQUIPMENT_COST[st][tier];
    upgrades.push({
      id: `equip_${st}_t${tier + 1}`,
      name: EQUIPMENT_NAMES[st][tier],
      desc: `${EQUIPMENT_FLAVOUR_TIER[st][tier]} ${EQUIPMENT_EFFECT_TEXT[st]}`,
      cost, currency: 'macarons', effect: EQUIPMENT_EFFECT[st],
      requires: { earned: cost * 0.4 }, icon: `prop:${st}:${tier + 1}`,
      zh: { name: EQUIP_NAME_ZH[st][tier], desc: `${EQUIP_FLAVOUR_ZH[st][tier]}${EQUIP_EFFECT_ZH[st]}` },
    });
  }
}

export const UPGRADES: UpgradeDef[] = upgrades;
export const UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(upgrades.map((u) => [u.id, u]));

/** Permanent upgrades bought with stars; survive prestige. */
const STAR_EN: UpgradeDef[] = [
  { id: 'star_kittens', name: 'Kitten nursery', desc: 'Start every new shop with 10 kittens.', cost: 3, currency: 'stars', effect: { type: 'startKittens', count: 10 }, icon: 'toy:yarn' },
  { id: 'star_click',   name: 'Star paws',      desc: 'Patting gives twice as many macarons, forever.', cost: 5, currency: 'stars', effect: { type: 'clickMult', mult: 2 }, icon: 'toy:wand' },
  { id: 'star_offline', name: 'Night shift',    desc: 'Offline earnings cover 16 hours instead of 8.', cost: 8, currency: 'stars', effect: { type: 'offlineHours', hours: 8 }, icon: 'toy:mouse' },
  { id: 'star_global',  name: 'Constellation',  desc: 'All production +25%, forever.', cost: 15, currency: 'stars', effect: { type: 'globalMult', mult: 1.25 }, icon: 'toy:fish' },
];
export const STAR_UPGRADES: UpgradeDef[] = STAR_EN.map((u) => ({ ...u, zh: STAR_UPGRADE_ZH[u.id] }));
export const STAR_UPGRADE_BY_ID: Record<string, UpgradeDef> = Object.fromEntries(STAR_UPGRADES.map((u) => [u.id, u]));
