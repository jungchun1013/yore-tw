import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Geometry helpers for props that are many small parts (logs, tiles, cobbles, stone
 * blocks). Parts are painted with a vertex colour and merged into one mesh, so a house
 * of four hundred tiles is still a handful of draw calls.
 */

/** Non-indexed copy with a per-vertex colour and no uv, ready to merge. */
export function paint(geo: THREE.BufferGeometry, hex: number, jitter = 0, rand: () => number = Math.random): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (g.attributes.uv1) g.deleteAttribute('uv1');
  if (!g.attributes.normal) g.computeVertexNormals();
  const c = new THREE.Color(hex);
  if (jitter) {
    const k = 1 + (rand() - 0.5) * 2 * jitter;
    c.multiplyScalar(k);
  }
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

/** Bake a transform into a geometry (position, euler rotation, scale). */
export function xf(geo: THREE.BufferGeometry, pos: THREE.Vector3Like, rot: THREE.Vector3Like = { x: 0, y: 0, z: 0 }, scale: THREE.Vector3Like = { x: 1, y: 1, z: 1 }) {
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(pos.x, pos.y, pos.z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rot.x, rot.y, rot.z)),
    new THREE.Vector3(scale.x, scale.y, scale.z),
  );
  geo.applyMatrix4(m);
  return geo;
}

export function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(parts, false)!;
  for (const p of parts) p.dispose();
  return g;
}

/**
 * An angular stone block: a box whose corners are pulled in and clipped at random,
 * hulled into flat fracture faces. `chip` 0 = clean ashlar, 1 = broken rubble.
 */
export function stoneBlock(w: number, h: number, d: number, rand: () => number, chip = 0.35): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const p = new THREE.Vector3((sx * w) / 2, (sy * h) / 2, (sz * d) / 2);
    if (rand() < chip) {
      // Clip this corner: replace it with three points stepped back along each edge.
      const cut = 0.18 + rand() * 0.3;
      pts.push(p.clone().setX(p.x * (1 - cut)), p.clone().setY(p.y * (1 - cut)), p.clone().setZ(p.z * (1 - cut)));
    } else {
      pts.push(p.multiplyScalar(1 - rand() * 0.06 * chip));
    }
  }
  return new ConvexGeometry(pts);
}

/** A lumpy round cluster (foliage), displaced by a cheap 3D wave so silhouettes break up. */
export function lumpy(r: number, detail: number, amount: number, seed: number): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const cache = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`;
    let k = cache.get(key);
    if (k === undefined) {
      const n = Math.sin(v.x * 7.1 + seed) * Math.sin(v.y * 6.3 + seed * 1.7) * Math.sin(v.z * 8.2 + seed * 0.6);
      k = 1 + n * amount;
      cache.set(key, k);
    }
    v.multiplyScalar(k);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  const merged = mergeVertices(g);
  merged.computeVertexNormals();
  return merged;
}

/**
 * A crag: a tall, peaked rock mass with big flat fracture faces, like a boulder the
 * stream has cut. Rings of points narrow toward a leaning peak, hulled into facets.
 */
export function crag(h: number, w: number, d: number, rand: () => number): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [];
  const peak = new THREE.Vector3((rand() - 0.5) * w * 0.35, h, (rand() - 0.5) * d * 0.3);
  const levels = [-0.25, 0.05, 0.32, 0.6, 0.82];
  for (const lv of levels) {
    const y = lv * h;
    const shrink = 1 - Math.max(0, lv) * 0.62;
    const count = 5 + Math.floor(rand() * 2);
    const start = rand() * Math.PI * 2;
    for (let i = 0; i < count; i++) {
      const a = start + (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.7;
      const k = shrink * (0.72 + rand() * 0.36);
      const p = new THREE.Vector3(Math.cos(a) * (w / 2) * k, y + (rand() - 0.5) * h * 0.08, Math.sin(a) * (d / 2) * k);
      // Lean the upper rings toward the peak so the mass lists to one side.
      p.x += peak.x * Math.max(0, lv);
      p.z += peak.z * Math.max(0, lv);
      pts.push(p);
    }
  }
  pts.push(peak);
  return new ConvexGeometry(pts);
}

/** Colour each flat face of a hulled rock its own grey, darker where it faces down. */
export function facetColors(geo: THREE.BufferGeometry, palette: number[], rand: () => number): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (!g.attributes.normal) g.computeVertexNormals();
  const n = g.attributes.normal as THREE.BufferAttribute;
  const count = g.attributes.position.count;
  const arr = new Float32Array(count * 3);
  const byFace = new Map<string, THREE.Color>();
  const c = new THREE.Color();
  for (let t = 0; t < count; t += 3) {
    const nx = n.getX(t), ny = n.getY(t), nz = n.getZ(t);
    const key = `${nx.toFixed(2)},${ny.toFixed(2)},${nz.toFixed(2)}`;
    let col = byFace.get(key);
    if (!col) {
      col = new THREE.Color(palette[Math.floor(rand() * palette.length)]);
      col.multiplyScalar((0.9 + rand() * 0.16) * (ny < -0.2 ? 0.8 : 1));
      byFace.set(key, col);
    }
    c.copy(col);
    for (let v = 0; v < 3; v++) arr.set([c.r, c.g, c.b], (t + v) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}
