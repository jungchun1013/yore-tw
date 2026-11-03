export interface GeneratorDef {
  id: string;
  name: string;
  desc: string;
  zh?: { name: string; desc: string };
  baseCost: number;
  baseProd: number;
  costMult: number;
  /** macaron palette key used for this cat's upgrade icons */
  color: string;
  /** fur definition key, see content/coats */
  coat: string;
  /** accessory overlay id for the pixel sprite */
  accessory: string;
  /** hidden until this achievement is unlocked */
  secret?: string;
}

export type UpgradeEffect =
  | { type: 'genMult'; gen: string; mult: number }
  | { type: 'clickMult'; mult: number }
  | { type: 'globalMult'; mult: number }
  | { type: 'clickPct'; pct: number }
  | { type: 'offlineHours'; hours: number }
  | { type: 'startKittens'; count: number }
  | { type: 'offlineRate'; add: number }
  | { type: 'customerMult'; mult: number };

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  zh?: { name: string; desc: string };
  cost: number;
  currency: 'macarons' | 'stars';
  effect: UpgradeEffect;
  /** visible once this requirement is met */
  requires?: { gen?: string; count?: number; clicks?: number; earned?: number };
  icon: string;
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  zh?: { name: string; desc: string };
  check: (s: GameState, ctx: AchievementCtx) => boolean;
}

export interface AchievementCtx {
  cps: number;
}

export type DiaryKind = 'cuddle' | 'fight' | 'nap' | 'rest' | 'bless' | 'timeskip' | 'star' | 'post' | 'customer' | 'prestige' | 'rainbow' | 'chat' | 'boxwalk' | 'treasure' | 'play';
export type DiaryBg = 'kitchen' | 'counter' | 'oven' | 'front' | 'park' | 'roof' | 'alley' | 'night' | 'cushion' | 'bed' | 'cathouse' | 'tent' | 'fish' | 'cattree' | 'window' | 'scratcher' | 'hangball' | 'fishbowl' | 'basket';
export interface DiaryEntry {
  t: number;
  kind: DiaryKind;
  /** where the photo was taken */
  bg?: DiaryBg;
  /** a moment the player snapped (shown as a post immediately) */
  snap?: boolean;
  /** generator ids (or species / 'shopcat') pictured, up to two */
  cats: string[];
  text: string;
}

/** Ways a floor cat can slack off; each lowers passive production while it lasts. */
export type SlackKind = 'nap' | 'love' | 'fight' | 'window' | 'play';

export interface GameState {
  version: number;
  macarons: number;
  totalEarned: number;
  allTimeEarned: number;
  clicks: number;
  gens: Record<string, number>;
  upgrades: string[];
  starUpgrades: string[];
  achievements: string[];
  stars: number;
  prestigeCount: number;
  boostUntil: number;
  boostMult: number;
  /** timestamp when the rewarded boost can be requested again */
  rushReadyAt: number;
  /** offline earnings computed but not yet collected (persisted so a reload cannot lose them) */
  pendingOffline: { amount: number; seconds: number; capped: boolean } | null;
  /** the shop cat's name (player editable) */
  heroName: string;
  /** cat type → timestamp until which it is 'loved' (petted) and produces more */
  loved: Record<string, number>;
  /** customer codex: species → visits / orders served */
  customersSeen: Record<string, number>;
  customersServed: Record<string, number>;
  /** Meowstagram followers (influencer cat posts); more followers → customers come more often */
  followers: number;
  posts: number;
  /** furniture bought (ids) and which piece sits in each of the four floor slots */
  furnitureOwned: string[];
  furnitureSlots: (string | null)[];
  /** Cat Deity blessing: production multiplier until timestamp */
  blessedUntil: number;
  blessMult: number;
  /** Time Cat warp: everything runs faster until timestamp */
  warpUntil: number;
  warpMult: number;
  /** Cosmic Cat stardust: 10 fragments = 1 permanent star */
  starFragments: number;
  /** Rainbow Cat effect: production ×2 until this time (kept alive by the energy bar; transient) */
  rainbowUntil: number;
  /** shop diary (newest last) */
  diary: DiaryEntry[];
  lastTick: number;
  createdAt: number;
  playTimeMs: number;
  sound: boolean;
  /** cats currently slacking, by kind (set by the scene each frame; not meaningful offline) */
  slack: Record<SlackKind, number>;
  /** patting heat: percent bonus on passive production, built by tapping, decays when idle */
  heat: number;
  heatAt: number;
  /** completed onboarding steps (pat, hire, upgrade, feed) */
  tutorial: string[];
}
