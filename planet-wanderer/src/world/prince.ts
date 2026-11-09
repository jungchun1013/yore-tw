import * as THREE from 'three';
import { toon } from '../render/materials';
import { tailoredSurface } from '../characters/surfaces';
import type { Planet } from './planet';
import type { Obstacle } from '../props/kit';

function part(geo: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0, side?: THREE.Side) {
  const m = new THREE.Mesh(geo, toon(color, { side, flat: true }));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Cape colours after the user's reference sheet (the original cape): cream outside,
// teal-grey lining, a white badge on the chest, small triangles along the hem.
const CAPE = 0xeadcb6;
const CAPE_LINING = 0x8fb0a3;
const HEM_MARK = 0xc8b68c;
const DARK = 0x3a3f4a;

/**
 * The traveller. About 3.5 heads tall: a large head, narrow shoulders no wider than
 * the head, and no waist. The cape is the basic "earplug" cut: a high collar, rounded
 * shoulders, straight sides that widen a little toward the hem, with dark hands and
 * boots showing beneath. Modelled +Y up, +Z forward, feet at y = 0, ~1.0 tall.
 */
export class Prince {
  readonly root = new THREE.Group();
  readonly dir: THREE.Vector3;
  readonly forward = new THREE.Vector3();
  private body = new THREE.Group();
  private legL = new THREE.Group();
  private legR = new THREE.Group();
  private armL = new THREE.Group();
  private armR = new THREE.Group();
  private capeBones: THREE.Bone[] = [];
  private walk = 0;
  speed = 0;
  private planet!: Planet;
  private obstacles: Obstacle[] = [];

  constructor() {
    this.dir = new THREE.Vector3(0, 0, 1);
    const b = this.body;
    this.root.name = 'traveller';
    this.root.userData.inspection = { target: [0, 0.55, 0], camera: [1.1, 0.9, 2.3] };

    // Legs: slim, dark, with a slightly fuller boot. Pivot hidden inside the cape.
    for (const [leg, x] of [[this.legL, -0.055], [this.legR, 0.055]] as const) {
      leg.position.set(x, 0.24, 0);
      leg.add(part(tailoredSurface([
        [-0.24, 0.022, 0.036, 0.014], [-0.23, 0.03, 0.05, 0.016],
        [-0.18, 0.024, 0.026, 0], [-0.1, 0.02, 0.02, 0],
        [0.0, 0.022, 0.022, 0], [0.04, 0.016, 0.016, 0],
      ]), DARK));
      b.add(leg);
    }

    // Cape: one closed surface from collar to hem. Shoulders are 0.115 wide against a
    // head of 0.122, so the figure reads narrow; the sides run straight and flare to
    // 0.15 at the hem. A second surface, drawn inside-out, gives the teal lining.
    // Sections run bottom → top like every other authored surface, so the winding
    // faces outward (listing them top-down turns the mesh inside out).
    const capeSections: [number, number, number, number][] = [
      [0.14, 0.13, 0.098, 0.0], // hem
      [0.26, 0.12, 0.091, 0.0],
      [0.40, 0.108, 0.083, 0.0],
      [0.52, 0.102, 0.078, 0.0],
      [0.63, 0.1, 0.076, 0.0],
      [0.67, 0.086, 0.066, 0.0], // shoulder slope
      [0.70, 0.066, 0.055, 0.004],
      [0.735, 0.062, 0.052, 0.004], // collar top
    ];
    const capeGeo = tailoredSurface(capeSections, 40);
    const joints: number[] = [], weights: number[] = [];
    const capePos = capeGeo.getAttribute('position');
    for (let i = 0; i < capePos.count; i++) {
      const t = THREE.MathUtils.clamp((0.63 - capePos.getY(i)) / 0.45, 0, 1) * 3;
      const joint = Math.min(2, Math.floor(t)), blend = t - joint;
      joints.push(joint, joint + 1, 0, 0);
      weights.push(1 - blend, blend, 0, 0);
    }
    capeGeo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(joints, 4));
    capeGeo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
    const cape = new THREE.SkinnedMesh(capeGeo, toon(CAPE, { flat: true }));
    cape.name = 'cape';
    cape.castShadow = true;
    cape.receiveShadow = false; // the planet-wide shadow map is too coarse for a 10 cm terminator
    for (let i = 0; i < 4; i++) {
      const bone = new THREE.Bone();
      bone.name = `cape-${i}`;
      bone.position.y = i === 0 ? 0.63 : -0.45 / 3;
      if (i) this.capeBones[i - 1].add(bone); else cape.add(bone);
      this.capeBones.push(bone);
    }
    cape.bind(new THREE.Skeleton(this.capeBones));
    b.add(cape);
    // Lining: a plain inner shell in the teal-grey of the reference, seen under the hem.
    const lining = new THREE.Mesh(
      tailoredSurface(capeSections.slice(0, 5).map(([y, w, d, o]) => [y, w - 0.008, d - 0.008, o] as const), 40),
      toon(CAPE_LINING, { side: THREE.BackSide, flat: true }),
    );
    lining.castShadow = lining.receiveShadow = false;
    b.add(lining);

    // Hem triangles and the chest badge sit on the cape surface.
    const hemY = 0.165;
    const tri = new THREE.Shape([new THREE.Vector2(-0.016, 0), new THREE.Vector2(0.016, 0), new THREE.Vector2(0, 0.03)]);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + 0.3;
      const rx = 0.126, rz = 0.095;
      const m = part(new THREE.ShapeGeometry(tri), HEM_MARK, Math.sin(a) * rx, hemY, Math.cos(a) * rz, THREE.DoubleSide);
      m.lookAt(Math.sin(a) * rx * 2, hemY, Math.cos(a) * rz * 2);
      m.castShadow = false;
      b.add(m);
    }
    const badge = part(new THREE.CylinderGeometry(0.022, 0.022, 0.012, 16), 0xfaf6ee, 0, 0.55, 0.08);
    badge.rotation.x = Math.PI / 2;
    badge.castShadow = false;
    b.add(badge);

    // Hands: dark, hanging just below the hem at the sides (the original cape hides the arms).
    for (const [arm, x] of [[this.armL, -0.125], [this.armR, 0.125]] as const) {
      arm.position.set(x, 0.36, 0);
      arm.add(part(tailoredSurface([
        [-0.2, 0.004, 0.004, 0], [-0.19, 0.02, 0.016, 0.004],
        [-0.15, 0.024, 0.02, 0], [-0.1, 0.02, 0.018, 0], [0.0, 0.016, 0.016, 0],
      ], 14), DARK));
      b.add(arm);
    }

    // Head (authored cross sections): continuous jaw, cheeks, brow and crown.
    b.add(part(tailoredSurface([
      [0.64, 0.025, 0.035, 0.015], [0.665, 0.065, 0.065, 0.015],
      [0.71, 0.105, 0.09, 0.005], [0.77, 0.122, 0.105, 0],
      [0.83, 0.116, 0.1, -0.008], [0.88, 0.085, 0.075, -0.015],
      [0.91, 0.003, 0.003, -0.015],
    ]), 0xe9d9d1));
    // A sculpted dark faceplate and quiet luminous slit eyes.
    b.add(part(tailoredSurface([
      [0.68, 0.008, 0.003, 0.076], [0.71, 0.062, 0.012, 0.085],
      [0.77, 0.09, 0.014, 0.094], [0.81, 0.071, 0.01, 0.092],
      [0.83, 0.004, 0.002, 0.08],
    ]), 0x655e79));
    for (const x of [-0.04, 0.04]) {
      const eye = new THREE.Mesh(tailoredSurface([
        [0.744, 0.003, 0.002, 0], [0.75, 0.009, 0.003, 0],
        [0.772, 0.008, 0.003, 0], [0.778, 0.002, 0.001, 0],
      ], 12), toon(0xffefcd, { emissive: 0.7, noOutline: true, flat: true }));
      eye.position.set(x, 0, 0.111);
      b.add(eye);
    }
    // Hair: a single cap with tapered swept locks.
    const hair = part(tailoredSurface([
      [0.76, 0.107, 0.082, -0.04], [0.82, 0.132, 0.112, -0.02],
      [0.88, 0.116, 0.105, -0.015], [0.925, 0.068, 0.065, -0.008],
      [0.945, 0.002, 0.002, 0],
    ]), 0xf5eadb);
    const hp = hair.geometry.getAttribute('position');
    for (let i = 0; i < hp.count; i++) {
      const z = hp.getZ(i), y = hp.getY(i);
      if (z > 0) hp.setY(i, y + Math.max(0, 0.845 - y) * Math.min(1, z / 0.045));
    }
    hair.geometry.computeVertexNormals();
    b.add(hair);
    for (const [x, y, angle, length] of [[-0.075, 0.855, -0.5, 0.075], [0.0, 0.875, 0.48, 0.085], [0.075, 0.855, 0.65, 0.06]]) {
      const lock = part(tailoredSurface([
        [-length, 0.001, 0.001, 0.008], [-length * 0.55, 0.022, 0.012, 0.012],
        [0, 0.033, 0.016, 0], [0.025, 0.008, 0.008, -0.015],
      ], 16), 0xf5eadb, x, y, 0.09);
      lock.rotation.z = angle;
      b.add(lock);
    }
    this.root.add(b);
  }

  /** Step onto a world (scene load or arrival by ship). */
  enter(planet: Planet, obstacles: Obstacle[], at: THREE.Vector3, heading: number) {
    this.planet = planet;
    this.obstacles = obstacles;
    this.dir.copy(at).normalize();
    this.speed = 0;
    this.face(heading);
  }

  /** Face a compass heading in degrees (0 = toward the north pole, 180 = south). */
  face(deg: number) {
    const n = this.dir;
    this.forward.set(0, 1, 0).addScaledVector(n, -n.y).normalize().applyAxisAngle(n, THREE.MathUtils.degToRad(deg));
    this.syncTransform();
  }

  private syncTransform() {
    const n = this.dir;
    this.root.position.copy(this.planet.surfacePoint(n, -0.02));
    // Build the basis from the walking direction.
    const f = this.forward.addScaledVector(n, -this.forward.dot(n)).normalize();
    const r = new THREE.Vector3().crossVectors(n, f);
    this.root.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, n, f));
  }

  /** Walk along the sphere in a tangent direction (world space, any length). */
  move(want: THREE.Vector3, dt: number) {
    const n = this.dir;
    const t = want.clone().addScaledVector(n, -want.dot(n));
    const moving = t.lengthSq() > 1e-6;
    this.speed = THREE.MathUtils.damp(this.speed, moving ? 1 : 0, 10, dt);
    if (moving) {
      t.normalize();
      // Turn smoothly toward the wanted heading.
      this.forward.lerp(t, 1 - Math.exp(-14 * dt)).normalize();
      const step = (2.2 * dt * this.speed) / this.planet.radius;
      const axis = new THREE.Vector3().crossVectors(n, t).normalize();
      const next = n.clone().applyAxisAngle(axis, step);
      for (const o of this.obstacles) {
        const a = next.angleTo(o.dir);
        const min = o.radius + this.planet.ang(0.22);
        if (a < min) {
          // Slide around the obstacle's edge.
          const away = next.clone().sub(o.dir.clone().multiplyScalar(next.dot(o.dir))).normalize();
          const ax = new THREE.Vector3().crossVectors(o.dir, away).normalize();
          next.copy(o.dir).applyAxisAngle(ax, min);
        }
      }
      // Carry the heading across the sphere so it does not drift.
      const q = new THREE.Quaternion().setFromUnitVectors(n, next.normalize());
      this.forward.applyQuaternion(q);
      n.copy(next);
    }
    this.walk += dt * 11 * this.speed;
    this.syncTransform();
  }

  animate(t: number) {
    const s = this.speed;
    const sw = Math.sin(this.walk);
    this.legL.rotation.x = sw * 0.7 * s;
    this.legR.rotation.x = -sw * 0.7 * s;
    this.armL.rotation.x = -sw * 0.35 * s;
    this.armR.rotation.x = sw * 0.35 * s;
    this.body.position.y = Math.abs(Math.cos(this.walk)) * 0.035 * s + Math.sin(t * 2) * 0.005;
    this.body.rotation.x = 0.06 * s;
    // The cape trails and breathes; the hem swings a little more than the shoulders.
    this.capeBones.forEach((bone, i) => {
      if (!i) return;
      bone.rotation.x = -0.07 * s * i + Math.sin(t * 2.5 - i * 0.7) * (0.015 + s * 0.03);
      bone.rotation.z = Math.sin(t * 1.8 - i * 0.6) * 0.012;
    });
  }
}
