import type { GameState } from './types';
import { newState, SAVE_VERSION, RUSH, sanitizeName } from './economy';

export const SAVE_KEY = 'meowcaron.save.v1';

export interface Storage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const localStorageAdapter: Storage = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* quota / private mode */ } },
  remove: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export function serialize(s: GameState): string {
  return JSON.stringify(s);
}

/** Parse and sanitise a save. Unknown or corrupt input yields a fresh state. */
export function deserialize(raw: string | null, now = Date.now()): GameState {
  const fresh = newState(now);
  if (!raw) return fresh;
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return fresh; }
  if (!parsed || typeof parsed !== 'object') return fresh;
  const p = parsed as Partial<GameState>;
  const num = (v: unknown, d: number) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : d);
  const counts = (v: unknown) => { const o: Record<string, number> = {}; if (v && typeof v === 'object') for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = Math.floor(num(x, 0)); return o; };
  const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  const gens: Record<string, number> = {};
  if (p.gens && typeof p.gens === 'object') {
    for (const [k, v] of Object.entries(p.gens)) gens[k] = Math.floor(num(v, 0));
  }
  return {
    version: SAVE_VERSION,
    macarons: num(p.macarons, 0),
    totalEarned: num(p.totalEarned, 0),
    allTimeEarned: num(p.allTimeEarned, 0),
    clicks: Math.floor(num(p.clicks, 0)),
    gens,
    upgrades: strs(p.upgrades),
    starUpgrades: strs(p.starUpgrades),
    achievements: strs(p.achievements),
    stars: Math.floor(num(p.stars, 0)),
    prestigeCount: Math.floor(num(p.prestigeCount, 0)),
    // clamp timestamps so a forwarded clock cannot grant a multi-year boost
    boostUntil: Math.min(num(p.boostUntil, 0), now + RUSH.durationMs),
    boostMult: Math.min(RUSH.mult, Math.max(1, num(p.boostMult, 1))),
    rushReadyAt: Math.min(num(p.rushReadyAt, 0), now + RUSH.cooldownMs),
    pendingOffline: (() => {
      const o = p.pendingOffline as { amount?: unknown; seconds?: unknown; capped?: unknown } | null | undefined;
      if (!o || typeof o !== 'object') return null;
      const amount = num(o.amount, 0);
      return amount > 0 ? { amount, seconds: num(o.seconds, 0), capped: o.capped === true } : null;
    })(),
    lastTick: Math.min(num(p.lastTick, now), now),
    createdAt: num(p.createdAt, now),
    playTimeMs: num(p.playTimeMs, 0),
    sound: p.sound !== false,
    slack: { nap: 0, love: 0, fight: 0, window: 0, play: 0 }, // transient: the scene recomputes it
    heat: Math.min(60, Math.max(0, num(p.heat, 0))),
    heatAt: Math.min(num(p.heatAt, 0), now),
    tutorial: strs(p.tutorial),
    heroName: sanitizeName(p.heroName),
    blessedUntil: Math.min(num(p.blessedUntil, 0), now + 60_000),
    blessMult: Math.min(2, Math.max(1, num(p.blessMult, 1))),
    warpUntil: Math.min(num(p.warpUntil, 0), now + 30_000),
    warpMult: Math.min(4, Math.max(1, num(p.warpMult, 1))),
    starFragments: Math.floor(num(p.starFragments, 0)),
    diary: Array.isArray(p.diary) ? (p.diary as unknown[]).filter((d): d is GameState['diary'][number] => !!d && typeof d === 'object' && typeof (d as { text?: unknown }).text === 'string').slice(-40) : [],
    furnitureOwned: Array.from(new Set(['cushion', ...strs(p.furnitureOwned)])),
    furnitureSlots: (() => { const v = Array.isArray(p.furnitureSlots) ? p.furnitureSlots : []; const out: (string | null)[] = []; for (let i = 0; i < 4; i++) out.push(typeof v[i] === 'string' ? (v[i] as string) : null); return out.every((x) => x === null) && !Array.isArray(p.furnitureSlots) ? [null, null, 'cushion', null] : out; })(),
    followers: Math.floor(num(p.followers, 0)),
    posts: Math.floor(num(p.posts, 0)),
    customersSeen: counts(p.customersSeen),
    customersServed: counts(p.customersServed),
    loved: (() => { const o: Record<string, number> = {}; if (p.loved && typeof p.loved === 'object') for (const [k, v] of Object.entries(p.loved)) o[k] = Math.min(num(v, 0), now + 90_000); return o; })(),
  };
}

export function load(storage: Storage, now = Date.now()): GameState {
  return deserialize(storage.get(SAVE_KEY), now);
}

export function save(storage: Storage, s: GameState): void {
  storage.set(SAVE_KEY, serialize(s));
}

export function wipe(storage: Storage): void {
  storage.remove(SAVE_KEY);
}
