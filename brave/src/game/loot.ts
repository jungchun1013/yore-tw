import type { Item, Kind, Mod, Save, Weight, L } from './types';
import { AFFIXES, NAMES, RARITY, WEIGHT_KEYS } from '../data/items';
import { pick, range, weighted } from '../core/rng';

export function rollRarity(dropMul: number): number {
  // luck flattens the curve: rarer tiers gain weight faster than common ones
  const f = Math.max(1, dropMul);
  return weighted(RARITY.map((r, i) => r.w * Math.pow(f, i * 0.6)));
}

const KIND_ROLL: Kind[] = ['weapon', 'weapon', 'head', 'body', 'hands', 'feet', 'acc', 'acc'];

export function makeItem(s: Save, ilvl: number, rarity: number, kind?: Kind, weight?: Weight): Item {
  const k = kind || pick(KIND_ROLL);
  const w = k === 'acc' ? undefined : weight || pick(WEIGHT_KEYS);
  const pool = AFFIXES.filter(a => a.kinds.includes(k));
  const affixes: Mod[] = [];
  const want = Math.max(RARITY[rarity].affixes, k === 'acc' ? 1 : 0);
  for (let i = 0; i < want && pool.length; i++) {
    const a = pool.splice(Math.floor(range(0, pool.length)), 1)[0];
    const v = (a.flat + a.per * ilvl) * range(0.6, 1.2) * (1 + 0.15 * rarity);
    affixes.push(a.kind === 'add' ? { key: a.key, add: v < 1 ? Math.round(v * 1000) / 1000 : Math.round(v) } : { key: a.key, mul: Math.round(v * 1000) / 1000 });
  }
  return { uid: s.nextUid++, kind: k, weight: w, ilvl, rarity, plus: 0, affixes, name: Math.min(4, Math.floor(ilvl / 26)) };
}

export const nameOf = (it: Item): L => NAMES[it.weight ? it.kind + '.' + it.weight : it.kind][it.name];
export const sellPrice = (it: Item): number => Math.floor((it.ilvl + 5) * 2 * Math.pow(1 + it.rarity, 1.5) * (1 + it.plus * 0.6));
