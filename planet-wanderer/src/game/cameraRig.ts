import * as THREE from 'three';
import type { Planet } from '../world/planet';
import type { Prince } from '../world/prince';

const ease = (z: number) => z * z * (3 - 2 * z);

/**
 * Orbit camera around a planet's centre. `zoom` 0 shows the whole world, 1 is the
 * life view behind the traveller. The orbit is a quaternion (no gimbal lock on a
 * sphere): the camera sits along orbit*(+Z), its up is orbit*(+Y).
 */
export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(30, 1, 0.5, 300);
  readonly orbit = new THREE.Quaternion();
  zoom = 0.82;
  zoomGoal = 0.82;
  tilt = 0.46;
  followPause = 0;
  readonly skyScroll = new THREE.Vector2();
  /** Key light direction (toward the light), world space. */
  readonly light = new THREE.Vector3(0, 1, 0);
  /** Sky style: the sun sits beyond the traveller, so everything is backlit. */
  backlit = false;
  /** Distance from the camera to the point it looks at. */
  focusDist = 10;
  private readonly dir = new THREE.Vector3();
  private readonly up = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly prevDir = new THREE.Vector3(0, 0, 1);

  get eased() {
    return ease(this.zoom);
  }

  /** Point the orbit straight at a surface direction with north up (scene load). */
  reset(focus: THREE.Vector3) {
    const d = focus.clone().normalize();
    const north = new THREE.Vector3(0, 1, 0).addScaledVector(d, -d.y).normalize();
    const right = new THREE.Vector3().crossVectors(north, d);
    this.orbit.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, north, d));
    this.read();
    this.prevDir.copy(this.dir);
  }

  private read() {
    this.dir.set(0, 0, 1).applyQuaternion(this.orbit);
    this.up.set(0, 1, 0).applyQuaternion(this.orbit);
    this.right.set(1, 0, 0).applyQuaternion(this.orbit);
  }

  update(dt: number, planet: Planet, prince: Prince) {
    this.zoom = THREE.MathUtils.damp(this.zoom, this.zoomGoal, 6, dt);
    const e = this.eased;
    this.read();
    const P = prince.dir;
    // Follow: keep the traveller framed, looking a little "north" past him.
    this.followPause = Math.max(0, this.followPause - dt);
    const k = this.followPause > 0 ? 0 : THREE.MathUtils.lerp(0.8, 5, e);
    if (k > 0) {
      const a = this.tilt * e;
      const upT = this.up.clone().addScaledVector(P, -this.up.dot(P)).normalize();
      const want = P.clone().multiplyScalar(Math.cos(a)).addScaledVector(upT, -Math.sin(a)).normalize();
      const step = new THREE.Quaternion().setFromUnitVectors(this.dir, want);
      const part = new THREE.Quaternion().slerp(step, 1 - Math.exp(-k * dt));
      this.orbit.premultiply(part).normalize();
      this.read();
    }
    const cam = this.camera;
    const h = THREE.MathUtils.lerp(planet.radius * 3.2, 7.4, e);
    cam.position.copy(this.dir).multiplyScalar(planet.radius + h);
    const target = prince.root.position.clone().addScaledVector(P, 0.45).multiplyScalar(e);
    cam.up.copy(this.up);
    cam.lookAt(target);
    this.focusDist = cam.position.distanceTo(target);

    const delta = this.dir.clone().sub(this.prevDir);
    this.skyScroll.x -= delta.dot(this.right) * 1.4;
    this.skyScroll.y -= delta.dot(this.up) * 1.4;
    this.prevDir.copy(this.dir);

    // Light built on the ground under the view centre: mostly overhead, leaning toward
    // the camera and to the left, so fronts facing the viewer are lit.
    const ground = this.dir;
    const north = this.up.clone().addScaledVector(ground, -this.up.dot(ground)).normalize();
    const east = new THREE.Vector3().crossVectors(north, ground);
    // Low sun beyond the traveller, a little to the right: long shadows, glare in frame.
    if (this.backlit) this.light.copy(ground).multiplyScalar(0.3).addScaledVector(north, 0.9).addScaledVector(east, 0.2).normalize();
    else this.light.copy(ground).multiplyScalar(0.78).addScaledVector(north, -0.42).addScaledVector(east, 0.46).normalize();
  }

  /** Drag: far away it spins the planet, close up it swings around the traveller. */
  rotateBy(dx: number, dy: number, prince: Prince) {
    const e = this.eased;
    this.read();
    const yawAxis = this.up.clone().lerp(prince.dir, e).normalize();
    this.orbit.premultiply(new THREE.Quaternion().setFromAxisAngle(yawAxis, -dx * 0.006));
    if (e > 0.5) this.tilt = THREE.MathUtils.clamp(this.tilt + dy * 0.004, 0.15, 0.8);
    else {
      this.read();
      this.orbit.premultiply(new THREE.Quaternion().setFromAxisAngle(this.right, -dy * 0.006));
      this.followPause = 2.5;
    }
    this.orbit.normalize();
  }

  /** Screen-up direction laid onto the ground at `n`, and screen-right. */
  groundAxes(n: THREE.Vector3) {
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const right = fwd.clone().cross(this.camera.up).normalize();
    fwd.addScaledVector(n, -fwd.dot(n));
    if (fwd.lengthSq() < 1e-4) fwd.copy(this.camera.up);
    return { fwd: fwd.normalize(), right };
  }
}
