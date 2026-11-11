import * as THREE from 'three';
import { PAL } from '../render/palette';
import { waterMaterial } from '../render/materials';
import { dirAt, orient } from '../world/planet';
import { at, blob, cyl, mesh, param, type PropModule } from './kit';
import { crag, facetColors, lumpy, merge, paint, stoneBlock, xf } from './geo';
import { grassCard } from './grassCard';
import { koiCard } from './koi';

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

    // The surface sits well below the rim, inside the bank wall, so the hole shows.
    const water = new THREE.Mesh(new THREE.CircleGeometry(units * 0.96, 48), waterMaterial(units * 0.96));
    water.receiveShadow = true;
    water.rotation.x = -Math.PI / 2;
    const holder = new THREE.Group();
    holder.add(water);
    holder.position.copy(dir).multiplyScalar(planet.radius + rimH - 0.34);
    orient(holder, dir);
    g.add(holder);

    // Lily pads with one pink bloom.
    for (const [x, z, r] of [[0.45, 0.2, 0.17], [-0.3, -0.5, 0.13], [0.1, -0.15, 0.1]] as const) {
      const pad = mesh(cyl(r, r, 0.02, 12), PAL.leafA);
      pad.castShadow = false;
      holder.add(at(pad, x, 0.015, z));
    }
    // Lotus on the big pad: two rings of cupped petals round a small yellow heart,
    // plus a closed bud on the far pad.
    const lotus = (open: number) => {
      const fl = new THREE.Group();
      const petal = (ring: number, i: number, n: number) => {
        const pm = mesh(blob(1, 2), ring === 0 ? 0xf1c3cb : 0xf8dde2, { rim: 0.3, noOutline: true });
        const len = ring === 0 ? 0.11 : 0.085;
        pm.scale.set(len * 0.5, len * 0.28, len);
        const a = i / n * Math.PI * 2 + ring * 0.5;
        const tilt = ring === 0 ? 0.2 + 0.95 * open : 0.1 + 0.5 * open; // closed bud → wide-open bloom
        pm.position.set(Math.cos(a) * len * 0.5 * open, 0.02 + ring * 0.02 + len * 0.3, Math.sin(a) * len * 0.5 * open);
        pm.rotation.set(0, -a, 0);
        pm.rotateZ(-(Math.PI / 2 - tilt));
        fl.add(pm);
      };
      for (let i = 0; i < 7; i++) petal(0, i, 7);
      for (let i = 0; i < 5; i++) petal(1, i, 5);
      if (open > 0.6) {
        const heart = mesh(blob(0.028, 1), 0xf0dc8e, { rim: 0.2, noOutline: true, emissive: 0.15 });
        heart.position.y = 0.065;
        fl.add(heart);
      }
      return fl;
    };
    holder.add(at(lotus(1), 0.47, 0.012, 0.19));
    holder.add(at(lotus(0.25), -0.3, 0.012, -0.5));

    const t = new THREE.Vector3();
    const axis = new THREE.Vector3();
    const k = units / 1.5;
    // Crags on the far bank: two or three tall, peaked rock masses with big flat
    // fracture faces, their feet standing in the water, like stone a stream has cut
    // its way past. Smaller blocks crowd around their bases.
    const obstacles: { dir: THREE.Vector3; radius: number }[] = [{ dir, radius: units * 0.95 }];
    const rockParts: THREE.BufferGeometry[] = [];
    const mossParts: THREE.BufferGeometry[] = [];
    const greys = [0xa6a3bd, 0x8f8ca9, 0xb9b6cc, 0x7f7c9c, 0xaeabc0, 0x75738f];
    const arcFrom = 3.6;
    const arcTo = 5.6;
    // Mostly broad, blunt masses; only the tallest one comes to a point.
    const masses: [angle: number, h: number, w: number, out: number, sharp: boolean][] = [
      [4.55, 1.45, 1.6, 1.05, true],
      [3.95, 0.85, 1.5, 1.08, false],
      [5.15, 0.7, 1.4, 1.0, false],
      [5.5, 0.38, 0.9, 0.9, false],
      [3.7, 0.4, 0.9, 0.92, false],
    ];
    for (const [a0, h0, w0, out, sharp] of masses) {
      axis.copy(tangent).applyAxisAngle(dir, a0 + (rand() - 0.5) * 0.1);
      const at = dir.clone().applyAxisAngle(axis, ang * out);
      const h = h0 * k * (0.9 + rand() * 0.2);
      const w = w0 * k * (0.9 + rand() * 0.2);
      const o = new THREE.Object3D();
      planet.place(o, at, rand() * 360, 0.2 * k);
      o.updateMatrix();
      const gc = crag(h, w, w * (0.75 + rand() * 0.3), rand, sharp);
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
      const gb = crag(s * 0.8, s * 1.6, s * 1.3, rand);
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

    // Grass clumps on one bank: pixel-art cards, not cones.
    for (let i = 0; i < 14; i++) {
      // Two stretches of bank, a few clumps each, the rest scattered just outside the rim.
      const a = i < 5 ? 1.6 + i * 0.16 : i < 9 ? 4.1 + (i - 5) * 0.18 : rand() * Math.PI * 2;
      axis.copy(tangent).applyAxisAngle(dir, a + (rand() - 0.5) * 0.08);
      t.copy(dir).applyAxisAngle(axis, ang * (1.02 + rand() * 0.22));
      const clump = grassCard(0.24 + rand() * 0.16, rand() * Math.PI);
      planet.place(clump, t, 0, 0.0);
      g.add(clump);
    }
    // Koi under the surface: flat vector-drawn cards with a swimming wave, slow circling.
    const fish: { g: THREE.Object3D; r: number; speed: number; phase: number; depth: number }[] = [];
    const variants = ['kohaku', 'ivory', 'amber', 'bekko'] as const;
    for (let i = 0; i < 4; i++) {
      const f = koiCard(variants[i], 0.7 + rand() * 0.2, rand() * Math.PI * 2);
      holder.add(f);
      fish.push({ g: f, r: 0.3 + rand() * 0.5, speed: (0.1 + rand() * 0.08) * (i % 2 ? 1 : -1), phase: rand() * Math.PI * 2, depth: -0.03 - rand() * 0.03 });
    }
    return {
      object: g,
      obstacles,
      update(t) {
        for (const f of fish) {
          const a = t * f.speed + f.phase;
          // Holder space: Y up, surface in XZ. The card's head points to -z; turn it to the velocity.
          f.g.position.set(Math.cos(a) * f.r, f.depth, Math.sin(a) * f.r);
          const vx = -Math.sin(a) * f.speed, vz = Math.cos(a) * f.speed;
          f.g.rotation.y = Math.atan2(-vx, -vz);
        }
      },
    };
  },
};
