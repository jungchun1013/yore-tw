// Detachable paper puppets, driven by data. Format: docs/art/RIG-SPEC.md.
//
// A puppet lives in public/art/puppets/<name>/: one transparent PNG per part plus rig.json.
// Each part is pinned to its parent at a pivot and turns around it; nothing is redrawn or
// deformed to animate. Motion comes from clips, and clips belong to a skeleton shared by every
// puppet built the same way (public/art/puppets/_skeletons/<skeleton>.json), addressed by part
// role, so a recolour or a new outfit only brings pictures and joint positions.
import { PUPPET_ASSETS } from '../data/manifest';

export interface RigPart { id: string; role?: string; file: string; parent?: string; pivot: [number, number]; at: [number, number]; z: number }
export type Channel = 'r' | 'x' | 'y';
export type Sway = [string, Channel, number, number, number];           // role, channel, amplitude, cycles/s, phase
export type Track = Partial<Record<Channel, [number, number][]>>;       // keyframes [time, value], linear
export interface Clip { length: number; sway?: Sway[]; tracks?: Record<string, Track> }
export interface Rig { version?: number; skeleton?: string; scale: number; parts: RigPart[]; clips?: Record<string, Clip> }

function sample(keys: [number, number][], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return v0 + ((v1 - v0) * (t - t0)) / Math.max(1e-6, t1 - t0); }
  }
  return keys[keys.length - 1][1];
}

interface Loaded { def: RigPart; img: HTMLImageElement; shade: HTMLCanvasElement; parent: number; m: DOMMatrix }

// A soft dark silhouette of a part (shrink then stretch back), made once at load.
function shadeOf(img: HTMLImageElement): HTMLCanvasElement {
  const w = img.naturalWidth, h = img.naturalHeight;
  const sil = document.createElement('canvas'); sil.width = w; sil.height = h;
  const s = sil.getContext('2d')!; s.drawImage(img, 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = '#3e2416'; s.fillRect(0, 0, w, h);
  const small = document.createElement('canvas'); small.width = Math.max(1, Math.round(w / 4)); small.height = Math.max(1, Math.round(h / 4));
  small.getContext('2d')!.drawImage(sil, 0, 0, small.width, small.height);
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const o = out.getContext('2d')!; o.imageSmoothingEnabled = true; o.drawImage(small, 0, 0, w, h);
  return out;
}

// Puppets loaded for play, by hero id. A hero without one keeps its sprite.
export const PUPPETS = new Map<string, Puppet>();
export async function loadPuppets(): Promise<void> {
  await Promise.all(PUPPET_ASSETS.map(async (x) => {
    try { PUPPETS.set(x.key, await Puppet.load(x.key)); } catch (e) { console.warn('puppet did not load', x.key, e); }
  }));
}

export class Puppet {
  clipLength(name: string): number { return this.rig.clips?.[name]?.length ?? 1; }
  clipNames(): string[] { return Object.keys(this.rig.clips ?? {}); }
  private parts: Loaded[] = [];
  private chain: Loaded[] = [];
  private order: Loaded[] = [];

  private constructor(readonly name: string, readonly rig: Rig) {}

  static async load(name: string): Promise<Puppet> {
    const base = `${import.meta.env.BASE_URL}art/puppets/${name}/`;
    const rig = (await (await fetch(`${base}rig.json`)).json()) as Rig;
    if (rig.skeleton) {
      // shared clips first, the puppet's own clips override them
      const sk = (await (await fetch(`${import.meta.env.BASE_URL}art/puppets/_skeletons/${rig.skeleton}.json`)).json()) as { clips: Record<string, Clip> };
      rig.clips = { ...sk.clips, ...(rig.clips ?? {}) };
    }
    const p = new Puppet(name, rig);
    const imgs = await Promise.all(rig.parts.map((d) => new Promise<HTMLImageElement>((ok, fail) => {
      const im = new Image(); im.onload = () => ok(im); im.onerror = () => fail(new Error(`${name}/${d.file}`)); im.src = base + d.file;
    })));
    p.parts = rig.parts.map((def, i) => ({ def, img: imgs[i], shade: shadeOf(imgs[i]), parent: def.parent ? rig.parts.findIndex((q) => q.id === def.parent) : -1, m: new DOMMatrix() }));
    const depth = (b: Loaded): number => (b.parent < 0 ? 0 : 1 + depth(p.parts[b.parent]));
    p.chain = p.parts.slice().sort((a, b) => depth(a) - depth(b));
    p.order = p.parts.slice().sort((a, b) => a.def.z - b.def.z);
    return p;
  }

  // Draws the puppet with its feet at (x, y). `spread` pulls the parts apart for an exploded view.
  draw(c: CanvasRenderingContext2D, x: number, y: number, size: number, face: number, t: number, motion: string, spread = 0): void {
    // pose per role: continuous sways plus keyframe tracks looped over the clip length
    const pose = new Map<string, { r: number; x: number; y: number }>();
    const clip = this.rig.clips?.[motion];
    const at0 = (role: string): { r: number; x: number; y: number } => { let j = pose.get(role); if (!j) pose.set(role, (j = { r: 0, x: 0, y: 0 })); return j; };
    if (clip) {
      for (const [role, ch, amp, hz, ph] of clip.sway ?? []) at0(role)[ch] += amp * Math.sin(t * hz * Math.PI * 2 + ph);
      const lt = ((t % clip.length) + clip.length) % clip.length;
      for (const role of Object.keys(clip.tracks ?? {})) {
        const tr = clip.tracks![role];
        for (const ch of Object.keys(tr) as Channel[]) at0(role)[ch] += sample(tr[ch]!, lt);
      }
    }
    const base = c.getTransform();
    const k = size * this.rig.scale;
    const root = base.translate(x, y).scale(face * k, k);
    for (const b of this.chain) {
      const j = pose.get(b.def.role ?? b.def.id) ?? { r: 0, x: 0, y: 0 };
      const from = b.parent >= 0 ? this.parts[b.parent].m : root;
      const at = b.parent >= 0 ? [b.def.at[0], b.def.at[1]] : b.def.at;
      b.m = from.translate(at[0] + j.x, at[1] + j.y).rotate((j.r * 180) / Math.PI).translate(-b.def.pivot[0], -b.def.pivot[1]);
    }
    for (const b of this.order) {
      const ex = spread * b.def.z * 10, ey = -spread * b.def.z * 6;
      c.setTransform(new DOMMatrix([1, 0, 0, 1, ex, ey]).multiply(b.m));
      // a faint shadow of each part on the parts beneath it
      c.save(); c.globalAlpha = 0.22; c.drawImage(b.shade, 3, 5); c.restore();
      c.drawImage(b.img, 0, 0);
    }
    c.setTransform(base);
  }
}
