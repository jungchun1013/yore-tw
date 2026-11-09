import * as THREE from 'three';
import { PAL } from '../render/palette';
import { toon } from '../render/materials';
import { tailoredSurface, mantleSurface } from '../characters/surfaces';
import type { Planet } from './planet';
import type { Obstacle } from '../props/kit';

function part(geo: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0, side?: THREE.Side) {
  const m = new THREE.Mesh(geo, toon(color, { side }));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** The little traveller: green coat, golden tousled hair, a yellow scarf that streams
 *  behind him. Modelled +Y up, +Z forward, feet at y = 0, about 0.95 units tall. */
export class Prince {
  readonly root = new THREE.Group();
  readonly dir: THREE.Vector3;
  readonly forward = new THREE.Vector3();
  private body = new THREE.Group();
  private legL = new THREE.Group();
  private legR = new THREE.Group();
  private armL = new THREE.Group();
  private armR = new THREE.Group();
  private scarfTails: THREE.Group[] = [];
  private capeBones: THREE.Bone[] = [];
  private walk = 0;
  speed = 0;
  private planet!: Planet;
  private obstacles: Obstacle[] = [];

  constructor() {
    this.dir = new THREE.Vector3(0, 0, 1);
    const b = this.body;
    this.root.name = 'traveller';
    // Deliberately shaped cross sections replace the old cylinder/sphere assembly.
    for (const [leg, x] of [[this.legL, -0.065], [this.legR, 0.065]] as const) {
      leg.position.set(x, 0.29, 0);
      leg.add(part(tailoredSurface([
        [-0.285, 0.025, 0.04, 0.015], [-0.27, 0.046, 0.075, 0.025],
        [-0.22, 0.039, 0.044, 0], [-0.14, 0.032, 0.032, 0],
        [-0.06, 0.046, 0.04, 0], [0.015, 0.04, 0.035, 0],
      ]), PAL.boots));
      b.add(leg);
    }
    b.add(part(tailoredSurface([
      [0.21, 0.16, 0.1, 0], [0.25, 0.165, 0.105, 0],
      [0.37, 0.105, 0.075, 0], [0.49, 0.12, 0.08, 0],
      [0.55, 0.145, 0.075, 0], [0.6, 0.075, 0.055, 0],
      [0.64, 0.052, 0.045, 0],
    ]), PAL.coat));
    for (const [arm, x] of [[this.armL, -0.135], [this.armR, 0.135]] as const) {
      arm.position.set(x, 0.54, 0);
      arm.add(part(tailoredSurface([
        [-0.235, 0.012, 0.018, 0], [-0.22, 0.027, 0.025, 0.005],
        [-0.18, 0.025, 0.023, 0], [-0.12, 0.036, 0.033, 0],
        [-0.04, 0.045, 0.04, 0], [0.015, 0.035, 0.035, 0],
        [0.035, 0.003, 0.003, 0],
      ]), PAL.coat));
      arm.rotation.z = x < 0 ? -0.16 : 0.16;
      b.add(arm);
    }
    // Continuous jaw, cheeks, brow and crown; no ball head or protruding eyeballs.
    b.add(part(tailoredSurface([
      [0.64, 0.025, 0.035, 0.015], [0.665, 0.065, 0.065, 0.015],
      [0.71, 0.105, 0.09, 0.005], [0.77, 0.122, 0.105, 0],
      [0.83, 0.116, 0.1, -0.008], [0.88, 0.085, 0.075, -0.015],
      [0.91, 0.003, 0.003, -0.015],
    ]), 0xe9d9d1));
    // A sculpted dark faceplate and quiet luminous slit eyes, inspired by ceremonial masks.
    b.add(part(tailoredSurface([
      [0.68, 0.008, 0.003, 0.076], [0.71, 0.062, 0.012, 0.085],
      [0.77, 0.09, 0.014, 0.094], [0.81, 0.071, 0.01, 0.092],
      [0.83, 0.004, 0.002, 0.08],
    ]), 0x655e79));
    for (const x of [-0.04, 0.04]) {
      const eye = new THREE.Mesh(tailoredSurface([
        [0.744, 0.003, 0.002, 0], [0.75, 0.009, 0.003, 0],
        [0.772, 0.008, 0.003, 0], [0.778, 0.002, 0.001, 0],
      ], 12), toon(0xffefcd, { emissive: 0.7, noOutline: true }));
      eye.position.set(x, 0, 0.111); b.add(eye);
    }
    // Hair is a single authored cap with tapered swept locks, rather than blobs.
    b.add(part(tailoredSurface([
      [0.76, 0.107, 0.082, -0.04], [0.82, 0.132, 0.112, -0.02],
      [0.88, 0.116, 0.105, -0.015], [0.925, 0.068, 0.065, -0.008],
      [0.945, 0.002, 0.002, 0],
    ]), 0xf5eadb));
    // Trim away the front lower cap to reveal the mask.
    const hair = b.children[b.children.length - 1] as THREE.Mesh;
    const hp = hair.geometry.getAttribute('position');
    for (let i = 0; i < hp.count; i++) {
      const z = hp.getZ(i), y = hp.getY(i);
      if (z > 0) hp.setY(i, y + Math.max(0, 0.845 - y) * Math.min(1, z / 0.045));
    }
    hair.geometry.computeVertexNormals();
    for (const [x, y, angle, length] of [[-0.075, 0.855, -0.5, 0.075], [0.0, 0.875, 0.48, 0.085], [0.075, 0.855, 0.65, 0.06]]) {
      const lock = part(tailoredSurface([
        [-length, 0.001, 0.001, 0.008], [-length * 0.55, 0.022, 0.012, 0.012],
        [0, 0.033, 0.016, 0], [0.025, 0.008, 0.008, -0.015],
      ], 16), 0xf5eadb, x, y, 0.09);
      lock.rotation.z = angle; b.add(lock);
    }
    const capeGeo = mantleSurface();
    const capePos = capeGeo.getAttribute('position');
    const joints: number[] = [], weights: number[] = [];
    for (let i = 0; i < capePos.count; i++) {
      const t = THREE.MathUtils.clamp((0.61 - capePos.getY(i)) / 0.4, 0, 1) * 3;
      const joint = Math.min(2, Math.floor(t)), blend = t - joint;
      joints.push(joint, joint + 1, 0, 0); weights.push(1 - blend, blend, 0, 0);
    }
    capeGeo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(joints, 4));
    capeGeo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
    const cape = new THREE.SkinnedMesh(capeGeo, toon(0xeee9e3, { side: THREE.DoubleSide }));
    cape.name = 'pleated-mantle'; cape.castShadow = cape.receiveShadow = true;
    for (let i = 0; i < 4; i++) {
      const bone = new THREE.Bone(); bone.name = `mantle-${i}`;
      bone.position.y = i === 0 ? 0.61 : -0.4 / 3;
      if (i) this.capeBones[i - 1].add(bone); else cape.add(bone);
      this.capeBones.push(bone);
    }
    cape.bind(new THREE.Skeleton(this.capeBones)); b.add(cape);
    // Gold clasp is a flattened diamond, legible from the gameplay camera.
    const clasp = part(new THREE.OctahedronGeometry(0.032), PAL.gold, 0, 0.57, 0.109);
    clasp.scale.set(0.75, 1, 0.3); b.add(clasp);
    for (const [x, len] of [[-0.035, 0.27], [0.035, 0.21]] as const) {
      const tail = new THREE.Group(); tail.position.set(x, 0.6, -0.08);
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, -0.02, -len * 0.45),
        new THREE.Vector3(x * 1.5, 0.01, -len),
      ]);
      tail.add(part(new THREE.TubeGeometry(curve, 12, 0.018, 5, false), PAL.scarf));
      b.add(tail); this.scarfTails.push(tail);
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
    this.armL.rotation.x = -sw * 0.6 * s;
    this.armR.rotation.x = sw * 0.6 * s;
    this.body.position.y = Math.abs(Math.cos(this.walk)) * 0.04 * s + Math.sin(t * 2) * 0.006;
    this.body.rotation.x = 0.08 * s;
    this.capeBones.forEach((bone, i) => {
      if (!i) return;
      bone.rotation.x = -0.055 * s + Math.sin(t * 2.5 - i * 0.7) * (0.022 + s * 0.035);
      bone.rotation.z = Math.sin(t * 1.8 - i * 0.6) * 0.018;
    });
    this.scarfTails.forEach((tail, i) => {
      const flutter = Math.sin(t * (5 + i * 1.7) + i) * (0.12 + 0.2 * s);
      tail.rotation.x = -(0.95 - s * 0.75) + flutter * 0.4;
      tail.rotation.y = flutter * 0.6 + (i ? 0.25 : -0.2);
    });
  }
}

