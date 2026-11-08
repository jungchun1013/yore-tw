import * as THREE from 'three';
import { PAL } from '../render/palette';
import { waterMaterial } from '../render/materials';
import { dirAt, orient } from '../world/planet';
import { at, blob, cyl, mesh, param, type PropModule } from './kit';

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
