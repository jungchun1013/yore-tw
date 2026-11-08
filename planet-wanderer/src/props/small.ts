import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import { at, blob, cyl, mesh, param, type PropModule } from './kit';

/** A single rose ringed by four pebbles. */
export const rose: PropModule = {
  build({ planet }, p) {
    const g = new THREE.Group();
    g.add(at(mesh(cyl(0.012, 0.016, 0.3, 4), PAL.leafC), 0, 0.15, 0));
    const leafL = mesh(blob(0.05, 1), PAL.leafA);
    leafL.scale.set(1.4, 0.4, 0.7);
    g.add(at(leafL, 0.06, 0.12, 0));
    g.add(at(leafL.clone(), -0.06, 0.18, 0));
    g.add(at(mesh(blob(0.075, 1), PAL.rose), 0, 0.33, 0));
    g.add(at(mesh(blob(0.05, 1), 0xf08b94), 0.02, 0.38, 0.03));
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      g.add(at(mesh(new THREE.DodecahedronGeometry(0.05, 0), PAL.stone), Math.cos(a) * 0.17, 0.02, Math.sin(a) * 0.17));
    }
    g.scale.setScalar(param(p, 'scale', 1));
    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0.02);
    return { object: g, obstacles: [{ dir: d, radius: 0.18 * param(p, 'scale', 1) }] };
  },
};

/** A knee-high volcano; an active one glows and puffs. */
export const volcano: PropModule = {
  build({ planet, root }, p) {
    const active = param(p, 'active', false);
    const g = new THREE.Group();
    g.add(at(mesh(cyl(0.2, 0.62, 0.55, 12), PAL.volcano), 0, 0.25, 0));
    g.add(at(mesh(cyl(0.16, 0.16, 0.03, 12), active ? 0xe9a07a : PAL.crater, { emissive: active ? 0.6 : 0 }), 0, 0.52, 0));
    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0.05);
    const puffs = active
      ? [0, 1].map((i) => {
          const m = mesh(blob(0.07, 1), 0xe9e2dc, { rim: 0 });
          m.castShadow = false;
          m.userData.phase = i / 2;
          root.add(m);
          return m;
        })
      : [];
    const base = planet.surfacePoint(d, 0.6);
    return {
      object: g,
      obstacles: [{ dir: d, radius: 0.6 }],
      update(t) {
        for (const m of puffs) {
          const k = (t * 0.2 + (m.userData.phase as number)) % 1;
          m.position.copy(base).addScaledVector(d, k * 0.8);
          m.scale.setScalar(Math.max(0, 0.6 + k - Math.max(0, k - 0.7) * 5));
        }
      },
    };
  },
};

/** A baobab seedling, three leaves. */
export const sprout: PropModule = {
  build({ planet }, p) {
    const g = new THREE.Group();
    g.add(at(mesh(cyl(0.02, 0.03, 0.18, 5), PAL.trunk), 0, 0.09, 0));
    for (let i = 0; i < 3; i++) {
      const leaf = mesh(blob(0.06, 1), PAL.leafB);
      leaf.scale.set(1.6, 0.35, 0.8);
      const h = new THREE.Group();
      h.add(at(leaf, 0.07, 0, 0));
      h.rotation.set(0, (i / 3) * Math.PI * 2, 0.4);
      h.position.y = 0.18;
      g.add(h);
    }
    planet.place(g, dirAt(p.at), p.yaw ?? 0, 0.01);
    return { object: g };
  },
};

/** A loose boulder with a smaller stone beside it. */
export const boulder: PropModule = {
  build({ planet, rand }, p) {
    const g = new THREE.Group();
    const r = 0.22 + rand() * 0.18;
    const b = mesh(new THREE.DodecahedronGeometry(r, 0), PAL.stone);
    b.scale.set(1, 0.7, 1);
    g.add(at(b, 0, r * 0.3, 0));
    g.add(at(mesh(new THREE.DodecahedronGeometry(r * 0.5, 0), PAL.stoneDark), r * 1.1, r * 0.1, r * 0.4));
    const d = dirAt(p.at);
    planet.place(g, d, rand() * 360, 0.03);
    return { object: g, obstacles: [{ dir: d, radius: 0.3 }] };
  },
};
