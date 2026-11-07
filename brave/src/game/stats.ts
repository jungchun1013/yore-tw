import { PRIMARY, type Item, type Save, type StatKey } from './types';
import { raceOf } from '../data/races';
import { WEIGHTS, SMITH_STEP } from '../data/items';
import { addOf, collectMods, mulOf } from './mods';

export interface Derived {
  prim: Record<StatKey, number>;
  hp: number; atk: number; magic: number; def: number; interval: number;
  crit: number; critDmg: number; eva: number; acc: number;
  xp: number; gold: number; drop: number; heal: number;
  petPower: number; guard: number; petHeal: number;
  cp: number;
}

export const itemAtk = (it: Item): number => (5 + it.ilvl * 2.6) * WEIGHTS[it.weight || 'medium'].atk * (1 + it.plus * SMITH_STEP);
export const itemDef = (it: Item): number => (3 + it.ilvl * 1.6) * WEIGHTS[it.weight || 'medium'].def * (1 + it.plus * SMITH_STEP);

export function derive(s: Save): Derived {
  const t = collectMods(s);
  const race = raceOf(s.race);
  const prim = {} as Record<StatKey, number>;
  for (const k of PRIMARY) prim[k] = (race.base[k] + s.grown[k] + s.legacy[k] + addOf(t, k)) * mulOf(t, k);

  const w = s.equip.weapon, a = s.equip.armor;
  const wAtk = w ? itemAtk(w) : 3;
  const aDef = a ? itemDef(a) : 0;
  const baseInterval = w ? WEIGHTS[w.weight || 'medium'].interval : 1.5;
  const penalty = a ? WEIGHTS[a.weight || 'medium'].speedPenalty : 0;

  const atk = (wAtk + prim.str * 1.6 + addOf(t, 'atk')) * mulOf(t, 'atk');
  const magic = (prim.int * 3 + atk * 0.3 + addOf(t, 'magic')) * mulOf(t, 'magic');
  const hp = (60 + prim.vit * 9 + s.lvl * 5 + addOf(t, 'hp')) * mulOf(t, 'hp');
  const def = (aDef + prim.vit * 0.4 + addOf(t, 'def')) * mulOf(t, 'def');
  const speed = (1 + prim.agi * 0.004) * mulOf(t, 'speed');
  const interval = Math.max(0.35, (baseInterval * (1 + penalty)) / speed);
  const crit = Math.min(0.6, 0.05 + prim.luk * 0.0025 + addOf(t, 'crit'));
  const critDmg = 1.5 + prim.dex * 0.003 + addOf(t, 'critDmg');
  const eva = Math.min(0.5, prim.agi * 0.0015 + (a ? WEIGHTS[a.weight || 'medium'].eva : 0) + addOf(t, 'eva'));
  const acc = prim.dex + addOf(t, 'acc') * 100;

  const d: Derived = {
    prim, hp, atk, magic, def, interval, crit, critDmg, eva, acc,
    xp: mulOf(t, 'xp'),
    gold: (1 + prim.luk * 0.004) * mulOf(t, 'gold'),
    drop: (1 + prim.luk * 0.003) * mulOf(t, 'drop'),
    heal: 0.05 + addOf(t, 'heal'),
    petPower: mulOf(t, 'petPower'),
    guard: Math.min(0.6, addOf(t, 'guard')),
    petHeal: addOf(t, 'petHeal'),
    cp: 0,
  };
  d.cp = cpOf(d.atk * (1 + d.crit * (d.critDmg - 1)) / d.interval, d.hp * (1 + d.def / 60) / (1 - d.eva) / (1 - d.guard));
  return d;
}

/** Combat Power: geometric mean of damage per second and effective HP. A guide, not a rule. */
export const cpOf = (dps: number, ehp: number): number => Math.round(Math.sqrt(Math.max(0, dps * ehp)));

export const xpNeed = (lvl: number): number => Math.floor(12 * Math.pow(lvl, 2.05) + 20);
