import { AREAS, type Area, type MonDef } from '../data/areas';
import type { L } from './types';
import { pick, irange } from '../core/rng';
import { cpOf } from './stats';

export interface Monster { def: MonDef; lvl: number; hp: number; maxHp: number; atk: number; armor: number; prt: number; interval: number; xp: number; gold: number; cp: number }

export function makeMonster(d: MonDef, lvl: number): Monster {
  const hp = (14 + 9 * lvl + 0.45 * lvl * lvl + 0.006 * lvl * lvl * lvl) * d.hp;
  const m: Monster = {
    def: d, lvl, hp, maxHp: hp,
    atk: (4 + 2.4 * lvl + 0.03 * lvl * lvl + 0.0004 * lvl * lvl * lvl) * d.atk,
    armor: lvl * 0.4 * d.def,
    prt: d.prt,
    interval: 2.0 * d.spd,
    xp: (6 + 3.5 * lvl + 0.12 * lvl * lvl) * (0.8 + 0.2 * d.hp),
    gold: (3 + lvl * 1.4 + 0.05 * lvl * lvl) * (0.8 + 0.2 * d.hp),
    cp: 0,
  };
  m.cp = cpOf(m.atk / m.interval, m.maxHp * (1 + m.armor / 40) / (1 - m.prt));
  return m;
}

export function spawn(a: Area): Monster { return makeMonster(pick(a.mons), irange(a.min, a.max)); }

/** Suggested CP means "you win comfortably", not "even fight". */
const SAFE = 1.8;
export function areaCp(a: Area): number {
  const lvl = Math.round((a.min * 2 + a.max) / 3);
  const s = a.mons.reduce((acc, d) => acc + makeMonster(d, lvl).cp, 0);
  return Math.round((s / a.mons.length) * SAFE);
}
export const AREA_CP = AREAS.map(areaCp);

/** BWE's difficulty label, from the monster's CP against yours. */
export const DIFFICULTY: { max: number; name: L; color: string }[] = [
  { max: 0.25, name: { zh: '最弱', en: 'WEAKEST' }, color: '#9a9a9a' },
  { max: 0.5, name: { zh: '弱', en: 'WEAK' }, color: '#3fa34d' },
  { max: 0.8, name: { zh: '普通', en: 'NORMAL' }, color: '#3b6fd8' },
  { max: 1.2, name: { zh: '強', en: 'STRONG' }, color: '#e0791a' },
  { max: 2, name: { zh: '可怕', en: 'AWFUL' }, color: '#d43d3d' },
  { max: Infinity, name: { zh: '頭目級', en: 'BOSS' }, color: '#8e3fd1' },
];
export const difficulty = (monCp: number, heroCp: number) => DIFFICULTY.find(d => monCp * 0.9 / Math.max(1, heroCp) <= d.max)!;
