// Run state plus the helpers every system shares: rng, spatial grid, damage, drops.
import type { Bullet, ChestResult, Choice, Enemy, EnemyDef, Fx, HeroDef, OwnedPassive, OwnedWeapon, Pickup, PickupKind, SfxEvent, Shot, StageDef, Stats, WeaponId } from './types';

export interface Player {
  x: number; y: number;
  hp: number; maxHp: number;
  inv: number;            // invulnerable seconds left
  face: number;           // -1 / 1, for the sprite and the sword
  ax: number; ay: number; // last move direction (unit)
  moving: boolean;
  level: number; xp: number; xpNext: number;
  hurt: number;           // seconds since last hit, for the red flash
}

export interface Run {
  rng: () => number;
  stage: StageDef; stageIndex: number;
  hero: HeroDef;
  meta: Record<string, number>;
  t: number;
  player: Player;
  stats: Stats;
  weapons: OwnedWeapon[];
  passives: OwnedPassive[];
  enemies: Enemy[];
  shots: Shot[];
  bullets: Bullet[];
  pickups: Pickup[];
  fx: Fx[];
  grid: Map<number, Enemy[]>;
  uid: number;
  kills: number;
  coins: number;
  gems: number;
  spawnAcc: number;
  eliteIdx: number; paradeIdx: number; ringIdx: number;
  toroT: number;
  bossSpawned: boolean; bossDead: boolean; boss: Enemy | null;
  pending: number;
  choices: Choice[] | null;
  rerolls: number;
  chest: ChestResult | null;
  revives: number;
  over: null | 'dead' | 'clear';
  sfx: SfxEvent[];
  viewW: number; viewH: number;
  seen: Set<string>;
  dealt: Partial<Record<WeaponId, number>>;
  shake: number;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CELL = 80;
const key = (cx: number, cy: number): number => ((cx & 0xffff) << 16) | (cy & 0xffff);

export function buildGrid(run: Run): void {
  const g = run.grid;
  for (const arr of g.values()) arr.length = 0;
  for (const e of run.enemies) {
    if (e.dead) continue;
    const k = key(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
    let arr = g.get(k);
    if (!arr) g.set(k, (arr = []));
    arr.push(e);
  }
  if (g.size > 4000) g.clear();
}

export function cellOf(run: Run, x: number, y: number): Enemy[] | undefined {
  return run.grid.get(key(Math.floor(x / CELL), Math.floor(y / CELL)));
}

// Calls cb for every live enemy whose body overlaps the circle.
export function eachIn(run: Run, x: number, y: number, r: number, cb: (e: Enemy) => void): void {
  const pad = r + 40;
  const x0 = Math.floor((x - pad) / CELL), x1 = Math.floor((x + pad) / CELL);
  const y0 = Math.floor((y - pad) / CELL), y1 = Math.floor((y + pad) / CELL);
  for (let cx = x0; cx <= x1; cx++) {
    for (let cy = y0; cy <= y1; cy++) {
      const arr = run.grid.get(key(cx, cy));
      if (!arr) continue;
      for (let i = 0; i < arr.length; i++) {
        const e = arr[i];
        if (e.dead) continue;
        const dx = e.x - x, dy = e.y - y, rr = r + e.r;
        if (dx * dx + dy * dy <= rr * rr) cb(e);
      }
    }
  }
}

export function nearest(run: Run, x: number, y: number, max: number): Enemy | null {
  let best: Enemy | null = null, bd = max * max;
  for (const e of run.enemies) {
    if (e.dead || e.def.ai === 'still') continue;
    const dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

// A random live enemy within `max`, or null. Bosses and elites are a little more likely.
export function randomTarget(run: Run, max: number): Enemy | null {
  const p = run.player;
  let pick: Enemy | null = null, n = 0;
  for (const e of run.enemies) {
    if (e.dead || e.def.ai === 'still') continue;
    const dx = e.x - p.x, dy = e.y - p.y;
    if (dx * dx + dy * dy > max * max) continue;
    const w = e.boss || e.elite ? 4 : 1;
    n += w;
    if (run.rng() * n < w) pick = e;
  }
  return pick;
}

export function addFx(run: Run, f: Partial<Fx> & { kind: Fx['kind']; x: number; y: number; life: number }): void {
  if (run.fx.length > 260) return;
  run.fx.push({ t: 0, v: 0, a: 0, ...f });
}

export function makeEnemy(run: Run, def: EnemyDef, x: number, y: number, hp: number, dmg: number, speed: number): Enemy {
  run.seen.add(def.id);
  return { uid: ++run.uid, def, x, y, hp, maxHp: hp, dmg, speed, r: def.r, kx: 0, ky: 0, flash: 0, t: run.rng() * 2, state: 0, ax: 0, ay: 0, face: 1, slow: 0, elite: false, boss: false, dead: false, move: 0 };
}

export function drop(run: Run, kind: PickupKind, x: number, y: number, v: number): void {
  if (kind === 'gem') {
    run.gems++;
    if (run.gems > 240) {
      // too many gems on the ground: fold this one into an existing gem
      for (let i = 0; i < 12; i++) {
        const p = run.pickups[Math.floor(run.rng() * run.pickups.length)];
        if (p && p.kind === 'gem' && !p.dead) { p.v += v; run.gems--; return; }
      }
    }
  }
  run.pickups.push({ kind, x, y, v, pull: false, age: 0, dead: false });
}

export function hurt(run: Run, e: Enemy, dmg: number, knock: number, fromX: number, fromY: number, w: WeaponId): void {
  if (e.dead) return;
  const crit = run.rng() < 0.05 + run.stats.luck * 0.25;
  const d = Math.max(1, Math.round(dmg * (0.9 + run.rng() * 0.2) * (crit ? 2 : 1)));
  e.hp -= d;
  e.flash = 0.12;
  run.dealt[w] = (run.dealt[w] ?? 0) + Math.min(d, e.hp + d);
  if (e.def.ai !== 'still') addFx(run, { kind: 'num', x: e.x + (run.rng() - 0.5) * 12, y: e.y - e.r, life: 0.55, v: d, crit });
  if (knock > 0) {
    const dx = e.x - fromX, dy = e.y - fromY, len = Math.hypot(dx, dy) || 1;
    const k = knock * (1 - (e.elite ? Math.max(0.85, e.def.heavy ?? 0) : e.def.heavy ?? 0));
    e.kx += (dx / len) * k; e.ky += (dy / len) * k;
  }
  if (e.hp <= 0) kill(run, e, w);
  else if (run.sfx.length < 4) run.sfx.push('hit');
}

export function kill(run: Run, e: Enemy, w?: WeaponId): void {
  if (e.dead) return;
  e.dead = true;
  addFx(run, { kind: 'puff', x: e.x, y: e.y, life: 0.3, v: e.r });
  if (e.def.ai === 'still') {
    const roll = run.rng();
    if (roll < 0.4) drop(run, 'heal', e.x, e.y, 0);
    else if (roll < 0.75) drop(run, 'coin', e.x, e.y, 4 + Math.floor(run.rng() * 5));
    else if (roll < 0.9) drop(run, 'magnet', e.x, e.y, 0);
    else drop(run, 'purge', e.x, e.y, 0);
    return;
  }
  run.kills++;
  if (run.sfx.length < 6) run.sfx.push('kill');
  const xp = e.def.xp * (e.elite ? 12 : 1);
  if (xp > 0) drop(run, 'gem', e.x, e.y, xp);
  if (e.boss) {
    run.bossDead = true; run.boss = null;
    drop(run, 'chest', e.x, e.y, 3);
    run.coins += Math.round((50 + 25 * run.stageIndex) * run.stats.greed);
    run.shake = 0.6;
    for (let i = 0; i < 10; i++) drop(run, 'gem', e.x + (run.rng() - 0.5) * 120, e.y + (run.rng() - 0.5) * 120, 10);
  } else if (e.elite) {
    drop(run, 'chest', e.x, e.y, 1);
  } else if (run.rng() < 0.01) {
    drop(run, 'coin', e.x + 6, e.y, 1);
  }
  if (w === 'sword') {
    const sw = run.weapons.find((o) => o.id === 'sword');
    if (sw?.evolved && run.rng() < 0.25) run.player.hp = Math.min(run.player.maxHp, run.player.hp + 1);
  }
}

export function viewRadius(run: Run): number {
  return Math.hypot(run.viewW, run.viewH) / 2;
}
