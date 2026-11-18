// Detachable paper puppets, driven by data.
//
// A puppet lives in public/art/puppets/<name>/: one transparent PNG per part plus rig.json.
// Each part is pinned to its parent at a pivot and turns around it; nothing is redrawn or
// deformed to animate, so a pose is only angles and offsets. The same rig plays in the game,
// on the ?puppet review page, and frame by frame for exporting an animated image.
//
// rig.json:
// {
//   "scale": 0.333,                       // logical px per image px (art is drawn at 3x)
//   "parts": [
//     { "id": "body", "file": "body.png", "pivot": [x, y], "at": [x, y], "z": 4 },
//     { "id": "head", "file": "head.png", "parent": "body", "pivot": [x, y], "at": [x, y], "z": 7 }
//   ],
//   "motions": {                          // each entry: part, channel (r | x | y), amplitude, cycles per second, phase
//     "idle": [["head", "r", 0.05, 0.6, 0]],
//     "walk": [["legL", "r", 0.5, 1.6, 0], ["legR", "r", 0.5, 1.6, 3.14]]
//   }
// }
// pivot: the pin inside this part's own image (px). at: where that pin sits in the parent's image
// (px), or, for a root part, relative to the feet. z: stacking order, higher lies on top.

export interface RigPart { id: string; file: string; parent?: string; pivot: [number, number]; at: [number, number]; z: number }
export type Motion = [string, 'r' | 'x' | 'y', number, number, number];
export interface Rig { scale: number; parts: RigPart[]; motions: Record<string, Motion[]> }

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
export async function loadPuppets(map: Record<string, string>): Promise<void> {
  await Promise.all(Object.entries(map).map(async ([hero, name]) => {
    try { PUPPETS.set(hero, await Puppet.load(name)); } catch (e) { console.warn('puppet did not load', name, e); }
  }));
}

export class Puppet {
  private parts: Loaded[] = [];
  private chain: Loaded[] = [];
  private order: Loaded[] = [];

  private constructor(readonly name: string, readonly rig: Rig) {}

  static async load(name: string): Promise<Puppet> {
    const base = `${import.meta.env.BASE_URL}art/puppets/${name}/`;
    const rig = (await (await fetch(`${base}rig.json`)).json()) as Rig;
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
    const pose = new Map<string, { r: number; x: number; y: number }>();
    for (const [part, ch, amp, hz, ph] of this.rig.motions[motion] ?? []) {
      const j = pose.get(part) ?? { r: 0, x: 0, y: 0 };
      j[ch] += amp * Math.sin(t * hz * Math.PI * 2 + ph);
      pose.set(part, j);
    }
    const base = c.getTransform();
    const k = size * this.rig.scale;
    const root = base.translate(x, y).scale(face * k, k);
    for (const b of this.chain) {
      const j = pose.get(b.def.id) ?? { r: 0, x: 0, y: 0 };
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
