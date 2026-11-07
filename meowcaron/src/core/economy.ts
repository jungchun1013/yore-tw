import type { GameState, GeneratorDef, UpgradeDef, DiaryEntry, SlackKind } from './types';
import { CATS, CAT_BY_ID } from '../content/cats';
import { UPGRADES, UPGRADE_BY_ID, STAR_UPGRADES, STAR_UPGRADE_BY_ID, HEAT_CAPS } from '../content/upgrades';
import { ACHIEVEMENTS } from '../content/achievements';
import { FURNITURE_BY_ID, FURNITURE_SLOTS, FURNITURE_BONUS } from '../content/furniture';

export const SAVE_VERSION = 1;

/** Prestige tuning. stars = floor((totalEarnedThisRun / base) ^ exp) */
/** Cookie-Clicker style: stars follow ALL-TIME earnings (cube root), minus the stars already held, so every
 *  star costs more than the last and short repeated runs never pay. base is tuned so a routine player
 *  (a few sessions a day, harvesting every ~6 h) reaches the first star after about two days. */
export const PRESTIGE = {
  base: 1e15,
  exp: 1 / 3,
  bonusPerStar: 0.25,
  /** minimum stars gained for prestige button to be enabled */
  minStars: 1,
};

export const OFFLINE = {
  rate: 0.5,
  /** hours at the full offline rate; after that the shop winds down to tailRate (the cats doze off) */
  baseHours: 6,
  tailRate: 0.1,
  /** nothing is credited past this many hours away */
  maxHours: 48,
  /** absences shorter than this (seconds) are just a tab switch: credited at full speed, no welcome-back screen */
  graceSeconds: 300,
  /** away at least this long: the whole floor is found asleep and has to be tapped awake */
  dozeAfterSeconds: 1800,
};

export const ACHIEVEMENT_BONUS = 0.01;

/** Rewarded-ad boost ("Catnip rush"). */
export const RUSH = { mult: 2, durationMs: 120_000, cooldownMs: 600_000 };

/** Slacking: every cat that is napping, cuddling, fighting or staring out of the window takes SLACK.perCat off
 *  passive production (capped). Tap the cat to snap it out of it. */
export const SLACK = { perCat: 0.04, max: 0.4 };
export const SLACK_KINDS: SlackKind[] = ['nap', 'love', 'fight', 'window', 'play', 'eat'];
export function slackCount(s: GameState): number { return SLACK_KINDS.reduce((a, k) => a + (s.slack?.[k] ?? 0), 0); }
export function slackMultiplier(s: GameState): number { return 1 - Math.min(SLACK.max, slackCount(s) * SLACK.perCat); }

/** Patting heat: every pat adds HEAT.perTap percent to passive production (needs the first paw upgrade); 50 pats ≈ +3%,
 *  a minute of steady tapping ≈ +20%. It holds for HEAT.graceMs after the last pat, then cools HEAT.decayPerSec per second. */
export const HEAT = { perTap: 0.06, graceMs: 3000, decayPerSec: 1.0 };
export function heatCap(s: GameState): number {
  let cap = 0;
  for (const id of s.upgrades) cap = Math.max(cap, HEAT_CAPS[id] ?? 0);
  return cap;
}
export function heatMultiplier(s: GameState): number { return 1 + Math.min(s.heat, heatCap(s)) / 100; }

/** Petting a floor cat: a few pats' worth, once per cat per cooldown. */
export const PET = { clickMultiple: 2, cooldownMs: 20_000, lovedMs: 60_000, lovedEach: 0.01 };

export const lovedKey = (genId: string, slot: number): string => `${genId}#${slot}`;
/** Number of individual cats currently loved (petted within PET.lovedMs). */
export function lovedCount(s: GameState, now: number, genId?: string): number {
  let n = 0;
  for (const [k, until] of Object.entries(s.loved)) if (until > now && (!genId || k.startsWith(genId + '#'))) n++;
  return n;
}
export function lovedMultiplier(s: GameState, now: number): number { return 1 + lovedCount(s, now) * PET.lovedEach; }
export function isLovedCat(s: GameState, genId: string, slot: number, now: number): boolean { return (s.loved[lovedKey(genId, slot)] ?? 0) > now; }
export const HERO_NAME_MAX = 14;

/** Meowstagram: the influencer cat posts now and then; followers shorten the gap between customers. */
export const GRAM = { minGapSec: 120, maxGapSec: 240, maxGapCut: 0.3, followersForMaxCut: 4000, rushCustomers: 3 };
export function customerGapMultiplier(s: GameState): number {
  return 1 - Math.min(GRAM.maxGapCut, (s.followers / GRAM.followersForMaxCut) * GRAM.maxGapCut);
}
export function hasInfluencer(s: GameState): boolean { return (s.gens.influencer ?? 0) > 0; }

/** Special abilities of the late cats. Each scales gently with how many of that cat you own. */
/** Special-cat abilities recharge on an hours scale (a reason to come back), so each use is a real harvest. */
export const ABILITY = {
  deity: { cooldownSec: 3600, firstSec: 60, durationMs: 600_000, baseMult: 1.5, perCat: 0.1, maxMult: 2, burstSec: 300 },        // ×1.5 for 10 min + 5 min of production
  timecat: { cooldownSec: 7200, firstSec: 60, durationMs: 300_000, baseMult: 2, perCat: 0.5, maxMult: 3, offlineHoursPerCat: 2, maxOfflineHours: 8 }, // ×2 for 5 min; +2 h full-rate offline each
  cosmic: { cooldownSec: 10800, firstSec: 60, fragmentsPerStar: 10, starBonusPerCat: 0.1, maxStarBonus: 1, burstSec: 600 },      // a stardust + 10 min of production
  rainbow: { cooldownSec: 3600, firstSec: 60, burstSec: 120, mult: 2, durationMs: 10_000, tapsForDouble: 5 },                     // 2 min of production + ×2 for 10 s, tapping refills the bar
  influencer: { cooldownSec: 14_400, firstSec: 60 },                                                                              // one post every 4 h
};
export const ABILITY_IDS = Object.keys(ABILITY);
export function abilityReady(s: GameState, gen: string, now: number): boolean { return gen in ABILITY && now >= (s.abilityReadyAt[gen] ?? 0); }
export function abilityUsed(s: GameState, gen: string, now: number): void { const a = ABILITY[gen as keyof typeof ABILITY]; if (a) s.abilityReadyAt[gen] = now + a.cooldownSec * 1000; }
/** A newly hired special cat charges up quickly the first time, so the player meets the ability right away. */
export function abilityPrime(s: GameState, gen: string, now: number): void { const a = ABILITY[gen as keyof typeof ABILITY]; if (a && !(gen in s.abilityReadyAt)) s.abilityReadyAt[gen] = now + a.firstSec * 1000; }
export function blessMultiplier(s: GameState, now: number): number { return now < s.blessedUntil ? s.blessMult : 1; }
export function deityBlessMult(s: GameState): number {
  const n = s.gens.deity ?? 0;
  return n > 0 ? Math.min(ABILITY.deity.maxMult, ABILITY.deity.baseMult + (n - 1) * ABILITY.deity.perCat) : 1;
}
export function timeWarpMult(s: GameState): number {
  const n = s.gens.timecat ?? 0;
  return n > 0 ? Math.min(ABILITY.timecat.maxMult, ABILITY.timecat.baseMult + (n - 1) * ABILITY.timecat.perCat) : 1;
}
export function warpMultiplier(s: GameState, now: number): number { return now < s.warpUntil ? s.warpMult : 1; }
export function rainbowMultiplier(s: GameState, now: number): number { return now < (s.rainbowUntil ?? 0) ? ABILITY.rainbow.mult : 1; }
export function cosmicStarBonus(s: GameState): number {
  return Math.min(ABILITY.cosmic.maxStarBonus, (s.gens.cosmic ?? 0) * ABILITY.cosmic.starBonusPerCat);
}
export function buyFurniture(s: GameState, id: string): boolean {
  const def = FURNITURE_BY_ID[id];
  if (!def || s.furnitureOwned.includes(id) || s.macarons < def.cost) return false;
  s.macarons -= def.cost;
  s.furnitureOwned.push(id);
  return true;
}
export function placeFurniture(s: GameState, id: string | null, slot: number): boolean {
  if (slot < 0 || slot >= FURNITURE_SLOTS) return false;
  if (id !== null && !s.furnitureOwned.includes(id)) return false;
  // a piece can only be in one slot
  s.furnitureSlots = s.furnitureSlots.map((v, i) => (i === slot ? id : v === id ? null : v));
  return true;
}
export const DIARY_MAX = 40;
export function addDiary(s: GameState, entry: DiaryEntry): void {
  s.diary.push(entry);
  if (s.diary.length > DIARY_MAX) s.diary.splice(0, s.diary.length - DIARY_MAX);
}
export function postGain(s: GameState): number {
  const n = s.gens.influencer ?? 0;
  return Math.round((40 + Math.random() * 120) * Math.sqrt(Math.max(1, n)));
}

export function sanitizeName(raw: unknown, fallback = 'Mochi'): string {
  if (typeof raw !== 'string') return fallback;
  const s = raw.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, HERO_NAME_MAX);
  return s.length ? s : fallback;
}

export function newState(now = Date.now()): GameState {
  return {
    version: SAVE_VERSION,
    macarons: 0,
    totalEarned: 0,
    allTimeEarned: 0,
    clicks: 0,
    gens: {},
    upgrades: [],
    starUpgrades: [],
    achievements: [],
    stars: 0,
    prestigeCount: 0,
    heat: 0,
    heatAt: 0,
    slack: { nap: 0, love: 0, fight: 0, window: 0, play: 0, eat: 0 },
    boostUntil: 0,
    boostMult: 1,
    rushReadyAt: 0,
    pendingOffline: null,
    heroName: 'Mochi',
    loved: {},
    customersSeen: {},
    customersServed: {},
    followers: 0,
    posts: 0,
    furnitureOwned: ['cushion'],
    furnitureSlots: [null, null, 'cushion', null],
    blessedUntil: 0,
    blessMult: 1,
    warpUntil: 0,
    warpMult: 1,
    starFragments: 0,
    rainbowUntil: 0,
    abilityReadyAt: {},
    diary: [],
    lastTick: now,
    createdAt: now,
    playTimeMs: 0,
    sound: true,
    tutorial: [],
  };
}

export function genCost(def: GeneratorDef, owned: number): number {
  return Math.ceil(def.baseCost * Math.pow(def.costMult, owned));
}

/** Total cost of buying `n` more units starting from `owned`. */
export function genCostN(def: GeneratorDef, owned: number, n: number): number {
  const r = def.costMult;
  return Math.ceil(def.baseCost * Math.pow(r, owned) * (Math.pow(r, n) - 1) / (r - 1));
}

/** Max units affordable with `money`. */
export function maxAffordable(def: GeneratorDef, owned: number, money: number): number {
  if (!isFinite(money)) return 0;
  const r = def.costMult;
  const first = def.baseCost * Math.pow(r, owned);
  if (money < first) return 0;
  const n = Math.floor(Math.log(money * (r - 1) / first + 1) / Math.log(r));
  // guard against float rounding
  let k = Math.max(0, n);
  while (k > 0 && genCostN(def, owned, k) > money) k--;
  while (genCostN(def, owned, k + 1) <= money) k++;
  return k;
}

function allUpgradeDefs(s: GameState): UpgradeDef[] {
  const out: UpgradeDef[] = [];
  for (const id of s.upgrades) { const u = UPGRADE_BY_ID[id]; if (u) out.push(u); }
  for (const id of s.starUpgrades) { const u = STAR_UPGRADE_BY_ID[id]; if (u) out.push(u); }
  return out;
}

export function genMultiplier(s: GameState, genId: string, _now = Date.now()): number {
  let m = 1;
  for (const u of allUpgradeDefs(s)) if (u.effect.type === 'genMult' && u.effect.gen === genId) m *= u.effect.mult;
  return m;
}

export function furnitureMultiplier(s: GameState): number { return 1 + s.furnitureSlots.filter(Boolean).length * FURNITURE_BONUS; }

export function globalMultiplier(s: GameState, now = Date.now()): number {
  let m = 1;
  m *= lovedMultiplier(s, now);
  m *= blessMultiplier(s, now);
  m *= furnitureMultiplier(s);
  for (const u of allUpgradeDefs(s)) if (u.effect.type === 'globalMult') m *= u.effect.mult;
  m *= 1 + s.stars * PRESTIGE.bonusPerStar;
  m *= 1 + s.achievements.length * ACHIEVEMENT_BONUS;
  return m;
}

export function boostMultiplier(s: GameState, now: number): number {
  return now < s.boostUntil ? s.boostMult : 1;
}

/** Production of one generator type per second, before global/boost multipliers. */
export function genProduction(s: GameState, def: GeneratorDef, now = Date.now()): number {
  const owned = s.gens[def.id] ?? 0;
  return owned * def.baseProd * genMultiplier(s, def.id, now);
}

export function baseCps(s: GameState, now = Date.now()): number {
  let total = 0;
  for (const c of CATS) total += genProduction(s, c, now);
  return total * globalMultiplier(s, now);
}

export function cps(s: GameState, now: number): number {
  return baseCps(s, now) * boostMultiplier(s, now) * warpMultiplier(s, now) * heatMultiplier(s) * slackMultiplier(s) * rainbowMultiplier(s, now);
}

export function clickValue(s: GameState, now: number): number {
  let mult = 1;
  let pct = 0;
  for (const u of allUpgradeDefs(s)) {
    if (u.effect.type === 'clickMult') mult *= u.effect.mult;
    if (u.effect.type === 'clickPct') pct += u.effect.pct;
  }
  const base = 1 * mult * globalMultiplier(s, now) + pct * baseCps(s, now);
  return base * boostMultiplier(s, now) * warpMultiplier(s, now);
}

/** Number of purchased equipment tiers (0–3) for a factory station. */
export function equipmentTier(s: GameState, station: string): number {
  let t = 0;
  for (let i = 1; i <= 3; i++) if (s.upgrades.includes(`equip_${station}_t${i}`)) t++;
  return t;
}

export function offlineRate(s: GameState): number {
  let r = OFFLINE.rate;
  for (const u of allUpgradeDefs(s)) if (u.effect.type === 'offlineRate') r += u.effect.add;
  return Math.min(1, r);
}

export function customerMultiplier(s: GameState): number {
  let m = 1;
  for (const u of allUpgradeDefs(s)) if (u.effect.type === 'customerMult') m *= u.effect.mult;
  return m;
}

export function offlineHours(s: GameState): number {
  let h = OFFLINE.baseHours;
  for (const u of allUpgradeDefs(s)) if (u.effect.type === 'offlineHours') h += u.effect.hours;
  h += Math.min(ABILITY.timecat.maxOfflineHours, (s.gens.timecat ?? 0) * ABILITY.timecat.offlineHoursPerCat);
  return h;
}

export function startKittens(s: GameState): number {
  let n = 0;
  for (const u of allUpgradeDefs(s)) if (u.effect.type === 'startKittens') n += u.effect.count;
  return n;
}

export function earn(s: GameState, amount: number): void {
  if (!(amount > 0)) return;
  s.macarons += amount;
  s.totalEarned += amount;
  s.allTimeEarned += amount;
}

/** Advance the simulation by dt seconds of active play. */
export function tick(s: GameState, dtSec: number, now: number): number {
  const gained = cps(s, now) * dtSec;
  earn(s, gained);
  if (s.heat > 0 && now - s.heatAt > HEAT.graceMs) s.heat = Math.max(0, s.heat - HEAT.decayPerSec * dtSec);
  s.playTimeMs += dtSec * 1000;
  s.lastTick = now;
  return gained;
}

export function click(s: GameState, now: number): number {
  const v = clickValue(s, now);
  earn(s, v);
  s.clicks += 1;
  const cap = heatCap(s);
  if (cap > 0) { s.heat = Math.min(cap, s.heat + HEAT.perTap); s.heatAt = now; }
  return v;
}

export function genUnlocked(s: GameState, def: GeneratorDef): boolean { return !def.secret || s.achievements.includes(def.secret); }

export function canBuyGen(s: GameState, genId: string, n = 1): boolean {
  const def = CAT_BY_ID[genId];
  return !!def && genUnlocked(s, def) && s.macarons >= genCostN(def, s.gens[genId] ?? 0, n);
}

export function buyGen(s: GameState, genId: string, n = 1): boolean {
  const def = CAT_BY_ID[genId];
  if (!def || !genUnlocked(s, def)) return false;
  const owned = s.gens[genId] ?? 0;
  const cost = genCostN(def, owned, n);
  if (s.macarons < cost) return false;
  s.macarons -= cost;
  s.gens[genId] = owned + n;
  return true;
}

export function upgradeVisible(s: GameState, u: UpgradeDef): boolean {
  if (u.currency === 'stars') return s.prestigeCount > 0 || s.stars > 0;
  if (s.upgrades.includes(u.id)) return false;
  const r = u.requires;
  if (!r) return true;
  if (r.gen && (s.gens[r.gen] ?? 0) < (r.count ?? 1)) return false;
  if (r.clicks && s.clicks < r.clicks) return false;
  if (r.earned && s.allTimeEarned < r.earned) return false;
  return true;
}

export function availableUpgrades(s: GameState): UpgradeDef[] {
  return UPGRADES.filter((u) => upgradeVisible(s, u)).sort((a, b) => a.cost - b.cost);
}

export function buyUpgrade(s: GameState, id: string): boolean {
  const u = UPGRADE_BY_ID[id];
  if (!u || s.upgrades.includes(id) || !upgradeVisible(s, u) || s.macarons < u.cost) return false;
  s.macarons -= u.cost;
  s.upgrades.push(id);
  return true;
}

export function buyStarUpgrade(s: GameState, id: string): boolean {
  const u = STAR_UPGRADE_BY_ID[id];
  if (!u || s.starUpgrades.includes(id) || s.stars < u.cost) return false;
  s.stars -= u.cost;
  s.starUpgrades.push(id);
  return true;
}

export { STAR_UPGRADES };

/** Stars the player would receive by prestiging now. */
export function prestigeStars(s: GameState): number {
  return Math.max(0, Math.floor(Math.pow(s.allTimeEarned / PRESTIGE.base, PRESTIGE.exp) * (1 + cosmicStarBonus(s))) - s.stars);
}
/** All-time earnings needed for the next star (what the shop panel shows). */
export function nextStarAt(s: GameState): number {
  const have = s.stars + prestigeStars(s);
  return PRESTIGE.base * Math.pow((have + 1) / (1 + cosmicStarBonus(s)), 1 / PRESTIGE.exp);
}

export function canPrestige(s: GameState): boolean {
  return prestigeStars(s) >= PRESTIGE.minStars;
}

/** Reset the run, keep stars / star upgrades / achievements / all-time stats. */
export function prestige(s: GameState, now: number): number {
  const gained = prestigeStars(s);
  if (gained < PRESTIGE.minStars) return 0;
  const keep = {
    stars: s.stars + gained,
    starUpgrades: s.starUpgrades,
    achievements: s.achievements,
    allTimeEarned: s.allTimeEarned,
    clicks: s.clicks,
    prestigeCount: s.prestigeCount + 1,
    rushReadyAt: s.rushReadyAt,
    boostUntil: s.boostUntil,
    boostMult: s.boostMult,
    pendingOffline: s.pendingOffline,
    heroName: s.heroName,
    loved: {},
    customersSeen: s.customersSeen,
    customersServed: s.customersServed,
    starFragments: s.starFragments,
    diary: s.diary,
    furnitureOwned: s.furnitureOwned,
    furnitureSlots: s.furnitureSlots,
    createdAt: s.createdAt,
    playTimeMs: s.playTimeMs,
    sound: s.sound,
    tutorial: s.tutorial,
  };
  const fresh = newState(now);
  Object.assign(s, fresh, keep);
  const kittens = startKittens(s);
  if (kittens > 0) s.gens.kitten = kittens;
  return gained;
}

/** Check achievements; returns newly unlocked ids. */
export function checkAchievements(s: GameState, now: number): string[] {
  const ctx = { cps: cps(s, now) };
  const unlocked: string[] = [];
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue;
    if (a.check(s, ctx)) { s.achievements.push(a.id); unlocked.push(a.id); }
  }
  return unlocked;
}

/** Offline earnings for an absence of `awaySec` seconds. */
export function offlineEarnings(s: GameState, awaySec: number): { seconds: number; amount: number; capped: boolean } {
  const full = offlineHours(s) * 3600, cap = OFFLINE.maxHours * 3600;
  const seconds = Math.min(awaySec, cap);
  const rate = offlineRate(s), c = baseCps(s, Number.MAX_SAFE_INTEGER);
  // full offline rate for the first offlineHours(), then the shop winds down to tailRate: coming back every ~6 h harvests the most
  const amount = c * (Math.min(seconds, full) * rate + Math.max(0, seconds - full) * OFFLINE.tailRate);
  return { seconds, amount, capped: awaySec > full };
}

/** Seconds until `cost` is affordable at current income (Infinity if no income). */
export function timeToAfford(s: GameState, cost: number, now: number): number {
  if (s.macarons >= cost) return 0;
  const rate = cps(s, now);
  return rate > 0 ? (cost - s.macarons) / rate : Infinity;
}
