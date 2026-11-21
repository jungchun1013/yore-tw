// Spawning, enemy AI, boss moves and enemy bullets.
import { PENDING_ART } from '../data/manifest';
import { ENEMY } from '../data/enemies';
import { BOSS_AT, ELITE_AT, PARADE_AT, RING_AT } from '../data/stages';
import type { Enemy, EnemyDef } from './types';
import { addFx, cellOf, kill, makeEnemy, viewRadius, type Run } from './world';

const PLAYER_R = 10;

export function scale(run: Run): { hp: number; dmg: number; speed: number } {
  const m = run.t / 60;
  return {
    // a stage's extra toughness fades in over the first minutes so the opening is always killable
    hp: (1 + (run.stage.hpMul - 1) * Math.min(1, 0.3 + m / 8)) * (1 + 0.14 * m + 0.012 * m * m),
    dmg: run.stage.dmgMul * (1 + 0.035 * m),
    speed: 1 + 0.012 * m,
  };
}

function spawnAt(run: Run, def: EnemyDef, x: number, y: number): Enemy {
  const s = scale(run);
  const e = makeEnemy(run, def, x, y, Math.ceil(def.hp * s.hp), def.dmg * s.dmg, def.speed * s.speed);
  run.enemies.push(e);
  return e;
}

function ringPoint(run: Run, extra = 40): [number, number] {
  const a = run.rng() * Math.PI * 2, r = viewRadius(run) + extra + run.rng() * 60;
  return [run.player.x + Math.cos(a) * r, run.player.y + Math.sin(a) * r];
}

function pickRoster(run: Run): EnemyDef {
  const m = run.t / 60;
  let total = 0;
  const live = run.stage.roster.filter((r) => m >= r.from && (r.to === undefined || m < r.to) && !PENDING_ART.has(r.id));
  for (const r of live) total += r.w;
  let roll = run.rng() * total;
  for (const r of live) { roll -= r.w; if (roll <= 0) return ENEMY[r.id]; }
  return ENEMY[live[0].id];
}

export function spawnElite(run: Run, id: string): Enemy {
  const [x, y] = ringPoint(run);
  const e = spawnAt(run, ENEMY[id], x, y);
  e.elite = true;
  e.hp = e.maxHp = e.maxHp * 22;
  e.r *= 1.55; e.dmg *= 1.5; e.speed *= 0.9;
  addFx(run, { kind: 'warn', x, y, life: 1.2 });
  return e;
}

export function spawnBoss(run: Run): Enemy {
  const def = ENEMY[run.stage.boss];
  const [x, y] = ringPoint(run, 20);
  const e = makeEnemy(run, def, x, y, def.hp, def.dmg, def.speed);
  e.boss = true; e.t = 2.5;
  run.enemies.push(e);
  run.boss = e; run.bossSpawned = true;
  run.sfx.push('boss');
  return e;
}

export function updateSpawns(run: Run, dt: number): void {
  const m = run.t / 60;
  let alive = 0;
  for (const e of run.enemies) if (e.def.ai !== 'still' && !e.dead) alive++;
  let target = Math.min(300, (16 + 15 * m) * run.stage.rate);
  if (run.boss) target *= 0.55;
  run.spawnAcc += dt * Math.max(1.5, target / 6);
  while (run.spawnAcc >= 1) {
    run.spawnAcc -= 1;
    if (alive >= target) { run.spawnAcc = Math.min(run.spawnAcc, 1); break; }
    const [x, y] = ringPoint(run);
    spawnAt(run, pickRoster(run), x, y);
    alive++;
  }

  if (run.eliteIdx < ELITE_AT.length && run.t >= ELITE_AT[run.eliteIdx]) spawnElite(run, run.stage.elites[run.eliteIdx++]);
  if (!run.bossSpawned && run.t >= BOSS_AT) spawnBoss(run);

  if (run.paradeIdx < PARADE_AT.length && run.t >= PARADE_AT[run.paradeIdx]) {
    // 百鬼夜行: a procession crosses the screen without chasing
    run.paradeIdx++;
    const dir = run.rng() < 0.5 ? 1 : -1;
    const def = ENEMY[(run.stage.roster.find((r) => ENEMY[r.id].ai === 'float') ?? run.stage.roster[0]).id];
    const rows = 4, cols = 9 + run.stageIndex;
    for (let i = 0; i < rows * cols; i++) {
      const cx = i % cols, cy = Math.floor(i / cols);
      const e = spawnAt(run, def, run.player.x - dir * (run.viewW / 2 + 60 + cx * 38), run.player.y + (cy - (rows - 1) / 2) * 46 + (cx % 2) * 14);
      e.state = 9; e.ax = dir; e.ay = 0; e.speed = 150; e.face = dir;
    }
    run.sfx.push('parade');
    addFx(run, { kind: 'warn', x: run.player.x - dir * (run.viewW / 2 - 40), y: run.player.y, life: 1.6 });
  }
  if (run.ringIdx < RING_AT.length && run.t >= RING_AT[run.ringIdx]) {
    run.ringIdx++;
    const def = ENEMY[run.stage.roster[0].id], n = 26 + run.stageIndex * 2, r = viewRadius(run) + 30;
    for (let i = 0; i < n; i++) spawnAt(run, def, run.player.x + Math.cos((i / n) * Math.PI * 2) * r, run.player.y + Math.sin((i / n) * Math.PI * 2) * r);
  }

  run.toroT -= dt;
  if (run.toroT <= 0) {
    run.toroT = 20;
    let n = 0;
    for (const e of run.enemies) if (e.def.ai === 'still' && !e.dead) n++;
    if (n < 4) {
      const p = run.player, a = Math.atan2(p.ay, p.ax) + (run.rng() - 0.5) * 2.2, r = viewRadius(run) * (0.75 + run.rng() * 0.4);
      const e = makeEnemy(run, ENEMY.toro, p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 1, 0, 0);
      run.seen.delete('toro');
      run.enemies.push(e);
    }
  }
}

function bullet(run: Run, e: Enemy, ang: number, speed: number, kind: string): void {
  if (run.bullets.length > 220) return;
  run.bullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: e.boss ? 7 : 6, dmg: e.dmg * 0.8, life: 5, kind });
}

function bossAi(run: Run, e: Enemy, dt: number, dx: number, dy: number, dist: number): [number, number] {
  const boss = e.def.boss!;
  const ux = dx / dist, uy = dy / dist;
  e.t -= dt;
  if (e.state === 1) {                       // dash wind-up
    if (e.t <= 0) { e.state = 2; e.t = 0.65; e.ax = ux; e.ay = uy; }
    return [0, 0];
  }
  if (e.state === 2) {                       // dashing
    if (e.t <= 0) { e.state = 0; e.t = 2.4; }
    return [e.ax * 470, e.ay * 470];
  }
  if (e.state === 4) {                       // spiral
    e.ax += dt;
    while (e.ax >= 0.09) { e.ax -= 0.09; e.ay += 0.55; bullet(run, e, e.ay, 120, 'orb'); bullet(run, e, e.ay + Math.PI, 120, 'orb'); }
    if (e.t <= 0) { e.state = 0; e.t = 2.6; }
    return [ux * e.speed * 0.3, uy * e.speed * 0.3];
  }
  if (e.t <= 0) {
    const move = boss.moves[e.move++ % boss.moves.length];
    const rage = e.hp < e.maxHp * 0.4 ? 1 : 0;
    if (move === 'dash') { e.state = 1; e.t = 0.8; addFx(run, { kind: 'warn', x: e.x, y: e.y - e.r - 14, life: 0.8 }); }
    else if (move === 'ring') {
      const n = 14 + run.stageIndex * 2 + rage * 6, off = run.rng() * 6;
      for (let i = 0; i < n; i++) bullet(run, e, off + (i / n) * Math.PI * 2, 125, 'orb');
      e.t = 3;
    } else if (move === 'aimed') {
      const base = Math.atan2(dy, dx), n = 5 + rage * 2;
      for (let i = 0; i < n; i++) bullet(run, e, base + (i - (n - 1) / 2) * 0.2, 185, 'orb');
      e.t = 2.2;
    } else if (move === 'spiral') { e.state = 4; e.t = 1.6 + rage * 0.8; e.ax = 0; e.ay = run.rng() * 6; }
    else {
      const def = ENEMY[boss.minion], n = 6 + run.stageIndex + rage * 3;
      for (let i = 0; i < n; i++) spawnAt(run, def, e.x + Math.cos((i / n) * Math.PI * 2) * 70, e.y + Math.sin((i / n) * Math.PI * 2) * 70);
      addFx(run, { kind: 'ring', x: e.x, y: e.y, life: 0.4, v: 80 });
      e.t = 3;
    }
  }
  return [ux * e.speed, uy * e.speed];
}

export function updateEnemies(run: Run, dt: number): number {
  const p = run.player;
  const far = viewRadius(run) + 380;
  let touching = 0, worst = 0;
  for (const e of run.enemies) {
    if (e.dead) continue;
    const dx = p.x - e.x, dy = p.y - e.y, dist = Math.hypot(dx, dy) || 1;
    const ux = dx / dist, uy = dy / dist;
    let sp = e.speed;
    if (e.slow > 0) { e.slow -= dt; sp *= 0.5; }
    if (e.flash > 0) e.flash -= dt;
    let vx = 0, vy = 0;
    if (e.state === 9) {                      // parade
      vx = e.ax * sp; vy = e.ay * sp + Math.sin(run.t * 3 + e.uid) * 14;
      if (dist > far + 300) { e.dead = true; continue; }
    } else switch (e.def.ai) {
      case 'chase': vx = ux * sp; vy = uy * sp; break;
      case 'float': {
        const w = Math.sin(run.t * 2.6 + e.uid * 1.7) * 0.7, c = Math.cos(w), s = Math.sin(w);
        vx = (ux * c - uy * s) * sp; vy = (ux * s + uy * c) * sp;
        break;
      }
      case 'hop': {
        e.t += dt;
        const ph = e.t % 0.9;
        if (ph < 0.45) { vx = ux * sp * 2; vy = uy * sp * 2; }
        break;
      }
      case 'shoot': {
        const range = e.def.shot!.range;
        if (dist > range) { vx = ux * sp; vy = uy * sp; }
        else { vx = -uy * sp * 0.4; vy = ux * sp * 0.4; }
        e.t -= dt;
        if (e.t <= 0 && dist < range + 60) { e.t = e.def.shot!.cd; bullet(run, e, Math.atan2(dy, dx), e.def.shot!.speed, 'pellet'); }
        break;
      }
      case 'charge':
        e.t -= dt;
        if (e.state === 0) {
          vx = ux * sp; vy = uy * sp;
          if (dist < 240 && e.t <= 0) { e.state = 1; e.t = 0.55; }
        } else if (e.state === 1) {
          if (e.t <= 0) { e.state = 2; e.t = 0.7; e.ax = ux; e.ay = uy; }
        } else {
          vx = e.ax * sp * 4.2; vy = e.ay * sp * 4.2;
          if (e.t <= 0) { e.state = 0; e.t = 1.8; }
        }
        break;
      case 'boss': [vx, vy] = bossAi(run, e, dt, dx, dy, dist); break;
      case 'still':
        if (dist > far + 500) { e.dead = true; continue; }
        break;
    }
    if (vx !== 0) e.face = vx > 0 ? 1 : -1;
    e.x += (vx + e.kx) * dt; e.y += (vy + e.ky) * dt;
    const damp = Math.exp(-9 * dt);
    e.kx *= damp; e.ky *= damp;

    // soft separation against a few neighbours in the same cell
    if (e.def.ai !== 'still' && e.state !== 9) {
      const cell = cellOf(run, e.x, e.y);
      if (cell) {
        const n = Math.min(cell.length, 8);
        for (let i = 0; i < n; i++) {
          const o = cell[i];
          if (o === e || o.dead) continue;
          const ox = e.x - o.x, oy = e.y - o.y, rr = (e.r + o.r) * 0.85, d2 = ox * ox + oy * oy;
          if (d2 < rr * rr && d2 > 0.01) {
            const d = Math.sqrt(d2), push = ((rr - d) / d) * 0.5 * (o.boss ? 1 : 0.5);
            if (!e.boss) { e.x += ox * push; e.y += oy * push; }
          }
        }
      }
      if (dist > far && !e.boss && !e.elite) {
        // left far behind: bring it back around the edge of the view
        const a = run.rng() * Math.PI * 2, r = viewRadius(run) + 50;
        e.x = p.x + Math.cos(a) * r; e.y = p.y + Math.sin(a) * r;
      }
    }

    if (e.dmg > 0 && dist < e.r + PLAYER_R) { touching++; if (e.dmg > worst) worst = e.dmg; }
  }

  for (const b of run.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    const dx = b.x - p.x, dy = b.y - p.y;
    if (dx * dx + dy * dy < (b.r + PLAYER_R - 2) ** 2) { b.life = 0; touching++; if (b.dmg > worst) worst = b.dmg; }
  }
  if (run.bullets.length) {
    let j = 0;
    for (let i = 0; i < run.bullets.length; i++) if (run.bullets[i].life > 0) run.bullets[j++] = run.bullets[i];
    run.bullets.length = j;
  }

  let j = 0;
  for (let i = 0; i < run.enemies.length; i++) if (!run.enemies[i].dead) run.enemies[j++] = run.enemies[i];
  run.enemies.length = j;

  // contact damage: the hardest hitter, plus a little for each extra body
  return touching > 0 ? worst * Math.min(2, 1 + 0.2 * (touching - 1)) : 0;
}

export function purge(run: Run, radius: number): void {
  const p = run.player;
  for (const e of run.enemies) {
    if (e.dead || e.def.ai === 'still') continue;
    const dx = e.x - p.x, dy = e.y - p.y;
    if (dx * dx + dy * dy > radius * radius) continue;
    if (e.boss || e.elite) { e.hp -= e.boss ? 300 : e.maxHp * 0.25; e.flash = 0.2; if (e.hp <= 0) kill(run, e); }
    else kill(run, e);
  }
  run.bullets.length = 0;
  addFx(run, { kind: 'ring', x: p.x, y: p.y, life: 0.5, v: radius });
}
