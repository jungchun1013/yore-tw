// Shared types. Everything that changes numbers goes through Mod, so a new system
// (food, guild, events...) only has to register a ModSource in game/mods.ts.

export type StatKey = 'str' | 'dex' | 'int' | 'will' | 'luk';
export const PRIMARY: StatKey[] = ['str', 'dex', 'int', 'will', 'luk'];

export type ModKey =
  | StatKey
  | 'hp' | 'mp' | 'atk' | 'atkMin' | 'atkMax' | 'bal' | 'crit' | 'critDmg' | 'def' | 'prt' | 'speed' | 'magic'
  | 'xp' | 'gold' | 'drop' | 'heal'
  | 'petPower' | 'guard' | 'petHeal'
  | 'dmgTaken' | 'sanDrain';

/** add is applied before mul; mul values from every source are summed (0.1 = +10%). */
export interface Mod { key: ModKey; add?: number; mul?: number }

export type Weight = 'light' | 'medium' | 'heavy';
/** What an item is. Accessories fit either accessory slot. */
export type Kind = 'weapon' | 'head' | 'body' | 'hands' | 'feet' | 'acc';
/** Where it is worn: the seven circles on the paper doll. */
export type Slot = 'weapon' | 'head' | 'body' | 'hands' | 'feet' | 'acc1' | 'acc2';
export const SLOTS: Slot[] = ['head', 'weapon', 'body', 'hands', 'acc1', 'feet', 'acc2'];
export const ARMOR_KINDS: Kind[] = ['head', 'body', 'hands', 'feet'];

export interface Item {
  uid: number;
  kind: Kind;
  weight?: Weight;   // weapon and armor pieces
  ilvl: number;
  rarity: number;    // 0 basic .. 5 legendary
  plus: number;      // blacksmith level
  affixes: Mod[];
  name: number;      // index into the name pool of its kind/weight
}

export interface PetState { key: string; lvl: number; xp: number; bond: number; bondT: number }

export interface Counters {
  kills: number; deaths: number; rebirths: number; bestPlus: number;
  fateLines: number; deepest: number; playSec: number; collapses?: number;
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
  skills: Record<string, number>;   // rank index: 0 = not learned, 1 = F ... 15 = 1
  equip: Partial<Record<Slot, Item>>;
  bag: Item[];
  nextUid: number;
  area: string;
  pets: PetState[];
  activePet: string | null;
  titles: string[];
  counters: Counters;
  autoSell: number;       // drops below this rarity are sold on pickup
  san: number;                        // sanity, 0..SAN_MAX
  pact: [string, string] | null;      // gift + curse for this life
  offers: [string, string][] | null;  // what the Abyss offers at the next rebirth
  lastSeen: number;
}

export type L = { zh: string; en: string };
