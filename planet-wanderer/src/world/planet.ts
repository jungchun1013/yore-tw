import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { terrainMaterial } from '../render/materials';
import type { LatLon, Mood, PathDef } from '../scenes/types';

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
export interface Flat { dir: THREE.Vector3; radius: number; height?: number; /** lift the level ground (raised plazas) */ raise?: number }
/** A hollow for water — radius in radians, depth in world units. */
export interface Pond { dir: THREE.Vector3; radius: number; depth: number }

const _m = new THREE.Matrix4();
const _f = new THREE.Vector3();
const _r = new THREE.Vector3();

/** One spherical world. Props register flats and ponds, then the mesh is built. */
export class Planet {
  readonly flats: Flat[] = [];
  readonly ponds: Pond[] = [];
  /** Dense centre lines of each winding path (unit directions). */
  readonly pathCurves: THREE.Vector3[][];
  /** Half-width of each path, radians. */
  readonly pathHalf: number[];
  /** The curves cut into short arcs for the ground shader and collision tests. */
  readonly paths: [THREE.Vector3, THREE.Vector3][];
  readonly pathSegHalf: number[];
  private readonly off: number;

  constructor(readonly radius: number, readonly seed: number, paths: PathDef[]) {
    this.off = seed * 13.17;
    this.pathCurves = paths.map((p, i) => windingCurve(p, radius, seed * 7 + i * 3.1));
    this.pathHalf = paths.map((p) => (p.width ?? 0.6) / 2 / radius);
    this.paths = [];
    this.pathSegHalf = [];
    this.pathCurves.forEach((c, i) => {
      for (let k = 0; k + 3 < c.length; k += 3) {
        this.paths.push([c[k], c[Math.min(c.length - 1, k + 3)]]);
        this.pathSegHalf.push(this.pathHalf[i]);
      }
      const last = c.length - 1 - ((c.length - 1) % 3);
      if (last < c.length - 1) {
        this.paths.push([c[last], c[c.length - 1]]);
        this.pathSegHalf.push(this.pathHalf[i]);
      }
    });
  }

  /** Angular distance from a direction to the nearest path centre, and that path's half-width. */
  pathDistance(d: THREE.Vector3): { dist: number; half: number } {
    let best = { dist: Infinity, half: 0 };
    this.pathCurves.forEach((c, i) => {
      for (const p of c) {
        const a = d.angleTo(p);
        if (a < best.dist) best = { dist: a, half: this.pathHalf[i] };
      }
    });
    return best;
  }

  /** Convert a size in world units to an angle on this planet. */
  ang(units: number) {
    return units / this.radius;
  }

  private rawHeight(d: THREE.Vector3) {
    const o = this.off;
    // One very broad swell (a few percent of the radius) so the silhouette is not a
    // perfect circle, then the meadow's rolling ground and its small detail.
    return 0.028 * this.radius * (vnoise(d.x * 0.9 + 11 + o, d.y * 0.9 + 7, d.z * 0.9 + 3) - 0.5) * 2
      + 0.22 * (vnoise(d.x * 2.1 + 5 + o, d.y * 2.1, d.z * 2.1) - 0.5) + 0.07 * (vnoise(d.x * 6, d.y * 6 + 3 + o, d.z * 6) - 0.5);
  }

  /** Terrain height above the radius for a unit direction. */
  heightAt(d: THREE.Vector3): number {
    let h = this.rawHeight(d);
    for (const f of this.flats) {
      const a = d.angleTo(f.dir);
      if (a < f.radius * 1.6) {
        const target = (f.height ?? this.rawHeight(f.dir)) + (f.raise ?? 0);
        const w = THREE.MathUtils.smoothstep(f.radius * 1.6 - a, 0, f.radius * 0.6);
        h = THREE.MathUtils.lerp(h, target, w);
      }
    }
    for (const p of this.ponds) {
      const pa = d.angleTo(p.dir) / p.radius;
      // A flat bed, a bank wall between 0.78 and 1.12 radii, then level ground: a dug
      // hole rather than a dish, so the bank reads as a bank from any angle.
      if (pa < 1.12) h -= p.depth * THREE.MathUtils.smoothstep(1.12 - pa, 0, 0.34);
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
    const mesh = new THREE.Mesh(geo, terrainMaterial({ ponds: this.ponds, paths: this.paths, pathHalf: this.pathSegHalf, mood }));
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    mesh.name = 'planet';
    return mesh;
  }
}

/** Points along a path through its waypoints, wandering sideways like a trodden track. */
function windingCurve(p: PathDef, radius: number, seed: number): THREE.Vector3[] {
  const pts = p.points.map(dirAt);
  const amp = (p.wind ?? 0.35) / radius;
  const out: THREE.Vector3[] = [];
  const step = 0.12 / radius; // a sample every 12 cm of ground
  for (let s = 0; s < pts.length - 1; s++) {
    const a = pts[s];
    const b = pts[s + 1];
    const span = a.angleTo(b);
    const n = Math.max(2, Math.ceil(span / step));
    const axis = new THREE.Vector3().crossVectors(a, b).normalize();
    for (let i = s === 0 ? 0 : 1; i <= n; i++) {
      const t = i / n;
      const q = a.clone().applyAxisAngle(axis, span * t);
      // Two waves, faded to zero at every waypoint so the path still meets them.
      const wob = (Math.sin(t * Math.PI * 2 + seed + s) * 0.7 + Math.sin(t * Math.PI * 5.3 + seed * 1.9) * 0.3) * Math.sin(t * Math.PI);
      const side = new THREE.Vector3().crossVectors(axis, q).normalize();
      const sideAxis = new THREE.Vector3().crossVectors(q, side).normalize();
      out.push(q.applyAxisAngle(sideAxis, amp * wob).normalize());
    }
  }
  return out;
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
