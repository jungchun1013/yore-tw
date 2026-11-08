import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { terrainMaterial } from '../render/materials';
import type { LatLon, Mood } from '../scenes/types';

/** Latitude/longitude in degrees → unit direction. lon 0 / lat 0 faces +Z. */
export function dirOf(lat: number, lon: number): THREE.Vector3 {
  const a = THREE.MathUtils.degToRad(lat);
  const b = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b));
}
export const dirAt = (p: LatLon) => dirOf(p[0], p[1]);

function hash(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
function vnoise(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const s = (t: number) => t * t * (3 - 2 * t);
  const fx = s(x - ix), fy = s(y - iy), fz = s(z - iz);
  const L = THREE.MathUtils.lerp;
  const c = (dx: number, dy: number, dz: number) => hash(ix + dx, iy + dy, iz + dz);
  return L(
    L(L(c(0, 0, 0), c(1, 0, 0), fx), L(c(0, 1, 0), c(1, 1, 0), fx), fy),
    L(L(c(0, 0, 1), c(1, 0, 1), fx), L(c(0, 1, 1), c(1, 1, 1), fx), fy),
    fz,
  );
}

/** Ground that must be level (buildings) — radius in radians. */
export interface Flat { dir: THREE.Vector3; radius: number; height?: number }
/** A hollow for water — radius in radians, depth in world units. */
export interface Pond { dir: THREE.Vector3; radius: number; depth: number }

const _m = new THREE.Matrix4();
const _f = new THREE.Vector3();
const _r = new THREE.Vector3();

/** One spherical world. Props register flats and ponds, then the mesh is built. */
export class Planet {
  readonly flats: Flat[] = [];
  readonly ponds: Pond[] = [];
  readonly paths: [THREE.Vector3, THREE.Vector3][];
  private readonly off: number;

  constructor(readonly radius: number, readonly seed: number, paths: [LatLon, LatLon][]) {
    this.paths = paths.map(([a, b]) => [dirAt(a), dirAt(b)]);
    this.off = seed * 13.17;
  }

  /** Convert a size in world units to an angle on this planet. */
  ang(units: number) {
    return units / this.radius;
  }

  private rawHeight(d: THREE.Vector3) {
    const o = this.off;
    return 0.22 * (vnoise(d.x * 2.1 + 5 + o, d.y * 2.1, d.z * 2.1) - 0.5) + 0.07 * (vnoise(d.x * 6, d.y * 6 + 3 + o, d.z * 6) - 0.5);
  }

  /** Terrain height above the radius for a unit direction. */
  heightAt(d: THREE.Vector3): number {
    let h = this.rawHeight(d);
    for (const f of this.flats) {
      const a = d.angleTo(f.dir);
      if (a < f.radius * 1.6) {
        const target = f.height ?? this.rawHeight(f.dir);
        const w = THREE.MathUtils.smoothstep(f.radius * 1.6 - a, 0, f.radius * 0.6);
        h = THREE.MathUtils.lerp(h, target, w);
      }
    }
    for (const p of this.ponds) {
      const pa = d.angleTo(p.dir) / p.radius;
      if (pa < 1.25) h -= p.depth * THREE.MathUtils.smoothstep(1.25 - pa, 0, 0.55);
    }
    return h;
  }

  surfacePoint(d: THREE.Vector3, lift = 0): THREE.Vector3 {
    const n = d.clone().normalize();
    return n.multiplyScalar(this.radius + this.heightAt(n) + lift);
  }

  /** Stand an object (modelled +Y up, +Z forward, base at y=0) on the surface. */
  place(obj: THREE.Object3D, d: THREE.Vector3, yawDeg = 0, sink = 0) {
    const n = d.clone().normalize();
    obj.position.copy(this.surfacePoint(n, -sink));
    orient(obj, n, yawDeg);
  }

  buildMesh(mood: Mood): THREE.Mesh {
    let geo: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, Math.max(16, Math.round(this.radius * 4.8)));
    geo.deleteAttribute('normal');
    geo.deleteAttribute('uv');
    geo = mergeVertices(geo);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      v.multiplyScalar(this.radius + this.heightAt(v));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, terrainMaterial({ ponds: this.ponds, paths: this.paths, mood }));
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.name = 'planet';
    return mesh;
  }
}

export function orient(obj: THREE.Object3D, n: THREE.Vector3, yawDeg = 0) {
  // Reference forward: toward the north pole, falling back near the poles.
  const ref = Math.abs(n.y) > 0.98 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
  _f.copy(ref).addScaledVector(n, -ref.dot(n)).normalize();
  _f.applyAxisAngle(n, THREE.MathUtils.degToRad(yawDeg));
  _r.crossVectors(n, _f).normalize();
  _m.makeBasis(_r, n, _f);
  obj.quaternion.setFromRotationMatrix(_m);
}
