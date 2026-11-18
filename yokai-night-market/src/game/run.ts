import { FOOD } from '../data/foods';
// One 15-minute run: creation, the fixed-step update, level-up choices and chests.
import { HERO, META, PASSIVE, PASSIVES, addStats, baseStats } from '../data/passives';
import { RUN_SECONDS, STAGES } from '../data/stages';
import { WEAPON, WEAPONS, WEAPON_MAX } from '../data/weapons';
import { purge, updateEnemies, updateSpawns } from './enemies';
import type { Choice, HeroId, PassiveId, WeaponId } from './types';
import { updateShots, updateWeapons } from './weapons';
import { addFx, buildGrid, mulberry32, type Run } from './world';

export const SLOTS = 5;
export const STEP = 1 / 60;

export interface RunOptions { stage: number; hero: HeroId; meta: Record<string, number>; seed: number; viewW?: number; viewH?: number; foods?: string[] }

export function xpNeed(level: number): number {
  return Math.floor(5 + level * 4.5 + level * level * 0.42);
}

export function recompute(run: Run): void {
  const s = baseStats();
  addStats(s, run.hero.bonus);
  for (const m of META) {
    const lv = run.meta[m.id] ?? 0;
    if (lv > 0) { const { reroll: _r, ...per } = m.per; addStats(s, per, lv); }
  }
  for (const p of run.passives) addStats(s, PASSIVE[p.id].per, p.level);
  for (const f of run.foods) if (FOOD[f]) addStats(s, FOOD[f].per);
  s.cooldown = Math.max(0.45, s.cooldown);
  run.stats = s;
  const max = Math.round(100 * s.maxHp);
  if (max > run.player.maxHp) run.player.hp += max - run.player.maxHp;
  run.player.maxHp = max;
  run.player.hp = Math.min(run.player.hp, max);
}

export function createRun(o: RunOptions): Run {
  const hero = HERO[o.hero];
  const run: Run = {
    rng: mulberry32(o.seed),
    stage: STAGES[o.stage], stageIndex: o.stage,
    hero, meta: o.meta, foods: o.foods ?? [],
    t: 0,
    player: { x: 0, y: 0, hp: 100, maxHp: 100, inv: 0, face: 1, ax: 1, ay: 0, moving: false, level: 1, xp: 0, xpNext: xpNeed(1), hurt: 9 },
    stats: baseStats(),
    weapons: [], passives: [],
    enemies: [], shots: [], bullets: [], pickups: [], fx: [],
    grid: new Map(),
    uid: 0, kills: 0, coins: 0, gems: 0,
    spawnAcc: 6, eliteIdx: 0, paradeIdx: 0, ringIdx: 0, toroT: 8,
    bossSpawned: false, bossDead: false, boss: null,
    pending: 0, choices: null,
    rerolls: 1 + (o.meta.reroll ?? 0),
    chest: null,
    revives: 0,
    over: null,
    sfx: [],
    viewW: o.viewW ?? 960, viewH: o.viewH ?? 600,
    seen: new Set(),
    dealt: {},
    shake: 0,
  };
  run.weapons.push({ id: hero.weapon, level: 1, evolved: false, timer: 0.6, burst: 0, burstT: 0, side: 1 });
  recompute(run);
  run.revives = run.stats.revive;
  run.player.hp = run.player.maxHp;
  return run;
}

function canEvolve(run: Run, id: WeaponId): boolean {
  const w = run.weapons.find((o) => o.id === id);
  return !!w && !w.evolved && w.level >= WEAPON_MAX && run.passives.some((p) => p.id === WEAPON[id].pair);
}

function upgradePool(run: Run, ownedOnly: boolean): { c: Choice; w: number }[] {
  const pool: { c: Choice; w: number }[] = [];
  for (const def of WEAPONS) {
    const own = run.weapons.find((o) => o.id === def.id);
    if (own) { if (own.level < WEAPON_MAX) pool.push({ c: { kind: 'weapon', id: def.id, level: own.level + 1 }, w: 1.4 }); }
    else if (!ownedOnly && run.weapons.length < SLOTS) pool.push({ c: { kind: 'weapon', id: def.id, level: 1 }, w: 1 });
  }
  for (const def of PASSIVES) {
    const own = run.passives.find((o) => o.id === def.id);
    if (own) { if (own.level < def.max) pool.push({ c: { kind: 'passive', id: def.id, level: own.level + 1 }, w: 1.2 }); }
    else if (!ownedOnly && run.passives.length < SLOTS) {
      // a passive that would unlock an evolution for a weapon you carry shows up more often
      const paired = run.weapons.some((o) => WEAPON[o.id].pair === def.id);
      pool.push({ c: { kind: 'passive', id: def.id, level: 1 }, w: paired ? 1.8 : 0.9 });
    }
  }
  return pool;
}

function draw(run: Run, pool: { c: Choice; w: number }[], n: number): Choice[] {
  const out: Choice[] = [];
  const left = pool.slice();
  while (out.length < n && left.length) {
    let total = 0;
    for (const p of left) total += p.w;
    let roll = run.rng() * total, idx = 0;
    for (let i = 0; i < left.length; i++) { roll -= left[i].w; if (roll <= 0) { idx = i; break; } }
    out.push(left[idx].c);
    left.splice(idx, 1);
  }
  return out;
}

function rollChoices(run: Run): Choice[] {
  const n = 3 + (run.rng() < run.stats.luck ? 1 : 0);
  const got = draw(run, upgradePool(run, false), n);
  if (got.length) return got;
  return [{ kind: 'coin', id: 'coin', level: 0 }, { kind: 'heal', id: 'heal', level: 0 }];
}

export function apply(run: Run, c: Choice): void {
  if (c.kind === 'weapon') {
    const own = run.weapons.find((o) => o.id === c.id);
    if (own) own.level = Math.min(WEAPON_MAX, own.level + 1);
    else run.weapons.push({ id: c.id as WeaponId, level: 1, evolved: false, timer: 0.3, burst: 0, burstT: 0, side: 1 });
  } else if (c.kind === 'passive') {
    const own = run.passives.find((o) => o.id === c.id);
    if (own) own.level = Math.min(PASSIVE[own.id].max, own.level + 1);
    else run.passives.push({ id: c.id as PassiveId, level: 1 });
    recompute(run);
  } else if (c.kind === 'evolve') {
    const own = run.weapons.find((o) => o.id === c.id);
    if (own) { own.evolved = true; own.timer = 0.2; }
    run.sfx.push('evolve');
  } else if (c.kind === 'coin') {
    run.coins += Math.round(25 * run.stats.greed);
  } else {
    run.player.hp = Math.min(run.player.maxHp, run.player.hp + 30);
  }
}

export function choose(run: Run, index: number): void {
  if (!run.choices) return;
  const c = run.choices[index];
  if (!c) return;
  apply(run, c);
  run.pending--;
  run.choices = run.pending > 0 ? rollChoices(run) : null;
}

export function reroll(run: Run): boolean {
  if (!run.choices || run.rerolls <= 0) return false;
  run.rerolls--;
  run.choices = rollChoices(run);
  return true;
}

function openChest(run: Run, tier: number): void {
  const count = tier >= 3 ? 3 : run.rng() < 0.12 + run.stats.luck ? 3 : 1;
  const items: Choice[] = [];
  for (let i = 0; i < count; i++) {
    const evo = WEAPONS.find((w) => canEvolve(run, w.id));
    let c: Choice | undefined;
    if (evo) c = { kind: 'evolve', id: evo.id, level: 0 };
    else c = draw(run, upgradePool(run, true), 1)[0];
    if (!c) break;
    apply(run, c);
    items.push(c);
  }
  const coins = Math.round((tier >= 3 ? 60 : 12 + run.rng() * 10) * run.stats.greed);
  run.coins += coins;
  run.chest = { items, coins };
  run.sfx.push('chest');
}

export function closeChest(run: Run): void {
  run.chest = null;
}

function updatePickups(run: Run, dt: number): void {
  const p = run.player;
  const reach = 58 * run.stats.magnet;
  for (const k of run.pickups) {
    if (k.dead) continue;
    k.age += dt;
    const dx = p.x - k.x, dy = p.y - k.y, d2 = dx * dx + dy * dy;
    if (!k.pull && d2 < reach * reach) k.pull = true;
    if (k.pull) {
      const d = Math.sqrt(d2) || 1, v = 260 + k.age * 60 + 320;
      k.x += (dx / d) * Math.min(d, v * dt); k.y += (dy / d) * Math.min(d, v * dt);
    }
    if (d2 < 18 * 18) {
      k.dead = true;
      switch (k.kind) {
        case 'gem':
          p.xp += k.v * run.stats.growth; run.gems--;
          if (run.sfx.length < 6) run.sfx.push('gem');
          break;
        case 'coin': run.coins += Math.max(1, Math.round(k.v * run.stats.greed)); run.sfx.push('coin'); break;
        case 'heal': p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.3); run.sfx.push('heal'); addFx(run, { kind: 'ring', x: p.x, y: p.y, life: 0.4, v: 40 }); break;
        case 'magnet': for (const o of run.pickups) if (o.kind === 'gem' || o.kind === 'coin') o.pull = true; run.sfx.push('coin'); break;
        case 'purge': purge(run, Math.hypot(run.viewW, run.viewH) / 2 + 40); run.shake = 0.35; run.sfx.push('boom'); break;
        case 'chest': openChest(run, k.v); break;
      }
    }
  }
  let j = 0;
  for (let i = 0; i < run.pickups.length; i++) if (!run.pickups[i].dead) run.pickups[j++] = run.pickups[i];
  run.pickups.length = j;
}

// Advances the run by one fixed step. `ix`, `iy` is the move input (any length up to 1).
export function step(run: Run, ix: number, iy: number): void {
  if (run.over || run.choices || run.chest) return;
  const dt = STEP, p = run.player;
  run.t += dt;

  const len = Math.hypot(ix, iy);
  p.moving = len > 0.15;
  if (p.moving) {
    const k = Math.min(1, len) / len, sp = 150 * run.stats.move;
    p.x += ix * k * sp * dt; p.y += iy * k * sp * dt;
    p.ax = ix / len; p.ay = iy / len;
    if (Math.abs(ix) > 0.15) p.face = ix > 0 ? 1 : -1;
  }
  if (p.inv > 0) p.inv -= dt;
  p.hurt += dt;
  if (run.shake > 0) run.shake -= dt;
  if (run.stats.regen > 0 && p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + run.stats.regen * dt);

  buildGrid(run);
  updateSpawns(run, dt);
  const hit = updateEnemies(run, dt);
  if (hit > 0 && p.inv <= 0) {
    p.hp -= Math.max(1, hit - run.stats.armor);
    p.inv = 0.5; p.hurt = 0;
    if (run.sfx.length < 6) run.sfx.push('hurt');
  }
  updateWeapons(run, dt);
  updateShots(run, dt);
  updatePickups(run, dt);

  for (const f of run.fx) f.t += dt;
  if (run.fx.length) {
    let j = 0;
    for (let i = 0; i < run.fx.length; i++) if (run.fx[i].t < run.fx[i].life) run.fx[j++] = run.fx[i];
    run.fx.length = j;
  }

  while (p.xp >= p.xpNext) { p.xp -= p.xpNext; p.level++; p.xpNext = xpNeed(p.level); run.pending++; }
  if (run.pending > 0 && !run.choices) { run.choices = rollChoices(run); run.sfx.push('level'); }

  if (p.hp <= 0) {
    if (run.revives > 0) {
      run.revives--;
      p.hp = p.maxHp * 0.5; p.inv = 2;
      purge(run, 260);
      run.sfx.push('heal');
    } else { p.hp = 0; run.over = 'dead'; run.sfx.push('dead'); }
  } else if (run.t >= RUN_SECONDS) {
    run.over = 'clear';
    run.coins += Math.round((40 + 30 * run.stageIndex) * run.stats.greed);
    run.sfx.push('clear');
  }
}
