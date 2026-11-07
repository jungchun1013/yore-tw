import type { Game, GameEvent } from '../game/engine';
import { areaOf } from '../data/areas';
import { raceOf } from '../data/races';
import { petOf, stageOf } from '../data/pets';
import { sprite } from './sprites';
import { num } from '../core/fmt';

/**
 * Battle strip. Placeholder shapes until real sprites are registered in sprites.ts.
 * Logical size 320x120, drawn at 2x for crisp edges.
 */
const W = 320, H = 120, S = 2;
interface Floater { x: number; y: number; text: string; color: string; age: number }

export class Scene {
  cv: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private floats: Floater[] = [];
  private heroLunge = 0; private monLunge = 0; private petLunge = 0; private monFlash = 0; private monFade = 0;
  private t = 0;

  constructor(private g: Game) {
    this.cv = document.createElement('canvas');
    this.cv.width = W * S; this.cv.height = H * S;
    this.cv.className = 'scene';
    this.ctx = this.cv.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    g.on(e => this.onEvent(e));
  }

  private onEvent(e: GameEvent): void {
    if (e.t === 'hit') {
      if (e.from === 'mon') {
        this.monLunge = 1;
        this.float(78, 52, e.blocked && !e.dmg ? 'BLOCK' : num(e.dmg), e.blocked ? '#9fb3c8' : '#ff6b6b');
      } else {
        if (e.from === 'hero') this.heroLunge = 1; else this.petLunge = 1;
        this.monFlash = 1;
        const col = e.skill === 'firebolt' ? '#ff9f43' : e.skill === 'icebolt' ? '#8fd3ff' : e.skill === 'lightning' ? '#fff27a' : e.crit ? '#ffd166' : e.from === 'pet' ? '#b8f2a0' : '#ffffff';
        this.float(238 + (e.from === 'pet' ? -10 : 0), 46, num(e.dmg) + (e.crit ? '!' : ''), col);
      }
    } else if (e.t === 'heal') this.float(70, 40, '+' + num(e.amt), '#7ee081');
    else if (e.t === 'kill') this.monFade = 1;
    else if (e.t === 'spawn') this.monFade = 0;
    else if (e.t === 'level') this.float(70, 30, 'LEVEL UP', '#ffd166');
  }

  private float(x: number, y: number, text: string, color: string): void {
    this.floats.push({ x: x + (Math.random() * 10 - 5), y, text, color, age: 0 });
    if (this.floats.length > 24) this.floats.shift();
  }

  draw(dt: number): void {
    const c = this.ctx, g = this.g, s = g.s;
    this.t += dt;
    const decay = (v: number) => Math.max(0, v - dt * 5);
    this.heroLunge = decay(this.heroLunge); this.monLunge = decay(this.monLunge); this.petLunge = decay(this.petLunge);
    this.monFlash = decay(this.monFlash);

    c.setTransform(S, 0, 0, S, 0, 0);
    const area = areaOf(s.area);
    const bg = sprite('bg.' + area.key);
    if (bg) c.drawImage(bg, 0, 0, W, H);
    else {
      c.fillStyle = area.bg; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 88, W, H - 88);
      c.fillStyle = 'rgba(255,255,255,0.06)'; for (let x = 0; x < W; x += 16) c.fillRect(x, 88, 8, 2);
    }

    const bob = Math.sin(this.t * 4) * 1.5;
    // hero
    const down = g.downFor > 0;
    const hx = 70 + this.heroLunge * 14, hy = 88;
    const hs = sprite('hero.' + s.race);
    c.globalAlpha = down ? 0.35 : 1;
    if (hs) c.drawImage(hs, hx - 16, hy - 32 + bob, 32, 32);
    else {
      c.fillStyle = raceOf(s.race).color; c.fillRect(hx - 7, hy - 20 + bob, 14, 18);
      c.fillStyle = '#f3d9b1'; c.fillRect(hx - 6, hy - 30 + bob, 12, 10);
      c.fillStyle = '#e8e3d3'; c.fillRect(hx + 7, hy - 24 + bob, 3, 16);
    }
    c.globalAlpha = 1;

    // pet
    const ps = s.pets.find(p => p.key === s.activePet);
    if (ps) {
      const d = petOf(ps.key)!, st = stageOf(ps.lvl);
      const px = 40 + this.petLunge * 20, py = 88, r = 5 + st * 1.5;
      const img = sprite(`pet.${ps.key}.${st}`);
      if (img) c.drawImage(img, px - 12, py - 24, 24, 24);
      else { c.fillStyle = d.stages[st].color; c.beginPath(); c.arc(px, py - r - Math.abs(Math.sin(this.t * 5)) * 3, r, 0, Math.PI * 2); c.fill(); }
    }

    // monster
    const m = g.mon;
    if (m) {
      const alpha = m.hp > 0 ? 1 : Math.max(0, 1 - this.monFade);
      this.monFade = Math.min(1, this.monFade + dt * 2);
      c.globalAlpha = alpha;
      const sz = 22 * m.def.size, mx = 245 - this.monLunge * 14, my = 88;
      const img = sprite('mon.' + m.def.key);
      if (img) c.drawImage(img, mx - sz, my - sz * 2, sz * 2, sz * 2);
      else {
        c.fillStyle = this.monFlash > 0.5 ? '#ffffff' : m.def.color;
        c.fillRect(mx - sz / 2, my - sz + bob * 0.5, sz, sz);
        c.fillStyle = '#111'; c.fillRect(mx - sz / 4 - 2, my - sz * 0.7, 3, 3);
      }
      c.globalAlpha = 1;
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
