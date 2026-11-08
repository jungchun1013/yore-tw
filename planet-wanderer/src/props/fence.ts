import * as THREE from 'three';
import { dirAt } from '../world/planet';
import type { LatLon } from '../scenes/types';
import { makeRand, mesh, param, type PropModule } from './kit';
import { merge, paint } from './geo';

const WEATHERED = [0x9c8064, 0x8b735c, 0xa88d70, 0x7f6a57];

/** A cylinder from a to b (world space), for rails and branches. */
export function limb(a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, seg = 6) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r1, r0, len, seg);
  g.translate(0, len / 2, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  g.applyQuaternion(q);
  g.translate(a.x, a.y, a.z);
  return g;
}

/** Rustic fence: leaning hand-split posts with pointed tops, two sagging rails per bay. */
export const fence: PropModule = {
  build({ planet }, p) {
    const rand = makeRand(97);
    const from = dirAt(p.at);
    const to = dirAt(param<LatLon>(p, 'to', p.at));
    const posts = param(p, 'posts', 6);
    const parts: THREE.BufferGeometry[] = [];
    const tops: THREE.Vector3[] = [];
    const ups: THREE.Vector3[] = [];
    const obstacles: { dir: THREE.Vector3; radius: number }[] = [];
    const o = new THREE.Object3D();
    for (let i = 0; i < posts; i++) {
      const d = from.clone().lerp(to, i / (posts - 1)).normalize();
      planet.place(o, d, rand() * 360, 0.06);
      o.rotateX((rand() - 0.5) * 0.14);
      o.rotateZ((rand() - 0.5) * 0.14);
      o.updateMatrix();
      const h = 0.55 + rand() * 0.1;
      const post = new THREE.CylinderGeometry(0.04, 0.05, h, 6);
      post.translate(0, h / 2, 0);
      const tip = new THREE.ConeGeometry(0.04, 0.09, 6);
      tip.translate(0, h + 0.045, 0);
      for (const g of [post, tip]) {
        g.applyMatrix4(o.matrix);
        parts.push(paint(g, WEATHERED[Math.floor(rand() * WEATHERED.length)], 0.05, rand));
      }
      tops.push(o.position.clone());
      ups.push(new THREE.Vector3(0, 1, 0).applyQuaternion(o.quaternion));
      obstacles.push({ dir: d, radius: 0.12 });
    }
    for (let i = 0; i < posts - 1; i++) {
      for (const hgt of [0.2, 0.42]) {
        const a = tops[i].clone().addScaledVector(ups[i], hgt + (rand() - 0.5) * 0.03);
        const b = tops[i + 1].clone().addScaledVector(ups[i + 1], hgt + (rand() - 0.5) * 0.03);
        // Each rail sags a little in the middle: two pieces meeting low.
        const mid = a.clone().lerp(b, 0.5).addScaledVector(ups[i], -0.025);
        for (const [s, e] of [[a, mid], [mid, b]]) parts.push(paint(limb(s, e, 0.026, 0.024, 5), WEATHERED[Math.floor(rand() * WEATHERED.length)], 0.04, rand));
      }
    }
    const g = new THREE.Group();
    g.add(mesh(merge(parts), 0xffffff, { vertexColors: true }));
    return { object: g, obstacles };
  },
};
