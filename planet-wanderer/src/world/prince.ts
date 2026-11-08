import * as THREE from 'three';
import { PAL } from '../render/palette';
import { toon } from '../render/materials';
import { blob } from '../props/kit';
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
  private walk = 0;
  speed = 0;
  private planet!: Planet;
  private obstacles: Obstacle[] = [];

  constructor() {
    this.dir = new THREE.Vector3(0, 0, 1);
    const b = this.body;
    // Legs and boots on pivots at the hip.
    for (const [leg, x] of [[this.legL, -0.07], [this.legR, 0.07]] as const) {
      leg.position.set(x, 0.24, 0);
      leg.add(part(new THREE.CapsuleGeometry(0.045, 0.12, 3, 8), PAL.boots, 0, -0.12, 0));
      const boot = part(blob(0.06, 1), PAL.boots, 0, -0.2, 0.025);
      boot.scale.set(1, 0.7, 1.35);
      leg.add(boot);
      b.add(leg);
    }
    // Coat: a flared bell, a collar ring, two buttons.
    b.add(part(new THREE.CylinderGeometry(0.13, 0.23, 0.4, 12), PAL.coat, 0, 0.38, 0));
    b.add(part(new THREE.CylinderGeometry(0.135, 0.135, 0.06, 12), 0x4f8577, 0, 0.56, 0));
    b.add(part(new THREE.SphereGeometry(0.02, 6, 4), PAL.gold, 0, 0.45, 0.165));
    b.add(part(new THREE.SphereGeometry(0.02, 6, 4), PAL.gold, 0, 0.36, 0.19));
    // Arms on shoulder pivots.
    for (const [arm, x] of [[this.armL, -0.15], [this.armR, 0.15]] as const) {
      arm.position.set(x, 0.53, 0);
      const sleeve = part(new THREE.CapsuleGeometry(0.042, 0.16, 3, 8), PAL.coat, 0, -0.11, 0);
      arm.add(sleeve);
      arm.add(part(blob(0.04, 1), PAL.skin, 0, -0.23, 0));
      arm.rotation.z = x < 0 ? -0.18 : 0.18;
      b.add(arm);
    }
    // Scarf: a ring at the neck and two tails that stream backwards.
    const ring = part(new THREE.TorusGeometry(0.095, 0.045, 6, 14), PAL.scarf, 0, 0.6, 0);
    ring.rotation.x = Math.PI / 2;
    b.add(ring);
    for (const [x, len] of [[-0.04, 0.34], [0.05, 0.26]] as const) {
      const tail = new THREE.Group();
      tail.position.set(x, 0.6, -0.09);
      const strip = part(new THREE.BoxGeometry(0.07, 0.025, len), PAL.scarf, 0, 0, -len / 2, THREE.DoubleSide);
      tail.add(strip);
      b.add(tail);
      this.scarfTails.push(tail);
    }
    // Head, eyes, cheeks.
    b.add(part(blob(0.17), PAL.skin, 0, 0.79, 0));
    b.add(part(new THREE.SphereGeometry(0.022, 6, 4), PAL.eye, -0.06, 0.78, 0.155));
    b.add(part(new THREE.SphereGeometry(0.022, 6, 4), PAL.eye, 0.06, 0.78, 0.155));
    b.add(part(new THREE.SphereGeometry(0.025, 6, 4), 0xf3b8b0, -0.1, 0.735, 0.13));
    b.add(part(new THREE.SphereGeometry(0.025, 6, 4), 0xf3b8b0, 0.1, 0.735, 0.13));
    // Golden hair: a cap of blobs plus a few tufts sticking out.
    const hair: [number, number, number, number][] = [
      [0, 0.88, -0.03, 0.135], [-0.1, 0.84, -0.06, 0.085], [0.1, 0.84, -0.06, 0.085],
      [0, 0.8, -0.11, 0.11], [-0.07, 0.9, 0.07, 0.07], [0.07, 0.91, 0.06, 0.07],
    ];
    for (const [x, y, z, r] of hair) b.add(part(blob(r, 1), PAL.hair, x, y, z));
    for (const [x, z, rz, rx] of [[-0.11, 0.0, 0.9, 0], [0.12, 0.0, -0.95, 0], [0.0, 0.02, 0.15, -0.3], [0.05, -0.12, -0.4, -0.9]] as const) {
      const tuft = part(new THREE.ConeGeometry(0.04, 0.14, 5), PAL.hair, x, 0.98, z);
      tuft.rotation.set(rx, 0, rz);
      b.add(tuft);
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
    this.scarfTails.forEach((tail, i) => {
      const flutter = Math.sin(t * (5 + i * 1.7) + i) * (0.12 + 0.2 * s);
      tail.rotation.x = -(0.95 - s * 0.75) + flutter * 0.4;
      tail.rotation.y = flutter * 0.6 + (i ? 0.25 : -0.2);
    });
  }
}

