// Shared shapes for the simulation. Nothing in src/game or src/data touches the DOM,
// so the same code runs in the browser and in the headless balance sim.

export type Lang = 'zh' | 'en';
export type L = Record<Lang, string>;

export interface Stats {
  might: number;      // damage multiplier
  area: number;       // size multiplier
  cooldown: number;   // cooldown multiplier (lower is faster)
  speed: number;      // projectile speed multiplier
  duration: number;   // effect duration multiplier
  amount: number;     // extra projectiles
  move: number;       // move speed multiplier
  maxHp: number;      // max HP multiplier
  regen: number;      // HP per second
  armor: number;      // flat damage reduction
  magnet: number;     // pickup radius multiplier
  luck: number;       // chance of a fourth level-up choice, better chest odds
  growth: number;     // experience multiplier
  greed: number;      // coin multiplier
  revive: number;     // revives left
}

export type WeaponId = 'ofuda' | 'shikigami' | 'furin' | 'cracker' | 'foxfire' | 'salt' | 'lantern' | 'poe' | 'sword';
export type PassiveId = 'sake' | 'taiko' | 'ramune' | 'incense' | 'geta' | 'turtle' | 'omamori' | 'maneki' | 'pouch' | 'crane';
export type HeroId = 'miko' | 'deng' | 'unpei';

export interface WeaponNumbers {
  dmg: number;
  cd: number;        // seconds between volleys
  amount: number;
  area: number;      // multiplier
  speed: number;     // multiplier
  duration: number;  // multiplier
  pierce: number;
}

// One level-up step. dmg / amount / pierce add; the Pct fields are percentages.
export interface WeaponPatch {
  dmg?: number;
  amount?: number;
  pierce?: number;
  cdPct?: number;    // negative is faster
  areaPct?: number;
  speedPct?: number;
  durPct?: number;
}

export interface WeaponDef {
  id: WeaponId;
  name: L;
  desc: L;
  evoName: L;
  evoDesc: L;
  pair: PassiveId;          // owning this passive lets a max-level weapon evolve
  base: WeaponNumbers;
  ups: WeaponPatch[];       // level 2..6
  evo: WeaponPatch;         // applied on top of level 6 when evolved
}

export interface PassiveDef {
  id: PassiveId;
  name: L;
  desc: L;
  max: number;
  per: Partial<Stats>;      // added per level (multiplier stats are additive fractions)
}

export type EnemyAi = 'chase' | 'float' | 'hop' | 'shoot' | 'charge' | 'still' | 'parade' | 'boss';
export type BossMove = 'dash' | 'ring' | 'aimed' | 'spiral' | 'summon';

export interface EnemyDef {
  id: string;
  name: L;
  lore: L;
  hp: number;
  dmg: number;
  speed: number;
  r: number;
  xp: number;
  ai: EnemyAi;
  heavy?: number;           // knockback resistance 0..1
  shot?: { cd: number; speed: number; range: number };
  boss?: { moves: BossMove[]; minion: string };
}

export interface RosterEntry { id: string; from: number; to?: number; w: number }

export interface StageDef {
  id: string;
  name: L;
  blurb: L;
  roster: RosterEntry[];
  elites: [string, string, string];
  boss: string;
  hpMul: number;
  dmgMul: number;
  rate: number;             // population multiplier
  ground: string;           // key for the renderer
  props: string[];
  // trees scattered under everything (back) and a few large ones over the play field (front)
  trees?: { back: string[]; front: string[] };
}

export interface HeroDef {
  id: HeroId;
  name: L;
  title: L;
  desc: L;
  weapon: WeaponId;
  bonus: Partial<Stats>;
  unlockStage: number;      // cleared stage count needed (0 = from the start)
}

export interface MetaDef {
  id: string;
  name: L;
  desc: L;
  max: number;
  cost: number;             // first level; each next level costs cost * (level + 1)
  per: Partial<Stats> & { reroll?: number };
}

export interface OwnedWeapon { id: WeaponId; level: number; evolved: boolean; timer: number; burst: number; burstT: number; side: number }
export interface OwnedPassive { id: PassiveId; level: number }

export interface Enemy {
  uid: number;
  def: EnemyDef;
  x: number; y: number;
  hp: number; maxHp: number;
  dmg: number; speed: number; r: number;
  kx: number; ky: number;      // knockback velocity
  flash: number;
  t: number;                    // ai timer
  state: number;                // ai state
  ax: number; ay: number;       // ai direction (charge, parade)
  face: number;                 // -1 left, 1 right
  slow: number;                 // seconds of slow left
  elite: boolean;
  boss: boolean;
  dead: boolean;
  move: number;                 // boss move index
}

export type ShotMode = 'line' | 'orbit' | 'boomerang' | 'zone' | 'lob' | 'slash' | 'pulse' | 'strike' | 'rocket';

export interface Shot {
  mode: ShotMode;
  kind: string;                 // sprite key
  w: WeaponId;
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  dmg: number;
  pierce: number;
  life: number; age: number;
  tick: number;                 // seconds before the same enemy can be hit again (0 = once)
  hits: Map<number, number>;
  knock: number;
  ang: number;
  a: number; b: number;         // mode-specific
  tx: number; ty: number;       // target (lob, strike)
  slow: number;
  dead: boolean;
}

export interface Bullet { x: number; y: number; vx: number; vy: number; r: number; dmg: number; life: number; kind: string }

export type PickupKind = 'gem' | 'coin' | 'heal' | 'magnet' | 'purge' | 'chest';
export interface Pickup { kind: PickupKind; x: number; y: number; v: number; pull: boolean; age: number; dead: boolean }

export interface Fx { kind: 'num' | 'ring' | 'pop' | 'bolt' | 'slash' | 'puff' | 'warn'; x: number; y: number; t: number; life: number; v: number; a: number; text?: string; crit?: boolean }

export type ChoiceKind = 'weapon' | 'passive' | 'evolve' | 'coin' | 'heal';
export interface Choice { kind: ChoiceKind; id: string; level: number }

export interface ChestResult { items: Choice[]; coins: number }

export type SfxEvent = 'hit' | 'kill' | 'gem' | 'coin' | 'level' | 'hurt' | 'boom' | 'chest' | 'boss' | 'heal' | 'evolve' | 'clear' | 'dead' | 'parade';
