import type { Item, Mod, Save, Slot, Weight } from './types';
import { AFFIXES, NAMES, RARITY, WEIGHT_KEYS } from '../data/items';
import { pick, range, weighted } from '../core/rng';
import type { L } from './types';

export function rollRarity(dropMul: number): number {
  // luck flattens the curve: rarer tiers gain weight faster than common ones
  const f = Math.max(1, dropMul);
  return weighted(RARITY.map((r, i) => r.w * Math.pow(f, i * 0.6)));
}

export function makeItem(s: Save, ilvl: number, rarity: number, slot?: Slot, weight?: Weight): Item {
  const sl = slot || (pick(['weapon', 'weapon', 'armor', 'armor', 'ring', 'amulet']) as Slot);
  const w = sl === 'weapon' || sl === 'armor' ? weight || pick(WEIGHT_KEYS) : undefined;
  const pool = AFFIXES.filter(a => a.slots.includes(sl));
  const affixes: Mod[] = [];
  const want = Math.max(RARITY[rarity].affixes, sl === 'ring' || sl === 'amulet' ? 1 : 0);
  for (let i = 0; i < want && pool.length; i++) {
    const a = pool.splice(Math.floor(range(0, pool.length)), 1)[0];
    const v = (a.flat + a.per * ilvl) * range(0.6, 1.2) * (1 + 0.15 * rarity);
    affixes.push(a.kind === 'add' ? { key: a.key, add: round(a.key, v) } : { key: a.key, mul: Math.round(v * 1000) / 1000 });
  }
  return { uid: s.nextUid++, slot: sl, weight: w, ilvl, rarity, plus: 0, affixes, name: Math.min(4, Math.floor(ilvl / 26)) };
}
const round = (k: string, v: number) => (k === 'crit' ? Math.round(v * 1000) / 1000 : Math.max(1, Math.round(v)));

export const nameOf = (it: Item): L => NAMES[it.weight ? it.slot + '.' + it.weight : it.slot][it.name];
export const sellPrice = (it: Item): number => Math.floor((it.ilvl + 5) * 2.5 * Math.pow(1 + it.rarity, 1.6) * (1 + it.plus * 0.6));
