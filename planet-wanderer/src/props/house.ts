import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import { at, blob, makeRand, mesh, type PropModule } from './kit';
import { lumpy, merge, paint, stoneBlock, xf } from './geo';

// Narrow and tall, like a village cottage squeezed between lanes.
const W = 1.2; // along X: the long wall with the door faces +Z
const D = 1.0; // along Z: gable ends at ±X
const PLINTH = 0.48; // top of the stone lower wall
const EAVE = 1.18; // top of the walls
const PITCH = THREE.MathUtils.degToRad(54);
const OVER_EAVE = 0.24;
const OVER_GABLE = 0.2;
const RIDGE = EAVE + (D / 2) * Math.tan(PITCH);

const TIMBER = [0x5b4232, 0x664a37, 0x52392b];
const PLASTER = [0xf1e9d6, 0xece2cc, 0xf4eddc];
const STONES = [0xd5cfbf, 0xc6c0ae, 0xbcb6a6, 0xdfd9c9, 0xb3ae9f];
const TILES = [0xb5523f, 0xc0634b, 0xa94a39, 0xc87159, 0x9e4536];

/**
 * Half-timbered cottage after the user's references: rough stone lower walls, cream
 * plaster above held in dark timber (posts, rails, braces), a steep clay roof whose
 * tiles sit unevenly and whose ridge sags, a little porch roof over the door, stone
 * steps, diamond-latticed windows with flower boxes, pots and a climbing vine.
 */
export const house: PropModule = {
  prepare(planet, p) {
    planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(1.15) });
  },
  build({ planet, root }, p) {
    const rand = makeRand(311);
    const pick = (a: number[]) => a[Math.floor(rand() * a.length)];
    const g = new THREE.Group();
    const timber: THREE.BufferGeometry[] = [];
    const wall: THREE.BufferGeometry[] = [];
    const stone: THREE.BufferGeometry[] = [];
    const tiles: THREE.BufferGeometry[] = [];
    const green: THREE.BufferGeometry[] = [];
    const beam = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, t = 0.06) => {
      const a = new THREE.Vector3(x0, y0, z0);
      const b = new THREE.Vector3(x1, y1, z1);
      const len = a.distanceTo(b);
      const geo = new THREE.BoxGeometry(t, len, t * 0.8);
      geo.translate(0, len / 2, 0);
      geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
      geo.translate(a.x, a.y, a.z);
      timber.push(paint(geo, pick(TIMBER), 0.05, rand));
    };

    // Lower walls: courses of rough stone around the footprint.
    stone.push(paint(xf(new THREE.BoxGeometry(W - 0.04, PLINTH, D - 0.04), { x: 0, y: PLINTH / 2, z: 0 }), 0x9d988a));
    const course = (len: number, fixed: number, alongX: boolean, sign: number) => {
      for (let y = 0; y < PLINTH - 0.02; y += 0.12) {
        let u = -len / 2 + (rand() * 0.08);
        while (u < len / 2 - 0.04) {
          const bw = Math.min(0.13 + rand() * 0.14, len / 2 - u);
          const bh = 0.1 + rand() * 0.03;
          const b = stoneBlock(bw - 0.012, bh, 0.1, rand, 0.55);
          const c = u + bw / 2;
          const off = fixed + sign * (0.02 + rand() * 0.015);
          xf(b, alongX ? { x: c, y: y + bh / 2, z: off } : { x: off, y: y + bh / 2, z: c }, { x: 0, y: alongX ? 0 : Math.PI / 2, z: 0 });
          stone.push(paint(b, pick(STONES), 0.05, rand));
          u += bw;
        }
      }
    };
    course(W + 0.06, D / 2, true, 1);
    course(W + 0.06, -D / 2, true, -1);
    course(D, W / 2, false, 1);
    course(D, -W / 2, false, -1);

    // Upper walls: plaster panels, then the timber frame over them.
    wall.push(paint(xf(new THREE.BoxGeometry(W, EAVE - PLINTH, D), { x: 0, y: (EAVE + PLINTH) / 2, z: 0 }), pick(PLASTER)));
    for (const zs of [1, -1]) {
      const z = zs * (D / 2 + 0.025);
      beam(-W / 2, PLINTH, z, W / 2, PLINTH, z, 0.08); // sill
      beam(-W / 2 - 0.02, EAVE, z, W / 2 + 0.02, EAVE, z, 0.08); // top plate
      for (const x of [-W / 2, -0.08, W / 2]) beam(x, PLINTH, z, x + (rand() - 0.5) * 0.015, EAVE, z, 0.07);
      // Braces: an X on one bay, a single diagonal on the other.
      beam(-0.08, PLINTH, z, W / 2, EAVE, z, 0.05);
      if (zs < 0) beam(-W / 2, PLINTH, z, -0.08, EAVE, z, 0.05);
    }
    for (const xs of [1, -1]) {
      const x = xs * (W / 2 + 0.025);
      beam(x, PLINTH, -D / 2, x, PLINTH, D / 2, 0.08);
      beam(x, EAVE, -D / 2 - 0.02, x, EAVE, D / 2 + 0.02, 0.08);
      beam(x, PLINTH, 0, x, EAVE, 0, 0.06);
      beam(x, PLINTH, -D / 2, x, EAVE, 0, 0.05);
      // Gable: plaster triangle, king post, two raking braces, a collar.
      const tri = new THREE.Shape([new THREE.Vector2(-D / 2, 0), new THREE.Vector2(D / 2, 0), new THREE.Vector2(0, RIDGE - EAVE)]);
      const gable = new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: false });
      gable.rotateY(Math.PI / 2);
      gable.translate(x - 0.02 * xs - (xs > 0 ? 0.04 : 0), EAVE, 0);
      wall.push(paint(gable, pick(PLASTER)));
      const xx = x + 0.01 * xs;
      beam(xx, EAVE, 0, xx, RIDGE - 0.04, 0, 0.06);
      beam(xx, EAVE + 0.32, -D / 2 * 0.55, xx, EAVE + 0.32, D / 2 * 0.55, 0.05);
      beam(xx, EAVE, -D / 2 + 0.06, xx, EAVE + 0.3, -0.04, 0.045);
      beam(xx, EAVE, D / 2 - 0.06, xx, EAVE + 0.3, 0.04, 0.045);
    }

    // Roof: two steep planes of uneven tiles over a deck; the ridge sags a touch.
    const slopeLen = (D / 2 + OVER_EAVE) / Math.cos(PITCH);
    const span = W + OVER_GABLE * 2;
    const sag = (x: number) => -0.045 * Math.cos((x / span) * Math.PI);
    const tileGeo = new THREE.BoxGeometry(0.15, 0.022, 0.15);
    const roofPlane = (matrix: THREE.Matrix4, len: number, width: number, sagAmt: number) => {
      const deck = xf(new THREE.BoxGeometry(width, 0.05, len), { x: 0, y: -0.035, z: len / 2 });
      deck.applyMatrix4(matrix);
      timber.push(paint(deck, 0x7a3a2c));
      const rows = Math.ceil(len / 0.11);
      const cols = Math.ceil(width / 0.135);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = -width / 2 + 0.07 + c * 0.135 + (r % 2) * 0.06 + (rand() - 0.5) * 0.015;
          if (x > width / 2 - 0.03) continue;
          const tg = tileGeo.clone();
          // Each course lies on the one below, lower edge lifted, a little crooked.
          xf(tg, { x, y: 0.006 + (rows - r) * 0.002 + sag(x) * sagAmt, z: 0.075 + r * 0.11 }, { x: -0.07 + (rand() - 0.5) * 0.05, y: (rand() - 0.5) * 0.14, z: (rand() - 0.5) * 0.08 }, { x: 0.9 + rand() * 0.25, y: 1, z: 0.95 + rand() * 0.15 });
          tg.applyMatrix4(matrix);
          tiles.push(paint(tg, pick(TILES), 0.07, rand));
        }
      }
    };
    for (const side of [1, -1]) {
      const m = new THREE.Matrix4()
        .makeTranslation(0, RIDGE + 0.05, 0)
        .multiply(new THREE.Matrix4().makeRotationY(side > 0 ? 0 : Math.PI))
        .multiply(new THREE.Matrix4().makeRotationX(PITCH));
      roofPlane(m, slopeLen, span, 1);
    }
    for (let c = 0; c * 0.14 < span; c++) {
      const x = -span / 2 + 0.07 + c * 0.14;
      const cap = new THREE.CylinderGeometry(0.075, 0.075, 0.15, 6, 1, false, 0, Math.PI);
      cap.rotateZ(Math.PI / 2); // runs along X, arched up
      xf(cap, { x, y: RIDGE + 0.07 + sag(x), z: 0 }, { x: 0, y: 0, z: (rand() - 0.5) * 0.1 });
      tiles.push(paint(cap, 0x8f3f31, 0.05, rand));
    }

    // Porch: a small lean-to roof over the door on two posts with knee braces.
    const doorX = -0.3;
    const porchW = 0.72;
    const porchD = 0.5;
    const porchTop = EAVE - 0.06;
    const porchDrop = 0.26;
    const porchPitch = Math.atan2(porchDrop, porchD);
    const porchM = new THREE.Matrix4()
      .makeTranslation(doorX, porchTop, D / 2 + 0.03)
      .multiply(new THREE.Matrix4().makeRotationX(porchPitch));
    roofPlane(porchM, Math.hypot(porchD, porchDrop) + 0.05, porchW, 0.3);
    for (const xs of [-1, 1]) {
      const px = doorX + xs * (porchW / 2 - 0.06);
      const pz = D / 2 + porchD - 0.04;
      beam(px, 0.1, pz, px, porchTop - porchDrop, pz, 0.06);
      beam(px, porchTop - porchDrop - 0.18, pz, px, porchTop - porchDrop + 0.02, pz - 0.18, 0.04);
    }

    // Door: planks with straps, raised on stone steps.
    const doorZ = D / 2 + 0.04;
    for (let i = 0; i < 4; i++) timber.push(paint(xf(new THREE.BoxGeometry(0.085, 0.64, 0.04), { x: doorX - 0.13 + i * 0.087, y: 0.2 + 0.32, z: doorZ }), 0x8a6447, 0.08, rand));
    for (const y of [0.32, 0.7]) timber.push(paint(xf(new THREE.BoxGeometry(0.3, 0.035, 0.02), { x: doorX, y, z: doorZ + 0.025 }), 0x3d3f44));
    beam(doorX - 0.2, 0.2, doorZ, doorX - 0.2, 0.88, doorZ, 0.06);
    beam(doorX + 0.2, 0.2, doorZ, doorX + 0.2, 0.88, doorZ, 0.06);
    beam(doorX - 0.23, 0.88, doorZ, doorX + 0.23, 0.88, doorZ, 0.07);
    for (let s = 0; s < 3; s++) {
      const step = stoneBlock(0.58 - s * 0.06, 0.07, 0.2, rand, 0.4);
      xf(step, { x: doorX + (rand() - 0.5) * 0.03, y: 0.035 + s * 0.065, z: doorZ + 0.42 - s * 0.14 });
      stone.push(paint(step, pick(STONES), 0.05, rand));
    }

    // Windows: glowing panes with a diamond lattice, frames, flower boxes.
    const lattice = (cx: number, cy: number, cz: number, w: number, h: number, nx: number) => {
      g.add(at(mesh(new THREE.BoxGeometry(nx ? 0.02 : w, h, nx ? w : 0.02), PAL.windowGlow, { emissive: 0.5 }), cx, cy, cz));
      const n = 3;
      for (let i = -n; i <= n; i++) {
        const o = (i / n) * w * 0.5;
        for (const dir of [1, -1]) {
          const len = Math.hypot(w, h) * 0.55;
          const bar = new THREE.BoxGeometry(0.012, len, 0.012);
          bar.rotateZ(dir * Math.atan2(w, h));
          bar.translate(o, 0, 0);
          if (nx) bar.rotateY(Math.PI / 2);
          bar.translate(cx + (nx ? 0.015 * nx : 0), cy, cz + (nx ? 0 : 0.015));
          timber.push(paint(bar, 0x4a3628));
        }
      }
      // Frame.
      const f = (fw: number, fh: number, fx: number, fy: number) => {
        const fb = new THREE.BoxGeometry(nx ? 0.05 : fw, fh, nx ? fw : 0.05);
        fb.translate(cx + (nx ? (fx ? 0 : 0) : fx), cy + fy, cz + (nx ? fx : 0));
        timber.push(paint(fb, pick(TIMBER)));
      };
      f(w + 0.08, 0.05, 0, h / 2 + 0.02);
      f(w + 0.1, 0.05, 0, -h / 2 - 0.02);
      f(0.05, h, -w / 2 - 0.02, 0);
      f(0.05, h, w / 2 + 0.02, 0);
      // Flower box.
      const bx = new THREE.BoxGeometry(nx ? 0.1 : w + 0.08, 0.08, nx ? w + 0.08 : 0.1);
      bx.translate(cx + (nx ? 0.05 * nx : 0), cy - h / 2 - 0.08, cz + (nx ? 0 : 0.05));
      timber.push(paint(bx, 0x7a5a40));
      for (let i = 0; i < 4; i++) {
        const u = -w / 2 + (w * (i + 0.5)) / 4;
        const leaf = lumpy(0.05, 1, 0.3, rand() * 9);
        xf(leaf, nx ? { x: cx + 0.06 * nx, y: cy - h / 2 - 0.02, z: cz + u } : { x: cx + u, y: cy - h / 2 - 0.02, z: cz + 0.06 });
        green.push(paint(leaf, PAL.leafA, 0.1, rand));
        g.add(at(mesh(blob(0.025, 1), pick([PAL.flowerC, PAL.rose, PAL.flowerA, 0xe58e6e])), nx ? cx + 0.08 * nx : cx + u + 0.02, cy - h / 2 + 0.03, nx ? cz + u : cz + 0.08));
      }
    };
    lattice(0.3, 0.84, D / 2 + 0.03, 0.3, 0.3, 0);
    lattice(W / 2 + 0.03, 0.84, 0.12, 0.26, 0.28, 1);
    // Small gable window up high.
    g.add(at(mesh(new THREE.BoxGeometry(0.03, 0.16, 0.12), PAL.windowGlow, { emissive: 0.5 }), -W / 2 - 0.035, EAVE + 0.5, 0));

    // Chimney: a slim stone stack against the right gable.
    for (let y = 0; y < RIDGE + 0.3; y += 0.12) {
      const b = stoneBlock(0.26 - y * 0.02, 0.11, 0.24, rand, 0.45);
      xf(b, { x: W / 2 + 0.17, y: y + 0.055, z: -0.22 }, { x: 0, y: (rand() - 0.5) * 0.12, z: 0 });
      stone.push(paint(b, pick(STONES), 0.05, rand));
    }
    stone.push(paint(xf(new THREE.BoxGeometry(0.26, 0.05, 0.26), { x: W / 2 + 0.17, y: RIDGE + 0.36, z: -0.22 }), 0x857f73));

    // Pots by the steps and a vine climbing the left corner.
    for (const [x, z, s] of [[doorX - 0.42, D / 2 + 0.38, 1], [doorX + 0.4, D / 2 + 0.5, 0.8], [0.62, D / 2 + 0.2, 0.9]] as const) {
      const pot = new THREE.CylinderGeometry(0.08 * s, 0.06 * s, 0.13 * s, 8);
      pot.translate(x, 0.065 * s, z);
      stone.push(paint(pot, 0xc4785a, 0.06, rand));
      const bush = lumpy(0.1 * s, 1, 0.3, rand() * 9);
      xf(bush, { x, y: 0.17 * s, z });
      green.push(paint(bush, pick([PAL.leafA, PAL.leafB, PAL.leafC]), 0.08, rand));
      for (let i = 0; i < 3; i++) g.add(at(mesh(blob(0.025, 1), pick([PAL.flowerC, 0xd9a0d8, PAL.flowerA])), x + (rand() - 0.5) * 0.12 * s, 0.22 * s + rand() * 0.05, z + (rand() - 0.5) * 0.12 * s));
    }
    for (let i = 0; i < 7; i++) {
      const v = lumpy(0.06 + rand() * 0.04, 1, 0.3, rand() * 9);
      xf(v, { x: -W / 2 - 0.02 + (rand() - 0.5) * 0.05, y: 0.15 + i * 0.13, z: D / 2 + 0.02 - rand() * 0.15 });
      green.push(paint(v, pick([PAL.leafA, PAL.leafC]), 0.1, rand));
    }

    // Lantern under the porch.
    g.add(at(mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.08, 6), 0xffd98f, { emissive: 0.9, glow: true }), doorX + 0.28, porchTop - porchDrop - 0.08, D / 2 + porchD - 0.1));

    g.add(mesh(merge(timber), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(wall), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(stone), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(tiles), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(green), 0xffffff, { vertexColors: true }));
    tileGeo.dispose();

    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0.03);
    g.updateMatrixWorld(true);

    // Chimney smoke: three puffs on a loop (world space, so they rise straight up).
    const top = g.localToWorld(new THREE.Vector3(W / 2 + 0.17, RIDGE + 0.42, -0.22));
    const up = d.clone();
    const smoke = [0, 1, 2].map((i) => {
      const m = mesh(blob(0.09, 1), 0xf4f7f2, { rim: 0 });
      m.castShadow = false;
      m.userData.phase = i / 3;
      root.add(m);
      return m;
    });
    return {
      object: g,
      obstacles: [{ dir: d, radius: 0.85 }],
      update(t) {
        for (const m of smoke) {
          const k = (t * 0.25 + (m.userData.phase as number)) % 1;
          m.position.copy(top).addScaledVector(up, k * 1.1).add(new THREE.Vector3(Math.sin(k * 4 + t) * 0.08, 0, 0));
          m.scale.setScalar(0.5 + k * 1.3 - Math.max(0, k - 0.8) * 5);
        }
      },
    };
  },
};
