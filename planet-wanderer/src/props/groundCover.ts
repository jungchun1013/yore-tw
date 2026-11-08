import * as THREE from 'three';
import { PAL } from '../render/palette';
import { toon } from '../render/materials';
import { blob, type Obstacle, type PropCtx } from './kit';

/** Grass tufts and small flowers scattered over everything that is not built on,
 *  under water or on a path. Two instanced meshes, so thousands cost two draw calls. */
export function groundCover({ planet, rand, root }: PropCtx, obstacles: Obstacle[], tuftCount: number, flowerCount: number) {
  const blocked = (d: THREE.Vector3) =>
    obstacles.some((o) => d.angleTo(o.dir) < o.radius * 1.15) ||
    planet.ponds.some((p) => d.angleTo(p.dir) < p.radius * 1.35) ||
    planet.paths.some(([a, b]) => {
      const n = new THREE.Vector3().crossVectors(a, b).normalize();
      return Math.abs(d.dot(n)) < 0.03 && d.angleTo(a) + d.angleTo(b) < a.angleTo(b) + 0.03;
    });
  const parts = [0, 1, 2].map((i) => {
    const c = new THREE.ConeGeometry(0.05, 0.22, 3);
    c.translate(0, 0.11, 0);
    c.rotateZ((i - 1) * 0.35);
    c.rotateY(i * 2.1);
    return c;
  });
  const tuftGeo = new THREE.BufferGeometry();
  const pos: number[] = [];
  for (const p of parts) {
    pos.push(...(p.toNonIndexed().attributes.position.array as Float32Array));
    p.dispose();
  }
  tuftGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  tuftGeo.computeVertexNormals();

  const tufts = new THREE.InstancedMesh(tuftGeo, toon(0xffffff, { noOutline: true, rim: 0 }), Math.max(1, tuftCount));
  const flowers = new THREE.InstancedMesh(blob(0.045, 1), toon(0xffffff, { noOutline: true }), Math.max(1, flowerCount));
  tufts.receiveShadow = flowers.receiveShadow = true;
  const o = new THREE.Object3D();
  const col = new THREE.Color();
  const greens = [PAL.leafB, PAL.grassLight, PAL.leafB, 0xd2e4ad];
  const blooms = [PAL.flowerA, PAL.flowerB, PAL.flowerC, PAL.flowerA];
  let ti = 0;
  let fi = 0;
  let guard = 0;
  while ((ti < tuftCount || fi < flowerCount) && guard++ < 20000) {
    const d = new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1);
    if (d.lengthSq() > 1 || d.lengthSq() < 0.01) continue;
    d.normalize();
    if (blocked(d)) continue;
    planet.place(o, d, rand() * 360, 0.02);
    if (ti < tuftCount) {
      o.scale.setScalar(0.7 + rand() * 0.7);
      o.updateMatrix();
      tufts.setMatrixAt(ti, o.matrix);
      tufts.setColorAt(ti, col.setHex(greens[Math.floor(rand() * greens.length)]));
      ti++;
    } else {
      o.position.copy(planet.surfacePoint(d, 0.04));
      o.scale.setScalar(0.8 + rand() * 0.5);
      o.updateMatrix();
      flowers.setMatrixAt(fi, o.matrix);
      flowers.setColorAt(fi, col.setHex(blooms[Math.floor(rand() * blooms.length)]));
      fi++;
    }
  }
  tufts.count = ti;
  flowers.count = fi;
  root.add(tufts, flowers);
}
