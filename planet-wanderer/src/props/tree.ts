import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import { at, blob, cyl, mesh, param, type PropModule } from './kit';

/** Round-canopy tree: a trunk, one branch and five soft leaf blobs. */
export const tree: PropModule = {
  build({ planet }, p) {
    const leaf = param(p, 'leaf', PAL.leafA);
    const leaf2 = param(p, 'leaf2', PAL.leafB);
    const g = new THREE.Group();
    g.add(at(mesh(cyl(0.08, 0.14, 1.0, 8), PAL.trunk), 0, 0.5, 0));
    const branch = mesh(cyl(0.035, 0.05, 0.42, 6), PAL.trunk);
    branch.rotation.z = -0.9;
    g.add(at(branch, 0.17, 0.85, 0));
    const blobs: [number, number, number, number, number][] = [
      [0, 1.45, 0, 0.62, leaf],
      [0.42, 1.18, 0.12, 0.42, leaf2],
      [-0.38, 1.22, -0.1, 0.46, leaf],
      [0.08, 1.2, 0.42, 0.4, leaf2],
      [0.1, 1.86, -0.12, 0.38, leaf2],
    ];
    for (const [x, y, z, r, c] of blobs) g.add(at(mesh(blob(r), c), x, y, z));
    g.scale.setScalar(param(p, 'scale', 1));
    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0.05);
    return { object: g, obstacles: [{ dir: d, radius: 0.25 }] };
  },
};
