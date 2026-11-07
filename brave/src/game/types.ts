// Shared types. Everything that changes numbers goes through Mod, so a new system
// (food, guild, events...) only has to register a ModSource in game/mods.ts.

export type StatKey = 'str' | 'dex' | 'int' | 'vit' | 'agi' | 'luk';
export const PRIMARY: StatKey[] = ['str', 'dex', 'int', 'vit', 'agi', 'luk'];

export type ModKey =
  | StatKey
  | 'hp' | 'atk' | 'def' | 'speed' | 'crit' | 'critDmg' | 'eva' | 'acc'
  | 'xp' | 'gold' | 'drop' | 'magic' | 'heal'
  | 'petPower' | 'guard' | 'petHeal';

/** add is applied before mul; mul values from every source are summed (0.1 = +10%). */
export interface Mod { key: ModKey; add?: number; mul?: number }

export type Weight = 'light' | 'medium' | 'heavy';
export type Slot = 'weapon' | 'armor' | 'ring' | 'amulet';
export const SLOTS: Slot[] = ['weapon', 'armor', 'ring', 'amulet'];

export interface Item {
  uid: number;
  slot: Slot;
  weight?: Weight;   // weapon/armor only
  ilvl: number;
  rarity: number;    // 0 common .. 4 legendary
  plus: number;      // blacksmith level
  affixes: Mod[];
  name: number;      // index into the name pool of its slot/weight
}

export interface PetState { key: string; lvl: number; xp: number; bond: number; bondT: number }

export interface Counters {
  kills: number; deaths: number; rebirths: number; bestPlus: number;
  fateLines: number; deepest: number; playSec: number;
}

export interface Save {
  v: number;
  name: string;
  race: string;
  age: number;
  ageT: number;           // seconds into the current year
  lvl: number;
  xp: number;
  grown: Record<StatKey, number>;   // gained this life (levels + birthdays), lost on rebirth
  legacy: Record<StatKey, number>;  // kept forever, fed by rebirth
  gold: number;
  ap: number;
  skills: Record<string, number>;
  equip: Partial<Record<Slot, Item>>;
  bag: Item[];
  nextUid: number;
  area: string;
  pets: PetState[];
  activePet: string | null;
  titles: string[];
  counters: Counters;
  autoSell: number;       // drops below this rarity are sold on pickup
  lastSeen: number;
}

export type L = { zh: string; en: string };
