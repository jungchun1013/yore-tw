import type { Game, GameEvent } from '../game/engine';
import { areaOf } from '../data/areas';
import { pixels } from './icons';
import { heroPixels } from './hero';
import { stageOf } from '../data/pets';
import { sprite } from './sprites';
import { num } from '../core/fmt';
import { drawLandscape } from './landscape';
import { BattleMotion } from './motion';

/**
 * Battle strip with shared pixel avatars and companion artwork.
 * Logical size 320x120, drawn at 2x for crisp edges.
 */
const W = 320, H = 120, S = 2;
interface Floater { x: number; y: number; text: string; color: string; age: number }

export class Scene {
  cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private floats: Floater[] = [];
  private heroLunge = 0; private monLunge = 0; private petLunge = 0; private monFlash = 0;
  private t = 0;
  private motion = new BattleMotion();
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private g: Game) {
    this.cv = document.createElement('canvas');
    this.cv.width = W * S; this.cv.height = H * S;
    this.cv.className = 'scene';
    this.cv.setAttribute('role', 'img');
    this.cv.setAttribute('aria-label', 'Pixel battle landscape');
    this.ctx = this.cv.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    g.on(e => this.onEvent(e));
  }

  private onEvent(e: GameEvent): void {
    if (e.t === 'hit') {
      if (e.from === 'mon') {
        this.monLunge = 1;
        this.float(e.target === 'pet' ? 46 : 78, 52, e.blocked && !e.dmg ? 'BLOCK' : num(e.dmg), e.blocked ? '#9fb3c8' : '#ff6b6b');
      } else {
        if (e.from === 'hero') this.heroLunge = 1; else this.petLunge = 1;
        this.monFlash = 1;
        const col = e.skill === 'firebolt' ? '#ff9f43' : e.skill === 'icebolt' ? '#8fd3ff' : e.skill === 'lightning' ? '#fff27a' : e.crit ? '#ffd166' : e.from === 'pet' ? '#b8f2a0' : '#ffffff';
        this.float(238 + (e.from === 'pet' ? -10 : 0), 46, num(e.dmg) + (e.crit ? '!' : ''), col);
      }
    } else if (e.t === 'heal') this.float(70, 40, '+' + num(e.amt), '#7ee081');
    else if (e.t === 'kill') this.motion.kill();
    else if (e.t === 'spawn') this.motion.spawn();
    else if (e.t === 'death') this.motion.death();
    else if (e.t === 'level') this.float(70, 30, 'LEVEL UP', '#ffd166');
  }

  private float(x: number, y: number, text: string, color: string): void {
    this.floats.push({ x: x + (Math.random() * 10 - 5), y, text, color, age: 0 });
    if (this.floats.length > 24) this.floats.shift();
  }

  draw(dt: number): void {
    const c = this.ctx, g = this.g, s = g.s;
    dt = Math.max(0, Math.min(dt, .1));
    this.t += dt;
    this.motion.update(dt, g.downFor);
    const motion = this.motion, reduced = this.reducedMotion;
    this.cv.dataset.phase = motion.phase;
    this.cv.dataset.travel = motion.travel.toFixed(2);
    this.cv.dataset.area = s.area;
    const decay = (v: number) => Math.max(0, v - dt * 5);
    this.heroLunge = decay(this.heroLunge); this.monLunge = decay(this.monLunge); this.petLunge = decay(this.petLunge);
    this.monFlash = decay(this.monFlash);

    c.setTransform(S, 0, 0, S, 0, 0);
    const area = areaOf(s.area);
    const bg = sprite('bg.' + area.key);
    if (bg) c.drawImage(bg, 0, 0, W, H);
    else drawLandscape(c, area.key, reduced ? 0 : motion.travel, this.t);

    const walking = motion.phase === 'advance' && motion.killAge > .12;
    const stride = walking && !reduced ? Math.sin(motion.killAge * 36) : 0;
    const bob = reduced ? 0 : Math.round(Math.sin(this.t * 4));
    // hero
    const down = g.downFor > 0;
    const hx = 70 + (reduced ? 0 : this.heroLunge * 14 + stride * 2), hy = 88;
    c.fillStyle = '#30383c'; c.globalAlpha = .25; c.fillRect(hx - 12, hy - 1, 26, 3);
    c.globalAlpha = 1;
    const hs = sprite('hero.' + s.race);
    c.globalAlpha = down ? Math.max(0, 1 - motion.deathAge / .65) : Math.min(1, motion.reviveAge / .65);
    if (hs) c.drawImage(hs, hx - 12, hy - 32 + bob, 24, 32);
    else for (const p of heroPixels(s.race, s.equip)) { // the B-original 24×32 hero, wearing what is equipped
      c.fillStyle = p.color; c.fillRect(Math.round(hx - 12 + p.x), Math.round(hy - 32 + bob) + p.y, 1, 1);
    }
    c.globalAlpha = 1;

    // pet
    const ps = s.pets.find(p => p.key === s.activePet);
    if (ps) {
      const st = stageOf(ps.lvl);
      const px = 40 + (reduced ? 0 : this.petLunge * 20 + stride), py = 88;
      c.globalAlpha = g.petDownFor > 0 ? .3 : 1; // a resting pal fades
      const img = sprite(`pet.${ps.key}.${st}`);
      if (img) c.drawImage(img, px - 12, py - 24, 24, 24);
      else for (const p of pixels('pet-' + ps.key)) {
        c.fillStyle = p.color;
        const scale = st === 2 ? 2 : 1;
        c.fillRect(Math.round(px - 8 * scale + p.x * scale), Math.round(py - 16 * scale - (reduced ? 0 : Math.round(Math.abs(Math.sin(this.t * 5)) * 3)) + p.y * scale), Math.ceil(scale), Math.ceil(scale));
      }
      c.globalAlpha = 1;
    }

    // monster
    const m = g.mon;
    if (m) {
      const alpha = m.hp > 0 ? Math.min(1, motion.spawnAge / .2) : Math.max(0, 1 - motion.killAge / .25);
      c.globalAlpha = alpha;
      const sz = 22 * m.def.size, mx = 245 - (reduced ? 0 : this.monLunge * 14) + (reduced ? 0 : Math.max(0, 1 - motion.spawnAge / .3) * 20), my = 88;
      const img = sprite('mon.' + m.def.key);
      if (img) c.drawImage(img, mx - sz, my - sz * 2, sz * 2, sz * 2);
      else {
        c.fillStyle = this.monFlash > 0.5 ? '#ffffff' : m.def.color;
        c.fillRect(mx - sz / 2, my - sz + bob * 0.5, sz, sz);
        c.fillStyle = '#111'; c.fillRect(mx - sz / 4 - 2, my - sz * 0.7, 3, 3);
      }
      c.globalAlpha = 1;
    }

    // Death: body dissolves, soul rises, then returns before the engine revives.
    if (down || motion.reviveAge < .8) {
      const darkness = down ? Math.min(.78, motion.deathAge * .65) : .78 * Math.max(0, 1 - motion.reviveAge / .8);
      c.globalAlpha = darkness; c.fillStyle = '#202332'; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
      if (down) {
        const returning = g.downFor < 1;
        const rise = reduced ? 0 : returning ? g.downFor * 27 : Math.min(27, motion.deathAge * 12);
        const sy = Math.round(56 - rise), sx = Math.round(hx);
        c.globalAlpha = Math.min(1, motion.deathAge * 2);
        c.fillStyle = '#839da5'; c.fillRect(sx - 5, sy - 2, 10, 10); c.fillRect(sx - 3, sy - 4, 6, 2);
        c.fillStyle = '#d9ded0'; c.fillRect(sx - 3, sy - 1, 6, 6); c.fillRect(sx - 2, sy - 3, 4, 2);
        c.fillRect(sx - 3, sy + 5, 2, 3); c.fillRect(sx + 1, sy + 5, 2, 2);
        c.fillStyle = '#536773'; c.fillRect(sx - 2, sy + 1, 1, 2); c.fillRect(sx + 1, sy + 1, 1, 2);
        if (!reduced) for (let i = 0; i < 5; i++) {
          c.globalAlpha = .45 * (1 - i / 5);
          c.fillStyle = '#bcc5bd'; c.fillRect(sx + Math.round(Math.sin(this.t * 3 + i) * 7), sy + 11 + i * 3, 1, 2);
        }
        c.globalAlpha = 1;
      } else {
        // A contracting ring anchors the returned soul to the feet.
        c.globalAlpha = Math.max(0, 1 - motion.reviveAge / .8);
        const width = Math.round(34 * (1 - motion.reviveAge / .8));
        c.fillStyle = '#bcc5bd'; c.fillRect(hx - width / 2, 89, width, 1);
        c.globalAlpha = 1;
      }
    }

    // floaters
    c.textAlign = 'center'; c.font = '11px Cubic11, monospace';
    for (const f of this.floats) {
      f.age += dt;
      c.globalAlpha = Math.max(0, 1 - f.age / 1.1);
      c.fillStyle = '#000'; c.fillText(f.text, f.x + 1, f.y - f.age * 22 + 1);
      c.fillStyle = f.color; c.fillText(f.text, f.x, f.y - f.age * 22);
    }
    c.globalAlpha = 1;
    this.floats = this.floats.filter(f => f.age < 1.1);
  }
}
