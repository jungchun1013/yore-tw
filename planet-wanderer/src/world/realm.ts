import * as THREE from 'three';
import { isSharedMaterial } from '../render/materials';
import { PROPS } from '../props';
import { groundCover } from '../props/groundCover';
import { blob, makeRand, mesh, type Obstacle, type PropCtx } from '../props/kit';
import { SCENES, DECOR_BODIES } from '../scenes';
import type { ExitDef, SceneDef, SkyBody } from '../scenes/types';
import { Planet, dirAt } from './planet';

export interface Interactable {
  object: THREE.Object3D;
  dir: THREE.Vector3;
  exit: ExitDef;
}

/** A loaded scene: everything in it hangs off `root`, so unloading is one dispose(). */
export interface Realm {
  def: SceneDef;
  planet: Planet;
  ground: THREE.Mesh;
  root: THREE.Group;
  obstacles: Obstacle[];
  interactables: Interactable[];
  glowAnchors: THREE.Object3D[];
  update(t: number, dt: number): void;
  dispose(): void;
}

function skyBody(b: SkyBody) {
  const g = new THREE.Group();
  g.add(mesh(blob(b.radius, 3), b.color));
  if (b.ring) {
    const r = mesh(new THREE.TorusGeometry(b.radius * 1.7, b.radius * 0.08, 4, 40), b.ring);
    r.rotation.x = Math.PI / 2.4;
    g.add(r);
  }
  g.position.set(...b.pos);
  g.traverse((o) => (o.castShadow = false));
  return g;
}

export function buildRealm(def: SceneDef): Realm {
  const planet = new Planet(def.planet.radius, def.planet.seed, def.planet.paths);
  // 1. Props shape the ground first (flats, pond hollows), then the ground is built.
  for (const p of def.props) PROPS[p.type]?.prepare?.(planet, p);
  const root = new THREE.Group();
  root.name = `realm:${def.id}`;
  const ground = planet.buildMesh(def.mood);
  root.add(ground);

  // 2. Props, in the order the scene lists them (that order fixes the random sequence).
  const ctx: PropCtx = { planet, rand: makeRand(def.planet.seed * 101 + 7), root };
  const obstacles: Obstacle[] = [];
  const updates: ((t: number, dt: number) => void)[] = [];
  const byId = new Map<string, THREE.Object3D>();
  const glowAnchors: THREE.Object3D[] = [];
  for (const p of def.props) {
    const mod = PROPS[p.type];
    if (!mod) {
      console.warn(`[realm] unknown prop type "${p.type}" in scene ${def.id}`);
      continue;
    }
    const built = mod.build(ctx, p);
    root.add(built.object);
    for (const o of built.obstacles ?? []) obstacles.push({ dir: o.dir, radius: planet.ang(o.radius) });
    if (built.update) updates.push(built.update);
    if (built.glowAnchor) glowAnchors.push(built.glowAnchor);
    if (p.id) byId.set(p.id, built.object);
  }
  groundCover(ctx, obstacles, def.groundCover.tufts, def.groundCover.flowers);

  // 3. The other scenes hang in the sky: you can always see where you could go next.
  for (const other of Object.values(SCENES)) if (other.id !== def.id) root.add(skyBody(other.skyBody));
  for (const b of DECOR_BODIES) root.add(skyBody(b));

  const interactables: Interactable[] = def.exits.flatMap((exit) => {
    const object = byId.get(exit.prop);
    const placement = def.props.find((p) => p.id === exit.prop);
    return object && placement ? [{ object, dir: dirAt(placement.at), exit }] : [];
  });

  return {
    def,
    planet,
    ground,
    root,
    obstacles,
    interactables,
    glowAnchors,
    update(t, dt) {
      for (const u of updates) u(t, dt);
    },
    dispose() {
      root.removeFromParent();
      root.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        for (const mat of mats) if (!isSharedMaterial(mat)) mat.dispose();
        if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose();
      });
    },
  };
}
