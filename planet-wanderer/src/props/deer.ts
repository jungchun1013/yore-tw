import * as THREE from 'three';
import { toon } from '../render/materials';
import { tailoredSurface } from '../characters/surfaces';
import { dirAt } from '../world/planet';
import type { PropModule } from './kit';
import { limb } from './fence';
import { merge, paint } from './geo';

const WHITE = 0xf3f6f4;
const HOOF = 0x6fa8c6;
const EAR_IN = 0xf2b7c0;
const GLOW_BASE = new THREE.Color(0x8fe9f6); // cyan at the antler base
const GLOW_TIP = new THREE.Color(0xffd27a); // gold at the tips

function skin(geo: THREE.BufferGeometry, color = WHITE) {
  const m = new THREE.Mesh(geo, toon(color, { flat: true }));
  m.castShadow = m.receiveShadow = true;
  return m;
}

/** A surface authored along +Y, laid down along +Z (forward) at a given pitch. */
function along(geo: THREE.BufferGeometry, pitchDeg: number) {
  geo.rotateX(Math.PI / 2 - THREE.MathUtils.degToRad(pitchDeg));
  return geo;
}

/** Antler: a main beam that sweeps up and back, with tines branching off it; each
 *  segment is coloured from cyan at the root to gold at the tips, and the whole thing
 *  glows (the bloom pass picks it up in soft and sky styles). */
function antler(side: number, rand: () => number) {
  const parts: THREE.BufferGeometry[] = [];
  const beam: THREE.Vector3[] = [new THREE.Vector3(side * 0.06, 0, -0.01)];
  const dirs = [
    new THREE.Vector3(side * 0.85, 1, -0.45), new THREE.Vector3(side * 0.5, 1, -0.6),
    new THREE.Vector3(side * 0.25, 1, -0.35), new THREE.Vector3(side * 0.1, 1, 0.2),
  ];
  const lens = [0.15, 0.17, 0.17, 0.16];
  for (let i = 0; i < dirs.length; i++) beam.push(beam[i].clone().addScaledVector(dirs[i].normalize(), lens[i]));
  const total = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  const colorAt = (t: number) => GLOW_BASE.clone().lerp(GLOW_TIP, Math.pow(THREE.MathUtils.clamp(t, 0, 1), 1.4)).getHex();
  for (let i = 0; i < dirs.length; i++) {
    const t0 = acc / total;
    acc += lens[i];
    const r0 = 0.016 * (1 - t0 * 0.6);
    const r1 = 0.016 * (1 - (acc / total) * 0.6);
    parts.push(paint(limb(beam[i], beam[i + 1], r0, r1, 7), colorAt(t0 + 0.15)));
    // Tines: one forward, one outward, from the middle joints; a fork at the top.
    if (i >= 1 && i <= 2) {
      const base = beam[i].clone();
      const d = new THREE.Vector3(side * (0.35 + rand() * 0.3), 0.8, 0.55 - i * 0.5).normalize();
      const tip = base.clone().addScaledVector(d, 0.12 + rand() * 0.05);
      parts.push(paint(limb(base, tip, r0 * 0.8, 0.004, 6), colorAt(t0 + 0.45)));
      parts.push(paint(new THREE.SphereGeometry(0.007, 6, 5).translate(tip.x, tip.y, tip.z), colorAt(1)));
    }
  }
  const top = beam[beam.length - 1];
  for (const d of [new THREE.Vector3(side * 0.6, 0.8, -0.2), new THREE.Vector3(side * -0.1, 1, 0.3)]) {
    const tip = top.clone().addScaledVector(d.normalize(), 0.1);
    parts.push(paint(limb(top, tip, 0.007, 0.003, 6), colorAt(1)));
    parts.push(paint(new THREE.SphereGeometry(0.007, 6, 5).translate(tip.x, tip.y, tip.z), colorAt(1)));
  }
  const g = new THREE.Mesh(merge(parts), toon(0xffffff, { vertexColors: true, emissive: 0.55, glow: true, flat: true }));
  g.castShadow = false;
  return g;
}

/**
 * A spirit deer: white, long-legged, with glowing cyan-to-gold antlers and golden eyes,
 * after the user's illustration. It stands and idles (breathing, head turns, ear flicks).
 * Local frame: +Y up, +Z forward, hooves at y = 0; shoulder height ≈ 1.15.
 */
export const deer: PropModule = {
  build({ planet, rand }, p) {
    const g = new THREE.Group();
    g.name = 'spirit-deer';
    g.userData.inspection = { target: [0, 1.0, 0.1], camera: [2.4, 1.6, 3.4] };

    // Torso: deep chest, slimmer waist, rounded rump; authored along +Y then laid forward.
    const torso = skin(along(tailoredSurface([
      [-0.58, 0.14, 0.17, -0.05], [-0.45, 0.19, 0.24, -0.02], [-0.2, 0.185, 0.235, 0.0],
      [0.05, 0.17, 0.215, 0.01], [0.3, 0.19, 0.25, 0.02], [0.48, 0.17, 0.22, 0.03], [0.58, 0.09, 0.13, 0.02],
    ], 36), 0));
    torso.position.set(0, 1.08, 0);
    g.add(torso);

    // Neck rises forward from the chest; head and muzzle carry on from it.
    const neckPivot = new THREE.Group();
    neckPivot.position.set(0, 1.16, 0.44);
    const neck = skin(tailoredSurface([
      [-0.16, 0.09, 0.1, -0.02], [0.0, 0.1, 0.115, 0.03], [0.18, 0.085, 0.1, 0.08], [0.32, 0.072, 0.09, 0.11], [0.44, 0.068, 0.082, 0.12],
    ], 28));
    neck.rotation.x = 0.35;
    neckPivot.add(neck);
    const head = new THREE.Group();
    head.position.set(0, 0.44, 0.24);
    head.add(skin(along(tailoredSurface([
      [-0.12, 0.075, 0.085, 0.0], [0.0, 0.08, 0.09, -0.01], [0.14, 0.062, 0.07, -0.02],
      [0.26, 0.045, 0.05, -0.035], [0.32, 0.03, 0.03, -0.045],
    ], 28), -12)));
    // Nose tip and golden diamond eyes.
    head.add(skin(new THREE.SphereGeometry(0.026, 8, 6).translate(0, -0.06, 0.33), 0xbfd3dc));
    for (const x of [-0.062, 0.062]) {
      const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.03), toon(0xffd27a, { emissive: 0.9, glow: true, noOutline: true }));
      eye.scale.set(0.6, 1, 0.35);
      eye.position.set(x, 0.015, 0.14);
      head.add(eye);
    }
    // Ears: flattened cones, pink inside, that flick now and then.
    const ears: THREE.Group[] = [];
    for (const s of [-1, 1]) {
      const ear = new THREE.Group();
      ear.position.set(s * 0.085, 0.09, -0.08);
      const outer = skin(new THREE.ConeGeometry(0.045, 0.2, 8).translate(0, 0.1, 0));
      outer.scale.set(1, 1, 0.45);
      const inner = skin(new THREE.ConeGeometry(0.03, 0.15, 8).translate(0, 0.095, 0.012), EAR_IN);
      inner.scale.set(1, 1, 0.3);
      inner.castShadow = false;
      ear.add(outer, inner);
      ear.rotation.set(-0.5, 0, s * 1.0);
      head.add(ear);
      ears.push(ear);
    }
    const antlerL = antler(-1, rand);
    const antlerR = antler(1, rand);
    antlerL.position.set(0, 0.08, -0.04);
    antlerR.position.set(0, 0.08, -0.04);
    head.add(antlerL, antlerR);
    neckPivot.add(head);
    g.add(neckPivot);

    // Legs: long and slim, a soft knee, blue hooves. Hind legs angle back a little.
    const legs: THREE.Group[] = [];
    for (const [x, z, hind] of [[-0.12, 0.42, false], [0.12, 0.42, false], [-0.13, -0.42, true], [0.13, -0.42, true]] as const) {
      const leg = new THREE.Group();
      leg.position.set(x, 1.0, z);
      const k = hind ? -0.045 : 0; // hind legs set back a touch at the hock
      leg.add(skin(tailoredSurface([
        [-0.93, 0.024, 0.027, k], [-0.7, 0.026, 0.03, k], [-0.5, 0.03, 0.036, k * 0.8],
        [-0.3, 0.04, 0.052, k * 0.4], [-0.1, 0.058, 0.08, 0.01], [0.05, 0.075, 0.1, 0.0],
      ], 20)));
      const hoof = skin(tailoredSurface([[-1.0, 0.026, 0.032, k], [-0.96, 0.03, 0.036, k], [-0.9, 0.023, 0.026, k]], 12), HOOF);
      leg.add(hoof);
      g.add(leg);
      legs.push(leg);
    }
    // Tail tuft.
    g.add(skin(new THREE.SphereGeometry(0.06, 8, 6).translate(0, 1.2, -0.6)));

    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0.02);
    const phase = rand() * 6;
    return {
      object: g,
      obstacles: [{ dir: d, radius: 0.7 }],
      update(t) {
        const tt = t + phase;
        torso.scale.setScalar(1 + Math.sin(tt * 1.6) * 0.012);
        neckPivot.rotation.x = Math.sin(tt * 0.5) * 0.08 - 0.05;
        neckPivot.rotation.y = Math.sin(tt * 0.31 + 1) * 0.25;
        head.rotation.x = Math.sin(tt * 0.9) * 0.06;
        ears.forEach((ear, i) => {
          const flick = Math.max(0, Math.sin(tt * 2.2 + i * 2.1) - 0.85) * 4;
          ear.rotation.y = flick * (i ? -0.6 : 0.6);
        });
        // Weight shift: hind legs sway almost imperceptibly.
        legs.forEach((leg, i) => { leg.rotation.x = Math.sin(tt * 0.5 + i) * 0.012; });
      },
    };
  },
};
