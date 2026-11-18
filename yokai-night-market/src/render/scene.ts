// Draws one frame of a run: ground, props, entities (y-sorted), shots, effects, night lighting.
import type { Enemy, Pickup } from '../game/types';
import type { Run } from '../game/world';
import { PROPS } from './items';
import { type Sprite, INK, TAU, flashOf, hash } from './kit';
import { TILE, groundTile, spr } from './sprites';
import { FOODS } from './paperAtlas';
import { PUPPETS } from './puppet';

type Ctx = CanvasRenderingContext2D;
export interface View { w: number; h: number; zoom: number; dpr: number }

const PROP_CELL = 230;
interface Item { y: number; kind: number; ref: unknown; x: number; key: string }
const items: Item[] = [];
let itemCount = 0;
function push(y: number, kind: number, ref: unknown, x = 0, key = ''): void {
  let it = items[itemCount];
  if (!it) items[itemCount] = it = { y, kind, ref, x, key };
  else { it.y = y; it.kind = kind; it.ref = ref; it.x = x; it.key = key; }
  itemCount++;
}

function put(c: Ctx, s: Sprite, x: number, y: number, flip = 1, sx = 1, sy = 1, img: CanvasImageSource = s.c, rot = 0): void {
  if (flip === 1 && sx === 1 && sy === 1 && rot === 0) { c.drawImage(img, x - s.ox, y - s.oy, s.w, s.h); return; }
  c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(flip * sx, sy);
  c.drawImage(img, -s.ox, -s.oy, s.w, s.h);
  c.restore();
}

// draws a sprite rotated around its visual centre
function spin(c: Ctx, s: Sprite, x: number, y: number, ang: number, scale = 1): void {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(scale, scale);
  c.drawImage(s.c, -s.w / 2, -s.h / 2, s.w, s.h);
  c.restore();
}

function shadow(c: Ctx, x: number, y: number, r: number): void {
  c.beginPath(); c.ellipse(x, y, r, r * 0.38, 0, 0, TAU); c.fill();
}

function gemKey(p: Pickup): string {
  return p.v >= 10 ? 'gem3' : p.v >= 3 ? 'gem2' : 'gem1';
}

function drawEnemy(c: Ctx, run: Run, e: Enemy): void {
  const s = spr(e.def.id);
  const wob = e.def.ai === 'still' ? 0 : Math.sin(run.t * 9 + e.uid * 1.3);
  // a paper doll on a stick: it rocks around its feet, it does not squash
  const rock = wob * (e.boss ? 0.035 : 0.075);
  let sy = 1, sx = 1, lift = 0;
  if (e.def.ai === 'hop') { const ph = e.t % 0.9; if (ph < 0.45) lift = Math.sin((ph / 0.45) * Math.PI) * 9; }
  if (e.def.ai === 'float' || e.def.id === 'suiki' || e.def.id === 'ushi') lift = 4 + Math.sin(run.t * 3 + e.uid) * 2.5;
  const k = e.elite ? 1.55 : 1;
  sx *= k; sy *= k;
  const winding = (e.def.ai === 'charge' || e.boss) && e.state === 1;
  let x = e.x;
  if (winding) x += Math.sin(run.t * 60) * 1.6;
  if (e.elite) {
    c.save(); c.globalAlpha = 0.55 + Math.sin(run.t * 5) * 0.15;
    c.beginPath(); c.ellipse(e.x, e.y - 2, e.r * 1.25, e.r * 0.55, 0, 0, TAU); c.strokeStyle = '#f7c948'; c.lineWidth = 2.5; c.stroke();
    c.restore();
  }
  put(c, s, x, e.y - lift, e.face, sx, sy, e.flash > 0 ? flashOf(s) : s.c, rock);
  if (winding) {
    c.save(); c.globalAlpha = 0.35 + Math.sin(run.t * 30) * 0.2; c.globalCompositeOperation = 'lighter';
    put(c, s, x, e.y - lift, e.face, sx, sy, flashOf(s), rock);
    c.restore();
  }
  if (e.elite && e.hp < e.maxHp) {
    const w = 34, y = e.y - s.h * k + 6;
    c.fillStyle = INK; c.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 6);
    c.fillStyle = '#e8553d'; c.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 4);
  }
}

function drawPlayer(c: Ctx, run: Run): void {
  const p = run.player;
  if (p.inv > 0 && p.hurt > 0.12 && Math.floor(run.t * 20) % 2 === 0) c.globalAlpha = 0.45;
  const puppet = PUPPETS.get(run.hero.id);
  if (puppet) {
    // the jointed paper puppet: parts turn on their pins; a hit tints it red for a moment
    if (p.hurt < 0.12) c.filter = 'sepia(1) saturate(4) hue-rotate(-30deg)';
    puppet.draw(c, p.x, p.y, 1, p.face, run.t, p.moving ? 'walk' : 'idle');
    c.filter = 'none';
  } else {
  const frame = p.moving ? 1 + (Math.floor(run.t * 9) % 2) : 0;
  const s = spr(`hero:${run.hero.id}:${frame}`);
  const bob = p.moving ? Math.abs(Math.sin(run.t * 14)) * 1.6 : Math.sin(run.t * 3) * 0.5;
  put(c, s, p.x, p.y - bob, p.face, 1, 1, p.hurt < 0.12 ? flashOf(s) : s.c, p.moving ? Math.sin(run.t * 14) * 0.07 : 0);
  }
  c.globalAlpha = 1;
  if (p.hp < p.maxHp) {
    const w = 30, y = p.y + 7;
    c.fillStyle = INK; c.fillRect(p.x - w / 2 - 1, y - 1, w + 2, 6);
    c.fillStyle = '#e8553d'; c.fillRect(p.x - w / 2, y, w * Math.max(0, p.hp / p.maxHp), 4);
  }
}

function drawFire(c: Ctx, x: number, y: number, r: number, t: number, gold: boolean, fade: number): void {
  c.save();
  c.globalAlpha = 0.34 * fade;
  c.beginPath(); c.ellipse(x, y, r, r * 0.7, 0, 0, TAU); c.fillStyle = gold ? '#f6a13a' : '#4f9fc8'; c.fill();
  c.globalAlpha = 0.85 * fade;
  const n = Math.max(3, Math.round(r / 11));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.7, rr = r * 0.55, fx = x + Math.cos(a) * rr, fy = y + Math.sin(a) * rr * 0.7;
    const h = 13 + Math.sin(t * 9 + i * 2.1) * 4;
    c.beginPath(); c.moveTo(fx, fy - h); c.quadraticCurveTo(fx + 6, fy - 2, fx, fy + 2); c.quadraticCurveTo(fx - 6, fy - 2, fx, fy - h);
    c.fillStyle = gold ? '#ffe9a8' : '#e6f6ff'; c.fill();
  }
  c.restore();
}

export function render(c: Ctx, run: Run, v: View, clock: number): void {
  const p = run.player;
  const k = v.dpr * v.zoom;
  const vw = v.w / v.zoom, vh = v.h / v.zoom;
  let cx = p.x, cy = p.y - 6;
  if (run.shake > 0) { cx += Math.sin(clock * 91) * run.shake * 8; cy += Math.cos(clock * 77) * run.shake * 8; }
  const left = cx - vw / 2, top = cy - vh / 2;
  c.setTransform(k, 0, 0, k, -left * k, -top * k);

  // ground
  const tile = groundTile(run.stage.ground);
  const tx0 = Math.floor(left / TILE), ty0 = Math.floor(top / TILE);
  for (let tx = tx0; tx * TILE < left + vw; tx++) for (let ty = ty0; ty * TILE < top + vh; ty++) c.drawImage(tile, tx * TILE, ty * TILE, TILE + 0.5, TILE + 0.5);

  // props: a deterministic scatter per cell
  itemCount = 0;
  const props = run.stage.props;
  const px0 = Math.floor((left - 80) / PROP_CELL), px1 = Math.floor((left + vw + 80) / PROP_CELL);
  const py0 = Math.floor((top - 20) / PROP_CELL), py1 = Math.floor((top + vh + 130) / PROP_CELL);
  if (run.stage.ground === 'gravel') {
    const rail = spr('rail');
    for (let ry = Math.floor(top / 920); ry * 920 - 60 < top + vh; ry++) for (let x = Math.floor(left / 128) * 128; x < left + vw + 128; x += 128) put(c, rail, x, ry * 920 + 20);
  }
  for (let gx = px0; gx <= px1; gx++) for (let gy = py0; gy <= py1; gy++) {
    const h = hash(gx * 7 + run.stageIndex * 1000, gy * 13);
    if (h > 0.62) continue;
    let key = props[Math.floor(hash(gx, gy * 3 + 1) * props.length)];
    if (key === 'rail') key = 'crate';
    const x = gx * PROP_CELL + hash(gx * 3, gy) * (PROP_CELL - 80) + 40, y = gy * PROP_CELL + hash(gx, gy * 5) * (PROP_CELL - 80) + 40;
    if (Math.abs(x) < 70 && Math.abs(y) < 70) continue;
    if (PROPS[key]?.flat) put(c, spr(key), x, y);
    else push(y, 3, null, x, key);
  }

  // burning ground
  for (const s of run.shots) if (s.mode === 'zone') drawFire(c, s.x, s.y, s.r, run.t + s.x, s.kind === 'fire2', Math.min(1, (s.life - s.age) * 3, s.age * 6));

  // shadows
  c.fillStyle = 'rgba(106,70,50,0.22)';
  for (const e of run.enemies) shadow(c, e.x, e.y, e.r * (e.elite ? 1.5 : 1) * 0.9);
  shadow(c, p.x, p.y, 10);
  for (const s of run.shots) if (s.mode === 'lob') shadow(c, s.x, s.y, 5);

  // y-sorted bodies
  for (const e of run.enemies) push(e.y, 0, e);
  for (const k2 of run.pickups) push(k2.y - 2, 1, k2);
  push(p.y, 2, null);
  const list = items;
  list.length = itemCount;
  list.sort((a, b) => a.y - b.y);
  for (let i = 0; i < itemCount; i++) {
    const it = list[i];
    if (it.kind === 0) drawEnemy(c, run, it.ref as Enemy);
    else if (it.kind === 1) {
      const pk = it.ref as Pickup;
      const key = pk.kind === 'gem' ? gemKey(pk) : pk.kind === 'heal' ? FOODS[Math.floor(hash(Math.round(pk.x), Math.round(pk.y)) * FOODS.length)] : pk.kind;
      const bob = pk.kind === 'gem' || pk.kind === 'coin' ? 0 : Math.sin(run.t * 4 + pk.x) * 2;
      const grow = Math.min(1, pk.age * 6);
      put(c, spr(key), pk.x, pk.y - bob, 1, grow, grow);
    } else if (it.kind === 2) drawPlayer(c, run);
    else {
      const s = spr(it.key);
      // a prop standing in front of the player goes see-through so nothing hides behind it
      const hide = it.y > p.y && Math.abs(it.x - p.x) < s.w / 2 + 6 && it.y - p.y < s.h;
      if (hide) c.globalAlpha = 0.45;
      put(c, s, it.x, it.y);
      c.globalAlpha = 1;
    }
  }

  // shots
  for (const s of run.shots) {
    switch (s.mode) {
      case 'line': case 'rocket': spin(c, spr(s.kind), s.x, s.y, s.ang, s.kind === 'salt' ? 1 : Math.max(1, s.r / 7)); break;
      case 'orbit': put(c, spr(s.kind), s.x, s.y + 12, 1, s.r / 11, s.r / 11); break;
      case 'boomerang': spin(c, spr(s.kind), s.x, s.y - 4, s.age * 16, s.r / 12); break;
      case 'lob': { const t = s.age / s.life; spin(c, spr(s.kind), s.x, s.y - 12 - Math.sin(t * Math.PI) * 46, s.age * 10); break; }
      case 'pulse': {
        const a = 1 - s.age / s.life;
        c.save(); c.globalAlpha = a * 0.9; c.lineWidth = 3 + a * 3; c.strokeStyle = s.slow > 0 ? '#e0a93a' : '#3f9aa8';
        c.beginPath(); c.ellipse(s.x, s.y - 4, s.r, s.r * 0.86, 0, 0, TAU); c.stroke();
        c.globalAlpha = a * 0.14; c.fillStyle = '#7fc8d0'; c.fill();
        c.restore();
        break;
      }
      case 'strike': {
        const t = s.age / s.life;
        c.save(); c.globalAlpha = 0.25 + t * 0.4; c.strokeStyle = '#f6a13a'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(s.x, s.y, s.a * (1.2 - t * 0.2), s.a * 0.7 * (1.2 - t * 0.2), 0, 0, TAU); c.stroke(); c.restore();
        put(c, spr(s.kind), s.x, s.y - (1 - t * t) * 240, 1, 1.2, 1.2);
        break;
      }
    }
  }
  for (const b of run.bullets) {
    const s = spr(b.kind);
    c.drawImage(s.c, b.x - s.w / 2, b.y - s.h / 2, s.w, s.h);
  }

  // effects
  for (const f of run.fx) {
    const t = f.t / f.life;
    switch (f.kind) {
      case 'ring':
        c.save(); c.globalAlpha = (1 - t) * 0.8; c.strokeStyle = '#d8503a'; c.lineWidth = 4 * (1 - t) + 1;
        c.beginPath(); c.ellipse(f.x, f.y, f.v * t, f.v * t * 0.86, 0, 0, TAU); c.stroke(); c.restore();
        break;
      case 'pop': {
        c.save(); c.globalAlpha = 1 - t;
        c.beginPath(); c.arc(f.x, f.y, f.v * (0.45 + t * 0.55), 0, TAU); c.fillStyle = t < 0.3 ? '#fff6e8' : '#f6a13a'; c.fill();
        c.globalAlpha = (1 - t) * 0.9; c.fillStyle = '#d8493a';
        for (let i = 0; i < 7; i++) { const a = i * 0.9 + f.x, d = f.v * (0.3 + t * 0.9); c.fillRect(f.x + Math.cos(a) * d - 2, f.y + Math.sin(a) * d - 2, 4, 4); }
        c.restore();
        break;
      }
      case 'slash': {
        c.save(); c.translate(f.x, f.y); c.scale(f.a, 1); c.globalAlpha = (1 - t) * 0.6;
        const r = f.v;
        c.beginPath(); c.moveTo(-r * 0.6, -r * 0.5); c.quadraticCurveTo(r * 1.25, 0, -r * 0.6, r * 0.5); c.quadraticCurveTo(r * 0.55, 0, -r * 0.6, -r * 0.5);
        c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = '#e8616b'; c.lineWidth = 2; c.stroke();
        c.restore();
        break;
      }
      case 'puff':
        c.save(); c.globalAlpha = (1 - t) * 0.6; c.fillStyle = '#b89a78';
        for (let i = 0; i < 4; i++) { const a = i * 1.57 + f.x; c.beginPath(); c.arc(f.x + Math.cos(a) * f.v * t, f.y - 6 + Math.sin(a) * f.v * t * 0.7, Math.max(0.5, f.v * 0.4 * (1 - t)), 0, TAU); c.fill(); }
        c.restore();
        break;
      case 'warn': {
        c.save(); c.globalAlpha = Math.floor(f.t * 8) % 2 ? 1 : 0.5; c.translate(f.x, f.y - 20);
        c.beginPath(); c.moveTo(0, -16); c.lineTo(15, 10); c.lineTo(-15, 10); c.closePath(); c.fillStyle = '#e8553d'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
        c.fillStyle = '#fff6e8'; c.fillRect(-1.8, -7, 3.6, 9); c.fillRect(-1.8, 4, 3.6, 3.4);
        c.restore();
        break;
      }
      case 'num': break;
    }
  }
  c.textAlign = 'center'; c.lineJoin = 'round';
  for (const f of run.fx) {
    if (f.kind !== 'num') continue;
    const t = f.t / f.life;
    c.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
    c.font = f.crit ? '800 17px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif' : '700 13px ui-rounded, "Arial Rounded MT Bold", system-ui, sans-serif';
    const y = f.y - 8 - t * 20, text = String(f.v);
    c.lineWidth = 3; c.strokeStyle = INK; c.strokeText(text, f.x, y);
    c.fillStyle = f.crit ? '#f7c948' : '#fff6e8'; c.fillText(text, f.x, y);
  }
  c.globalAlpha = 1;

  // warm paper vignette, and a little lamp light where lamps stand
  c.setTransform(v.dpr, 0, 0, v.dpr, 0, 0);
  const R = Math.hypot(v.w, v.h) / 2;
  const g = c.createRadialGradient(v.w / 2, v.h / 2, R * 0.22, v.w / 2, v.h / 2, R);
  g.addColorStop(0, 'rgba(150,90,50,0)'); g.addColorStop(1, 'rgba(150,90,50,0.3)');
  c.fillStyle = g; c.fillRect(0, 0, v.w, v.h);
  c.globalCompositeOperation = 'source-over';
  for (let i = 0; i < itemCount; i++) {
    const it = items[i];
    if (it.kind !== 3 || !PROPS[it.key]?.light) continue;
    const sx = (it.x - left) * v.zoom, sy = (it.y - top - spr(it.key).h * 0.55) * v.zoom, r = 90 * v.zoom;
    const lg = c.createRadialGradient(sx, sy, 0, sx, sy, r);
    lg.addColorStop(0, `rgba(255,214,120,${0.3 + Math.sin(clock * 3 + it.x) * 0.04})`); lg.addColorStop(1, 'rgba(255,214,120,0)');
    c.fillStyle = lg; c.fillRect(sx - r, sy - r, r * 2, r * 2);
  }
  c.globalCompositeOperation = 'source-over';

  // edge arrows toward the boss and any chest that is off screen
  const arrow = (wx: number, wy: number, col: string): void => {
    const dx = (wx - cx) * v.zoom, dy = (wy - cy) * v.zoom;
    if (Math.abs(dx) < v.w / 2 - 20 && Math.abs(dy) < v.h / 2 - 20) return;
    const a = Math.atan2(dy, dx), m = 34;
    const s = Math.min((v.w / 2 - m) / Math.abs(Math.cos(a) || 1e-6), (v.h / 2 - m) / Math.abs(Math.sin(a) || 1e-6));
    c.save(); c.translate(v.w / 2 + Math.cos(a) * s, v.h / 2 + Math.sin(a) * s); c.rotate(a);
    c.beginPath(); c.moveTo(14, 0); c.lineTo(-8, -11); c.lineTo(-3, 0); c.lineTo(-8, 11); c.closePath();
    c.fillStyle = col; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
    c.restore();
  };
  if (run.boss) arrow(run.boss.x, run.boss.y, '#e8553d');
  for (const k2 of run.pickups) if (k2.kind === 'chest') arrow(k2.x, k2.y, '#f7c948');
}
