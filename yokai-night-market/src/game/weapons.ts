// Weapon firing and shot behaviour.
import { weaponNumbers } from '../data/weapons';
import type { OwnedWeapon, Shot, ShotMode, WeaponId, WeaponNumbers } from './types';
import { addFx, eachIn, hurt, nearest, randomTarget, type Run } from './world';

// seconds between the shots of one volley
const SPACING: Record<WeaponId, number> = { ofuda: 0.07, shikigami: 0, furin: 0, cracker: 0.12, foxfire: 0.1, salt: 0, lantern: 0.14, poe: 0.12, sword: 0.18 };

function shot(run: Run, w: WeaponId, mode: ShotMode, kind: string, x: number, y: number, o: Partial<Shot>): Shot {
  const s: Shot = { mode, kind, w, x, y, vx: 0, vy: 0, r: 8, dmg: 0, pierce: 1, life: 1, age: 0, tick: 0, hits: new Map(), knock: 0, ang: 0, a: 0, b: 0, tx: 0, ty: 0, slow: 0, dead: false, ...o };
  run.shots.push(s);
  return s;
}

function volleySize(run: Run, o: OwnedWeapon, n: WeaponNumbers): number {
  if (o.id === 'furin') return 1;
  if (o.id === 'sword') return n.amount + (run.stats.amount > 0 ? 1 : 0);
  return n.amount + run.stats.amount;
}

function explode(run: Run, x: number, y: number, r: number, dmg: number, w: WeaponId, knock: number): void {
  eachIn(run, x, y, r, (e) => hurt(run, e, dmg, knock, x, y, w));
  addFx(run, { kind: 'pop', x, y, life: 0.28, v: r });
  if (run.sfx.length < 6) run.sfx.push('boom');
}

function fireOne(run: Run, o: OwnedWeapon, n: WeaponNumbers, i: number, total: number): void {
  const p = run.player, st = run.stats;
  const dmg = n.dmg * st.might, area = n.area * st.area, spd = n.speed * st.speed, dur = n.duration * st.duration;
  switch (o.id) {
    case 'ofuda': {
      const t = nearest(run, p.x, p.y, 520);
      let ang = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.ay, p.ax);
      ang += (run.rng() - 0.5) * 0.12;
      shot(run, 'ofuda', 'line', o.evolved ? 'ofuda2' : 'ofuda', p.x, p.y - 6, { vx: Math.cos(ang) * 380 * spd, vy: Math.sin(ang) * 380 * spd, r: 7 * area, dmg, pierce: n.pierce, life: 1.4, knock: 40, ang });
      break;
    }
    case 'shikigami': {
      const cd = n.cd * st.cooldown;
      shot(run, 'shikigami', 'orbit', 'doll', p.x, p.y, { r: 11 * area, dmg, pierce: 99, life: o.evolved ? cd + 0.05 : 3 * dur, tick: 0.45, knock: 120, ang: (i / total) * Math.PI * 2 + (o.evolved ? run.t * 3.2 * spd : 0), a: (o.evolved ? 84 : 62) * area, b: 3.2 * spd });
      break;
    }
    case 'furin':
      shot(run, 'furin', 'pulse', 'ring', p.x, p.y, { r: 10, dmg, pierce: 99, life: 0.32, knock: 230, a: 88 * area, slow: o.evolved ? 1.6 : 0 });
      break;
    case 'cracker': {
      if (o.evolved) {
        const ang = (i / total) * Math.PI * 2 + run.t * 1.7 + (run.rng() - 0.5) * 0.3;
        shot(run, 'cracker', 'rocket', 'rocket', p.x, p.y, { vx: Math.cos(ang) * 360 * spd, vy: Math.sin(ang) * 360 * spd, r: 7, dmg, pierce: 1, life: 1.3, a: 40 * area, ang, knock: 80 });
      } else {
        const t = randomTarget(run, 300);
        const tx = t ? t.x : p.x + p.ax * 130 + (run.rng() - 0.5) * 80, ty = t ? t.y : p.y + p.ay * 130 + (run.rng() - 0.5) * 80;
        shot(run, 'cracker', 'lob', 'cracker', p.x, p.y, { tx, ty, dmg, life: 0.5, a: 52 * area, b: p.x, ang: p.y, knock: 110 });
      }
      break;
    }
    case 'foxfire': {
      const t = randomTarget(run, 330);
      const x = t ? t.x : p.x + (run.rng() - 0.5) * 260, y = t ? t.y : p.y + (run.rng() - 0.5) * 260;
      shot(run, 'foxfire', 'zone', o.evolved ? 'fire2' : 'fire', x, y, { r: 40 * area, dmg, life: 3 * dur, tick: 0.5, a: 0.5 });
      break;
    }
    case 'salt': {
      const base = Math.atan2(p.ay, p.ax);
      const ang = o.evolved ? (i / total) * Math.PI * 2 + run.t : base + ((total > 1 ? i / (total - 1) : 0.5) - 0.5) * 0.95 + (run.rng() - 0.5) * 0.08;
      const v = (300 + run.rng() * 80) * spd;
      shot(run, 'salt', 'line', 'salt', p.x, p.y - 4, { vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, r: 6, dmg, pierce: n.pierce, life: 0.36 * area, knock: 90, ang });
      break;
    }
    case 'lantern': {
      const t = randomTarget(run, Math.min(run.viewW, run.viewH) * 0.55);
      const x = t ? t.x : p.x + (run.rng() - 0.5) * 300, y = t ? t.y : p.y + (run.rng() - 0.5) * 300;
      shot(run, 'lantern', 'strike', 'brush', x, y, { dmg, life: 0.42, a: 46 * area, knock: 60 });
      break;
    }
    case 'poe': {
      const t = nearest(run, p.x, p.y, 420);
      const base = t ? Math.atan2(t.y - p.y, t.x - p.x) : Math.atan2(p.ay, p.ax);
      const ang = base + (i - (total - 1) / 2) * 0.42;
      const v = 400 * spd;
      shot(run, 'poe', 'boomerang', i % 2 ? 'poeB' : 'poeA', p.x, p.y, { vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, r: 13 * area, dmg, pierce: 99, life: 1.5, tick: 0.35, knock: 70, a: v, ang });
      break;
    }
    case 'sword': {
      const sides = o.evolved ? [1, -1] : [i % 2 ? -1 : 1];
      const t = nearest(run, p.x, p.y, 170);
      const front = t && Math.abs(t.x - p.x) > 4 ? Math.sign(t.x - p.x) : p.face;
      for (const sgn of sides) {
        const dir = front * sgn;
        const rx = 80 * area, ry = 42 * area, cx = p.x + dir * rx * 0.75, cy = p.y - 4;
        eachIn(run, cx, cy, rx, (e) => {
          const dx = (e.x - cx) / (rx + e.r), dy = (e.y - cy) / (ry + e.r);
          if (dx * dx + dy * dy <= 1) hurt(run, e, dmg, 160, p.x, p.y, 'sword');
        });
        addFx(run, { kind: 'slash', x: cx, y: cy, life: 0.2, v: rx, a: dir });
      }
      break;
    }
  }
}

export function updateWeapons(run: Run, dt: number): void {
  for (const o of run.weapons) {
    const n = weaponNumbers(o.id, o.level, o.evolved);
    if (o.burst > 0) {
      o.burstT -= dt;
      while (o.burst > 0 && o.burstT <= 0) {
        const total = volleySize(run, o, n);
        fireOne(run, o, n, total - o.burst, total);
        o.burst--;
        o.burstT += SPACING[o.id];
      }
    }
    o.timer -= dt;
    if (o.timer <= 0) {
      o.timer += Math.max(0.12, n.cd * run.stats.cooldown);
      const total = volleySize(run, o, n);
      if (o.id === 'shikigami' && o.evolved) for (const s of run.shots) if (s.w === 'shikigami') s.dead = true;
      if (SPACING[o.id] === 0) for (let i = 0; i < total; i++) fireOne(run, o, n, i, total);
      else { o.burst = total; o.burstT = 0; }
    }
  }
}

function touch(run: Run, s: Shot, x: number, y: number, r: number): void {
  eachIn(run, x, y, r, (e) => {
    if (s.dead) return;
    const last = s.hits.get(e.uid);
    if (last !== undefined && (s.tick === 0 || run.t - last < s.tick)) return;
    s.hits.set(e.uid, run.t);
    if (s.mode === 'rocket') { explode(run, s.x, s.y, s.a, s.dmg, s.w, s.knock); s.dead = true; return; }
    hurt(run, e, s.dmg, s.knock, s.mode === 'line' ? s.x - s.vx : run.player.x, s.mode === 'line' ? s.y - s.vy : run.player.y, s.w);
    if (s.slow > 0) e.slow = Math.max(e.slow, s.slow);
    if (--s.pierce <= 0) s.dead = true;
  });
}

export function updateShots(run: Run, dt: number): void {
  const p = run.player;
  for (const s of run.shots) {
    if (s.dead) continue;
    s.age += dt;
    switch (s.mode) {
      case 'line':
      case 'rocket':
        s.x += s.vx * dt; s.y += s.vy * dt;
        touch(run, s, s.x, s.y, s.r);
        break;
      case 'orbit':
        s.ang += s.b * dt;
        s.x = p.x + Math.cos(s.ang) * s.a; s.y = p.y + Math.sin(s.ang) * s.a * 0.82;
        touch(run, s, s.x, s.y, s.r);
        break;
      case 'boomerang': {
        // flies out, slows, and comes back through the thrower
        const k = 1 - s.age / 0.5;
        s.x += Math.cos(s.ang) * s.a * k * dt; s.y += Math.sin(s.ang) * s.a * k * dt;
        touch(run, s, s.x, s.y, s.r);
        break;
      }
      case 'zone':
        s.a -= dt;
        if (s.a <= 0) {
          s.a += s.tick;
          eachIn(run, s.x, s.y, s.r, (e) => hurt(run, e, s.dmg, 0, s.x, s.y, s.w));
        }
        break;
      case 'lob': {
        const k = Math.min(1, s.age / s.life);
        s.x = s.b + (s.tx - s.b) * k; s.y = s.ang + (s.ty - s.ang) * k;
        if (s.age >= s.life) { explode(run, s.tx, s.ty, s.a, s.dmg, s.w, s.knock); s.dead = true; }
        break;
      }
      case 'pulse':
        s.x = p.x; s.y = p.y;
        s.r = 10 + (s.a - 10) * Math.min(1, s.age / s.life);
        touch(run, s, s.x, s.y, s.r);
        break;
      case 'strike':
        if (s.age >= s.life) { explode(run, s.x, s.y, s.a, s.dmg, s.w, s.knock); s.dead = true; }
        break;
      case 'slash':
        break;
    }
    if (s.age >= s.life) s.dead = true;
  }
  if (run.shots.length > 0) {
    let j = 0;
    for (let i = 0; i < run.shots.length; i++) if (!run.shots[i].dead) run.shots[j++] = run.shots[i];
    run.shots.length = j;
  }
}
