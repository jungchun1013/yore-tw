import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import { at, blob, box, makeRand, mesh, type PropModule } from './kit';
import { merge, paint, stoneBlock, xf } from './geo';

const W = 1.7; // wall span along X (front)
const D = 1.3; // wall span along Z (side)
const BASE = 0.22; // top of the stone footing
const LOG_R = 0.062;
const COURSE = 0.118;
const COURSES = 8;
const EAVE = BASE + COURSES * COURSE; // ≈ 1.16
const RIDGE = EAVE + 0.82;

/**
 * Medieval-fantasy log cabin: stacked logs with crossed corner ends, an irregular
 * stone footing, a clay-tile roof laid tile by tile, plank door with iron straps,
 * shuttered window, stone chimney with smoke, a lantern and a woodpile.
 * Parts are merged by material so the whole cabin is a few draw calls.
 */
export const house: PropModule = {
  prepare(planet, p) {
    planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(1.3) });
  },
  build({ planet, root }, p) {
    const rand = makeRand(311);
    const g = new THREE.Group();
    const wood: THREE.BufferGeometry[] = [];
    const stone: THREE.BufferGeometry[] = [];
    const tiles: THREE.BufferGeometry[] = [];
    const iron: THREE.BufferGeometry[] = [];

    // Stone footing: a ring of chipped blocks around a dark core.
    stone.push(paint(xf(new THREE.BoxGeometry(W + 0.1, BASE, D + 0.1), { x: 0, y: BASE / 2 - 0.02, z: 0 }), 0x8e9394));
    const ring = (len: number, fixed: number, alongX: boolean, sign: number) => {
      let u = -len / 2;
      while (u < len / 2 - 0.05) {
        const bw = Math.min(0.2 + rand() * 0.16, len / 2 - u);
        const b = stoneBlock(bw - 0.02, BASE * (0.85 + rand() * 0.25), 0.16, rand, 0.45);
        const c = u + bw / 2;
        xf(b, alongX ? { x: c, y: BASE / 2, z: fixed + sign * 0.03 } : { x: fixed + sign * 0.03, y: BASE / 2, z: c }, { x: 0, y: alongX ? 0 : Math.PI / 2, z: 0 });
        stone.push(paint(b, [PAL.boulder, PAL.boulderDark, 0xb9bcb6][Math.floor(rand() * 3)], 0.06, rand));
        u += bw;
      }
    };
    ring(W + 0.2, D / 2 + 0.05, true, 1);
    ring(W + 0.2, -D / 2 - 0.05, true, -1);
    ring(D, W / 2 + 0.05, false, 1);
    ring(D, -W / 2 - 0.05, false, -1);

    // Logs: front/back run along X, sides along Z half a course higher; ends cross.
    const logColor = () => [0xa77d58, 0x9a7150, 0xb08862, 0x8f6948][Math.floor(rand() * 4)];
    const log = (len: number, x: number, y: number, z: number, alongX: boolean) => {
      const r = LOG_R * (0.92 + rand() * 0.16);
      const c = new THREE.CylinderGeometry(r, r, len, 8);
      xf(c, { x, y, z }, alongX ? { x: 0, y: 0, z: Math.PI / 2 } : { x: Math.PI / 2, y: 0, z: 0 });
      wood.push(paint(c, logColor(), 0.05, rand));
      // Pale cut ends.
      for (const s of [-1, 1]) {
        const cap = new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.012, 8);
        const off = (len / 2) * s;
        xf(cap, alongX ? { x: x + off, y, z } : { x, y, z: z + off }, alongX ? { x: 0, y: 0, z: Math.PI / 2 } : { x: Math.PI / 2, y: 0, z: 0 });
        wood.push(paint(cap, 0xd8bb92, 0.05, rand));
      }
    };
    for (let i = 0; i < COURSES; i++) {
      const y = BASE + LOG_R + i * COURSE;
      log(W + 0.28, 0, y, D / 2, true);
      log(W + 0.28, 0, y, -D / 2, true);
      log(D + 0.28, W / 2, y + COURSE / 2, 0, false);
      log(D + 0.28, -W / 2, y + COURSE / 2, 0, false);
    }
    // Wall infill behind the logs (no light leaks between round logs).
    wood.push(paint(xf(new THREE.BoxGeometry(W - 0.05, EAVE - BASE, D - 0.05), { x: 0, y: (EAVE + BASE) / 2, z: 0 }), 0x6f5440));

    // Gables: vertical boards in a triangle, front and back.
    const gableH = RIDGE - EAVE - 0.05;
    for (const zs of [1, -1]) {
      const boards = 9;
      for (let b = 0; b < boards; b++) {
        const x = -W / 2 + (W * (b + 0.5)) / boards;
        const h = gableH * (1 - Math.abs(x) / (W / 2 + 0.12));
        if (h < 0.05) continue;
        const board = new THREE.BoxGeometry(W / boards - 0.012, h, 0.04);
        xf(board, { x, y: EAVE + 0.06 + h / 2, z: zs * (D / 2 + 0.02) });
        wood.push(paint(board, 0xb89470, 0.07, rand));
      }
    }

    // Roof: two planes of overlapping clay tiles over a dark deck.
    const half = W / 2 + 0.28;
    const rise = RIDGE - EAVE + 0.08;
    const slope = Math.atan2(rise, half);
    const slopeLen = Math.hypot(half, rise);
    const depth = D + 0.5;
    const tile = new THREE.CylinderGeometry(0.075, 0.08, 0.2, 6, 1, false, 0, Math.PI);
    tile.rotateZ(Math.PI / 2); // runs along X (down the slope), arched up toward +Y
    for (const side of [1, -1]) {
      const plane = new THREE.Matrix4()
        .makeTranslation(0, RIDGE + 0.04, 0)
        .multiply(new THREE.Matrix4().makeRotationY(side > 0 ? 0 : Math.PI))
        .multiply(new THREE.Matrix4().makeRotationZ(-slope));
      const deck = xf(new THREE.BoxGeometry(slopeLen, 0.05, depth), { x: slopeLen / 2, y: -0.03, z: 0 });
      deck.applyMatrix4(plane);
      wood.push(paint(deck, 0x5e4636));
      const rows = Math.ceil(slopeLen / 0.15);
      const cols = Math.ceil(depth / 0.15);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const tg = tile.clone();
          // Tiles run down the slope (local +X); rows overlap and lift slightly.
          xf(tg, { x: 0.06 + r * 0.15, y: 0.02 + (rows - r) * 0.004, z: -depth / 2 + 0.075 + c * 0.15 + (r % 2) * 0.02 }, { x: 0, y: 0, z: 0.12 }, { x: 1, y: 1, z: 0.95 });
          tg.applyMatrix4(plane);
          const tone = rand() < 0.15 ? 0xa65d47 : rand() < 0.3 ? 0xd08a6c : PAL.roof;
          tiles.push(paint(tg, tone, 0.06, rand));
        }
      }
    }
    // Ridge caps along the top.
    for (let c = 0; c * 0.16 < depth; c++) {
      const cap = new THREE.CylinderGeometry(0.08, 0.08, 0.17, 6, 1, false, 0, Math.PI);
      cap.rotateZ(Math.PI / 2);
      cap.rotateY(Math.PI / 2);
      cap.translate(0, RIDGE + 0.06, -depth / 2 + 0.08 + c * 0.16);
      tiles.push(paint(cap, 0x9c5a46, 0.05, rand));
    }

    // Door: vertical planks, two iron straps, a ring, a frame and a step.
    const doorX = -0.33;
    const doorZ = D / 2 + LOG_R + 0.02;
    for (let i = 0; i < 4; i++) {
      wood.push(paint(xf(new THREE.BoxGeometry(0.095, 0.66, 0.05), { x: doorX - 0.15 + i * 0.1, y: BASE + 0.33, z: doorZ }), 0x7a5a43, 0.08, rand));
    }
    for (const y of [BASE + 0.14, BASE + 0.52]) iron.push(paint(xf(new THREE.BoxGeometry(0.34, 0.035, 0.02), { x: doorX - 0.02, y, z: doorZ + 0.03 }), 0x3d3f44));
    iron.push(paint(xf(new THREE.TorusGeometry(0.035, 0.008, 4, 10), { x: doorX + 0.12, y: BASE + 0.34, z: doorZ + 0.035 }), 0x3d3f44));
    for (const x of [doorX - 0.22, doorX + 0.22]) wood.push(paint(xf(new THREE.BoxGeometry(0.06, 0.74, 0.08), { x, y: BASE + 0.37, z: doorZ }), 0x6b4f3b));
    wood.push(paint(xf(new THREE.BoxGeometry(0.52, 0.07, 0.09), { x: doorX, y: BASE + 0.74, z: doorZ }), 0x6b4f3b));
    stone.push(paint(xf(stoneBlock(0.56, 0.1, 0.3, rand, 0.3), { x: doorX, y: 0.07, z: doorZ + 0.17 }), PAL.stone));

    // Window with glowing panes, mullions and two open shutters.
    const winX = 0.42;
    const winY = BASE + 0.5;
    const winZ = D / 2 + LOG_R + 0.015;
    g.add(at(mesh(box(0.34, 0.3, 0.03), PAL.windowGlow, { emissive: 0.55 }), winX, winY, winZ));
    wood.push(paint(xf(new THREE.BoxGeometry(0.42, 0.05, 0.06), { x: winX, y: winY + 0.17, z: winZ + 0.01 }), 0x6b4f3b));
    wood.push(paint(xf(new THREE.BoxGeometry(0.46, 0.05, 0.1), { x: winX, y: winY - 0.17, z: winZ + 0.03 }), 0x6b4f3b));
    wood.push(paint(xf(new THREE.BoxGeometry(0.03, 0.3, 0.04), { x: winX, y: winY, z: winZ + 0.02 }), 0x6b4f3b));
    wood.push(paint(xf(new THREE.BoxGeometry(0.34, 0.03, 0.04), { x: winX, y: winY, z: winZ + 0.02 }), 0x6b4f3b));
    for (const s of [-1, 1]) {
      const sh = new THREE.BoxGeometry(0.17, 0.32, 0.025);
      xf(sh, { x: s * 0.085, y: 0, z: 0 });
      xf(sh, { x: winX + s * 0.18, y: winY, z: winZ + 0.04 }, { x: 0, y: s * -0.9, z: 0 });
      wood.push(paint(sh, 0x7f9a8c, 0.05, rand));
    }
    // Flower box under the window.
    wood.push(paint(xf(new THREE.BoxGeometry(0.42, 0.09, 0.11), { x: winX, y: winY - 0.24, z: winZ + 0.07 }), 0x8a6a4e));
    for (let i = 0; i < 5; i++) {
      const c = [PAL.flowerC, PAL.flowerB, PAL.flowerA, PAL.rose, PAL.flowerC][i];
      g.add(at(mesh(blob(0.04, 1), c), winX - 0.16 + i * 0.08, winY - 0.17, winZ + 0.08));
    }

    // Stone chimney on the back right, stacked chipped blocks.
    const chX = 0.5;
    const chZ = -0.32;
    for (let y = EAVE - 0.1; y < RIDGE + 0.35; y += 0.13) {
      const b = stoneBlock(0.3, 0.12, 0.3, rand, 0.4);
      xf(b, { x: chX + (rand() - 0.5) * 0.02, y: y + 0.06, z: chZ }, { x: 0, y: (rand() - 0.5) * 0.15, z: 0 });
      stone.push(paint(b, [PAL.boulder, 0xb4b8b6, PAL.boulderDark][Math.floor(rand() * 3)], 0.05, rand));
    }
    stone.push(paint(xf(new THREE.BoxGeometry(0.36, 0.05, 0.36), { x: chX, y: RIDGE + 0.43, z: chZ }), 0x7d8384));

    // Lantern on a post by the door.
    wood.push(paint(xf(new THREE.CylinderGeometry(0.03, 0.035, 0.95, 6), { x: -0.98, y: 0.47, z: D / 2 + 0.32 }), 0x5e4636));
    wood.push(paint(xf(new THREE.BoxGeometry(0.2, 0.03, 0.03), { x: -0.9, y: 0.92, z: D / 2 + 0.32 }), 0x5e4636));
    iron.push(paint(xf(new THREE.CylinderGeometry(0.06, 0.07, 0.03, 6), { x: -0.82, y: 0.86, z: D / 2 + 0.32 }), 0x3d3f44));
    g.add(at(mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.1, 6), 0xffd98f, { emissive: 0.9, glow: true }), -0.82, 0.79, D / 2 + 0.32));

    // Woodpile against the left wall.
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 5 - row; i++) {
        const c = new THREE.CylinderGeometry(0.055, 0.055, 0.45, 7);
        xf(c, { x: -W / 2 - 0.22, y: 0.07 + row * 0.1, z: -0.3 + (i + row * 0.5) * 0.115 }, { x: 0, y: 0, z: Math.PI / 2 });
        wood.push(paint(c, rand() < 0.5 ? 0xc9a77f : 0xb3906a, 0.06, rand));
      }
    }

    g.add(mesh(merge(wood), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(stone), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(tiles), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(iron), 0xffffff, { vertexColors: true }));
    tile.dispose();

    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0.03);
    g.updateMatrixWorld(true);

    // Chimney smoke: three puffs on a loop (world space, so they rise straight up).
    const top = g.localToWorld(new THREE.Vector3(chX, RIDGE + 0.5, chZ));
    const up = d.clone();
    const smoke = [0, 1, 2].map((i) => {
      const m = mesh(blob(0.1, 1), 0xf4f7f2, { rim: 0 });
      m.castShadow = false;
      m.userData.phase = i / 3;
      root.add(m);
      return m;
    });
    return {
      object: g,
      obstacles: [{ dir: d, radius: 1.1 }],
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
