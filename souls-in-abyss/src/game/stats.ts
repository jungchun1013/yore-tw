import { PRIMARY, ARMOR_KINDS, type Item, type Save, type StatKey } from './types';
import { raceOf } from '../data/races';
import { PIECE, WEIGHTS, SMITH_STEP } from '../data/items';
import { addOf, collectMods, mulOf } from './mods';

/** The character sheet, BWE style. bal/crit/prt are fractions (0.22 = 22). */
export interface Derived {
  prim: Record<StatKey, number>;
  hp: number; mp: number; atkMin: number; atkMax: number; bal: number; crit: number; critDmg: number;
  def: number; prt: number; magic: number; interval: number;
  xp: number; gold: number; drop: number; heal: number;
  petPower: number; guard: number; petHeal: number;
  dmgTaken: number; sanDrain: number;
  cp: number;
}

const up = (it: Item) => 1 + it.plus * SMITH_STEP;
const wBase = (it: Item) => 4 + it.ilvl * 2.4;
export const weaponRange = (it: Item): [number, number] => {
  const w = WEIGHTS[it.weight || 'medium'];
  return [wBase(it) * w.min * up(it), wBase(it) * w.max * up(it)];
};
export const armorDef = (it: Item): number => (3 + it.ilvl * 1.0) * WEIGHTS[it.weight || 'medium'].def * (PIECE[it.kind] || 0) * up(it);
export const armorPrt = (it: Item): number => WEIGHTS[it.weight || 'medium'].prt * (1 + it.ilvl / 60) * (PIECE[it.kind] || 0) * up(it);

export function derive(s: Save): Derived {
  const t = collectMods(s);
  const race = raceOf(s.race);
  const prim = {} as Record<StatKey, number>;
  for (const k of PRIMARY) prim[k] = (race.base[k] + s.grown[k] + s.legacy[k] + addOf(t, k)) * mulOf(t, k);

  const w = s.equip.weapon;
  const wd = WEIGHTS[w?.weight || 'medium'];
  const [wMin, wMax] = w ? weaponRange(w) : [1, 3];
  const pieces = ARMOR_KINDS.map(k => s.equip[k as 'head']).filter(Boolean) as Item[];

  const atkMul = mulOf(t, 'atk');
  const atkMin = (wMin + prim.str / 3 + addOf(t, 'atkMin')) * atkMul;
  const atkMax = Math.max(atkMin, (wMax + prim.str / 2.5 + addOf(t, 'atkMax')) * atkMul);
  const bal = clamp(0.3 + (w ? wd.bal : 0) + (prim.dex - 10) * 0.004 + addOf(t, 'bal'), 0.1, 0.8);
  const crit = clamp(0.03 + (w ? wd.crit : 0) + (prim.will - 10) * 0.0012 + (prim.luk - 10) * 0.0025 + addOf(t, 'crit'), 0, 0.6);
  const def = (pieces.reduce((a, it) => a + armorDef(it), 0) + prim.str / 10 + addOf(t, 'def')) * mulOf(t, 'def');
  const prt = clamp(pieces.reduce((a, it) => a + armorPrt(it), 0) + addOf(t, 'prt'), 0, 0.6);
  const hp = (50 + s.lvl * 6 + prim.will * 1.2 + prim.str * 0.6 + addOf(t, 'hp')) * mulOf(t, 'hp');
  const mp = (20 + s.lvl * 2 + prim.int * 1.5 + addOf(t, 'mp')) * mulOf(t, 'mp');
  const magic = (5 + s.lvl + prim.int * 1.2 + addOf(t, 'magic')) * mulOf(t, 'magic');
  const interval = Math.max(0.35, (w ? wd.interval : 1.5) / ((1 + prim.dex * 0.002) * mulOf(t, 'speed')));

  const d: Derived = {
    prim, hp, mp, atkMin, atkMax, bal, crit, critDmg: 1.5 + addOf(t, 'critDmg'), def, prt, magic, interval,
    xp: mulOf(t, 'xp'),
    gold: (1 + prim.luk * 0.004) * mulOf(t, 'gold'),
    drop: (1 + prim.luk * 0.003) * mulOf(t, 'drop'),
    heal: 0.05 + addOf(t, 'heal'),
    petPower: mulOf(t, 'petPower'),
    guard: Math.min(0.6, addOf(t, 'guard')),
    petHeal: addOf(t, 'petHeal'),
    dmgTaken: mulOf(t, 'dmgTaken'),
    sanDrain: Math.max(0, mulOf(t, 'sanDrain')),
    cp: 0,
  };
  const avg = atkMin + (atkMax - atkMin) * bal;
  d.cp = cpOf(avg * (1 + crit * (d.critDmg - 1)) / interval, hp * (1 + def / 40) / (1 - prt) / (1 - d.guard));
  return d;
}

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

/** Combat Power: geometric mean of damage per second and effective HP. A guide, not a rule. */
export const cpOf = (dps: number, ehp: number): number => Math.round(Math.sqrt(Math.max(0, dps * ehp)));

export const xpNeed = (lvl: number): number => Math.floor(12 * Math.pow(lvl, 2.05) + 20);
