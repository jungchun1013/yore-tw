import * as THREE from 'three';
import { PAL } from './palette';
import { NOISE } from './glsl';
import type { Mood } from '../scenes/types';

/** Uniforms every scene material reads; main.ts writes them once per frame. */
export const shared = {
  uLightDir: { value: new THREE.Vector3(0, 1, 0) },
  uTime: { value: 0 },
  uDither: { value: 1 },
  uShadowTint: { value: new THREE.Color(PAL.shadowTint) },
  uSunTint: { value: new THREE.Color(PAL.sun) },
  uRimTint: { value: new THREE.Color(PAL.rim) },
};

const VERT = /* glsl */ `
#include <common>
#include <color_pars_vertex>
#include <shadowmap_pars_vertex>
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vLocal;
void main() {
  #include <color_vertex>
  #include <beginnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <project_vertex>
  #include <worldpos_vertex>
  #include <shadowmap_vertex>
  vNormalW = normalize(inverseTransformDirection(transformedNormal, viewMatrix));
  vec4 wp = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    wp = instanceMatrix * wp;
  #endif
  vPosW = (modelMatrix * wp).xyz;
  vLocal = position;
}
`;

/** Toon lighting in four bands (shadow / mid / lit / highlight) with hue-shifted
 *  shadows and an ordered-dither seam between bands. gl_FragCoord is the pixel of
 *  the low-resolution target, so the dither grid is the art's pixel grid. */
const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uLightDir;
uniform vec3 uShadowTint;
uniform vec3 uSunTint;
uniform vec3 uRimTint;
uniform float uEmissive;
uniform float uRim;
uniform float uDither;
uniform float uTime;
uniform float uMark;
#ifdef TERRAIN
uniform vec3 uGrassDark; uniform vec3 uGrassLight; uniform vec3 uSand; uniform vec3 uPath;
uniform vec3 uPondDir[MAX_PONDS]; uniform float uPondR[MAX_PONDS]; uniform int uPondCount;
uniform vec3 uPathA[MAX_PATHS]; uniform vec3 uPathB[MAX_PATHS]; uniform int uPathCount;
#endif
#include <common>
#include <packing>
#include <color_pars_fragment>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
varying vec3 vNormalW;
varying vec3 vPosW;
varying vec3 vLocal;
${NOISE}
#ifdef TERRAIN
float arcDist(vec3 p, vec3 a, vec3 b) {
  vec3 n = normalize(cross(a, b));
  float off = abs(asin(clamp(dot(p, n), -1.0, 1.0)));
  vec3 q = normalize(p - n * dot(p, n));
  float span = acos(clamp(dot(a, b), -1.0, 1.0));
  float ta = acos(clamp(dot(q, a), -1.0, 1.0));
  float tb = acos(clamp(dot(q, b), -1.0, 1.0));
  if (ta + tb > span + 0.002) return min(acos(clamp(dot(p, a), -1.0, 1.0)), acos(clamp(dot(p, b), -1.0, 1.0)));
  return off;
}
#endif
void main() {
  vec3 base = uColor;
  #if defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
    base *= vColor;
  #endif
  #ifdef TERRAIN
    vec3 dir = normalize(vPosW);
    // Patchy meadow in three discrete tones, anchored to the world so it never swims.
    float n = fbm3(dir * 4.2);
    base = n < 0.4 ? uGrassDark : (n > 0.62 ? uGrassLight : base);
    // A scatter of single lighter blades: one cell per art pixel at close range.
    vec3 cell = floor(vPosW * 9.0);
    float h = hash13(cell);
    if (h > 0.93) base = mix(base, uGrassLight, 0.6);
    else if (h < 0.05) base = mix(base, uGrassDark, 0.7);
    float pd = 1e3;
    for (int i = 0; i < MAX_PONDS; i++) {
      if (i >= uPondCount) break;
      pd = min(pd, acos(clamp(dot(dir, uPondDir[i]), -1.0, 1.0)) / uPondR[i]);
    }
    for (int i = 0; i < MAX_PATHS; i++) {
      if (i >= uPathCount) break;
      float d = arcDist(dir, uPathA[i], uPathB[i]);
      float wob = (fbm3(dir * 18.0) - 0.5) * 0.012;
      if (d + wob < 0.022) base = mix(uPath, uSand, step(0.6, hash13(cell * 1.7)) * 0.5);
    }
    if (pd < 1.32) base = mix(uSand, uPath, step(0.75, hash13(cell)));
  #endif

  vec3 N = normalize(vNormalW);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vPosW);
  float ndl = dot(N, uLightDir);
  float sh = getShadowMask();
  float l = clamp(ndl * 1.25 + 0.1, 0.0, 1.0) * mix(0.18, 1.0, sh);
  float th = bayer4(gl_FragCoord.xy) - 0.5;
  l += th * 0.09 * uDither;

  vec3 shadowCol = mix(base * 0.66, base * uShadowTint * 1.25, 0.45);
  vec3 midCol = mix(shadowCol, base, 0.58);
  vec3 hiCol = mix(base, uSunTint, 0.38);
  vec3 col = l < 0.2 ? shadowCol : (l < 0.5 ? midCol : (l < 0.94 ? base : hiCol));

  // Sky bounce on the rims: the atmosphere reads cyan where surfaces turn away.
  float fr = 1.0 - max(dot(N, V), 0.0);
  float rim = step(0.78 - th * 0.08 * uDither, fr) * uRim;
  col = mix(col, uRimTint, rim * 0.42);

  col = mix(col, base, uEmissive);
  // Alpha carries a mark for the composite pass: 1 = outline me, 0.75 = glow, no outline.
  gl_FragColor = vec4(col, uMark);
}
`;

const cache = new Map<string, THREE.ShaderMaterial>();
/** Cached toon materials are shared by every scene and must never be disposed. */
export const isSharedMaterial = (m: THREE.Material) => [...cache.values()].includes(m as THREE.ShaderMaterial) || m === normalPassMaterial;

/** Write a scene's colour mood into the uniforms every material shares. */
export function applyMaterialMood(mood: Mood) {
  shared.uShadowTint.value.setHex(mood.shadowTint);
  shared.uSunTint.value.setHex(mood.sun);
  shared.uRimTint.value.setHex(mood.rim);
}

export interface ToonOpts {
  emissive?: number;
  rim?: number;
  side?: THREE.Side;
  vertexColors?: boolean;
  glow?: boolean;
  /** Skip the composite outline (thin things that would turn into dark specks). */
  noOutline?: boolean;
}

export function toon(color: number, opts: ToonOpts = {}): THREE.ShaderMaterial {
  const key = `${color}|${opts.emissive ?? 0}|${opts.rim ?? 1}|${opts.side ?? 0}|${opts.vertexColors ? 1 : 0}|${opts.glow ? 1 : 0}|${opts.noOutline ? 1 : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    lights: true,
    side: opts.side ?? THREE.FrontSide,
    vertexColors: !!opts.vertexColors,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.lights,
      {
        uColor: { value: new THREE.Color(color) },
        uEmissive: { value: opts.emissive ?? 0 },
        uRim: { value: opts.rim ?? 1 },
        uMark: { value: opts.glow ? 0.75 : opts.noOutline ? 0.8 : 1 },
      },
    ]),
  });
  Object.assign(m.uniforms, shared);
  cache.set(key, m);
  return m;
}

export const MAX_PONDS = 4;
export const MAX_PATHS = 8;

export interface TerrainZones {
  ponds: { dir: THREE.Vector3; radius: number }[];
  paths: [THREE.Vector3, THREE.Vector3][];
  mood: Mood;
}

/** Per-planet ground material (not cached: each planet owns and disposes its own). */
export function terrainMaterial(z: TerrainZones): THREE.ShaderMaterial {
  const pad = <T>(arr: T[], n: number, fill: T) => [...arr.slice(0, n), ...Array(Math.max(0, n - arr.length)).fill(fill)];
  const up = new THREE.Vector3(0, 1, 0);
  const m = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    lights: true,
    defines: { TERRAIN: 1, MAX_PONDS, MAX_PATHS },
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.lights,
      {
        uColor: { value: new THREE.Color(z.mood.grass) },
        uEmissive: { value: 0 },
        uRim: { value: 1 },
        uMark: { value: 1 },
        uGrassDark: { value: new THREE.Color(z.mood.grassDark) },
        uGrassLight: { value: new THREE.Color(z.mood.grassLight) },
        uSand: { value: new THREE.Color(z.mood.sand) },
        uPath: { value: new THREE.Color(z.mood.path) },
        uPondDir: { value: pad(z.ponds.map((p) => p.dir.clone()), MAX_PONDS, up) },
        uPondR: { value: pad(z.ponds.map((p) => p.radius), MAX_PONDS, 1) },
        uPondCount: { value: Math.min(z.ponds.length, MAX_PONDS) },
        uPathA: { value: pad(z.paths.map((p) => p[0].clone()), MAX_PATHS, up) },
        uPathB: { value: pad(z.paths.map((p) => p[1].clone()), MAX_PATHS, up) },
        uPathCount: { value: Math.min(z.paths.length, MAX_PATHS) },
      },
    ]),
  });
  Object.assign(m.uniforms, shared);
  return m;
}

/** Pond surface: three wave tones that drift, a shore ring and world-anchored glints. */
export function waterMaterial(radius: number): THREE.ShaderMaterial {
  const m = new THREE.ShaderMaterial({
    uniforms: {
      uRadius: { value: radius },
      uDeep: { value: new THREE.Color(PAL.waterDeep) },
      uMid: { value: new THREE.Color(PAL.water) },
      uLight: { value: new THREE.Color(PAL.waterLight) },
      uTime: shared.uTime,
      uDither: shared.uDither,
    },
    vertexShader: /* glsl */ `
      varying vec3 vLocal; varying vec3 vPosW;
      void main() { vLocal = position; vec4 w = modelMatrix * vec4(position, 1.0); vPosW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      uniform float uRadius; uniform vec3 uDeep; uniform vec3 uMid; uniform vec3 uLight; uniform float uTime; uniform float uDither;
      varying vec3 vLocal; varying vec3 vPosW;
      ${NOISE}
      void main() {
        float r = length(vLocal.xy) / uRadius;
        vec3 p = vPosW * 1.8;
        float w = vnoise3(p + vec3(uTime * 0.25, 0.0, uTime * 0.18)) * 0.65 + vnoise3(p * 2.3 - vec3(0.0, uTime * 0.3, 0.0)) * 0.35;
        w += (1.0 - r) * 0.25 + (bayer4(gl_FragCoord.xy) - 0.5) * 0.12 * uDither;
        vec3 col = w < 0.52 ? uMid : uDeep;
        if (w < 0.36) col = mix(uMid, uLight, 0.45);
        if (r > 0.86) col = uLight;
        vec3 cell = floor(vPosW * 12.0);
        float g = fract(hash13(cell) + uTime * 0.18);
        if (g > 0.992 && r < 0.8) col = vec3(1.0, 0.99, 0.94);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  return m;
}

/** Override material for the normal pre-pass: view-space normals packed in RGB. */
export const normalPassMaterial = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  vertexShader: /* glsl */ `
    #include <common>
    varying vec3 vN;
    void main() {
      #include <beginnormal_vertex>
      #include <defaultnormal_vertex>
      #include <begin_vertex>
      #include <project_vertex>
      vN = normalize(transformedNormal);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vN;
    void main() { vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; gl_FragColor = vec4(n * 0.5 + 0.5, 1.0); }
  `,
});
