import * as THREE from 'three';
import { dirAt } from '../world/planet';
import { blob, cyl, mesh, param, type PropModule } from './kit';

/**
 * Ridge tent after the user's two pixel-art references: a single canvas sheet
 * draped over a ridge pole, crossed poles poking out above the ridge at both
 * ends, a triangular doorway with one flap gathered aside, and a garland.
 * Two variants: `flower` (cream canvas, blue flower string across the front)
 * and `leaf` (olive canvas, leaf-and-berry string along the ridge, firewood).
 */

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const WOOD = 0x9a6a3c, WOOD_DARK = 0x6e4a2a, ROPE = 0xa98c5e, PEG = 0x7a5536;

const L = 2.2; // canvas length along the ridge
const W = 0.95; // half width at the ground
const H = 1.58; // ridge height

/** Closed thin shell from a parametric sheet: front skin, back skin, sewn edges. */
function sheet(fn: (u: number, v: number) => THREE.Vector3, color: number, thickness = 0.03, cols = 28, rows = 20, opts: { rim?: number } = {}) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) pos.push(...fn(i / cols, j / rows).toArray());
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
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
  return mesh(g, color, { rim: opts.rim ?? 0.18 });
}

/** Side profile of the draped canvas: s = 0 at the ground hem, 1 at the ridge. */
function drape(side: -1 | 1, s: number, u: number) {
  // The sheet bows out a little at mid-height and pulls in slightly between the
  // two end frames, so it reads as cloth, not a roof.
  const bulge = 0.06 * Math.sin(Math.PI * s) - 0.035 * Math.sin(Math.PI * u) * Math.sin(Math.PI * s);
  const ripple = 0.014 * Math.sin(u * Math.PI * 6 + side) * Math.sin(Math.PI * s);
  const hem = s < 0.1 ? 0.05 * (1 - s / 0.1) : 0; // the bottom edge flares out
  const x = side * (W * (1 - s) + bulge + ripple + hem);
  const y = 0.03 + (H - 0.03) * s + 0.012 * Math.sin(u * Math.PI * 7) * (1 - s);
  return { x, y };
}

function canvasSheet(color: number) {
  return sheet((u, v) => {
    const z = -L / 2 + L * u;
    // v runs left hem -> ridge -> right hem.
    const side: -1 | 1 = v < 0.5 ? -1 : 1;
    const s = v < 0.5 ? v * 2 : 2 - v * 2;
    const p = drape(side, s, u);
    return V(p.x, p.y, z);
  }, color, 0.03, 30, 24);
}

/** Triangular gable at one end. `gather` > 0 pulls the right half aside like a curtain. */
function gable(color: number, z: number, half: -1 | 1 | 0, gather = 0, shade = 0) {
  return sheet((u, v) => {
    // u across the triangle (left -> right), v from the ground to the apex.
    let x0 = -W, x1 = W;
    if (half === -1) { x1 = 0; } else if (half === 1) { x0 = 0; }
    let x = THREE.MathUtils.lerp(x0, x1, u) * (1 - v);
    let y = 0.03 + (H - 0.06) * v;
    let zz = z + 0.03 * Math.sin(Math.PI * v) * (1 - Math.abs((x) / (W * (1 - v) + 1e-3)));
    if (gather > 0) {
      // Gather toward the slanted right edge of the doorway and let it hang in folds.
      const edgeX = W * (1 - v) * 0.92;
      const k = gather * (1 - v * 0.35);
      x = THREE.MathUtils.lerp(x, edgeX, k);
      zz += 0.10 * k + 0.035 * Math.sin(u * Math.PI * 7) * k * (1 - v);
      y -= 0.04 * k * Math.sin(u * Math.PI);
    }
    return V(x, y, zz);
  }, color, 0.028, 18, 16, { rim: 0.16 + shade });
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

function flower(g: THREE.Group, at: THREE.Vector3, petal: number, heart: number, size = 1) {
  const f = new THREE.Group();
  f.position.copy(at);
  f.add(mesh(blob(0.03 * size, 2), heart, { rim: 0.2, noOutline: true }));
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    const p = mesh(blob(0.036 * size, 2), petal, { rim: 0.2, noOutline: true });
    p.scale.set(1, 1, 0.55);
    p.position.set(Math.cos(a) * 0.052 * size, Math.sin(a) * 0.052 * size, -0.01);
    f.add(p);
  }
  f.rotation.set(-0.25, (Math.random() - 0.5) * 0.4, Math.random() * Math.PI);
  g.add(f);
}

function leaf(g: THREE.Group, at: THREE.Vector3, color: number, rand: () => number) {
  const m = mesh(blob(0.055, 2), color, { rim: 0.2, noOutline: true });
  m.scale.set(1, 0.28, 1.7);
  m.position.copy(at);
  m.rotation.set(rand() * 0.8 - 0.4, rand() * Math.PI, rand() * 0.9 + 0.3);
  g.add(m);
}

export const ridgeTent: PropModule = {
  prepare(planet, p) {
    planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(1.75) });
  },
  build({ planet, rand }, p) {
    const variant = param<'flower' | 'leaf'>(p, 'variant', 'flower');
    const canvasColor = param(p, 'canvas', variant === 'leaf' ? 0xb3b483 : 0xefdcb0);
    const g = new THREE.Group();
    g.name = `tent-${variant}`;
    g.userData.inspection = { target: [0, 0.78, 0.1], camera: [2.7, 1.9, 4.3] };

    // Trampled ground under and around the tent.
    const ground = mesh(cyl(1.45, 1.5, 0.03, 28), 0xcdbb94, { rim: 0.05, noOutline: true });
    ground.scale.set(1.05, 1, 1.25);
    ground.position.y = 0.012;
    ground.receiveShadow = true;
    g.add(ground);

    // Canvas and gables.
    g.add(canvasSheet(canvasColor));
    g.add(gable(canvasColor, -L / 2 + 0.035, 0));
    // Front: left half hangs closed, right half is gathered toward its pole.
    g.add(gable(canvasColor, L / 2 - 0.035, -1));
    g.add(gable(canvasColor, L / 2 - 0.035, 1, 0.78, 0.04));
    // Interior: a dark back wall and a bedroll.
    const inner = mesh(new THREE.ShapeGeometry((() => { const s = new THREE.Shape(); s.moveTo(-W * 0.9, 0.03); s.lineTo(W * 0.9, 0.03); s.lineTo(0, H * 0.9); s.closePath(); return s; })()), 0x5a4636, { flat: true, noOutline: true });
    inner.position.z = -L / 2 + 0.2;
    inner.receiveShadow = false;
    g.add(inner);
    const roll = mesh(cyl(0.13, 0.13, 0.72, 14), 0xd2aea6, { rim: 0.2 });
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0.15, 0.16, -0.25);
    g.add(roll);
    for (const x of [-0.12, 0.42]) {
      const band = mesh(new THREE.TorusGeometry(0.132, 0.012, 6, 18), 0x8a6a5e, { noOutline: true });
      band.rotation.y = Math.PI / 2;
      band.position.set(x, 0.16, -0.25);
      g.add(band);
    }

    // Frame: crossed poles at each end, a ridge pole resting in the crotches.
    const ends = [-L / 2 + 0.16, L / 2 - 0.16];
    const tips: THREE.Vector3[] = [];
    for (const z of ends) {
      for (const side of [-1, 1]) {
        const foot = V(side * (W + 0.1), 0.0, z);
        const crotch = V(0, H + 0.03, z);
        const dir = crotch.clone().sub(foot).normalize();
        const tip = crotch.clone().addScaledVector(dir, 0.4);
        pole(g, foot.clone().addScaledVector(dir, -0.02), tip, 0.062);
        tips.push(tip);
      }
    }
    pole(g, V(0, H + 0.1, -L / 2 - 0.26), V(0, H + 0.1, L / 2 + 0.26), 0.056, WOOD);
    // Lashing at each crotch.
    for (const z of ends) {
      const lash = mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 16), ROPE, { noOutline: true });
      lash.rotation.y = Math.PI / 2;
      lash.position.set(0, H + 0.08, z);
      g.add(lash);
    }
    // Guy ropes from the pole tips to pegs.
    tips.forEach((tip, i) => {
      const side = i % 2 ? 1 : -1;
      const z = ends[Math.floor(i / 2)] + (Math.floor(i / 2) ? 0.55 : -0.55);
      const peg = V(side * (W + 0.55), 0.04, z);
      cord(g, [tip.clone(), tip.clone().lerp(peg, 0.5).add(V(0, -0.04, 0)), peg], 0.011);
      const stake = mesh(cyl(0.028, 0.034, 0.2, 7), PEG, { noOutline: true });
      stake.position.copy(peg).setY(0.06);
      stake.rotation.set(0.2 * (Math.floor(i / 2) ? 1 : -1), 0, -0.2 * side);
      g.add(stake);
    });

    if (variant === 'flower') {
      // A string of blue flowers across the front, slung between the two pole feet.
      const a = V(-(W + 0.08), 0.42, L / 2 + 0.08);
      const top = V(0, H + 0.12, L / 2 + 0.14);
      const b = V(W + 0.08, 0.42, L / 2 + 0.08);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const q = t < 0.5 ? a.clone().lerp(top, t * 2) : top.clone().lerp(b, t * 2 - 1);
        const sag = Math.sin(Math.PI * (t < 0.5 ? t * 2 : t * 2 - 1)) * 0.09;
        pts.push(q.add(V(0, -sag, 0.02 * Math.sin(t * Math.PI * 3))));
      }
      cord(g, pts, 0.007, 0xb09a6c);
      const curve = new THREE.CatmullRomCurve3(pts);
      for (let i = 0; i < 11; i++) {
        const t = 0.05 + i / 10 * 0.9;
        const at = curve.getPoint(t).add(V(0, -0.015, 0.03));
        flower(g, at, i % 3 === 1 ? 0xa9c6e4 : 0x8fb3d9, 0xf3e3a3, 0.9 + rand() * 0.3);
      }
    } else {
      // A string of leaves and a few red berries along the ridge, firewood beside the tent.
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        pts.push(V(0.02 * Math.sin(t * Math.PI * 4), H + 0.12 - 0.03 * Math.sin(Math.PI * t), -L / 2 - 0.1 + (L + 0.2) * t));
      }
      cord(g, pts, 0.006, 0x8f7a52);
      const curve = new THREE.CatmullRomCurve3(pts);
      for (let i = 0; i < 17; i++) {
        const t = 0.03 + i / 16 * 0.94;
        const at = curve.getPoint(t).add(V((rand() - 0.5) * 0.06, -0.05 - rand() * 0.03, 0));
        leaf(g, at, [0x7fa36a, 0x9bb97b, 0x6f9460][i % 3], rand);
        if (i % 4 === 2) {
          const berry = mesh(blob(0.024, 2), 0xd06a5c, { rim: 0.25, noOutline: true });
          berry.position.copy(at).add(V(0.02, -0.03, 0.02));
          g.add(berry);
        }
      }
      // Firewood stack: five logs, two on three, bark-coloured with pale ends.
      const logs = [[-0.14, 0.07], [0, 0.07], [0.14, 0.07], [-0.07, 0.19], [0.07, 0.19]];
      for (const [x, y] of logs) {
        const log = mesh(cyl(0.062, 0.066, 0.52, 10), 0x8a5f3a, { rim: 0.14 });
        log.rotation.x = Math.PI / 2;
        log.position.set(W + 0.55 + x, y, 0.35);
        g.add(log);
        for (const dz of [-0.26, 0.26]) {
          const end = mesh(cyl(0.05, 0.05, 0.012, 10), 0xd9bd8d, { noOutline: true });
          end.rotation.x = Math.PI / 2;
          end.position.set(W + 0.55 + x, y, 0.35 + dz);
          g.add(end);
        }
      }
      // Three sticks leaning together: a small drying rack.
      const base = V(W + 0.5, 0, -0.55);
      for (let i = 0; i < 3; i++) {
        const a = i / 3 * Math.PI * 2 + 0.4;
        pole(g, base.clone().add(V(Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17)), base.clone().add(V(Math.cos(a) * -0.03, 0.62, Math.sin(a) * -0.03)), 0.016, WOOD_DARK);
      }
    }

    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0);
    return { object: g, obstacles: [{ dir: d, radius: 1.3 }] };
  },
};
