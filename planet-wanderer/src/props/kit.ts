import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toon, type ToonOpts } from '../render/materials';
import type { Planet } from '../world/planet';
import type { PropPlacement } from '../scenes/types';

/** Everything a prop builder may use. */
export interface PropCtx {
  planet: Planet;
  rand: () => number;
  /** Scene root: props that are several loose pieces (fence, rocks) add them here. */
  root: THREE.Object3D;
}

export interface Obstacle { dir: THREE.Vector3; radius: number }

export interface BuiltProp {
  object: THREE.Object3D;
  /** Radii in world units; the realm converts them to angles on the planet. */
  obstacles?: { dir: THREE.Vector3; radius: number }[];
  update?: (t: number, dt: number) => void;
  /** Point the screen-space wisp glow follows. */
  glowAnchor?: THREE.Object3D;
}

export interface PropModule {
  /** Shape the terrain before the planet mesh exists (flatten a lot, dig a pond). */
  prepare?: (planet: Planet, p: PropPlacement) => void;
  build: (ctx: PropCtx, p: PropPlacement) => BuiltProp;
}

export function makeRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function mesh(geo: THREE.BufferGeometry, color: number, opts: ToonOpts = {}) {
  const m = new THREE.Mesh(geo, toon(color, opts));
  m.castShadow = !opts.glow;
  m.receiveShadow = true;
  return m;
}
export function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T {
  o.position.set(x, y, z);
  return o;
}
/** A smooth blob: icosphere with merged vertices so toon bands curve cleanly. */
export function blob(r: number, detail = 2) {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(r, detail);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  g.computeVertexNormals();
  return g;
}
export const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
export const cyl = (rt: number, rb: number, h: number, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
export const param = <T>(p: PropPlacement, key: string, fallback: T): T => (p.params?.[key] as T | undefined) ?? fallback;
