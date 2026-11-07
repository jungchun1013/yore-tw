import { PRIMARY, type Save, type StatKey } from './types';
import { makeItem } from './loot';

export const SAVE_KEY = 'soulsinabyss.save';
export const SAVE_VERSION = 2;
export const YEAR_SEC = 20 * 60;     // one year of age per 20 real minutes
export const REBIRTH_AGE = 20;
export const LEGACY_RATE = 0.1;
export const OFFLINE_CAP = 6 * 3600;

export const zeroStats = (): Record<StatKey, number> => Object.fromEntries(PRIMARY.map(k => [k, 0])) as Record<StatKey, number>;

export function newSave(name: string, race: string, age: number): Save {
  const s: Save = {
    v: SAVE_VERSION, name, race, age, ageT: 0, lvl: 1, xp: 0,
    grown: zeroStats(), legacy: zeroStats(),
    gold: 0, ap: 5, skills: {}, equip: {}, bag: [], nextUid: 1,
    area: 'meadow', pets: [], activePet: null, titles: [],
    counters: { kills: 0, deaths: 0, rebirths: 0, bestPlus: 0, fateLines: 0, deepest: 0, playSec: 0 },
    autoSell: 1, lastSeen: Date.now(),
  };
  s.equip.weapon = makeItem(s, 1, 0, 'weapon', 'medium');
  s.equip.body = makeItem(s, 1, 0, 'body', 'light');
  return s;
}

/** Each entry upgrades a save from version i to i+1. Add one here whenever Save changes shape. */
const MIGRATIONS: ((s: any) => void)[] = [];

export function loadSave(): Save | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if ((s.v || 0) < 2) return null; // v1 was the first prototype with a different stat model
    while (s.v < SAVE_VERSION) { MIGRATIONS[s.v]?.(s); s.v++; }
    return s as Save;
  } catch (e) { return null; }
}
export function writeSave(s: Save): void {
  s.lastSeen = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { /* storage full or blocked */ }
}
export function clearSave(): void { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
