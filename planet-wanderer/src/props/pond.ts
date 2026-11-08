import * as THREE from 'three';
import { PAL } from '../render/palette';
import { waterMaterial } from '../render/materials';
import { dirAt, orient } from '../world/planet';
import { at, blob, cyl, mesh, param, type PropModule } from './kit';

/** A chunky boulder: an icosphere with jittered corners, flat facets like carved stone. */
function rockGeo(r: number, rand: () => number) {
  const g = new THREE.IcosahedronGeometry(r, 1);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const seen = new Map<string, number>();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
    let s = seen.get(key);
    if (s === undefined) seen.set(key, (s = 0.82 + rand() * 0.3));
    v.multiplyScalar(s);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

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

    // A ring of small rocks around the shore, with gaps so it reads as natural.
    const t = new THREE.Vector3();
    const axis = new THREE.Vector3();
    for (let i = 0; i < 13; i++) {
      const a = (i / 13) * Math.PI * 2 + rand() * 0.25;
      if (i % 5 === 4) continue;
      axis.copy(tangent).applyAxisAngle(dir, a);
      t.copy(dir).applyAxisAngle(axis, ang * (1.04 + rand() * 0.1));
      const r = 0.14 + rand() * 0.14;
      const rock = mesh(new THREE.DodecahedronGeometry(r, 0), rand() > 0.5 ? PAL.stone : PAL.stoneDark);
      rock.scale.set(1, 0.65, 1);
      const hold = new THREE.Group();
      hold.add(at(rock, 0, r * 0.25, 0));
      rock.rotation.set(rand() * 3, rand() * 3, rand() * 3);
      planet.place(hold, t, rand() * 360, 0.02);
      g.add(hold);
    }
    // Big grey boulders sitting on the shore, each with a smaller stone leaning on it
    // and a cap of moss. They skip the reed bank (around 2.2–2.9 rad).
    const k = units / 1.5;
    for (const [a, size] of [[0.35, 0.46], [1.25, 0.34], [3.55, 0.5], [4.45, 0.36], [5.4, 0.42]] as const) {
      axis.copy(tangent).applyAxisAngle(dir, a + (rand() - 0.5) * 0.2);
      t.copy(dir).applyAxisAngle(axis, ang * (1.12 + rand() * 0.06));
      const r = size * k * (0.9 + rand() * 0.2);
      const hold = new THREE.Group();
      const big = mesh(rockGeo(r, rand), rand() > 0.4 ? PAL.boulder : PAL.boulderDark);
      big.scale.set(1.15, 0.78, 1);
      big.rotation.y = rand() * 6.28;
      hold.add(at(big, 0, r * 0.45, 0));
      const small = mesh(rockGeo(r * 0.5, rand), PAL.boulderDark);
      small.rotation.set(rand(), rand() * 6.28, rand());
      hold.add(at(small, r * 0.95, r * 0.22, r * 0.35));
      const moss = mesh(blob(r * 0.42, 1), PAL.moss);
      moss.scale.set(1.3, 0.35, 1.1);
      hold.add(at(moss, -r * 0.1, r * 1.12, 0));
      planet.place(hold, t, rand() * 360, 0.05);
      g.add(hold);
    }
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
    return { object: g, obstacles: [{ dir, radius: units * 0.95 }] };
  },
};
