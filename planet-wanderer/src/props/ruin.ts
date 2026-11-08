import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import { makeRand, mesh, param, type PropModule } from './kit';
import { lumpy, merge, paint, stoneBlock, xf } from './geo';

const STONE = [0xc0bdd0, 0xb0adc4, 0xa4a2ba, 0xcac7d8];

/**
 * Ancient ring sanctuary, in the spirit of Hyrule's weathered ruins: a raised round
 * floor of worn flagstones, a ring of fluted columns on plinths. Some still carry
 * their lintels, some are broken off, one lies toppled in drums outside the ring.
 * Moss gathers on every ledge. The glowing stele stands in the middle (its own prop).
 */
export const ruin: PropModule = {
  prepare(planet, p) {
    const R = param(p, 'radius', 2.2);
    // Raise and level the ground so the floor sits flush and can be walked on.
    planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(R + 0.4), raise: 0.12 });
  },
  build({ planet }, p) {
    const rand = makeRand(733);
    const R = param(p, 'radius', 2.2);
    const stone: THREE.BufferGeometry[] = [];
    const moss: THREE.BufferGeometry[] = [];
    const tone = () => STONE[Math.floor(rand() * STONE.length)];
    const addMoss = (x: number, y: number, z: number, s: number) => {
      const m = lumpy(s, 1, 0.25, rand() * 30);
      xf(m, { x, y, z }, { x: 0, y: rand() * 6, z: 0 }, { x: 1.4, y: 0.32, z: 1.2 });
      moss.push(paint(m, rand() < 0.5 ? PAL.moss : 0x96b07e, 0.06, rand));
    };

    // Floor: an outer kerb ring, then flagstone rings, then a round centre stone.
    const kerbN = 28;
    for (let i = 0; i < kerbN; i++) {
      const a = (i / kerbN) * Math.PI * 2;
      const w = ((Math.PI * 2 * R) / kerbN) * 0.96;
      const b = stoneBlock(w, 0.3, 0.32, rand, 0.4);
      xf(b, { x: Math.cos(a) * R, y: -0.1, z: Math.sin(a) * R }, { x: 0, y: -a + Math.PI / 2, z: 0 });
      stone.push(paint(b, tone(), 0.05, rand));
    }
    const rings: [number, number, number][] = [[0.55, 1.15, 10], [1.15, R - 0.16, 18]];
    for (const [r0, r1, n] of rings) {
      for (let i = 0; i < n; i++) {
        if (rand() < 0.08) continue; // a missing stone here and there
        const a = ((i + (r0 > 1 ? 0.5 : 0)) / n) * Math.PI * 2;
        const rm = (r0 + r1) / 2;
        const w = ((Math.PI * 2 * rm) / n) * 0.93;
        const b = stoneBlock(w, 0.1, (r1 - r0) * 0.94, rand, 0.25);
        xf(b, { x: Math.cos(a) * rm, y: -0.04 + (rand() - 0.5) * 0.02, z: Math.sin(a) * rm }, { x: (rand() - 0.5) * 0.04, y: -a + Math.PI / 2, z: (rand() - 0.5) * 0.04 });
        stone.push(paint(b, tone(), 0.07, rand));
      }
    }
    stone.push(paint(xf(new THREE.CylinderGeometry(0.55, 0.57, 0.12, 16), { x: 0, y: -0.04, z: 0 }), 0xb8b5ca));
    // Dark bed under everything so gaps read as shadowed joints, not grass.
    stone.push(paint(xf(new THREE.CylinderGeometry(R + 0.1, R + 0.25, 0.3, 32), { x: 0, y: -0.2, z: 0 }), 0x726f8c));

    // Columns: plinth, fluted drums, capital. Some carry lintels, some are broken.
    const colR = R - 0.42;
    const N = 8;
    const state = ['whole', 'whole', 'whole', 'broken', 'fallen', 'whole', 'broken', 'stump'];
    const tops: (THREE.Vector3 | null)[] = [];
    const obstacles: { local: THREE.Vector3; radius: number }[] = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + Math.PI / N;
      const x = Math.cos(a) * colR;
      const z = Math.sin(a) * colR;
      const s = state[i];
      stone.push(paint(xf(stoneBlock(0.46, 0.18, 0.46, rand, 0.3), { x, y: 0.09, z }, { x: 0, y: -a, z: 0 }), tone(), 0.04, rand));
      if (s === 'fallen') {
        // Toppled outward: drums lying in a broken line on the grass beyond the floor.
        for (let k = 0; k < 4; k++) {
          const dd = colR + 0.6 + k * 0.42;
          const drum = new THREE.CylinderGeometry(0.17, 0.17, 0.38, 10);
          xf(drum, { x: Math.cos(a + k * 0.03) * dd, y: 0.08, z: Math.sin(a + k * 0.03) * dd }, { x: Math.PI / 2, y: -a + Math.PI / 2 + (rand() - 0.5) * 0.4, z: 0 });
          stone.push(paint(drum, tone(), 0.05, rand));
          obstacles.push({ local: new THREE.Vector3(Math.cos(a) * dd, 0, Math.sin(a) * dd), radius: 0.2 });
        }
        addMoss(Math.cos(a) * (colR + 1.1), 0.24, Math.sin(a) * (colR + 1.1), 0.14);
        tops.push(null);
        continue;
      }
      const drums = s === 'whole' ? 5 : s === 'broken' ? 2 + Math.floor(rand() * 2) : 1;
      let y = 0.18;
      for (let k = 0; k < drums; k++) {
        const h = 0.36;
        const drum = new THREE.CylinderGeometry(0.16, 0.17, h - 0.01, 10);
        xf(drum, { x: x + (rand() - 0.5) * 0.015, y: y + h / 2, z: z + (rand() - 0.5) * 0.015 }, { x: 0, y: rand() * 6, z: 0 });
        stone.push(paint(drum, tone(), 0.04, rand));
        y += h;
      }
      if (s === 'whole') {
        stone.push(paint(xf(stoneBlock(0.46, 0.14, 0.46, rand, 0.25), { x, y: y + 0.07, z }, { x: 0, y: -a, z: 0 }), tone(), 0.04, rand));
        tops.push(new THREE.Vector3(x, y + 0.14, z));
        addMoss(x, y + 0.15, z, 0.12);
      } else {
        // Jagged break on top.
        stone.push(paint(xf(stoneBlock(0.3, 0.16, 0.3, rand, 1), { x, y: y + 0.05, z }, { x: rand(), y: rand() * 6, z: rand() * 0.4 }), tone(), 0.04, rand));
        tops.push(null);
        addMoss(x + 0.12, 0.2, z, 0.13);
      }
      obstacles.push({ local: new THREE.Vector3(x, 0, z), radius: 0.24 });
    }
    // Lintels between neighbouring whole columns (with one already cracked and slipped).
    for (let i = 0; i < N; i++) {
      const a = tops[i];
      const b = tops[(i + 1) % N];
      if (!a || !b) continue;
      const len = a.distanceTo(b) + 0.4;
      const mid = a.clone().lerp(b, 0.5);
      const ang = Math.atan2(b.z - a.z, b.x - a.x);
      const slipped = i === 1;
      const l = stoneBlock(len, 0.22, 0.4, rand, 0.35);
      xf(l, { x: mid.x, y: mid.y + 0.11 - (slipped ? 0.06 : 0), z: mid.z }, { x: 0, y: -ang, z: slipped ? 0.09 : 0 });
      stone.push(paint(l, tone(), 0.04, rand));
      addMoss(mid.x, mid.y + 0.24, mid.z, 0.16);
    }
    // Rubble scattered around the rim.
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2;
      const dd = R + 0.15 + rand() * 0.8;
      const s = 0.1 + rand() * 0.16;
      stone.push(paint(xf(stoneBlock(s * 1.4, s, s, rand, 0.9), { x: Math.cos(a) * dd, y: s * 0.3, z: Math.sin(a) * dd }, { x: rand(), y: rand() * 6, z: rand() }), tone(), 0.06, rand));
    }
    for (let i = 0; i < 6; i++) {
      const a = rand() * Math.PI * 2;
      addMoss(Math.cos(a) * (R - 0.1), 0.06, Math.sin(a) * (R - 0.1), 0.18);
    }

    const g = new THREE.Group();
    g.add(mesh(merge(stone), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(moss), 0xffffff, { vertexColors: true }));
    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0);
    g.updateMatrixWorld(true);
    return {
      object: g,
      obstacles: obstacles.map((o) => ({ dir: g.localToWorld(o.local.clone()).normalize(), radius: o.radius })),
    };
  },
};

/** A small half-buried tablet by the roadside, leaning, chipped, with a faint glyph.
 *  Placed by path: params { path, t (0–1 along it), side (+1 / -1) }. */
export const marker: PropModule = {
  build({ planet }, p) {
    const rand = makeRand(5000 + Math.round(param(p, 't', 0.5) * 1000) + param(p, 'path', 0) * 37);
    const curve = planet.pathCurves[param(p, 'path', 0)];
    let d = dirAt(p.at);
    let yaw = p.yaw ?? 0;
    if (curve) {
      const i = Math.min(curve.length - 2, Math.max(0, Math.round(param(p, 't', 0.5) * (curve.length - 1))));
      const c = curve[i];
      const tan = curve[i + 1].clone().sub(c).normalize();
      const side = new THREE.Vector3().crossVectors(c, tan).normalize().multiplyScalar(param(p, 'side', 1));
      const off = (planet.pathHalf[param(p, 'path', 0)] ?? 0) + planet.ang(0.3);
      d = c.clone().applyAxisAngle(tan.clone().cross(side).normalize().negate(), 0).addScaledVector(side, off).normalize();
      // Face the road.
      const north = new THREE.Vector3(0, 1, 0).addScaledVector(d, -d.y).normalize();
      const toRoad = side.clone().negate();
      yaw = THREE.MathUtils.radToDeg(Math.atan2(new THREE.Vector3().crossVectors(north, toRoad).dot(d), north.dot(toRoad)));
    }
    const stone: THREE.BufferGeometry[] = [];
    // Tall thin tablet with a rounded, chipped crown; the lower third is underground.
    const lean = { x: -0.28 + (rand() - 0.5) * 0.12, y: 0, z: (rand() - 0.5) * 0.35 };
    const slab = stoneBlock(0.3, 0.78, 0.1, rand, 0.25);
    xf(slab, { x: 0, y: 0.26, z: 0 }, lean);
    stone.push(paint(slab, STONE[Math.floor(rand() * STONE.length)], 0.05, rand));
    const crown = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 10, 1, false, 0, Math.PI);
    crown.rotateZ(Math.PI / 2);
    crown.rotateY(Math.PI / 2);
    // Same pivot as the slab (its centre), so the crown stays seated when it leans.
    xf(crown, { x: 0, y: 0.39, z: 0 });
    xf(crown, { x: 0, y: 0.26, z: 0 }, lean);
    stone.push(paint(crown, STONE[Math.floor(rand() * STONE.length)], 0.05, rand));
    const chunk = stoneBlock(0.14, 0.1, 0.1, rand, 1);
    xf(chunk, { x: 0.22, y: 0.04, z: 0.12 }, { x: rand(), y: rand(), z: rand() });
    stone.push(paint(chunk, 0xa9a6bd, 0.05, rand));
    const g = new THREE.Group();
    g.add(mesh(merge(stone), 0xffffff, { vertexColors: true }));
    const face = new THREE.Group();
    face.rotation.set(lean.x, lean.y, lean.z);
    face.position.y = 0.26;
    const glyph = mesh(new THREE.TorusGeometry(0.045, 0.008, 4, 12), PAL.rune, { emissive: 0.35, glow: true });
    glyph.position.set(0, 0.16, 0.056);
    face.add(glyph);
    const bar = mesh(new THREE.BoxGeometry(0.008, 0.12, 0.01), PAL.rune, { emissive: 0.35, glow: true });
    bar.position.set(0, 0.02, 0.056);
    face.add(bar);
    g.add(face);
    for (const [x, z, s] of [[-0.08, 0.08, 0.1], [0.12, -0.04, 0.08]] as const) {
      const moss = mesh(lumpy(s, 1, 0.25, x * 10), PAL.moss);
      moss.scale.set(1.5, 0.35, 1.2);
      moss.position.set(x, 0.02, z);
      g.add(moss);
    }
    planet.place(g, d, yaw, 0.08);
    return { object: g, obstacles: [{ dir: d, radius: 0.2 }] };
  },
};
