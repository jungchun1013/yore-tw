import * as THREE from 'three';
import { PAL } from '../render/palette';
import { waterMaterial } from '../render/materials';
import { dirAt, orient } from '../world/planet';
import { at, blob, cyl, mesh, param, type PropModule } from './kit';
import { crag, facetColors, lumpy, merge, paint, stoneBlock, xf } from './geo';

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
    // Crags on the far bank: two or three tall, peaked rock masses with big flat
    // fracture faces, their feet standing in the water, like stone a stream has cut
    // its way past. Smaller blocks crowd around their bases.
    const obstacles: { dir: THREE.Vector3; radius: number }[] = [{ dir, radius: units * 0.95 }];
    const rockParts: THREE.BufferGeometry[] = [];
    const mossParts: THREE.BufferGeometry[] = [];
    const greys = [0x9ea4a8, 0x8a9096, 0xb3b8ba, 0x7d8597, 0xa6a9a6, 0x6f778c];
    const arcFrom = 3.6;
    const arcTo = 5.6;
    const masses: [angle: number, h: number, w: number, out: number][] = [
      [4.55, 1.55, 1.7, 1.05],
      [3.95, 1.0, 1.25, 1.08],
      [5.15, 0.8, 1.1, 1.0],
      [5.5, 0.42, 0.7, 0.9],
      [3.7, 0.45, 0.7, 0.92],
    ];
    for (const [a0, h0, w0, out] of masses) {
      axis.copy(tangent).applyAxisAngle(dir, a0 + (rand() - 0.5) * 0.1);
      const at = dir.clone().applyAxisAngle(axis, ang * out);
      const h = h0 * k * (0.9 + rand() * 0.2);
      const w = w0 * k * (0.9 + rand() * 0.2);
      const o = new THREE.Object3D();
      planet.place(o, at, rand() * 360, 0.2 * k);
      o.updateMatrix();
      const gc = crag(h, w, w * (0.75 + rand() * 0.3), rand);
      gc.applyMatrix4(o.matrix);
      rockParts.push(facetColors(gc, greys, rand));
      // A tuft of moss on a ledge of the bigger masses.
      if (h0 > 0.9) {
        const m = lumpy(0.14 * k, 1, 0.25, rand() * 10);
        xf(m, { x: (rand() - 0.5) * w * 0.3, y: h * (0.35 + rand() * 0.2), z: w * 0.32 }, { x: 0, y: 0, z: 0 }, { x: 1.3, y: 0.35, z: 1 });
        m.applyMatrix4(o.matrix);
        mossParts.push(paint(m, PAL.moss, 0.08, rand));
      }
      obstacles.push({ dir: at, radius: w * 0.5 });
    }
    // Chipped blocks crowding the foot of the crags.
    for (let i = 0; i < 9; i++) {
      axis.copy(tangent).applyAxisAngle(dir, arcFrom + rand() * (arcTo - arcFrom));
      const at = dir.clone().applyAxisAngle(axis, ang * (0.9 + rand() * 0.25));
      const o = new THREE.Object3D();
      planet.place(o, at, rand() * 360, 0.08 * k);
      o.updateMatrix();
      const s = (0.18 + rand() * 0.2) * k;
      const gb = crag(s * 1.1, s * 1.4, s * 1.2, rand);
      gb.applyMatrix4(o.matrix);
      rockParts.push(facetColors(gb, greys, rand));
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
