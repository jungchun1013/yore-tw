import type { L, Stats } from '../game/types';

// Snacks sold at the stall on the map. Bought with coins, packed for the next run only, one of each.
export interface FoodDef { id: string; name: L; desc: L; price: number; per: Partial<Stats> }

export const FOODS_FOR_SALE: FoodDef[] = [
  { id: 'danzai', name: { zh: '擔仔麵', en: 'Danzai Noodles' }, desc: { zh: '這一局生命上限 +15%', en: 'Max HP +15% this run' }, price: 60, per: { maxHp: 0.15 } },
  { id: 'milkfish', name: { zh: '虱目魚湯', en: 'Milkfish Soup' }, desc: { zh: '這一局每秒回復 +0.4', en: 'Regen +0.4/s this run' }, price: 60, per: { regen: 0.4 } },
  { id: 'wagui', name: { zh: '碗粿', en: 'Wa-kue' }, desc: { zh: '這一局受到的傷害 -1', en: 'Damage taken -1 this run' }, price: 80, per: { armor: 1 } },
  { id: 'pengbing', name: { zh: '椪餅', en: 'Phong-piann' }, desc: { zh: '這一局拾取範圍 +30%', en: 'Pickup range +30% this run' }, price: 50, per: { magnet: 0.3 } },
  { id: 'dango', name: { zh: '糰子', en: 'Dango' }, desc: { zh: '這一局移動速度 +8%', en: 'Move speed +8% this run' }, price: 60, per: { move: 0.08 } },
  { id: 'lurou', name: { zh: '滷肉飯', en: 'Braised Pork Rice' }, desc: { zh: '這一局傷害 +10%', en: 'Damage +10% this run' }, price: 80, per: { might: 0.1 } },
];
export const FOOD: Record<string, FoodDef> = Object.fromEntries(FOODS_FOR_SALE.map((f) => [f.id, f]));
