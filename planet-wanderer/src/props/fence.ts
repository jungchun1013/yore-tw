import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import type { LatLon } from '../scenes/types';
import { at, box, mesh, param, type PropModule } from './kit';

/** Posts from `at` to params.to, two rails between each pair, following the curve. */
export const fence: PropModule = {
  build({ planet }, p) {
    const g = new THREE.Group();
    const from = dirAt(p.at);
    const to = dirAt(param<LatLon>(p, 'to', p.at));
    const posts = param(p, 'posts', 6);
    const tops: THREE.Vector3[] = [];
    const ups: THREE.Vector3[] = [];
    const obstacles: { dir: THREE.Vector3; radius: number }[] = [];
    for (let i = 0; i < posts; i++) {
      const d = from.clone().lerp(to, i / (posts - 1)).normalize();
      const holder = new THREE.Group();
      holder.add(at(mesh(box(0.09, 0.5, 0.09), PAL.wood), 0, 0.22, 0));
      holder.add(at(mesh(box(0.12, 0.04, 0.12), PAL.woodDark), 0, 0.48, 0));
      planet.place(holder, d, 0, 0.03);
      g.add(holder);
      tops.push(holder.position.clone());
      ups.push(d);
      obstacles.push({ dir: d, radius: 0.12 });
    }
    for (let i = 0; i < posts - 1; i++) {
      for (const hgt of [0.17, 0.36]) {
        const a = tops[i].clone().addScaledVector(ups[i], hgt);
        const b = tops[i + 1].clone().addScaledVector(ups[i + 1], hgt);
        const rail = mesh(box(a.distanceTo(b), 0.05, 0.04), PAL.wood);
        rail.position.copy(a).lerp(b, 0.5);
        const xAxis = b.clone().sub(a).normalize();
        const up = ups[i].clone().add(ups[i + 1]).normalize();
        const zAxis = new THREE.Vector3().crossVectors(xAxis, up).normalize();
        const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis);
        rail.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
        g.add(rail);
      }
    }
    return { object: g, obstacles };
  },
};
