import type { Mod, ModKey, Save } from './types';
import { raceOf } from '../data/races';
import { SKILLS } from '../data/skills';
import { TITLES } from '../data/titles';
import { petOf, stageOf } from '../data/pets';

/**
 * Every system that changes numbers is a ModSource. To add food, buffs, guilds...
 * write one function returning Mod[] and push it onto SOURCES. Nothing else changes.
 */
export type ModSource = { key: string; collect: (s: Save) => Mod[] };

export const SOURCES: ModSource[] = [
  { key: 'race', collect: s => raceOf(s.race).mods },
  { key: 'gear', collect: s => Object.values(s.equip).flatMap(it => (it ? it.affixes : [])) },
  { key: 'skills', collect: s => SKILLS.flatMap(d => (d.mods && s.skills[d.key] ? d.mods(s.skills[d.key], s) : [])) },
  { key: 'titles', collect: s => TITLES.filter(t => s.titles.includes(t.key)).flatMap(t => t.mods) },
  {
    key: 'pet', collect: s => {
      const st = s.pets.find(p => p.key === s.activePet);
      const d = st && petOf(st.key);
      return st && d ? d.mods(stageOf(st.lvl), st.bond, s.counters.rebirths) : [];
    },
  },
];

export interface ModTable { add: Record<string, number>; mul: Record<string, number> }

export function collectMods(s: Save, extra: Mod[] = []): ModTable {
  const t: ModTable = { add: {}, mul: {} };
  const put = (m: Mod) => {
    if (m.add) t.add[m.key] = (t.add[m.key] || 0) + m.add;
    if (m.mul) t.mul[m.key] = (t.mul[m.key] || 0) + m.mul;
  };
  for (const src of SOURCES) src.collect(s).forEach(put);
  extra.forEach(put);
  return t;
}
export const addOf = (t: ModTable, k: ModKey): number => t.add[k] || 0;
export const mulOf = (t: ModTable, k: ModKey): number => 1 + (t.mul[k] || 0);
