import * as THREE from 'three';
import { PAL } from '../render/palette';
import { waterMaterial } from '../render/materials';
import { dirAt, orient } from '../world/planet';
import { at, blob, cyl, mesh, param, type PropModule } from './kit';
import { lumpy, merge, paint, stoneBlock, xf } from './geo';

/** A hollow in the ground with water, lily pads, a ring of rocks and some reeds. */
export const pond: PropModule = {
  prepare(planet, p) {
    planet.ponds.push({ dir: dirAt(p.at), radius: planet.ang(param(p, 'radius', 1.5)), depth: param(p, 'depth', 0.42) });
  },
  build({ planet, rand }, p) {
    const g = new THREE.Group();
    const dir = dirAt(p.at);
    const units = param(p, 'radius', 1.5);
    const ang = planet.ang(units);
    const side = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
    if (side.lengthSq() < 0.5) side.set(1, 0, 0);
    const tangent = side.clone();
    const spin = Math.abs(dir.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const rimH = planet.heightAt(dir.clone().applyAxisAngle(spin, ang * 1.05));

    const water = new THREE.Mesh(new THREE.CircleGeometry(units * 1.02, 48), waterMaterial(units * 1.02));
    water.receiveShadow = true;
    water.rotation.x = -Math.PI / 2;
    const holder = new THREE.Group();
    holder.add(water);
    holder.position.copy(dir).multiplyScalar(planet.radius + rimH - 0.08);
    orient(holder, dir);
    g.add(holder);

    // Lily pads with one pink bloom.
    for (const [x, z, r] of [[0.45, 0.2, 0.17], [-0.3, -0.5, 0.13], [0.1, -0.15, 0.1]] as const) {
      const pad = mesh(cyl(r, r, 0.02, 12), PAL.leafA);
      pad.castShadow = false;
      holder.add(at(pad, x, 0.015, z));
    }
    holder.add(at(mesh(blob(0.06, 1), PAL.flowerC), 0.48, 0.07, 0.18));

    const t = new THREE.Vector3();
    const axis = new THREE.Vector3();
    const k = units / 1.5;
    // Bedrock along the far bank: one rock body cut by joints. Blocks share a strike
    // and dip, step down toward the water in two or three tiers, and are half buried,
    // so the bank reads as stone the water wore through, not stones carried in.
    const obstacles: { dir: THREE.Vector3; radius: number }[] = [{ dir, radius: units * 0.95 }];
    const rockParts: THREE.BufferGeometry[] = [];
    const mossParts: THREE.BufferGeometry[] = [];
    const greys = [PAL.boulder, PAL.boulderDark, 0xb4b8b6, 0x9aa1a3];
    const arcFrom = 3.25;
    const arcTo = 6.1;
    const cols = Math.round(9 * k);
    for (let c = 0; c < cols; c++) {
      const a = arcFrom + ((arcTo - arcFrom) * (c + 0.5)) / cols + (rand() - 0.5) * 0.08;
      axis.copy(tangent).applyAxisAngle(dir, a);
      const bank = dir.clone().applyAxisAngle(axis, ang * 1.02);
      const n = bank.clone();
      const outward = bank.clone().sub(dir.clone().multiplyScalar(bank.dot(dir))).normalize();
      const along = new THREE.Vector3().crossVectors(n, outward).normalize();
      const frame = new THREE.Matrix4().makeBasis(along, n, outward);
      const origin = planet.surfacePoint(bank, -0.12);
      const colW = ((arcTo - arcFrom) / cols) * units * 1.02;
      // Tiers: 0 at the waterline, 1 and 2 stepping up and back from the water.
      const tiers = c % 4 === 0 ? 2 : 3;
      for (let tier = 0; tier < tiers; tier++) {
        const h = (0.22 + rand() * 0.16) * k;
        const w = colW * (0.82 + rand() * 0.12);
        const d = (0.38 + rand() * 0.22) * k;
        const top = (tier === 0 ? 0.02 : tier === 1 ? 0.3 : 0.52) * k + rand() * 0.06;
        const z = (tier - 0.6) * 0.38 * k;
        const g0 = stoneBlock(w, h, d, rand, 0.55);
        // Shared dip: the strata lean the same way along the whole bank.
        xf(g0, { x: (rand() - 0.5) * 0.05, y: top - h / 2, z }, { x: 0.16, y: (rand() - 0.5) * 0.06, z: 0.05 });
        g0.applyMatrix4(frame);
        g0.translate(origin.x, origin.y, origin.z);
        rockParts.push(paint(g0, greys[Math.floor(rand() * greys.length)], 0.05, rand));
        if (tier > 0 && rand() < 0.45) {
          const m = lumpy(0.13 * k, 1, 0.2, rand() * 10);
          xf(m, { x: (rand() - 0.5) * w * 0.5, y: top + 0.01, z: z + (rand() - 0.5) * d * 0.4 }, { x: 0, y: 0, z: 0 }, { x: 1.4, y: 0.3, z: 1.1 });
          m.applyMatrix4(frame);
          m.translate(origin.x, origin.y, origin.z);
          mossParts.push(paint(m, PAL.moss, 0.08, rand));
        }
      }
      obstacles.push({ dir: bank, radius: colW * 0.6 + 0.1 });
    }
    // A few fallen slabs lying in the shallows below the outcrop.
    for (let i = 0; i < 4; i++) {
      const a = arcFrom + rand() * (arcTo - arcFrom);
      axis.copy(tangent).applyAxisAngle(dir, a);
      t.copy(dir).applyAxisAngle(axis, ang * (0.82 + rand() * 0.08));
      const p = planet.surfacePoint(t);
      const water = dir.clone().multiplyScalar(planet.radius + rimH - 0.08);
      p.copy(t).multiplyScalar(water.length() - 0.04);
      const g0 = stoneBlock((0.3 + rand() * 0.2) * k, 0.14 * k, (0.25 + rand() * 0.15) * k, rand, 0.7);
      const o = new THREE.Object3D();
      orient(o, t, rand() * 360);
      o.position.copy(p);
      o.rotateX((rand() - 0.5) * 0.3);
      o.updateMatrix();
      g0.applyMatrix4(o.matrix);
      rockParts.push(paint(g0, greys[Math.floor(rand() * greys.length)], 0.05, rand));
    }
    g.add(mesh(merge(rockParts), 0xffffff, { vertexColors: true }));
    if (mossParts.length) g.add(mesh(merge(mossParts), 0xffffff, { vertexColors: true }));
    // Pebbles on the sandy side.
    const pebbles: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 26; i++) {
      const a = 0.2 + rand() * 2.0 * Math.PI * 0.32;
      axis.copy(tangent).applyAxisAngle(dir, a);
      t.copy(dir).applyAxisAngle(axis, ang * (1.0 + rand() * 0.25));
      const o = new THREE.Object3D();
      planet.place(o, t, rand() * 360, 0.01);
      o.updateMatrix();
      const r = 0.04 + rand() * 0.05;
      const g0 = xf(stoneBlock(r * 2, r * 0.9, r * 1.6, rand, 0.8), { x: 0, y: r * 0.3, z: 0 });
      g0.applyMatrix4(o.matrix);
      pebbles.push(paint(g0, greys[Math.floor(rand() * greys.length)], 0.08, rand));
    }
    g.add(mesh(merge(pebbles), 0xffffff, { vertexColors: true }));

    // Reeds on one bank.
    for (let i = 0; i < 6; i++) {
      axis.copy(tangent).applyAxisAngle(dir, 2.2 + i * 0.12);
      t.copy(dir).applyAxisAngle(axis, ang * (0.9 + (i % 2) * 0.08));
      const reed = mesh(cyl(0.008, 0.025, 0.42 + rand() * 0.2, 4), PAL.leafC);
      const hold = new THREE.Group();
      hold.add(at(reed, 0, 0.2, 0));
      reed.rotation.z = (rand() - 0.5) * 0.3;
      planet.place(hold, t, 0, 0.05);
      g.add(hold);
    }
    return { object: g, obstacles };
  },
};
