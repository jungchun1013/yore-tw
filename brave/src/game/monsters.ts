import { AREAS, type Area, type MonDef } from '../data/areas';
import { pick, irange } from '../core/rng';
import { cpOf } from './stats';

export interface Monster { def: MonDef; lvl: number; hp: number; maxHp: number; atk: number; armor: number; interval: number; eva: number; xp: number; gold: number }

export function makeMonster(d: MonDef, lvl: number): Monster {
  const hp = (14 + 9 * lvl + 0.45 * lvl * lvl + 0.006 * lvl * lvl * lvl) * d.hp;
  return {
    def: d, lvl, hp, maxHp: hp,
    atk: (3 + 2.2 * lvl + 0.03 * lvl * lvl + 0.0004 * lvl * lvl * lvl) * d.atk,
    armor: (1 + lvl * 1.4) * d.def,
    interval: 2.0 * d.spd,
    eva: d.eva,
    xp: (6 + 3.5 * lvl + 0.12 * lvl * lvl) * (0.8 + 0.2 * d.hp),
    gold: (3 + lvl * 1.4 + 0.05 * lvl * lvl) * (0.8 + 0.2 * d.hp),
  };
}

export function spawn(a: Area): Monster { return makeMonster(pick(a.mons), irange(a.min, a.max)); }

/** Suggested CP: the middle of the area, averaged over its monsters, on the same scale as the hero. */
/** Suggested CP means "you win comfortably", not "even fight". */
const SAFE = 1.8;

export function areaCp(a: Area): number {
  const lvl = Math.round((a.min * 2 + a.max) / 3);
  let s = 0;
  for (const d of a.mons) {
    const m = makeMonster(d, lvl);
    s += cpOf(m.atk / m.interval, m.maxHp * (1 + m.armor / 60) / (1 - m.eva));
  }
  return Math.round((s / a.mons.length) * SAFE);
}
export const AREA_CP = AREAS.map(areaCp);
