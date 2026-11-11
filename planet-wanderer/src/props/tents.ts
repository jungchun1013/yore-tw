import * as THREE from 'three';
import { dirAt } from '../world/planet';
import { mesh, type PropModule } from './kit';

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const CREAM = 0xf0d69c, HEM = 0xbc873e, WOOD = 0x98602d;


/** Closed canvas shell: front/back skins joined along every cut edge. */
function canvas(fn: (u: number, v: number) => THREE.Vector3, color: number, thickness = 0.024, cols = 24, rows = 24) {
  const positions: number[] = [], indices: number[] = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) positions.push(...fn(i / cols, j / rows).toArray());
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const k = j * (cols + 1) + i;
    indices.push(k, k + 1, k + cols + 1, k + 1, k + cols + 2, k + cols + 1);
  }
  const shell = new THREE.BufferGeometry();
  shell.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); shell.setIndex(indices); shell.computeVertexNormals();
  const normals = shell.getAttribute('normal'), count = positions.length / 3;
  for (let i = 0; i < count; i++) positions.push(positions[i * 3] - normals.getX(i) * thickness, positions[i * 3 + 1] - normals.getY(i) * thickness, positions[i * 3 + 2] - normals.getZ(i) * thickness);
  const front = indices.slice();
  for (let i = 0; i < front.length; i += 3) indices.push(front[i] + count, front[i + 2] + count, front[i + 1] + count);
  const edge = (a: number, b: number) => indices.push(a, a + count, b, b, a + count, b + count);
  for (let i = 0; i < cols; i++) { edge(i, i + 1); edge(rows * (cols + 1) + i + 1, rows * (cols + 1) + i); }
  for (let j = 0; j < rows; j++) { edge((j + 1) * (cols + 1), j * (cols + 1)); edge(j * (cols + 1) + cols, (j + 1) * (cols + 1) + cols); }
  shell.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); shell.setIndex(indices);
  shell.deleteAttribute('normal'); shell.computeVertexNormals();
  return mesh(shell, color, { side: THREE.DoubleSide, rim: 0.18 });
}

/** Two separate canvas shelters: open cushion nook and windowed camping tent. */
function openTent(): PropModule {
  return {
    prepare(planet, p) {
      planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(1.45) });
    },
    build({ planet }, p) {
      const g = new THREE.Group();
      g.name = 'tent-cushions';
      g.userData.inspection = { target: [0, 0.85, 0.1], camera: [3.1, 2.1, 4.7] };
      const height = 1.32;
      const radius = 1.06;
      const gap = 0.70;
      const panels = 6;
      // A sagged canvas span between poles, with a small flared hem.
      const surface = (a: number, t: number, offset = 0) => {
        const phase = (a - gap) / (Math.PI * 2 - gap * 2) * panels;
        const sag = Math.pow(Math.sin(phase * Math.PI), 2);
        const r = 0.055 + radius * t - 0.075 * sag * Math.sin(t * Math.PI)
          + Math.sin(phase * Math.PI * 6.0) * 0.024 * Math.sin(t * Math.PI)
          + Math.sin(phase * Math.PI * 4.0) * 0.012 * t * t + offset;
        return V(Math.sin(a) * r, height * (1 - t) + 0.045 + 0.024 * sag * t * t, Math.cos(a) * r);
      };
      const cord = (points: THREE.Vector3[], color: number, width: number) => {
        const curve = new THREE.CatmullRomCurve3(points);
        const m = mesh(new THREE.TubeGeometry(curve, Math.max(8, points.length * 3), width, 5, false), color, { rim: 0.25 });
        g.add(m); return m;
      };
      const pole = (a: THREE.Vector3, b: THREE.Vector3, width: number, color = WOOD) => cord([a, b], color, width);
      const patch = (a0: number, a1: number, t0: number, t1: number, color: number, offset = 0) => {
        const m = canvas((u, v) => surface(THREE.MathUtils.lerp(a0, a1, u), THREE.MathUtils.lerp(t0, t1, v), offset), color);
        g.add(m); return m;
      };
      const palette = [CREAM, 0xe2bd77, 0xf4dfa9, 0xe8c585, 0xeacf92, 0xf7e3b3];
      for (let i = 0; i < panels; i++) {
        const a = gap + (Math.PI * 2 - gap * 2) * i / panels;
        const b = gap + (Math.PI * 2 - gap * 2) * (i + 1) / panels;
        patch(a, b, 0.035, 1, palette[i]);
        patch(a, b, 0.94, 1, i % 2 ? 0xbca77b : 0xc7b58b, 0.004);
        cord(Array.from({ length: 15 }, (_, k) => surface(a, 0.035 + k / 14 * 0.965, 0.008)), HEM, 0.014);
      }
      // Visible tripod ends, bound with plain rope; no festive ornaments.
      for (const a of [gap, Math.PI, Math.PI * 2 - gap]) {
        const base = surface(a, 1, -0.025);
        const top = V(-Math.sin(a) * 0.11, height + 0.19, -Math.cos(a) * 0.11);
        pole(base, top, 0.049);
      }
      for (let k = 0; k < 4; k++) {
        const ring = mesh(new THREE.TorusGeometry(0.108, 0.016, 5, 16), 0xbba071, { rim: 0.15 });
        ring.rotation.x = Math.PI / 2; ring.position.y = height + 0.02 + k * 0.024; g.add(ring);
      }
      cord(Array.from({ length: 15 }, (_, k) => surface(Math.PI * 2 - gap, 0.035 + k / 14 * 0.965, 0.012)), HEM, 0.021);
      // Interior woven mat extends through the entrance.
      const rug = mesh(new THREE.BoxGeometry(1.10, 0.035, 1.36), 0xb5ab83);
      rug.position.set(0, 0.043, 0.40); g.add(rug);
      for (const x of [-0.51, 0.51]) {
        const stripe = mesh(new THREE.BoxGeometry(0.035, 0.006, 1.32), 0xe6d7a9);
        stripe.position.set(x, 0.064, 0.40); g.add(stripe);
      }
      for (let i = 0; i < 13; i++) {
        const x = (i - 6) * 0.075;
        pole(V(x, 0.055, 1.08), V(x + 0.012, 0.045, 1.16), 0.008, 0xd9c89b);
      }
      {
        // Exactly two plump sewn cushions; curved surfaces rather than flat decals.
        for (let k = 0; k < 2; k++) {
          const cushion = new THREE.Group(); cushion.name = `tent-cushion-${k + 1}`;
          const geo = new THREE.SphereGeometry(1, 24, 16);
          const positions = geo.getAttribute('position');
          for (let i = 0; i < positions.count; i++) {
            const f = (n: number) => Math.sign(n) * Math.pow(Math.abs(n), 0.55);
            positions.setXYZ(i, f(positions.getX(i)) * 0.20, f(positions.getY(i)) * 0.20, f(positions.getZ(i)) * 0.10);
          }
          geo.computeVertexNormals(); cushion.add(mesh(geo, k ? 0x88b5c4 : 0xa7c7cf, { rim: 0.25 }));
          const seam: THREE.Vector3[] = [];
          for (let i = 0; i <= 64; i++) {
            const a = i / 64 * Math.PI * 2;
            const f = (n: number) => Math.sign(n) * Math.pow(Math.abs(n), 0.55);
            seam.push(V(f(Math.cos(a)) * 0.201, f(Math.sin(a)) * 0.201, 0));
          }
          const piping = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(seam), 64, 0.006, 4, false), 0xe4e2cb);
          cushion.add(piping);
          const diamond = mesh(new THREE.PlaneGeometry(0.11, 0.11), 0xf0e4bc, { side: THREE.DoubleSide });
          diamond.rotation.z = Math.PI / 4; diamond.position.z = 0.102; cushion.add(diamond);
          cushion.position.set(k ? 0.25 : -0.25, 0.27, k ? 0.30 : 0.23);
          cushion.rotation.set(-0.22, k ? -0.16 : 0.18, k ? -0.12 : 0.10); g.add(cushion);
        }
      }
      // Ground pegs and short tension cords stay clear of the entrance.
      for (const a of [1.35, 2.8, 4.6]) {
        const peg = surface(a, 1, 0.18); peg.y = 0.06;
        pole(peg.clone().add(V(0, -0.03, 0)), peg.clone().add(V(0.025, 0.13, -0.02)), 0.018);
        cord([surface(a, 0.87, 0.01), peg.clone().add(V(0, 0.07, 0))], 0xb9a37c, 0.006);
      }
      const d = dirAt(p.at); planet.place(g, d, p.yaw ?? 0, 0);
      return { object: g, obstacles: [{ dir: d, radius: 1.08 }] };
    },
  };
}
export const cushionTent = openTent();


/** Tailored square-pyramid tent: sewn pole sleeves, split rolled entrance and an open round window. */
export const windowTent: PropModule = {
  prepare(planet, p) { planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(1.65) }); },
  build({ planet }, p) {
    const g = new THREE.Group(); g.name = 'tent-windowed';
    g.userData.inspection = { target: [0, 0.72, 0], camera: [-3.3, 2.3, 4.7] };
    const half = 1.02, height = 1.48, bottom = 0.08;
    const cord = (pts: THREE.Vector3[], color = HEM, width = 0.018) => {
      const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(12, pts.length * 3), width, 7, false), color, { rim: 0.18 }); g.add(m); return m;
    };
    // u spans a straight edge of the square base; t descends from the apex.
    const face = (side: number, u: number, t: number, offset = 0) => {
      const fold = Math.sin(u * Math.PI * 5 + 0.4) * 0.022 * Math.sin(t * Math.PI) * (1 - u * u);
      const belly = 0.028 * Math.sin(t * Math.PI) * (1 - u * u);
      return V(u * half * t, bottom + height * (1 - t), half * t + fold + belly + offset).applyAxisAngle(V(0, 1, 0), side * Math.PI / 2);
    };
    const add = (fn: (u: number, v: number) => THREE.Vector3, color: number, thick = 0.032) => { const m = canvas(fn, color, thick, 30, 28); g.add(m); return m; };
    for (let side = 1; side < 4; side++) {
      if (side !== 3) add((u, v) => face(side, u * 2 - 1, 0.018 + v * 0.982), [CREAM, 0xe9cb8a, 0xe4c27f, 0xf3daa1][side]);
      add((u, v) => face(side, u * 2 - 1, 0.91 + v * 0.09, 0.015), 0xc4954e, 0.023);
    }
    // The front has an actual cut opening, not a dark triangle pasted on a cone.
    const top = 0.27;
    const doorHalf = (t: number) => 0.40 * Math.sin((t - top) / (1 - top) * Math.PI * 0.60);
    add((u, v) => face(0, u * 2 - 1, 0.018 + v * (top - 0.018)), 0xf4dda6);
    for (const sign of [-1, 1]) {
      add((u, v) => {
        const t = top + v * (1 - top);
        const inner = doorHalf(t) / (half * t);
        return face(0, sign * THREE.MathUtils.lerp(inner, 1, u), t);
      }, sign < 0 ? 0xeacb88 : 0xf0d498);
      // The slit edges themselves roll outward: no lintel, jamb or separate door frame.
      const rollCenter = (v: number) => {
        const t = top + v * (1 - top);
        return face(0, sign * (doorHalf(t) + 0.015) / (half * t), t, 0.04);
      };
      add((u, v) => {
        const pt = rollCenter(v);
        const r = 0.008 + 0.052 * Math.pow(Math.sin(v * Math.PI / 2), 0.7);
        const angle = u * Math.PI * 2;
        pt.x += Math.cos(angle) * r;
        pt.z += Math.sin(angle) * r;
        return pt;
      }, sign < 0 ? 0xe7c98d : 0xefdaa9, 0.014);
      cord(Array.from({ length: 28 }, (_, i) => {
        const v = i / 27, pt = rollCenter(v);
        pt.x += sign * (0.008 + 0.052 * Math.pow(Math.sin(v * Math.PI / 2), 0.7));
        return pt;
      }), 0xcaa66a, 0.007);
      const tie = rollCenter(0.64);
      cord([tie.clone().add(V(-0.067, 0, 0.025)), tie.clone().add(V(0, -0.012, 0.065)), tie.clone().add(V(0.067, 0, 0.025))], 0xae7e46, 0.012);
      cord([tie.clone().add(V(0, 0, 0.065)), tie.clone().add(V(sign * 0.04, -0.13, 0.08))], 0xae7e46, 0.008);
    }
    // Wooden corner poles continue above the apex; tubular sewn canvas encloses
    // the poles along the roof, with a visible stitch line beside each sleeve.
    for (let side = 0; side < 4; side++) {
      const start = face(side, 1, 1, 0);
      const apex = V(0, bottom + height, 0);
      const end = apex.clone().add(apex.clone().sub(start).normalize().multiplyScalar(0.24));
      cord([start, apex, end], 0xa77c54, 0.032);
      const sleeve = Array.from({ length: 24 }, (_, i) => face(side, 1, 0.045 + i / 23 * 0.955, 0));
      cord(sleeve, 0xe2c793, 0.049);
      for (let i = 2; i < 23; i++) {
        const t = i / 24;
        cord([face(side, 0.94, t, 0.018), face(side, 0.94, t + 0.013, 0.018)], 0xbc945c, 0.004);
      }
    }
    for (let i = 0; i < 3; i++) {
      const binding = mesh(new THREE.TorusGeometry(0.067, 0.012, 6, 20), 0xc4a370);
      binding.rotation.x = Math.PI / 2; binding.position.y = bottom + height + i * 0.021; g.add(binding);
    }
    // Cut a circular hole through the left canvas shell, in physical slope-space.
    const slope = Math.hypot(half, height), center = slope * 0.64, radius = 0.245;
    const wall = new THREE.Shape();
    wall.moveTo(-half * 0.018, slope * 0.018); wall.lineTo(-half, slope);
    wall.lineTo(half, slope); wall.lineTo(half * 0.018, slope * 0.018); wall.closePath();
    const hole = new THREE.Path(); hole.absarc(0, center, radius, 0, Math.PI * 2, true); wall.holes.push(hole);
    const planePoint = (x: number, y: number, depth = 0) =>
      V(x, bottom + height * (1 - y / slope) + depth * half / slope, half * y / slope + depth * height / slope).applyAxisAngle(V(0, 1, 0), -Math.PI / 2);
    const wallGeo = new THREE.ExtrudeGeometry(wall, { depth: 0.028, bevelEnabled: true, bevelSize: 0.005, bevelThickness: 0.005, bevelSegments: 2, curveSegments: 48 });
    const pos = wallGeo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) { const pt = planePoint(pos.getX(i), pos.getY(i), pos.getZ(i)); pos.setXYZ(i, pt.x, pt.y, pt.z); }
    wallGeo.computeVertexNormals();
    const wallMesh = mesh(wallGeo, 0xefdaa9, { side: THREE.DoubleSide, rim: 0.18 }); wallMesh.name = 'canvas-with-round-window-hole'; g.add(wallMesh);
    const rim = Array.from({ length: 65 }, (_, i) => { const a = i / 64 * Math.PI * 2; return planePoint(Math.cos(a) * radius, center + Math.sin(a) * radius, 0.032); });
    cord(rim, 0xd4b279, 0.023);
    // Two solid wooden crossbars span the opening. There is no coloured pane.
    cord([planePoint(-radius, center, 0.025), planePoint(radius, center, 0.025)], 0xa77c54, 0.016);
    cord([planePoint(0, center - radius, 0.025), planePoint(0, center + radius, 0.025)], 0xa77c54, 0.016);
    const floor = mesh(new THREE.BoxGeometry(2.04, 0.065, 2.04), 0xb98343);
    floor.position.y = 0.035; g.add(floor);
    const step = mesh(new THREE.BoxGeometry(0.85, 0.055, 0.34), 0xdfb975);
    step.position.set(0, 0.027, 1.12); g.add(step);
    // Corner stakes and short guy ropes, leaving the doorway clear.
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const post = mesh(new THREE.CylinderGeometry(0.034, 0.042, 0.17, 7), WOOD);
      post.position.set(x * 1.14, 0.085, z * 1.14); g.add(post);
      cord([V(x * 0.94, 0.20, z * 0.94), V(x * 1.14, 0.10, z * 1.14)], 0xc7964c, 0.012);
    }
    const d = dirAt(p.at); planet.place(g, d, p.yaw ?? 0, 0);
    return { object: g, obstacles: [{ dir: d, radius: 1.42 }] };
  },
};
