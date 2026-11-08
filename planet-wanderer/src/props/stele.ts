import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import { at, blob, box, cyl, mesh, type PropModule } from './kit';

/** Broken stone tablet with glowing runes, fallen pieces and column stumps. */
export const stele: PropModule = {
  prepare(planet, p) {
    planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(0.8) });
  },
  build({ planet, rand }, p) {
    const g = new THREE.Group();
    g.add(at(mesh(box(1.25, 0.16, 0.9), PAL.stoneDark), 0, 0.04, 0));
    g.add(at(mesh(box(0.9, 0.14, 0.62), PAL.stone), 0, 0.18, 0));
    const slab = new THREE.Group();
    slab.add(at(mesh(box(0.56, 1.15, 0.2), PAL.stone), 0, 0.58, 0));
    const cap = mesh(box(0.56, 0.22, 0.2), PAL.stone);
    cap.rotation.z = 0.32;
    slab.add(at(cap, 0.06, 1.15, 0));
    const rune = (w: number, h: number, x: number, y: number) =>
      slab.add(at(mesh(box(w, h, 0.02), PAL.rune, { emissive: 1, glow: true }), x, y, 0.105));
    rune(0.03, 0.5, 0, 0.62);
    rune(0.22, 0.03, 0, 0.82);
    rune(0.03, 0.14, -0.1, 0.4);
    rune(0.03, 0.14, 0.1, 0.4);
    slab.add(at(mesh(new THREE.TorusGeometry(0.1, 0.016, 4, 14), PAL.rune, { emissive: 1, glow: true }), 0, 0.62, 0.105));
    slab.add(at(mesh(blob(0.12, 1), PAL.moss), -0.22, 0.12, 0.08));
    slab.add(at(mesh(blob(0.09, 1), PAL.moss), 0.18, 1.12, 0.02));
    slab.rotation.set(-0.06, 0, 0.08);
    slab.position.y = 0.24;
    g.add(slab);
    const frag = mesh(box(0.4, 0.2, 0.18), PAL.stone);
    frag.rotation.set(0.1, 0.7, 0.25);
    g.add(at(frag, 0.75, 0.1, 0.35));
    g.add(at(mesh(cyl(0.13, 0.15, 0.55, 8), PAL.stoneDark), -0.78, 0.27, -0.25));
    g.add(at(mesh(cyl(0.13, 0.15, 0.3, 8), PAL.stone), 0.78, 0.15, -0.3));
    const fallen = mesh(cyl(0.12, 0.12, 0.62, 8), PAL.stone);
    fallen.rotation.set(0, 0.4, Math.PI / 2);
    g.add(at(fallen, -0.55, 0.12, 0.55));
    for (let i = 0; i < 5; i++) {
      const s = 0.05 + rand() * 0.06;
      const c = mesh(box(s, s, s), PAL.stoneDark);
      c.rotation.set(rand(), rand(), rand());
      g.add(at(c, (rand() - 0.5) * 1.6, s / 2, (rand() - 0.5) * 1.3));
    }
    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0.03);
    return { object: g, obstacles: [{ dir: d, radius: 0.7 }] };
  },
};
