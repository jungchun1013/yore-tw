import * as THREE from 'three';
import { dirAt } from '../world/planet';
import { cyl, mesh, param, type PropModule } from './kit';

/**
 * Square-pyramid tent after the user's cream pixel-art reference. The canvas is
 * one continuous sheet stretched over four edge poles: it bulges where a pole
 * presses from inside and sags inward between them, like oxford cloth on a camp
 * stool. The front face is unhooked and laid out flat as a mat; a round window is
 * cut out of the right face; a small rain cap (the same profile pushed outward)
 * sits over the apex, and the two front poles cross above it.
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const WOOD = 0x9a6a3c, ROPE = 0xa98c5e, PEG = 0x7a5536;

const HALF = 1.12; // half of the square base
const H = 1.62; // apex height
const POLE_R = 0.08;

/** Closed thin shell from a parametric sheet; `skip` omits quads (cut-outs). */
function sheet(fn: (u: number, v: number) => THREE.Vector3, color: number, thickness: number, cols: number, rows: number, rim: number, skip?: (u: number, v: number) => boolean, snap?: (u: number, v: number) => [number, number]) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    let u = i / cols, v = j / rows;
    // Vertices inside a cut-out move to its boundary, so the hole's edge is the
    // true curve rather than a staircase of grid cells.
    if (skip && snap && skip(u, v)) [u, v] = snap(u, v);
    pos.push(...fn(u, v).toArray());
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    // A cell is dropped only when all four corners are inside the cut-out; the
    // remaining boundary is then drawn entirely by vertices snapped onto the rim.
    if (skip && skip(i / cols, j / rows) && skip((i + 1) / cols, j / rows) && skip(i / cols, (j + 1) / rows) && skip((i + 1) / cols, (j + 1) / rows)) continue;
    const k = j * (cols + 1) + i;
    idx.push(k, k + 1, k + cols + 1, k + 1, k + cols + 2, k + cols + 1);
  }
  const front = new THREE.BufferGeometry();
  front.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  front.setIndex(idx);
  front.computeVertexNormals();
  const n = front.getAttribute('normal');
  const count = pos.length / 3;
  for (let i = 0; i < count; i++) pos.push(pos[i * 3] - n.getX(i) * thickness, pos[i * 3 + 1] - n.getY(i) * thickness, pos[i * 3 + 2] - n.getZ(i) * thickness);
  const f = idx.slice();
  for (let i = 0; i < f.length; i += 3) idx.push(f[i] + count, f[i + 2] + count, f[i + 1] + count);
  const edge = (a: number, b: number) => idx.push(a, a + count, b, b, a + count, b + count);
  for (let i = 0; i < cols; i++) { edge(i, i + 1); edge(rows * (cols + 1) + i + 1, rows * (cols + 1) + i); }
  for (let j = 0; j < rows; j++) { edge((j + 1) * (cols + 1), j * (cols + 1)); edge(j * (cols + 1) + cols, (j + 1) * (cols + 1) + cols); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return mesh(g, color, { rim, side: THREE.DoubleSide });
}

/** Angle range of the standing canvas: from just past the front-left pole, round the back, to just past the front-right pole (front = +z). */
const A0 = THREE.MathUtils.degToRad(113);
const A1 = THREE.MathUtils.degToRad(427);

/** Radius of the canvas at angle `a` (0 = +x, 90° = +z) and height fraction `v`, with pole bulges and face sag. `out` pushes the whole profile outward (rain cap). */
function profile(a: number, v: number, out = 0) {
  const base = HALF * (1 - v);
  // Square footprint.
  const sq = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
  // Distance to the nearest pole (corners at 45°, 135°, ...), and to the nearest face centre.
  // ((a - 45°) mod 90°) - 45° is the signed offset from the nearest face centre.
  const dFace = Math.abs(((a - Math.PI / 4) % (Math.PI / 2) + Math.PI / 2) % (Math.PI / 2) - Math.PI / 4);
  const dCorner = Math.PI / 4 - dFace;
  // The bulge is the pole's radius plus the cloth wrapping it; constant in world units.
  const bulge = (POLE_R + 0.065) * Math.exp(-Math.pow(dCorner / 0.2, 2));
  // Cloth between poles sags inward, most at mid height, nothing at the hem and apex.
  const sag = 0.07 * Math.exp(-Math.pow(dFace / 0.42, 2)) * Math.sin(Math.PI * v) * (1 - v * 0.3);
  return base * sq + bulge - sag + out;
}

function canvasPoint(u: number, v: number, out = 0) {
  const a = THREE.MathUtils.lerp(A0, A1, u);
  const r = profile(a, v, out);
  const hem = v < 0.06 ? 0.03 * (1 - v / 0.06) : 0;
  return V(Math.cos(a) * (r + hem), 0.03 + (H - 0.03) * v, Math.sin(a) * (r + hem));
}

function pole(g: THREE.Group, a: THREE.Vector3, b: THREE.Vector3, r: number, color = WOOD) {
  const d = b.clone().sub(a);
  const m = mesh(cyl(r * 0.86, r, d.length(), 9), color, { rim: 0.14 });
  m.position.copy(a).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
  g.add(m);
  return m;
}

function cord(g: THREE.Group, pts: THREE.Vector3[], r: number, color = ROPE) {
  const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), Math.max(10, pts.length * 4), r, 6, false), color, { rim: 0.12, noOutline: true });
  g.add(m);
  return m;
}

export const pyramidTent: PropModule = {
  prepare(planet, p) {
    planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(1.9) });
  },
  build({ planet }, p) {
    const canvasColor = param(p, 'canvas', 0xefdcb0);
    const g = new THREE.Group();
    g.name = 'tent-pyramid';
    g.userData.inspection = { target: [0, 0.75, 0.3], camera: [3.2, 2.0, 5.0] };

    const ground = mesh(cyl(1.6, 1.65, 0.03, 28), 0xcdbb94, { rim: 0.05, noOutline: true });
    ground.scale.set(1, 1, 1.3);
    ground.position.set(0, 0.012, 0.35);
    g.add(ground);

    // One continuous canvas round three sides, with a round window cut from the
    // +x face (angle 0, i.e. u where a = 360°).
    const WIN_V = 0.5, WIN_R = 0.21;
    const winU = (Math.PI * 2 - A0) / (A1 - A0);
    const winHalfU = (WIN_R / (HALF * (1 - WIN_V))) / (A1 - A0);
    const winHalfV = WIN_R / (H - 0.03);
    const inWindow = (u: number, v: number) => Math.pow((u - winU) / winHalfU, 2) + Math.pow((v - WIN_V) / winHalfV, 2) < 1;
    const toRim = (u: number, v: number): [number, number] => {
      const du = (u - winU) / winHalfU, dv = (v - WIN_V) / winHalfV;
      const l = Math.hypot(du, dv) || 1;
      return [winU + du / l * winHalfU, WIN_V + dv / l * winHalfV];
    };
    g.add(sheet((u, v) => canvasPoint(u, v), canvasColor, 0.03, 120, 44, 0.18, inWindow, toRim));
    // The front face, unhooked and laid flat in front as a mat.
    g.add(sheet((u, v) => {
      const x = (u * 2 - 1) * HALF * (1 - v);
      const z = HALF + 0.02 + (H * 0.92) * v;
      const y = 0.035 + 0.025 * Math.sin(Math.PI * v) * Math.sin(u * Math.PI) + 0.012 * Math.sin(u * Math.PI * 7) * (1 - v);
      return V(x, y, z);
    }, 0xf3e3bd, 0.025, 20, 18, 0.1));
    // Dark interior wall and a bedroll seen through the opening.
    const inner = mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-HALF * 0.85, 0.03); s.lineTo(HALF * 0.85, 0.03); s.lineTo(0, H * 0.88); s.closePath(); return s; })()), 0x5a4636, { flat: true, noOutline: true });
    inner.position.z = -HALF * 0.3;
    g.add(inner);
    const roll = mesh(cyl(0.14, 0.14, 0.8, 14), 0xb9c7d6, { rim: 0.2 });
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0.1, 0.17, -0.15);
    g.add(roll);

    // Four edge poles under the bulges; the two front ones continue past the cap and cross.
    const apex = V(0, H + 0.02, 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const foot = V(x * HALF * 0.985, 0.0, z * HALF * 0.985);
      const dir = apex.clone().sub(foot).normalize();
      pole(g, foot.clone().addScaledVector(dir, -0.02), apex.clone().addScaledVector(dir, z > 0 ? 0.72 : 0.12), POLE_R);
    }
    const lash = mesh(new THREE.TorusGeometry(0.1, 0.026, 6, 16), ROPE, { noOutline: true });
    lash.rotation.x = Math.PI / 2;
    lash.rotation.z = 0.4;
    lash.position.set(0, H + 0.3, 0.1);
    g.add(lash);

    // Rain cap: the same profile pushed 0.05 outward, covering the top quarter of
    // the tent and wrapping all four sides including over the doorway.
    const CAP_V0 = 0.74;
    g.add(sheet((u, v) => {
      const a = u * Math.PI * 2;
      const vv = THREE.MathUtils.lerp(CAP_V0, 1.0, 1 - v);
      const r = profile(a, vv, 0.05) + 0.02 * v * v;
      return V(Math.cos(a) * r, 0.03 + (H - 0.03) * vv + 0.02, Math.sin(a) * r);
    }, 0xe4c88e, 0.026, 64, 10, 0.2));

    // Window cross bars, set just proud of the canvas in the cut-out.
    {
      const centre = V(profile(0, WIN_V) + 0.02, 0.03 + (H - 0.03) * WIN_V, 0);
      const win = new THREE.Group();
      win.position.copy(centre);
      win.quaternion.setFromUnitVectors(V(0, 0, 1), V(H, HALF, 0).normalize());
      for (const rz of [0, Math.PI / 2]) {
        const bar = mesh(cyl(0.03, 0.03, WIN_R * 2.05, 7), 0xf4e2b4, { noOutline: true });
        bar.rotation.z = rz;
        win.add(bar);
      }
      g.add(win);
    }

    // Pegs at the four corners, with short ties from the hem.
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const peg = V(x * (HALF + 0.3), 0.05, z * (HALF + 0.3));
      const stake = mesh(cyl(0.028, 0.034, 0.2, 7), PEG, { noOutline: true });
      stake.position.copy(peg).setY(0.08);
      stake.rotation.set(0.18 * -z, 0, 0.18 * x);
      g.add(stake);
      cord(g, [V(x * HALF * 0.98, 0.08, z * HALF * 0.98), peg.clone().setY(0.12)], 0.01);
    }
    // Guy ropes from the crossing forward to two pegs beside the mat.
    for (const x of [-1, 1]) {
      const peg = V(x * (HALF + 0.55), 0.05, HALF + 0.9);
      const stake = mesh(cyl(0.028, 0.034, 0.2, 7), PEG, { noOutline: true });
      stake.position.copy(peg).setY(0.08);
      stake.rotation.set(-0.2, 0, 0.2 * x);
      g.add(stake);
      const top = V(0, H + 0.26, 0.06);
      cord(g, [top, top.clone().lerp(peg, 0.5).add(V(0, -0.06, 0)), peg.clone().setY(0.12)], 0.011);
    }

    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0);
    return { object: g, obstacles: [{ dir: d, radius: 1.4 }] };
  },
};
