// Jointed paper dolls.
//
// A doll is a tree of card parts pinned together at pivots, like a split-pin puppet. Each part
// is cut and layered on its own (see `piece` in kit.ts), keeps its own white card rim, and is
// drawn separately every frame: it turns around its pin, and it drops a shadow on whatever parts
// lie under it. Nothing is ever redrawn or deformed to animate; a pose is only angles and offsets.
import { type C, type Sprite, piece, shadeOf } from './kit';

export interface PartDef {
  id: string;
  parent?: string;
  at: [number, number];                    // where the pin sits, in the parent's space
  z: number;                               // stacking height: higher parts lie on top
  box: [number, number, number, number];   // drawing bounds around the pin
  draw: (c: C) => void;
}
export interface Joint { r?: number; x?: number; y?: number; sx?: number; sy?: number }
export type Pose = Record<string, Joint>;
export interface DollDef { parts: PartDef[]; pose: (t: number, moving: boolean) => Pose }

interface Built { def: PartDef; spr: Sprite; shade: HTMLCanvasElement; parent: number; m: DOMMatrix }

export class Doll {
  private parts: Built[] = [];
  private order: Built[];
  private chain: Built[];

  constructor(private def: DollDef, res: number) {
    for (const p of def.parts) {
      const spr = piece(p.box[0], p.box[1], p.box[2], p.box[3], p.draw, res);
      this.parts.push({ def: p, spr, shade: shadeOf(spr), parent: p.parent ? def.parts.findIndex((q) => q.id === p.parent) : -1, m: new DOMMatrix() });
    }
    this.order = this.parts.slice().sort((a, b) => a.def.z - b.def.z);
    // parents must be placed before their children, whatever order the parts were listed in
    const depth = (b: Built): number => (b.parent < 0 ? 0 : 1 + depth(this.parts[b.parent]));
    this.chain = this.parts.slice().sort((x, y) => depth(x) - depth(y));
  }

  // `spread` pulls the parts apart along z, for an exploded view of how the doll is built.
  draw(c: CanvasRenderingContext2D, x: number, y: number, scale: number, face: number, t: number, moving: boolean, spread = 0): void {
    const pose = this.def.pose(t, moving);
    const base = c.getTransform();
    const root = base.translate(x, y).scale(face * scale, scale);
    for (const b of this.chain) {
      const j = pose[b.def.id] ?? {};
      const from = b.parent >= 0 ? this.parts[b.parent].m : root;
      b.m = from.translate(b.def.at[0] + (j.x ?? 0), b.def.at[1] + (j.y ?? 0)).rotate(((j.r ?? 0) * 180) / Math.PI).scale(j.sx ?? 1, j.sy ?? 1);
    }
    const k = Math.hypot(base.a, base.b) * scale;
    for (const b of this.order) {
      const s = b.spr, lift = 0.5 + b.def.z * 0.16;
      const ex = spread * b.def.z * 2.2 * k, ey = -spread * b.def.z * 1.2 * k;
      // the shadow falls in a fixed screen direction, further for parts that sit higher
      c.setTransform(b.m.a, b.m.b, b.m.c, b.m.d, b.m.e + ex + lift * 0.7 * k, b.m.f + ey + lift * 1.5 * k);
      c.globalAlpha = 0.22;
      c.drawImage(b.shade, -s.ox, -s.oy, s.w, s.h);
      c.globalAlpha = 1;
      c.setTransform(b.m.a, b.m.b, b.m.c, b.m.d, b.m.e + ex, b.m.f + ey);
      c.drawImage(s.c, -s.ox, -s.oy, s.w, s.h);
    }
    c.setTransform(base);
  }
}
