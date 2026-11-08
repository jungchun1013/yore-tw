import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import { makeRand, mesh, param, type PropModule } from './kit';
import { lumpy, merge, paint, xf } from './geo';
import { limb } from './fence';

/**
 * Broadleaf tree grown from a seed: a bending, tapering trunk with root flare, four to
 * six limbs that fork once, and irregular leaf clusters at every tip in two greens
 * (darker inside, lighter where the light catches). Bark and leaves are one mesh each.
 */
export const tree: PropModule = {
  build({ planet }, p) {
    const seed = param(p, 'seed', Math.round((p.at[0] * 31 + p.at[1] * 17) % 997));
    const rand = makeRand(1000 + Math.abs(seed));
    const leaf = param(p, 'leaf', PAL.leafA);
    const leaf2 = param(p, 'leaf2', PAL.leafB);
    const bark: THREE.BufferGeometry[] = [];
    const leaves: THREE.BufferGeometry[] = [];
    const barkTone = () => [PAL.trunk, 0x7d6352, 0x977a66][Math.floor(rand() * 3)];

    // Trunk: four segments, leaning a little and tapering.
    const trunk: THREE.Vector3[] = [new THREE.Vector3(0, 0, 0)];
    const lean = new THREE.Vector3((rand() - 0.5) * 0.12, 1, (rand() - 0.5) * 0.12).normalize();
    for (let i = 1; i <= 4; i++) {
      const prev = trunk[i - 1];
      const dir = lean.clone().add(new THREE.Vector3((rand() - 0.5) * 0.25, 0, (rand() - 0.5) * 0.25)).normalize();
      trunk.push(prev.clone().addScaledVector(dir, 0.3));
    }
    const rAt = (i: number) => 0.13 * (1 - i / 5.5);
    for (let i = 0; i < 4; i++) bark.push(paint(limb(trunk[i], trunk[i + 1], rAt(i), rAt(i + 1), 8), barkTone(), 0.04, rand));
    // Root flare.
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + rand() * 0.5;
      const out = new THREE.Vector3(Math.cos(a) * 0.24, -0.03, Math.sin(a) * 0.24);
      bark.push(paint(limb(new THREE.Vector3(0, 0.16, 0), out, 0.06, 0.025, 5), barkTone(), 0.04, rand));
    }

    // Limbs from the upper trunk, each forking once; leaves at every tip.
    const tips: THREE.Vector3[] = [trunk[4].clone().add(new THREE.Vector3(0, 0.15, 0))];
    const limbs = 4 + Math.floor(rand() * 3);
    for (let i = 0; i < limbs; i++) {
      const at = trunk[2 + Math.floor(rand() * 3)].clone();
      const a = (i / limbs) * Math.PI * 2 + rand() * 0.6;
      const dir = new THREE.Vector3(Math.cos(a), 0.75 + rand() * 0.5, Math.sin(a)).normalize();
      const mid = at.clone().addScaledVector(dir, 0.38 + rand() * 0.15);
      bark.push(paint(limb(at, mid, 0.055, 0.035, 6), barkTone(), 0.04, rand));
      for (const turn of [-0.5, 0.5]) {
        const d2 = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), turn + (rand() - 0.5) * 0.3);
        d2.y += 0.25;
        const end = mid.clone().addScaledVector(d2.normalize(), 0.25 + rand() * 0.15);
        bark.push(paint(limb(mid, end, 0.032, 0.018, 5), barkTone(), 0.04, rand));
        tips.push(end);
      }
    }
    // Leaf clusters: a darker inner mass and lighter outer puffs.
    for (const tip of tips) {
      const r = 0.3 + rand() * 0.16;
      const inner = lumpy(r, 2, 0.22, rand() * 20);
      xf(inner, tip, { x: rand(), y: rand() * 6, z: rand() }, { x: 1.15, y: 0.85, z: 1.1 });
      leaves.push(paint(inner, leaf, 0.06, rand));
      for (let k = 0; k < 2; k++) {
        const puff = lumpy(r * (0.55 + rand() * 0.2), 1, 0.25, rand() * 20);
        const off = new THREE.Vector3(rand() - 0.5, rand() * 0.6 + 0.1, rand() - 0.5).normalize().multiplyScalar(r * 0.7);
        xf(puff, tip.clone().add(off));
        leaves.push(paint(puff, leaf2, 0.07, rand));
      }
    }

    const g = new THREE.Group();
    g.add(mesh(merge(bark), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(leaves), 0xffffff, { vertexColors: true }));
    g.scale.setScalar(param(p, 'scale', 1) * 1.15);
    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0.05);
    return { object: g, obstacles: [{ dir: d, radius: 0.28 }] };
  },
};
