import * as THREE from 'three';
import { dirAt } from '../world/planet';
import { makeRand, mesh, type PropModule } from './kit';
import { merge, paint, xf } from './geo';

const WOOD = [0xb38b62, 0xc49b70, 0xa67c55, 0xbb9064, 0xcba47b];
const FRAME = [0x956c49, 0xa77c54, 0xb88d62];
const RED = [0xb85c4e, 0xc86e58, 0xbc6150, 0xce7961, 0xac5149];
const HALF_W = 0.64, HALF_D = 0.59, EAVE = 1.25, RIDGE = 2.02;
const ROOF_W = 0.88, ROOF_D = 0.84;

/** Timber cabin: front gable, open plank door, swept ridge ends and a side shelter.
 * The roof is an authored curved surface; tiles and trim use the same height
 * function, so decorative wood never breaks through the red roofing. */
export const cabin: PropModule = {
  prepare(planet, p) {
    planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(1.55) });
  },
  build({ planet }, p) {
    const rand = makeRand(781);
    const pick = (colors: number[]) => colors[Math.floor(rand() * colors.length)];
    const wood: THREE.BufferGeometry[] = [], roof: THREE.BufferGeometry[] = [], stone: THREE.BufferGeometry[] = [];
    const g = new THREE.Group(); g.name = 'red-roof-timber-cabin';
    const block = (parts: THREE.BufferGeometry[], color: number, w: number, h: number, d: number, x: number, y: number, z: number) => {
      parts.push(paint(xf(new THREE.BoxGeometry(w, h, d), { x, y, z }), color, 0.025, rand));
    };
    const beam = (a: THREE.Vector3, b: THREE.Vector3, width = 0.075, color = pick(FRAME)) => {
      const geo = new THREE.BoxGeometry(width, a.distanceTo(b), width);
      geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
      geo.translate(...a.clone().add(b).multiplyScalar(0.5).toArray());
      wood.push(paint(geo, color, 0.025, rand));
    };
    const strut = (a: number[], b: number[], width = 0.075) => beam(new THREE.Vector3(...a), new THREE.Vector3(...b), width);
    const roofY = (x: number, z: number) => RIDGE - Math.abs(x) * 1.12
      + 0.105 * Math.pow(Math.abs(z) / ROOF_D, 3) + 0.045 * Math.pow(Math.abs(x) / ROOF_W, 5);

    // Raised floor and broad corner posts resting on quiet blue-grey stone shoes.
    block(wood, 0x73583f, 1.38, 0.1, 1.3, 0, 0.16, 0);
    for (const x of [-HALF_W, HALF_W]) for (const z of [-HALF_D, HALF_D]) {
      block(stone, 0xb9bec5, 0.19, 0.2, 0.19, x, 0.11, z);
      block(wood, pick(FRAME), 0.12, EAVE - 0.15, 0.12, x, (EAVE + 0.15) / 2, z);
    }
    // Vertical plank siding; front opening is actual empty space, not a dark decal.
    for (const side of [-1, 1]) {
      for (let i = 0; i < 11; i++) {
        const x = -0.6 + (i + 0.5) * 1.2 / 11;
        const aboveDoor = side > 0 && Math.abs(x) < 0.25;
        const bottom = aboveDoor ? 1.025 : 0.21;
        const top = EAVE - 0.055;
        block(wood, pick(WOOD), 1.2 / 11 - 0.004, top - bottom, 0.055, x, (top + bottom) / 2, side * HALF_D);
      }
      for (let i = 0; i < 11; i++) {
        const z = -0.55 + (i + 0.5) * 1.1 / 11;
        block(wood, pick(WOOD), 0.055, EAVE - 0.255, 0.096, side * HALF_W, (EAVE + 0.165) / 2, z);
      }
      block(wood, pick(FRAME), 1.43, 0.1, 0.1, 0, EAVE - 0.055, side * (HALF_D + 0.025));
      // Gable boards have sloped tops, cut below the roofing and its understructure.
      for (let i = 0; i < 12; i++) {
        const left = -HALF_W + i * HALF_W / 6, right = left + HALF_W / 6 - 0.003;
        const z = side * HALF_D;
        const shape = new THREE.Shape();
        shape.moveTo(left, EAVE); shape.lineTo(right, EAVE);
        shape.lineTo(right, roofY(right, z) - 0.085);
        shape.lineTo(left, roofY(left, z) - 0.085); shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: false });
        geo.translate(0, 0, z - 0.0225); wood.push(paint(geo, pick(WOOD), 0.025, rand));
      }
      const faceZ = side * (HALF_D + 0.055);
      strut([0, EAVE, faceZ], [0, RIDGE - 0.09, faceZ], 0.065);
      strut([-0.5, EAVE + 0.015, faceZ], [0, RIDGE - 0.18, faceZ], 0.06);
      strut([0.5, EAVE + 0.015, faceZ], [0, RIDGE - 0.18, faceZ], 0.06);
    }
    // A dark interior set back behind the real door frame.
    block(wood, 0x493d35, 0.55, 0.84, 0.035, 0, 0.62, 0.37);
    for (const x of [-0.29, 0.29]) block(wood, 0xc49b70, 0.075, 0.88, 0.09, x, 0.64, HALF_D + 0.055);
    block(wood, 0xc49b70, 0.66, 0.085, 0.1, 0, 1.08, HALF_D + 0.06);
    // Open door leaf, with two horizontal battens, swung out to the left.
    const door = new THREE.Group(); door.position.set(-0.25, 0.21, HALF_D + 0.07); door.rotation.y = -1.0;
    for (let i = 0; i < 5; i++) {
      const board = mesh(new THREE.BoxGeometry(0.094, 0.79, 0.035), pick(WOOD));
      board.position.set((i + 0.5) * 0.096, 0.395, 0); door.add(board);
    }
    for (const y of [0.12, 0.65]) {
      const rail = mesh(new THREE.BoxGeometry(0.47, 0.045, 0.035), 0xa57c54);
      rail.position.set(0.24, y, 0.03); door.add(rail);
    }
    g.add(door);
    for (let i = 0; i < 3; i++) {
      block(wood, pick(WOOD), 0.62, 0.065, 0.13, 0, 0.19 - i * 0.052, 0.71 + i * 0.12);
    }
    for (const x of [-0.245, 0.245]) strut([x, 0.2, 0.65], [x, 0.025, 1.04], 0.035);

    // Closed tile volumes follow the curved roof, in clipped staggered courses.
    const tile = (x0: number, x1: number, z0: number, z1: number, color: number) => {
      const corners = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
      const positions: number[] = [];
      for (const offset of [0, -0.028]) for (const [x, z] of corners) positions.push(x, roofY(x, z) + offset, z);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setIndex([0,2,1,0,3,2, 4,5,6,4,6,7, 0,1,5,0,5,4, 1,2,6,1,6,5, 2,3,7,2,7,6, 3,0,4,3,4,7]);
      geo.computeVertexNormals(); roof.push(paint(geo, color, 0.02, rand));
    };
    const rows = 8, cols = 12, tileD = ROOF_D * 2 / cols;
    for (const side of [-1, 1]) for (let r = 0; r < rows; r++) {
      const xa = side * ROOF_W * r / rows, xb = side * ROOF_W * (r + 1) / rows;
      for (let c = -1; c < cols; c++) {
        const z0 = Math.max(-ROOF_D, -ROOF_D + (c + (r % 2) * 0.5) * tileD);
        const z1 = Math.min(ROOF_D, -ROOF_D + (c + 1 + (r % 2) * 0.5) * tileD);
        if (z1 > z0) tile(Math.min(xa, xb), Math.max(xa, xb), z0, z1, pick(RED));
      }
    }
    // Continuous roof trim: centreline is lowered far enough for its thickness.
    const roofTrim = (x0: number, z0: number, x1: number, z1: number, width: number) => {
      for (let i = 0; i < 12; i++) {
        const t0 = i / 12, t1 = (i + 1) / 12;
        const x = THREE.MathUtils.lerp(x0, x1, t0), z = THREE.MathUtils.lerp(z0, z1, t0);
        const xx = THREE.MathUtils.lerp(x0, x1, t1), zz = THREE.MathUtils.lerp(z0, z1, t1);
        beam(new THREE.Vector3(x, roofY(x, z) - 0.11, z), new THREE.Vector3(xx, roofY(xx, zz) - 0.11, zz), width, 0xb78d65);
      }
    };
    for (const z of [-ROOF_D, ROOF_D]) {
      roofTrim(-ROOF_W, z, 0, z, 0.105); roofTrim(0, z, ROOF_W, z, 0.105);
    }
    for (const x of [-ROOF_W, ROOF_W]) roofTrim(x, -ROOF_D, x, ROOF_D, 0.09);

    // One continuous ridge extends past the gables and gently rises at its tips.
    // The projection is intentional roof trim, not crossed ornaments or stray beams.
    const ridgePath: THREE.Vector3[] = [];
    const ridgeEnd = ROOF_D + 0.18;
    for (let i = 0; i <= 32; i++) {
      const z = THREE.MathUtils.lerp(-ridgeEnd, ridgeEnd, i / 32);
      const tip = Math.max(0, (Math.abs(z) - 0.7) / (ridgeEnd - 0.7));
      const y = roofY(0, THREE.MathUtils.clamp(z, -ROOF_D, ROOF_D)) + 0.015 + 0.08 * tip * tip;
      ridgePath.push(new THREE.Vector3(0, y, z));
    }
    const ridgeSection = new THREE.Shape([
      new THREE.Vector2(-0.04, -0.028), new THREE.Vector2(0.04, -0.028),
      new THREE.Vector2(0.04, 0.028), new THREE.Vector2(-0.04, 0.028),
    ]);
    ridgeSection.closePath();
    const ridge = new THREE.ExtrudeGeometry(ridgeSection, {
      steps: 64, bevelEnabled: false,
      extrudePath: new THREE.CatmullRomCurve3(ridgePath),
    });
    wood.push(paint(ridge, 0xb78d65, 0.015, rand));

    // A low plank shelter on the right, supported by two posts and knee braces.
    const shelterX0 = 0.65, shelterX1 = 1.5, shelterZ0 = -0.32, shelterZ1 = 0.74;
    const shelterY = (x: number) => 1.11 - (x - shelterX0) * 0.15;
    for (let i = 0; i < 9; i++) {
      const z = shelterZ0 + (i + 0.5) * (shelterZ1 - shelterZ0) / 9;
      const geo = new THREE.BoxGeometry(shelterX1 - shelterX0, 0.035, (shelterZ1 - shelterZ0) / 9 - 0.004);
      geo.rotateZ(-Math.atan(0.15));
      geo.translate((shelterX0 + shelterX1) / 2, shelterY((shelterX0 + shelterX1) / 2), z);
      wood.push(paint(geo, pick(WOOD), 0.025, rand));
    }
    for (const z of [shelterZ0 + 0.09, shelterZ1 - 0.09]) {
      const x = shelterX1 - 0.1, y = shelterY(x) - 0.055;
      strut([x, 0.02, z], [x, y, z], 0.075);
      strut([x, y - 0.3, z], [x - 0.27, y - 0.015, z], 0.055);
      strut([shelterX0, shelterY(shelterX0) - 0.07, z], [shelterX1, shelterY(shelterX1) - 0.07, z], 0.065);
    }
    strut([shelterX1 - 0.1, 0.1, shelterZ0 + 0.09], [HALF_W + 0.08, 0.78, shelterZ0 + 0.09], 0.045);

    g.add(mesh(merge(wood), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(roof), 0xffffff, { vertexColors: true }));
    g.add(mesh(merge(stone), 0xffffff, { vertexColors: true }));
    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0.02);
    return { object: g, obstacles: [
      { dir: d, radius: 0.83 },
      { dir: g.localToWorld(new THREE.Vector3(1.1, 0, 0)).normalize(), radius: 0.55 },
    ] };
  },
};
