import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { LoopSubdivision } from 'three-subdivide';
import { SPIRIT_DAY, SPIRIT_NIGHT, antlerMaterial, constellation, spiritMaterial, type SpiritTint } from '../render/spirit';
import { dirAt } from '../world/planet';
import { blob, mesh, param, type PropModule } from './kit';

/** Base models (public/models/, see LICENSES.md there) and how tall they stand. */
const MODELS: Record<string, { file: string; height: number; idle: string[]; radius: number }> = {
  stag: { file: 'stag.glb', height: 1.75, idle: ['Idle', 'Idle_2', 'Idle_Headlow', 'Eating'], radius: 0.75 },
  doe: { file: 'doe.glb', height: 1.35, idle: ['Idle', 'Idle_2', 'Idle_Headlow', 'Eating'], radius: 0.6 },
  rabbit: { file: 'rabbit.glb', height: 0.34, idle: [], radius: 0.25 },
};

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
function smooth(geo: THREE.BufferGeometry, skinned: boolean, subdivide: boolean): THREE.BufferGeometry {
  let g = geo;
  const tris = (g.index ? g.index.count : g.attributes.position.count) / 3;
  // Subdivide only compact static bodies: the library is slow on big or fragmented
  // meshes (the stag's antlers took 46 s), and thin parts look fine with smooth normals.
  if (subdivide && !skinned && tris < 1200) g = LoopSubdivision.modify(g, 2, { split: false, uvSmooth: false, preserveEdges: false, flatOnly: false });
  g.deleteAttribute('normal');
  if (g.attributes.uv) g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-4);
  g.computeVertexNormals();
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
        m.geometry = smooth(m.geometry as THREE.BufferGeometry, skinned, !horn);
        m.castShadow = false;
        m.receiveShadow = false;
        if (horn) {
          m.geometry.computeBoundingBox();
          const bb = m.geometry.boundingBox!;
          m.material = antlerMaterial(0x8fe9f6, 0xffd27a, bb.min.y, bb.max.y);
        } else {
          m.material = spiritMaterial(tint, skinned, s);
          m.renderOrder = 2;
        }
      });
      body.add(clone);
      root = clone;

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
    const moteGeo = blob(0.02, 1);
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
