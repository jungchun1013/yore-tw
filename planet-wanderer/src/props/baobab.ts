import * as THREE from 'three';
import { dirAt } from '../world/planet';
import { mesh, param, type PropModule } from './kit';
import { merge, paint } from './geo';
import { leafPad, paintedBranch, trunkSurface } from './treeForms';

/** Little-Prince baobab nod: bottle trunk, broad root flare and root-like forks.
 * Deliberately compact for a small planet; this is visual scenery, not growth logic. */
export const baobab: PropModule = {
  build({ planet }, p) {
    const scale = param(p, 'scale', 1), seed = param(p, 'seed', 131);
    const bark: THREE.BufferGeometry[] = [], leaves: THREE.BufferGeometry[] = [];
    const trunk = trunkSurface([
      [-0.07, 0.48, 0.42, 0], [0.06, 0.47, 0.41, 0],
      [0.3, 0.4, 0.36, 0.005], [0.75, 0.43, 0.37, -0.015],
      [1.16, 0.39, 0.34, -0.02], [1.48, 0.29, 0.26, -0.015],
      [1.74, 0.16, 0.15, 0], [1.88, 0.015, 0.015, 0],
    ], 0.035);
    bark.push(paint(trunk, 0xb49b8e)); trunk.dispose();
    // Five primary forks, each with thin, crooked fingers; visible sky between them.
    const arms = [
      { end: [-0.92, 2.24, 0.12], leaf: [0.36, 0.2, 0.29] },
      { end: [0.83, 2.16, 0.18], leaf: [0.35, 0.19, 0.3] },
      { end: [-0.22, 2.49, -0.57], leaf: [0.32, 0.2, 0.3] },
      { end: [0.17, 2.46, 0.43], leaf: [0.3, 0.19, 0.28] },
      { end: [0.66, 2.38, -0.46], leaf: [0.32, 0.2, 0.28] },
    ] as const;
    arms.forEach((arm, i) => {
      const [x, y, z] = arm.end, start = 1.36 + i * 0.055;
      bark.push(paintedBranch([
        [x * 0.12, start, z * 0.12], [x * 0.4, start + 0.24, z * 0.42],
        [x * 0.82, y - 0.28, z * 0.86], [x, y - 0.02, z],
      ], 0.145 - i * 0.012, 0.022, 0xb49b8e));
      for (const side of [-1, 1]) {
        const tip: [number, number, number] = [x + side * 0.16, y + 0.12 + i % 2 * 0.04, z + side * 0.13];
        bark.push(paintedBranch([
          [x * 0.83, y - 0.25, z * 0.85], [x + side * 0.1, y - 0.01, z + side * 0.12], tip,
        ], 0.038, 0.006, 0xa58b7f));
      }
      leaves.push(leafPad([x, y + 0.07, z], arm.leaf, seed + i * 2.7, [0x8d9f79, 0x9cab7e, 0x7d9680][i % 3]));
    });
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + 0.2;
      bark.push(paintedBranch([[Math.cos(a) * 0.24, 0.25, Math.sin(a) * 0.23],
        [Math.cos(a) * 0.49, 0.05, Math.sin(a) * 0.44],
        [Math.cos(a) * 0.7, -0.035, Math.sin(a) * 0.63]], 0.115, 0.02, 0xb49b8e));
    }
    const g = new THREE.Group(); g.name = 'little-prince-baobab';
    g.userData.inspection = { target: [0, 1.3, 0], camera: [3.6, 2.6, 6.5] };
    g.userData.species = 'Adansonia-inspired fantasy baobab';
    g.add(mesh(merge(bark), 0xffffff, { vertexColors: true }), mesh(merge(leaves), 0xffffff, { vertexColors: true }));
    g.scale.setScalar(scale); const dir = dirAt(p.at); planet.place(g, dir, p.yaw ?? 0, 0.025);
    return { object: g, obstacles: [{ dir, radius: 0.56 * scale }] };
  },
};
