import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LoopSubdivision } from 'three-subdivide';
import { SPIRIT_DAY, SPIRIT_NIGHT, antlerMaterial, constellation, spiritMaterial, type SpiritTint } from '../render/spirit';
import { dirAt } from '../world/planet';
import { blob, mesh, param, type PropModule } from './kit';

/** Base models (public/models/, see LICENSES.md there) and how tall they stand. */
interface ModelSpec {
  file: string;
  /** Standing height in world units (after any antlers are cut). */
  height: number;
  idle: string[];
  radius: number;
  deer?: boolean;
  /** Split the model at this fraction of its height: below = body, above = antlers. */
  antlerCut?: number;
  /** Keep the model's own antlers (as a glowing part) instead of discarding them. */
  keepAntlers?: boolean;
  /** Graft the Quaternius stag's antlers onto the skull cap at their original tilt and
   *  spread; value = size multiplier, 1 = the same antler-to-body proportion as on that stag. */
  graftAntlers?: number;
}
// Model D (madtrollstudio) is the stag with its own antlers; model C (Google Poly) is
// the doe with its antlers removed. Both are the slender static deer the user picked.
const MODELS: Record<string, ModelSpec> = {
  stag: { file: 'deer_d.glb', height: 1.7, idle: [], radius: 0.7, deer: true, antlerCut: 0.805, graftAntlers: 0.9 },
  doe: { file: 'deer_c.glb', height: 1.4, idle: [], radius: 0.6, deer: true, antlerCut: 0.87 },
  rabbit: { file: 'rabbit.glb', height: 0.34, idle: [], radius: 0.25 },
};
const ANTLER_FILE = 'stag.glb'; // Quaternius stag: body `Stag`, antlers `Stag_Horns`

const loader = new GLTFLoader();
const cache = new Map<string, Promise<THREE.Group>>();
function loadModel(file: string) {
  let p = cache.get(file);
  if (!p) {
    p = new Promise((res, rej) => loader.load(`${import.meta.env.BASE_URL}models/${file}`, (g) => {
      // Keep the pristine scene + clips; callers clone it.
      (g.scene as THREE.Group & { animations?: THREE.AnimationClip[] }).animations = g.animations;
      res(g.scene);
    }, undefined, rej));
    cache.set(file, p);
  }
  return p;
}

/** Facets off, skin on: a static mesh gets two rounds of Loop subdivision; a skinned
 *  one keeps its vertex count (joint weights cannot be interpolated) and only gets its
 *  split vertices welded so the normals run smoothly across the surface. */
/** Vertices that share a position (across material groups or UV seams) form one
 *  cluster; smoothing and normals work per cluster so seams never open or shade apart. */
function clusters(pos: THREE.BufferAttribute): { of: Int32Array; members: number[][] } {
  const map = new Map<string, number>();
  const of = new Int32Array(pos.count);
  const members: number[][] = [];
  // Quantise relative to the model's size: base models are tiny in file units, so a
  // fixed decimal count would split welded vertices and the seams would open up.
  let span = 0;
  for (let i = 0; i < pos.count; i++) span = Math.max(span, Math.abs(pos.getX(i)), Math.abs(pos.getY(i)), Math.abs(pos.getZ(i)));
  const q = span * 2e-3 || 1e-6;
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) / q)},${Math.round(pos.getY(i) / q)},${Math.round(pos.getZ(i) / q)}`;
    let c = map.get(k);
    if (c === undefined) { c = members.length; map.set(k, c); members.push([]); }
    of[i] = c; members[c].push(i);
  }
  return { of, members };
}

/** Taubin smoothing (λ/μ) on position clusters: rounds off sculpted detail such as
 *  muscle groups without the shrinkage of plain Laplacian smoothing. Positions only,
 *  so skinning attributes stay valid. Needs an indexed geometry. */
function relax(g: THREE.BufferGeometry, iterations: number, lambda = 0.5, mu = -0.53) {
  const idx = g.index;
  if (!idx) return;
  const pos = g.attributes.position as THREE.BufferAttribute;
  const { of, members } = clusters(pos);
  const n = members.length;
  const nbrs: Set<number>[] = Array.from({ length: n }, () => new Set<number>());
  for (let i = 0; i < idx.count; i += 3) {
    const a = of[idx.getX(i)], b = of[idx.getX(i + 1)], c = of[idx.getX(i + 2)];
    if (a !== b) { nbrs[a].add(b); nbrs[b].add(a); }
    if (b !== c) { nbrs[b].add(c); nbrs[c].add(b); }
    if (a !== c) { nbrs[a].add(c); nbrs[c].add(a); }
  }
  const p = new Float32Array(n * 3);
  for (let c = 0; c < n; c++) { const i = members[c][0]; p[c * 3] = pos.getX(i); p[c * 3 + 1] = pos.getY(i); p[c * 3 + 2] = pos.getZ(i); }
  const q = new Float32Array(n * 3);
  const step = (k: number) => {
    for (let c = 0; c < n; c++) {
      const nb = nbrs[c];
      if (!nb.size) { q[c * 3] = p[c * 3]; q[c * 3 + 1] = p[c * 3 + 1]; q[c * 3 + 2] = p[c * 3 + 2]; continue; }
      let x = 0, y = 0, z = 0;
      for (const j of nb) { x += p[j * 3]; y += p[j * 3 + 1]; z += p[j * 3 + 2]; }
      x /= nb.size; y /= nb.size; z /= nb.size;
      q[c * 3] = p[c * 3] + k * (x - p[c * 3]);
      q[c * 3 + 1] = p[c * 3 + 1] + k * (y - p[c * 3 + 1]);
      q[c * 3 + 2] = p[c * 3 + 2] + k * (z - p[c * 3 + 2]);
    }
    p.set(q);
  };
  for (let it = 0; it < iterations; it++) { step(lambda); step(mu); }
  for (let c = 0; c < n; c++) for (const i of members[c]) pos.setXYZ(i, p[c * 3], p[c * 3 + 1], p[c * 3 + 2]);
  pos.needsUpdate = true;
}

/** Plump the body: push every vertex out along its smooth normal by a fraction of
 *  the model's size, so a lean sculpt reads soft and rounded rather than wiry. */
function inflate(g: THREE.BufferGeometry, fraction: number) {
  clusterNormals(g);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  g.computeBoundingSphere();
  const d = (g.boundingSphere?.radius ?? 1) * fraction;
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) + nrm.getX(i) * d, pos.getY(i) + nrm.getY(i) * d, pos.getZ(i) + nrm.getZ(i) * d);
  pos.needsUpdate = true;
}

/** Smooth normals that agree across position clusters (no seam shading). */
function clusterNormals(g: THREE.BufferGeometry) {
  g.computeVertexNormals();
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  const { members } = clusters(pos);
  const v = new THREE.Vector3();
  for (const m of members) {
    if (m.length < 2) continue;
    v.set(0, 0, 0);
    for (const i of m) v.add(new THREE.Vector3(nrm.getX(i), nrm.getY(i), nrm.getZ(i)));
    v.normalize();
    for (const i of m) nrm.setXYZ(i, v.x, v.y, v.z);
  }
  nrm.needsUpdate = true;
}

/** One round of 1→4 midpoint subdivision that also interpolates skin joints/weights
 *  (the library cannot), so low-poly animated bodies get enough vertices to relax into
 *  soft shapes. Midpoints merge both parents' influences and keep the four strongest. */
function subdivideSkinned(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const idx = g.index!;
  const pos = g.attributes.position as THREE.BufferAttribute;
  const J = g.attributes.skinIndex as THREE.BufferAttribute | undefined;
  const W = g.attributes.skinWeight as THREE.BufferAttribute | undefined;
  const n0 = pos.count;
  const P: number[] = Array.from(pos.array as ArrayLike<number>);
  const JI: number[] = J ? Array.from(J.array as ArrayLike<number>) : [];
  const WI: number[] = W ? Array.from(W.array as ArrayLike<number>) : [];
  const mid = new Map<string, number>();
  let count = n0;
  const midpoint = (a: number, b: number) => {
    const key = a < b ? `${a}_${b}` : `${b}_${a}`;
    let m = mid.get(key);
    if (m !== undefined) return m;
    m = count++;
    P.push((P[a * 3] + P[b * 3]) / 2, (P[a * 3 + 1] + P[b * 3 + 1]) / 2, (P[a * 3 + 2] + P[b * 3 + 2]) / 2);
    if (J && W) {
      const acc = new Map<number, number>();
      for (const v of [a, b]) for (let k = 0; k < 4; k++) { const w = WI[v * 4 + k]; if (w > 0) acc.set(JI[v * 4 + k], (acc.get(JI[v * 4 + k]) ?? 0) + w / 2); }
      const top = [...acc.entries()].sort((x, y) => y[1] - x[1]).slice(0, 4);
      const sum = top.reduce((s, e) => s + e[1], 0) || 1;
      for (let k = 0; k < 4; k++) { JI.push(top[k]?.[0] ?? 0); WI.push(top[k] ? top[k][1] / sum : 0); }
    }
    mid.set(key, m);
    return m;
  };
  const out: number[] = [];
  const groups = g.groups.length ? g.groups : [{ start: 0, count: idx.count, materialIndex: 0 }];
  const newGroups: { start: number; count: number; materialIndex: number }[] = [];
  for (const grp of groups) {
    const start = out.length;
    for (let i = grp.start; i < grp.start + grp.count; i += 3) {
      const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      out.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    newGroups.push({ start, count: out.length - start, materialIndex: grp.materialIndex ?? 0 });
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  if (J && W) {
    r.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(JI, 4));
    r.setAttribute('skinWeight', new THREE.Float32BufferAttribute(WI, 4));
  }
  r.setIndex(out);
  for (const grp of newGroups) r.addGroup(grp.start, grp.count, grp.materialIndex);
  return r;
}

/**
 * Split the model at `cutY`: triangles whose centroid lies above it are the antlers,
 * the rest is the body. The openings left in the skull are capped with a fan so the
 * head stays closed; the antler piece keeps its original position, so it sits exactly
 * where the modeller put it.
 */
function cutAbove(geo: THREE.BufferGeometry, cutY: number): { geo: THREE.BufferGeometry; above: THREE.BufferGeometry | null; mounts: THREE.Vector3[] } {
  const g = geo.index ? geo : mergeVertices(geo, 1e-5);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const idx = g.index!;
  const keep: number[] = [];
  const upper: number[] = [];
  const edgeCount = new Map<string, number>();
  const key = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
    const cy = (pos.getY(a) + pos.getY(b) + pos.getY(c)) / 3;
    if (cy > cutY) { upper.push(a, b, c); continue; }
    keep.push(a, b, c);
    for (const [u, v] of [[a, b], [b, c], [c, a]]) edgeCount.set(key(u, v), (edgeCount.get(key(u, v)) ?? 0) + 1);
  }
  // Open edges near the cut belong to the holes we just made.
  const open: [number, number][] = [];
  for (let i = 0; i < keep.length; i += 3) {
    const a = keep[i], b = keep[i + 1], c = keep[i + 2];
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      if (edgeCount.get(key(u, v)) === 1 && Math.max(pos.getY(u), pos.getY(v)) > cutY - (cutY * 0.15)) open.push([u, v]);
    }
  }
  // Group open edges into loops by shared vertices, fan each loop from its centre.
  const adj = new Map<number, number[]>();
  for (const [u, v] of open) { (adj.get(u) ?? adj.set(u, []).get(u)!).push(v); (adj.get(v) ?? adj.set(v, []).get(v)!).push(u); }
  const seen = new Set<number>();
  const extra: number[] = [];
  const mounts: THREE.Vector3[] = [];
  const P: number[] = Array.from(pos.array as ArrayLike<number>);
  let next = pos.count;
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const loop: number[] = [];
    const stack = [start];
    while (stack.length) { const v = stack.pop()!; if (seen.has(v)) continue; seen.add(v); loop.push(v); for (const w of adj.get(v) ?? []) if (!seen.has(w)) stack.push(w); }
    if (loop.length < 3) continue;
    const c = new THREE.Vector3();
    for (const v of loop) c.add(new THREE.Vector3(pos.getX(v), pos.getY(v), pos.getZ(v)));
    c.divideScalar(loop.length);
    mounts.push(c.clone());
    const ci = next++;
    P.push(c.x, c.y, c.z);
    for (const [u, v] of open) if (loop.includes(u) && loop.includes(v)) extra.push(u, v, ci);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  out.setIndex([...keep, ...extra]);
  // Capped fans may face either way; the spirit material shades both sides.
  let above: THREE.BufferGeometry | null = null;
  if (upper.length) {
    above = new THREE.BufferGeometry();
    above.setAttribute('position', new THREE.Float32BufferAttribute(Array.from(pos.array as ArrayLike<number>), 3));
    above.setIndex(upper);
  }
  return { geo: out, above, mounts };
}

/**
 * Toward a fawn's build (Bambi): the base sculpts have a swayed back and a heavy,
 * muscular rump. Straighten the back line and draw the hindquarters in. Works in the
 * model's own space; the forward axis is the longer horizontal one, the front is the
 * taller end (head and neck rise above the rump).
 */
function fawnShape(g: THREE.BufferGeometry) {
  const pos = g.attributes.position as THREE.BufferAttribute;
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  const size = bb.getSize(new THREE.Vector3());
  const axis: 'x' | 'z' = size.x > size.z ? 'x' : 'z';
  const other: 'x' | 'z' = axis === 'x' ? 'z' : 'x';
  const lo = bb.min[axis], hi = bb.max[axis], len = hi - lo;
  // Which end is the front: the end whose top is higher.
  const bins = 20;
  const top = new Array<number>(bins).fill(-Infinity);
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(bins - 1, Math.floor(((pos as THREE.BufferAttribute & { getComponent(i: number, c: number): number }).getComponent(i, axis === 'x' ? 0 : 2) - lo) / len * bins));
    top[t] = Math.max(top[t], pos.getY(i));
  }
  const frontIsHi = Math.max(...top.slice(bins - 5)) > Math.max(...top.slice(0, 5));
  const h = size.y;
  const midOther = (bb.min[other] + bb.max[other]) / 2;
  // Back line target: a straight line from the withers (t≈0.72) to the croup (t≈0.18).
  const tOf = (i: number) => { const v = axis === 'x' ? pos.getX(i) : pos.getZ(i); const t = (v - lo) / len; return frontIsHi ? t : 1 - t; };
  const topAt = (t: number) => { const b = Math.min(bins - 1, Math.max(0, Math.floor((frontIsHi ? t : 1 - t) * bins))); return top[b]; };
  const withers = topAt(0.72), croup = topAt(0.2);
  for (let i = 0; i < pos.count; i++) {
    const t = tOf(i);
    let y = pos.getY(i);
    let o = axis === 'x' ? pos.getZ(i) : pos.getX(i);
    let a = axis === 'x' ? pos.getX(i) : pos.getZ(i);
    // 1. Straighten the back: lift the saddle up to the withers–croup line.
    if (t > 0.18 && t < 0.78 && y > bb.min.y + h * 0.55) {
      const line = croup + (withers - croup) * THREE.MathUtils.clamp((t - 0.2) / 0.52, 0, 1);
      const localTop = topAt(t);
      const nearTop = THREE.MathUtils.smoothstep(y, localTop - h * 0.22, localTop);
      const lift = Math.max(0, line - localTop) * nearTop;
      y += lift;
    }
    // 2. Smaller hindquarters: pull the rear body toward its own centre, legs untouched.
    if (t < 0.4 && y > bb.min.y + h * 0.42) {
      const w = THREE.MathUtils.smoothstep(0.4 - t, 0, 0.3);
      const cy = bb.min.y + h * 0.68;
      const k = 1 - 0.14 * w;
      y = cy + (y - cy) * k;
      o = midOther + (o - midOther) * k;
      // and tuck the very end of the rump forward a touch
      const tuck = (0.1 - Math.min(t, 0.1)) / 0.1 * len * 0.03;
      a += frontIsHi ? tuck : -tuck;
    }
    pos.setY(i, y);
    if (axis === 'x') { pos.setZ(i, o); pos.setX(i, a); } else { pos.setX(i, o); pos.setZ(i, a); }
  }
  pos.needsUpdate = true;
}

function smooth(geo: THREE.BufferGeometry, skinned: boolean, subdivide: boolean, deer = false): THREE.BufferGeometry {
  let g = geo;
  const tris = (g.index ? g.index.count : g.attributes.position.count) / 3;
  g.deleteAttribute('normal');
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (g.attributes.color) g.deleteAttribute('color');
  if (subdivide && !skinned && tris < 1200) {
    // Static body: the library's Loop subdivision, then weld.
    g = LoopSubdivision.modify(g, 2, { split: false, uvSmooth: false, preserveEdges: false, flatOnly: false });
    g = mergeVertices(g, 2e-4);
    relax(g, 10);
    inflate(g, 0.015);
  } else if (subdivide && skinned) {
    // Animated body: weld, subdivide with skin weights, weld again, then relax hard.
    g = mergeVertices(g, 1e-4);
    if (deer) fawnShape(g);
    // Two rounds, like the rabbit's Loop subdivision, so the relax has enough vertices
    // to round into a soft surface instead of a faceted one.
    if (tris < 2500) { g = subdivideSkinned(g); g = mergeVertices(g, 1e-5); g = subdivideSkinned(g); }
    g = mergeVertices(g, 1e-5);
    relax(g, 36, 0.55, -0.58);
    inflate(g, 0.02);
  } else {
    g = mergeVertices(g, 1e-4); // antlers: smooth normals only
  }
  clusterNormals(g);
  return g;
}

/**
 * A spirit animal: a borrowed base shape (CC0 / CC-BY, see public/models/LICENSES.md),
 * smoothed at load time and dressed in the spirit material — translucent body with a
 * bright fresnel edge, star dust, glowing antlers, an optional constellation on the
 * flank, hovering a hand above the ground with light motes rising around it.
 * params: { model: 'stag'|'doe'|'rabbit', variant: 'day'|'night', scale?: number }
 */
export const spirit: PropModule = {
  build({ planet, rand }, p) {
    const spec = MODELS[param(p, 'model', 'stag')] ?? MODELS.stag;
    const variant = param<string>(p, 'variant', 'day');
    const tint: SpiritTint = variant === 'night' ? SPIRIT_NIGHT : SPIRIT_DAY;
    const scale = param(p, 'scale', 1);
    const g = new THREE.Group();
    g.name = `spirit-${param(p, 'model', 'stag')}`;
    g.userData.inspection = { target: [0, spec.height * 0.55 * scale, 0], camera: [spec.height * 1.6 * scale, spec.height * 0.9 * scale, spec.height * 2.3 * scale] };
    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0);

    const body = new THREE.Group(); // bobs up and down
    g.add(body);
    let mixer: THREE.AnimationMixer | null = null;
    let swapAt = 0;
    let clips: THREE.AnimationClip[] = [];
    let current: THREE.AnimationAction | null = null;
    let root: THREE.Object3D | null = null;

    loadModel(spec.file).then((pristine) => {
      const clone = pristine.clone(true);
      // SkeletonUtils-free clone: re-bind skinned meshes to the cloned bones.
      const boneMap = new Map<THREE.Bone, THREE.Bone>();
      const srcBones: THREE.Bone[] = [];
      pristine.traverse((o) => { if ((o as THREE.Bone).isBone) srcBones.push(o as THREE.Bone); });
      const dstBones: THREE.Bone[] = [];
      clone.traverse((o) => { if ((o as THREE.Bone).isBone) dstBones.push(o as THREE.Bone); });
      srcBones.forEach((b, i) => boneMap.set(b, dstBones[i]));
      clone.traverse((o) => {
        const sm = o as THREE.SkinnedMesh;
        if (sm.isSkinnedMesh) {
          const bones = sm.skeleton.bones.map((b) => boneMap.get(b) ?? b);
          sm.bind(new THREE.Skeleton(bones, sm.skeleton.boneInverses), sm.bindMatrix);
        }
      });

      // Base files come in wildly different units (0.02 to 135 per model). Bake a
      // uniform scale into the geometry first so every tolerance below (welding,
      // clustering, cutting) means the same thing: the body is 1 unit tall here.
      {
        clone.updateMatrixWorld(true);
        const raw = new THREE.Box3().setFromObject(clone);
        const k0 = 1 / Math.max(1e-6, raw.getSize(new THREE.Vector3()).y);
        clone.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh && !(m as THREE.SkinnedMesh).isSkinnedMesh) {
            m.geometry = (m.geometry as THREE.BufferGeometry).clone();
            m.updateWorldMatrix(true, false);
            const sc = new THREE.Vector3(); m.getWorldScale(sc);
            m.geometry.scale(sc.x * k0, sc.y * k0, sc.z * k0);
            m.scale.set(1, 1, 1);
            // Parent scales were baked in; neutralise them up the chain.
            let par = m.parent; while (par && par !== clone) { par.scale.set(1, 1, 1); par = par.parent; }
          }
        });
        clone.scale.set(1, 1, 1);
      }
      // Static deer: split off the modelled antlers. Kept ones become their own mesh
      // (glowing material, smooth normals only); discarded ones leave a capped skull.
      let mountLocal: THREE.Vector3 | null = null;
      let mountMesh: THREE.Mesh | null = null;
      if (spec.antlerCut) {
        let done = false;
        const toAdd: [THREE.Object3D, THREE.Mesh][] = [];
        clone.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh || done) return;
          done = true;
          const g0 = m.geometry as THREE.BufferGeometry;
          g0.computeBoundingBox();
          const bb = g0.boundingBox!;
          const cutY = bb.min.y + (bb.max.y - bb.min.y) * spec.antlerCut!;
          const { geo: g1, above, mounts } = cutAbove(g0, cutY);
          m.geometry = g1;
          if (mounts.length) { mountLocal = mounts.reduce((a, b) => (a.y > b.y ? a : b)).clone(); mountMesh = m; }
          if (spec.keepAntlers && above) {
            const antlers = new THREE.Mesh(above);
            antlers.name = 'antlers';
            antlers.position.copy(m.position); antlers.quaternion.copy(m.quaternion); antlers.scale.copy(m.scale);
            toAdd.push([m.parent!, antlers]);
          }
        });
        for (const [parent, mesh3] of toAdd) parent.add(mesh3);
      }
      clone.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(clone);
      const size = box.getSize(new THREE.Vector3());
      const s = (spec.height * scale) / size.y;
      clone.scale.multiplyScalar(s);
      clone.position.set(-((box.min.x + box.max.x) / 2) * s, -box.min.y * s, -((box.min.z + box.max.z) / 2) * s);
      clone.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const skinned = (m as THREE.SkinnedMesh).isSkinnedMesh === true;
        const horn = /horn|antler/i.test(m.name);
        m.geometry = smooth(m.geometry as THREE.BufferGeometry, skinned, !horn, !!spec.deer && !horn);
        m.castShadow = false;
        m.receiveShadow = false;
        if (horn) {
          m.geometry.computeBoundingBox();
          const bb = m.geometry.boundingBox!;
          m.material = antlerMaterial(0x8fe9f6, 0xffd27a, bb.min.y, bb.max.y);
        } else {
          // Translucent bodies overlap themselves (far side under near side) and the
          // overlap brightens unevenly along the mesh's draw order, which shows as
          // lines. A depth-only prepass fixes which surface wins per pixel, then the
          // colour pass draws only that nearest layer.
          const prepass = (m as THREE.Mesh).clone();
          prepass.material = new THREE.MeshBasicMaterial({ colorWrite: false });
          prepass.renderOrder = 1;
          prepass.castShadow = prepass.receiveShadow = false;
          if ((prepass as THREE.SkinnedMesh).isSkinnedMesh) (prepass as THREE.SkinnedMesh).bind((m as THREE.SkinnedMesh).skeleton, (m as THREE.SkinnedMesh).bindMatrix);
          m.parent!.add(prepass);
          m.material = spiritMaterial(tint, skinned, s);
          (m.material as THREE.ShaderMaterial).depthWrite = false;
          (m.material as THREE.ShaderMaterial).depthFunc = THREE.LessEqualDepth;
          m.renderOrder = 2;
        }
      });
      body.add(clone);
      root = clone;

      if (spec.graftAntlers && mountLocal && mountMesh) {
        const mm = mountMesh as THREE.Mesh;
        const ml = mountLocal as THREE.Vector3;
        loadModel(ANTLER_FILE).then((src) => {
          // The antlers keep exactly the orientation they have on the Quaternius stag; the
          // only correction is a yaw so that stag's forward matches this body's forward.
          // The body is several primitives (coat, hooves, eyes…): take the union of all
          // non-antler meshes, not the first one found.
          let horns: THREE.Mesh | null = null;
          const qb = new THREE.Box3();
          src.updateMatrixWorld(true);
          src.traverse((o) => {
            const m = o as THREE.Mesh;
            if (!m.isMesh) return;
            if (/horn|antler/i.test(m.name) || /horn|antler/i.test(m.parent?.name ?? '')) { horns = horns ?? m; return; }
            qb.expandByObject(m);
          });
          if (!horns || qb.isEmpty()) return;
          const hGeo = ((horns as THREE.Mesh).geometry as THREE.BufferGeometry).clone();
          hGeo.applyMatrix4((horns as THREE.Mesh).matrixWorld); // into the Quaternius scene frame
          hGeo.deleteAttribute('normal'); if (hGeo.attributes.uv) hGeo.deleteAttribute('uv');
          const welded = mergeVertices(hGeo, 1e-6);
          welded.computeBoundingBox();
          const hb = welded.boundingBox!;
          const hs = hb.getSize(new THREE.Vector3());
          // Roots: the lowest 12% of antler vertices, split into left/right by the
          // Quaternius stag's own midline; the mount point is the midpoint of the two
          // clusters (the plain vertex average drifts toward whichever antler has more
          // geometry and pulls the whole pair sideways).
          const hp = welded.attributes.position as THREE.BufferAttribute;
          const qc = qb.getCenter(new THREE.Vector3());
          const qBodyH = qb.getSize(new THREE.Vector3()).y;
          const qsz = qb.getSize(new THREE.Vector3());
          const qAxis: 'x' | 'z' = qsz.x > qsz.z ? 'x' : 'z'; // Quaternius forward axis
          const qSide: 'x' | 'z' = qAxis === 'x' ? 'z' : 'x';
          const L = new THREE.Vector3(), R = new THREE.Vector3(); let nl = 0, nrr = 0;
          for (let i = 0; i < hp.count; i++) {
            if (hp.getY(i) >= hb.min.y + hs.y * 0.12) continue;
            const v = new THREE.Vector3(hp.getX(i), hp.getY(i), hp.getZ(i));
            if (v[qSide] < qc[qSide]) { L.add(v); nl++; } else { R.add(v); nrr++; }
          }
          L.divideScalar(Math.max(1, nl)); R.divideScalar(Math.max(1, nrr));
          const rootC = L.clone().add(R).multiplyScalar(0.5);
          rootC[qSide] = qc[qSide]; // exactly on the source stag's midline
          // Quaternius forward = from its body centre toward the antler roots (horizontal).
          const qFwd = new THREE.Vector3(rootC.x - qc.x, 0, rootC.z - qc.z).normalize();
          // Re-origin on the roots so the placement and yaw pivot there.
          welded.translate(-rootC.x, -rootC.y, -rootC.z);
          welded.computeVertexNormals();
          welded.computeBoundingBox();
          const hb2 = welded.boundingBox!;
          // Same proportion to the body as on the source stag: scale Quaternius units to this body's height.
          const k = ((spec.height * scale) / qBodyH) * spec.graftAntlers!;
          // Pedicle: the lowest stretch of the antlers is part of the head, so it takes
          // the body's spirit material; the glow begins above it.
          const pedH = hb2.min.y + (hb2.max.y - hb2.min.y) * 0.09;
          const wIdx = welded.index!;
          const lo: number[] = [], hi: number[] = [];
          for (let i = 0; i < wIdx.count; i += 3) {
            const a = wIdx.getX(i), b = wIdx.getX(i + 1), c = wIdx.getX(i + 2);
            const cy = (hp.getY(a) + hp.getY(b) + hp.getY(c)) / 3;
            (cy < pedH ? lo : hi).push(a, b, c);
          }
          welded.setIndex([...lo, ...hi]);
          welded.clearGroups();
          welded.addGroup(0, lo.length, 0);
          welded.addGroup(lo.length, hi.length, 1);
          const pedMat = spiritMaterial(tint, false, k);
          pedMat.depthWrite = true;
          const mesh2 = new THREE.Mesh(welded, [pedMat, antlerMaterial(0x8fe9f6, 0xffd27a, pedH, hb2.max.y)]);
          mesh2.name = 'antlers';
          mesh2.castShadow = false;
          mesh2.scale.setScalar(k);
          // This body's forward: the head end is the higher end of its long axis.
          const bodyPos = (mm.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute;
          const bb2 = new THREE.Box3().setFromBufferAttribute(bodyPos);
          const bsz = bb2.getSize(new THREE.Vector3());
          const axis: 'x' | 'z' = bsz.x > bsz.z ? 'x' : 'z';
          let topLo = -Infinity, topHi = -Infinity;
          for (let i = 0; i < bodyPos.count; i++) {
            const a = axis === 'x' ? bodyPos.getX(i) : bodyPos.getZ(i);
            const t = (a - bb2.min[axis]) / Math.max(1e-6, bsz[axis]);
            if (t < 0.25) topLo = Math.max(topLo, bodyPos.getY(i));
            if (t > 0.75) topHi = Math.max(topHi, bodyPos.getY(i));
          }
          const dFwd = new THREE.Vector3(); dFwd[axis] = topHi > topLo ? 1 : -1;
          mesh2.rotation.y = Math.atan2(dFwd.x, dFwd.z) - Math.atan2(qFwd.x, qFwd.z);
          const side: 'x' | 'z' = axis === 'x' ? 'z' : 'x';
          const mlc = ml.clone(); mlc[side] = (bb2.min[side] + bb2.max[side]) / 2; // body midline
          const mountWorld = mm.localToWorld(mlc);
          body.worldToLocal(mountWorld);
          mesh2.position.copy(mountWorld).add(new THREE.Vector3(0, -0.05 * scale, 0));
          body.add(mesh2);
        });
      }

      // Constellation on the flank (night only): a handful of body vertices joined up.
      if (tint === SPIRIT_NIGHT) {
        let flank: THREE.Mesh | null = null;
        clone.traverse((o) => { if ((o as THREE.Mesh).isMesh && !/horn|antler/i.test(o.name) && !flank) flank = o as THREE.Mesh; });
        if (flank) {
          const pos = (flank as THREE.Mesh).geometry.attributes.position;
          for (const side of [1, -1]) {
            const picks: THREE.Vector3[] = [];
            const v = new THREE.Vector3();
            let guard = 0;
            while (picks.length < 7 && guard++ < 600) {
              v.fromBufferAttribute(pos, Math.floor(rand() * pos.count));
              if (v.x * side > 0.02 / s && picks.every((q) => q.distanceTo(v) > 0.1 / s)) picks.push(v.clone().addScaledVector(v.clone().normalize(), 0.006 / s));
            }
            if (picks.length > 2) (flank as THREE.Mesh).add(constellation(picks, tint.star));
          }
        }
      }

      const anims = (pristine as THREE.Group & { animations?: THREE.AnimationClip[] }).animations ?? [];
      clips = spec.idle.map((n) => anims.find((a) => a.name === n)).filter((a): a is THREE.AnimationClip => !!a);
      if (clips.length) {
        mixer = new THREE.AnimationMixer(clone);
        current = mixer.clipAction(clips[0]);
        current.timeScale = 0.75;
        current.play();
        swapAt = 6 + rand() * 6;
      }
    }).catch((e) => console.warn('[spirit] failed to load', spec.file, e));

    // Light motes drifting up around the body.
    const moteGeo = blob(0.011 * spec.height * scale + 0.004, 1);
    const motes = Array.from({ length: 14 }, () => {
      const m = mesh(moteGeo, tint.star, { emissive: 1, glow: true, flat: true });
      m.castShadow = false;
      m.userData = { r: (0.3 + rand() * 0.5) * spec.height * scale, a: rand() * 6.28, h: rand(), sp: 0.5 + rand() * 0.6 };
      g.add(m);
      return m;
    });
    const hover = 0.08 * scale;
    return {
      object: g,
      obstacles: [{ dir: d, radius: spec.radius * scale }],
      update(t, dt) {
        body.position.y = hover + Math.sin(t * 0.9 + p.at[0]) * 0.03 * scale;
        if (mixer) {
          mixer.update(dt);
          if (root && clips.length > 1 && t > swapAt) {
            // Drift between idle clips so the animal never loops visibly.
            const next = mixer.clipAction(clips[Math.floor(rand() * clips.length)]);
            if (next !== current) {
              next.reset().setEffectiveTimeScale(0.75).fadeIn(0.8).play();
              current?.fadeOut(0.8);
              current = next;
            }
            swapAt = t + 5 + rand() * 6;
          }
        }
        const H = spec.height * scale;
        for (const m of motes) {
          const u = m.userData as { r: number; a: number; h: number; sp: number };
          u.h = (u.h + dt * 0.12 * u.sp) % 1;
          const ang = u.a + t * 0.25 * u.sp;
          m.position.set(Math.cos(ang) * u.r, u.h * (H + 0.4), Math.sin(ang) * u.r * 0.7);
          m.scale.setScalar(Math.sin(u.h * Math.PI) * (0.6 + 0.4 * Math.sin(t * 3 + u.a)));
        }
      },
    };
  },
};
