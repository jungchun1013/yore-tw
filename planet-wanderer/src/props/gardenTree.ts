import * as THREE from 'three';
import { dirAt } from '../world/planet';
import { makeRand, mesh, param, type PropModule } from './kit';
import { merge, paint } from './geo';
import { leafPad, paintedBranch, trunkSurface } from './treeForms';

/** Small landscape tree: wide lower foliage pads, narrowing upper crown and
 * deliberately asymmetric open spaces. A designed silhouette, not a species ID. */
export const gardenTree: PropModule = {
  build({ planet }, p) {
    const scale = param(p, 'scale', 1), seed = param(p, 'seed', 47);
    const rand = makeRand(seed);
    const bark: THREE.BufferGeometry[] = [], leaves: THREE.BufferGeometry[] = [];
    const trunk = trunkSurface([
      [-0.04, 0.17, 0.14, 0], [0.08, 0.13, 0.105, 0],
      [0.38, 0.075, 0.066, 0.015], [0.68, 0.063, 0.054, -0.01],
      [0.98, 0.046, 0.039, -0.04], [1.33, 0.027, 0.023, -0.05],
      [1.69, 0.003, 0.003, -0.03],
    ]);
    bark.push(paint(trunk, 0x9d8b77)); trunk.dispose();
    // The lower layer is the widest; canopy pads overlap locally, not everywhere.
    const pads = [
      { end: [-0.69, 1.06, 0.09], radius: [0.58, 0.29, 0.45], color: 0x739b7e },
      { end: [0.65, 1.2, -0.1], radius: [0.53, 0.28, 0.43], color: 0x81a481 },
      { end: [0.05, 1.05, -0.58], radius: [0.47, 0.25, 0.38], color: 0x72958a },
      { end: [-0.29, 1.5, -0.13], radius: [0.53, 0.27, 0.43], color: 0x8dae86 },
      { end: [0.43, 1.49, 0.3], radius: [0.39, 0.24, 0.33], color: 0x99b68d },
      { end: [0.04, 1.82, -0.02], radius: [0.34, 0.25, 0.31], color: 0xabc395 },
    ] as const;
    pads.forEach((pad, i) => {
      const [x, y, z] = pad.end, start = Math.min(1.28, 0.57 + i * 0.115);
      bark.push(paintedBranch([
        [0.015, start, -0.01], [x * 0.38, start + 0.17, z * 0.45],
        [x * 0.83, y - 0.12, z * 0.85], [x, y + 0.02, z],
      ], 0.047 - i * 0.004, 0.009, 0x9d8b77));
      leaves.push(leafPad(pad.end, pad.radius, seed + i * 1.8, pad.color));
    });
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + rand() * 0.3;
      bark.push(paintedBranch([[0, 0.14, 0], [Math.cos(a) * 0.14, 0.025, Math.sin(a) * 0.14],
        [Math.cos(a) * 0.23, -0.025, Math.sin(a) * 0.23]], 0.045, 0.012, 0x9d8b77));
    }
    const g = new THREE.Group(); g.name = 'layered-garden-tree';
    g.userData.inspection = { target: [0, 1.02, 0], camera: [3.0, 2.1, 5.2] };
    g.userData.artDirection = 'Small landscape broadleaf, lower-wide / upper-narrow; not a botanical species';
    g.add(mesh(merge(bark), 0xffffff, { vertexColors: true }), mesh(merge(leaves), 0xffffff, { vertexColors: true }));
    g.scale.setScalar(scale); const dir = dirAt(p.at); planet.place(g, dir, p.yaw ?? 0, 0.025);
    return { object: g, obstacles: [{ dir, radius: 0.23 * scale }] };
  },
};
