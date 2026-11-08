import * as THREE from 'three';
import { toon } from '../render/materials';
import { makeRand, type PropCtx } from './kit';

const TONES = [0xb9b6aa, 0xa9a79c, 0xc6c0b0, 0x9c9d96, 0xbdb39f];

/** Cobbles laid along every path: rows of irregular flat stones with earth showing in
 *  the joints, thinning out toward the edges. One instanced mesh for the whole world. */
export function cobbles({ planet }: PropCtx, seed: number) {
  const rand = makeRand(seed);
  // One stone: a squat 7-sided slab with its top corners nudged, flat-shaded.
  const base = new THREE.CylinderGeometry(0.07, 0.08, 0.07, 7);
  const pos = base.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) pos.setXYZ(i, pos.getX(i) * (0.85 + rand() * 0.2), pos.getY(i) + (rand() - 0.5) * 0.015, pos.getZ(i) * (0.85 + rand() * 0.2));
  }
  const geo = base.toNonIndexed();
  base.dispose();
  geo.deleteAttribute('uv');
  geo.computeVertexNormals();

  const placements: THREE.Matrix4[] = [];
  const colors: number[] = [];
  const o = new THREE.Object3D();
  const step = planet.ang(0.15);
  planet.pathCurves.forEach((curve, pi) => {
    const half = planet.pathHalf[pi];
    let acc = 0;
    for (let i = 1; i < curve.length; i++) {
      acc += curve[i].angleTo(curve[i - 1]);
      if (acc < step) continue;
      acc = 0;
      const c = curve[i];
      const tan = curve[i].clone().sub(curve[i - 1]).normalize();
      const side = new THREE.Vector3().crossVectors(c, tan).normalize();
      const across = Math.max(2, Math.round((half * 2) / step));
      for (let k = 0; k < across; k++) {
        const u = (k + 0.5) / across * 2 - 1; // -1..1 across the path
        // Fewer stones near the edges; the middle is well paved.
        if (rand() < 0.08 + Math.abs(u) * 0.35) continue;
        const d = c.clone().addScaledVector(side, u * half * 0.95 + (rand() - 0.5) * step * 0.3).addScaledVector(tan, (rand() - 0.5) * step * 0.4).normalize();
        planet.place(o, d, rand() * 360, 0.015);
        const s = 0.85 + rand() * 0.45;
        o.scale.set(s * (0.9 + rand() * 0.3), 0.8 + rand() * 0.4, s);
        o.updateMatrix();
        placements.push(o.matrix.clone());
        colors.push(TONES[Math.floor(rand() * TONES.length)]);
      }
    }
  });
  const inst = new THREE.InstancedMesh(geo, toon(0xffffff), Math.max(1, placements.length));
  const col = new THREE.Color();
  placements.forEach((m, i) => {
    inst.setMatrixAt(i, m);
    inst.setColorAt(i, col.setHex(colors[i]).multiplyScalar(0.94 + rand() * 0.1));
  });
  inst.count = placements.length;
  inst.receiveShadow = true;
  inst.castShadow = false;
  inst.name = 'cobbles';
  return inst;
}
