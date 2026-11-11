import * as THREE from 'three';
import { PAL } from './palette';
import { NOISE } from './glsl';
import type { Mood } from '../scenes/types';

/** Uniforms every scene material reads; main.ts writes them once per frame. */
export const shared = {
  uLightDir: { value: new THREE.Vector3(0, 1, 0) },
  uTime: { value: 0 },
  uDither: { value: 1 },
  /** 0 = hybrid optical mixing (default), 1 = soft cel, 2 = broad Sky ramp. */
  uStyle: { value: 0 },
  uPixelSize: { value: 3 },
  /** 0 original, 1 timber/tiles only, 2 includes experimental ruin stone. */
  uSurfaceDetails: { value: 2 },
  /** Shadows of passing clouds on everything (0 = off). */
  uCloudShadow: { value: 1 },
  /** Terrain only: 0 smooth, 1 cloud-shadow edges dithered, 2 patch edges dithered too, 3 = 2 plus a few regions carry the water's stippled two-tone body. */
  uGrassDither: { value: 2 },
  uShadowTint: { value: new THREE.Color(PAL.shadowTint) },
  uSunTint: { value: new THREE.Color(PAL.sun) },
  uRimTint: { value: new THREE.Color(PAL.rim) },
};

const VERT = /* glsl */ `
#include <common>
#include <color_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
varying vec3 vNormalW;
varying vec3 vPosW;
#ifdef TIMBER_DETAIL
attribute vec3 grainPosition;
varying vec3 vGrain;
#endif
varying vec3 vLocal;
void main() {
  #include <color_vertex>
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
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
  #ifdef TIMBER_DETAIL
    vGrain = grainPosition;
  #endif
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
uniform float uStyle;
uniform float uPixelSize;
uniform float uGrad;
uniform float uCloudShadow;
uniform float uGrassDither;
uniform float uPearl;
uniform float uFoliage;
uniform float uSurfaceDetails;
#ifdef TIMBER_DETAIL
varying vec3 vGrain;
#endif
#ifdef TERRAIN
uniform vec3 uGrassDark; uniform vec3 uGrassLight; uniform vec3 uSand; uniform vec3 uPath;
uniform vec3 uPondDir[MAX_PONDS]; uniform float uPondR[MAX_PONDS]; uniform int uPondCount;
uniform vec3 uPathA[MAX_PATHS]; uniform vec3 uPathB[MAX_PATHS]; uniform float uPathW[MAX_PATHS]; uniform int uPathCount;
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
// HSV-equivalent: keep hue, increase saturation, lower value. No grey wash.
vec3 pigmentShade(vec3 c, float value, float saturation) {
  float peak = max(c.r, max(c.g, c.b));
  return max(vec3(0.0), vec3(peak) - (vec3(peak) - c) * saturation) * value;
}
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
    // Few, broad patches (low frequency), no fine mottling: calm meadow, not camouflage.
    float n = fbm3(dir * 1.7);
    // Coarse cells: two-tone mottling on paths and sand comes in patches, not specks.
    vec3 cell = floor(vPosW * 3.0);
    // Broad watercolour patches that blend into each other. In grass-dither mode 2
    // the blend across each patch edge is an ordered dither instead of a gradient:
    // the two greens interlock cell by cell, like the water's tone boundaries.
    float gBay = bayer4(floor(gl_FragCoord.xy / max(uPixelSize, 1.0)));
    // Mode 2: a narrow blend band, so each patch is one clean colour and only a thin
    // strip at its edge interlocks (the same recipe as the water's tone boundaries).
    float band = uGrassDither > 1.5 ? 0.035 : 0.07;
    float tMid = smoothstep(0.43 - band, 0.43 + band, n);
    float tLight = smoothstep(0.63 - band, 0.63 + band, n);
    if (uGrassDither > 1.5) { tMid = step(gBay, tMid); tLight = step(gBay, tLight); }
    base = mix(uGrassDark, base, tMid);
    base = mix(base, uGrassLight, tLight);
    if (uGrassDither > 2.5) {
      // Mode 3: some regions (a slow world-anchored mask) take a stippled texture:
      // a second noise crosses a threshold and the Bayer grid decides cell by cell
      // which of two close tones shows, exactly like the pond water. Elsewhere flat.
      float region = smoothstep(0.5, 0.58, fbm3(dir * 1.1 + 31.0));
      float w2 = fbm3(vPosW * 1.6 + 7.0);
      float stipple = step(gBay, smoothstep(0.42, 0.58, w2));
      vec3 alt = base * vec3(0.9, 0.94, 0.88);
      base = mix(base, mix(base, alt, stipple), region);
    }
    float pd = 1e3;
    for (int i = 0; i < MAX_PONDS; i++) {
      if (i >= uPondCount) break;
      pd = min(pd, acos(clamp(dot(dir, uPondDir[i]), -1.0, 1.0)) / uPondR[i]);
    }
    for (int i = 0; i < MAX_PATHS; i++) {
      if (i >= uPathCount) break;
      float d = arcDist(dir, uPathA[i], uPathB[i]);
      float wob = (fbm3(dir * 18.0) - 0.5) * 0.008;
      float w = uPathW[i];
      float tPath = 1.0 - smoothstep(w * 0.9, w * 1.08, d + wob);
      if (uGrassDither > 1.5) tPath = step(gBay, tPath);
      base = mix(base, mix(uPath, uSand, fbm3(vPosW * 3.0) * 0.6), tPath);
    }
    // Pond bank: grass gives way to sand over a wider band, dithered in mode 2.
    float tSand = 1.0 - smoothstep(1.28, 1.42, pd);
    if (uGrassDither > 1.5) tSand = step(gBay, tSand);
    base = mix(base, mix(uSand, uPath, fbm3(vPosW * 4.0) * 0.5), tSand);
  #endif

  // Sparse, object-anchored pigment marks. Fade before their cells become
  // subpixel; no displacement, silhouette changes or screen-space noise.
  #ifdef SURFACE_DETAIL
  if (uSurfaceDetails > 0.5) {
    vec3 p = vLocal;
    float scale = 72.0;
    #ifdef TIMBER_DETAIL
      p = vGrain;
    #endif
    float footprint = max(length(dFdx(p)), length(dFdy(p))) * scale;
    float visible = 1.0 - smoothstep(0.65, 1.65, footprint);
    vec3 q = (floor(p * scale) + 0.5) / scale;
    float dark = 0.0;
    float light = 0.0;
    #ifdef TIMBER_DETAIL
      // Long, interrupted fibres with a gentle bend.
      float crossGrain = q.x + q.z;
      float bend = sin(q.y * 8.0 + crossGrain * 13.0) * 0.009;
      float bands = fract((crossGrain + bend) * 44.0);
      float breaks = vnoise3(vec3(crossGrain * 65.0, q.y * 9.0, 4.0));
      dark = (1.0 - smoothstep(0.13, 0.23, bands)) * smoothstep(0.32, 0.58, breaks);
      light = step(0.80, bands) * smoothstep(0.55, 0.72, breaks);
      float keepGrain = step(0.5, hash13(floor(q * vec3(12.0, 7.0, 12.0))));
      dark *= keepGrain; light *= keepGrain;
      base = mix(base, pigmentShade(base, 0.82, 1.25), visible * dark);
      base *= 1.0 + visible * light * 0.055;
    #elif defined(TILE_DETAIL)
      // Small fired-clay pigment islands, avoiding a uniform speckle coating.
      float clay = vnoise3(q * vec3(25.0, 8.0, 33.0));
      dark = smoothstep(0.66, 0.82, clay);
      light = 1.0 - smoothstep(0.20, 0.33, clay);
      float keepClay = step(0.5, hash13(floor(q * 14.0)));
      dark *= keepClay; light *= keepClay;
      base = mix(base, pigmentShade(base, 0.85, 1.22), visible * dark);
      base *= 1.0 + visible * light * 0.07;
    #elif defined(STONE_DETAIL)
      if (uSurfaceDetails > 1.5) {
        // Faint mineral seams with plenty of untouched polished stone.
        float mineral = vnoise3(q * 11.0);
        float seam = abs(sin(q.x * 13.0 + q.z * 9.0 + q.y * 5.0 + mineral * 4.0));
        dark = (1.0 - smoothstep(0.04, 0.13, seam)) * smoothstep(0.55, 0.75, mineral);
        light = smoothstep(0.70, 0.87, mineral);
        base = mix(base, pigmentShade(base, 0.86, 1.4), dark * visible * 0.65);
        base += vec3(0.018, 0.015, 0.012) * light * visible;
      }
    #endif
  }
  #endif

  // High-value neutrals carry complementary reflected hues, with nearly equal
  // luminance: pearl white remains white rather than turning into grey noise.
  float neutral = (1.0 - smoothstep(0.12, 0.38, max(base.r, max(base.g, base.b)) - min(base.r, min(base.g, base.b))))
    * smoothstep(0.55, 0.9, dot(base, vec3(0.2126, 0.7152, 0.0722)));
  float pigment = fbm3(vPosW * 1.8);
  vec3 pearl = mix(vec3(0.88, 0.85, 1.0), vec3(0.84, 1.0, 0.95), smoothstep(0.28, 0.7, pigment));
  pearl = mix(pearl, vec3(1.0, 0.9, 0.83), smoothstep(0.58, 0.82, fbm3(vPosW * 1.3 + 19.0)));
  base *= mix(vec3(1.0), pearl, neutral * 0.65 * uPearl);

  // Grass blades: dark at the root, bright at the tip.
  if (uGrad > 0.5) base *= mix(0.68, 1.14, clamp(vLocal.y / 0.22, 0.0, 1.0));

  vec3 N = normalize(vNormalW);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vPosW);
  float ndl = dot(N, uLightDir);
  float bite = vnoise3(vPosW * 3.2) * 0.65 + vnoise3(vPosW * 7.5) * 0.35 - 0.5;
  float sh = getShadowMask();
  // Clouds drifting over the world leave soft travelling shadows.
  float cloudN = fbm3(vPosW * 0.2 + vec3(uTime * 0.035, 0.0, uTime * 0.022));
  float cloud = smoothstep(0.48, 0.65, cloudN);
  #ifdef TERRAIN
    // Dithered cloud edge on the meadow: the shadow's border is a band of
    // interlocking cells that drifts with the cloud. Everything else keeps the soft edge.
    if (uGrassDither > 0.5) cloud = step(bayer4(floor(gl_FragCoord.xy / max(uPixelSize, 1.0))), smoothstep(0.5, 0.62, cloudN));
  #endif

  sh *= 1.0 - cloud * 0.8 * uCloudShadow * (1.0 - uEmissive);
  float l = clamp(ndl * 1.25 + 0.1, 0.0, 1.0) * mix(0.18, 1.0, sh);
  // Bounded optical mixing: stable ordered cells only inside a lighting seam.
  // No noise moves the geometry, cast shadows or broad colour patches.
  vec2 cellPx = floor(gl_FragCoord.xy / max(uPixelSize, 1.0));
  float th = bayer4(cellPx) - 0.5;
  float seamWidth = max(0.035, fwidth(l) * 1.5);
  float seam = 1.0 - smoothstep(seamWidth, seamWidth * 2.0, abs(l - 0.32));

  vec3 shadowCol = pigmentShade(base, 0.69, 1.32);
  vec3 hiCol = mix(base, uSunTint, 0.38);
  float fr = 1.0 - max(dot(N, V), 0.0);
  vec3 col;
  float alpha;
  if (uStyle > 0.5) {
    // Soft cel: two tones joined by a short smooth ramp, cool shadows, warm light.
    float lr = clamp(ndl * 1.25 + 0.1, 0.0, 1.0) * mix(0.12, 1.0, sh);
    bool skyStyle = uStyle > 1.5;
    // Zelda: two tones with a short ramp. Sky: one long smooth ramp, shadows lifted
    // and filled with sky light so the dark side stays luminous.
    float lit = skyStyle ? smoothstep(-0.05, 0.85, lr) : smoothstep(0.14, 0.34, lr);
    vec3 softShadow = pigmentShade(base, skyStyle ? 0.82 : 0.72, skyStyle ? 1.18 : 1.30);
    col = mix(softShadow, base, lit);
    col = mix(col, hiCol, smoothstep(0.88, 1.0, lr) * (skyStyle ? 0.6 : 0.45));
    // Sky fill on surfaces facing up, so shadows stay airy rather than muddy.
    float up = clamp(dot(N, normalize(vPosW)), 0.0, 1.0);
    col += uRimTint * (skyStyle ? 0.16 : 0.06) * up * (1.0 - lit);
    // Backlit rim glow (Sky): a soft bright fringe where surfaces turn away.
    float rim = smoothstep(skyStyle ? 0.45 : 0.55, 0.95, fr) * uRim;
    col = mix(col, mix(uRimTint, uSunTint, skyStyle ? 0.7 : 0.5), rim * (skyStyle ? 0.55 + 0.3 * lit : 0.25 + 0.3 * lit));
    // Emissive goes above 1 so the bloom pass picks it up.
    col = mix(col, base * (1.0 + 0.7 * uEmissive * uEmissive), uEmissive);
    // Alpha = MSAA coverage; a value off the quarter steps marks "no outline".
    alpha = uMark < 0.9 ? 0.99 : 1.0;
  } else {
    vec3 midCol = mix(shadowCol, base, 0.58);
    float ramp = smoothstep(0.25, 0.39, l);
    float dots = smoothstep(0.25, 0.39, l + th * 0.14);
    float amount = (uDither < 0.5 ? 0.0 : uDither > 1.5 ? 0.45 : 0.18) * (1.0 - uFoliage);
    float lit = mix(ramp, dots, seam * amount);
    col = mix(midCol, base, lit);
    col = mix(shadowCol, col, smoothstep(0.04, 0.18, l));
    col = mix(col, hiCol, smoothstep(0.84, 1.0, l) * 0.48);
    float rim = smoothstep(0.65, 0.98, fr) * uRim;
    col = mix(col, mix(base, uRimTint, 0.5), rim * 0.28);
    col = mix(col, base * (1.0 + 0.7 * uEmissive * uEmissive), uEmissive);
    alpha = uMark < 0.9 ? 0.99 : 1.0;
  }
  if (uFoliage > 0.5) {
    // Broad foliage light masses, with a few object-anchored leaf-sized dabs.
    // Geometry keeps the soft polygon outline; no screen-wide checkerboard.
    float patches = fbm3(vLocal * 6.0);
    vec3 cell = floor(vLocal * 48.0);
    float tiny = hash13(cell);
    float boundary = (ndl * 0.6 + 0.4) * mix(0.3, 1.0, sh) + (patches - 0.5) * 0.42;
    float litPatch = smoothstep(0.37, 0.49, boundary + (tiny - 0.5) * 0.04);
    vec3 coolLeaf = mix(base * vec3(0.68,0.83,0.83), base * uShadowTint, 0.16);
    vec3 sunLeaf = mix(base * vec3(1.02,1.08,0.97), uSunTint, 0.08);
    vec3 foliageCol = mix(coolLeaf, sunLeaf, litPatch);
    float detailVis = 1.0 - smoothstep(0.025,0.065,length(fwidth(vLocal)));
    float dab = step(0.79,tiny) * (1.0-smoothstep(0.2,0.48,length(fract(vLocal.xy*48.0)-0.5)));
    foliageCol = mix(foliageCol, foliageCol * vec3(0.85,0.94,0.87), dab * 0.38 * detailVis);
    col = mix(col, foliageCol, 0.8);
  }
  #if NUM_POINT_LIGHTS > 0
    vec3 posView = (viewMatrix * vec4(vPosW, 1.0)).xyz;
    vec3 normalView = normalize((viewMatrix * vec4(N, 0.0)).xyz);
    for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
      vec3 delta = pointLights[i].position - posView;
      float dist = length(delta);
      float range = max(pointLights[i].distance, 0.001);
      float falloff = pow(clamp(1.0 - dist / range, 0.0, 1.0), 2.0);
      float facing = max(dot(normalView, delta / max(dist, 0.001)), 0.0);
      col += base * pointLights[i].color * falloff * facing * 0.55 * (1.0 - uEmissive);
    }
  #endif
  gl_FragColor = vec4(col, alpha);
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
  surfaceDetail?: 'wood' | 'tile' | 'stone';
  /** Soft polygon foliage with local leaf-sized colour dabs. */
  foliage?: boolean;
  emissive?: number;
  rim?: number;
  side?: THREE.Side;
  vertexColors?: boolean;
  glow?: boolean;
  /** Skip the composite outline (thin things that would turn into dark specks). */
  noOutline?: boolean;
  /** Keep the authored colour exactly (no world-space pearl tint): characters, badges. */
  flat?: boolean;
  /** Darken toward the base of the mesh (grass blades). */
  gradient?: boolean;
}

export function toon(color: number, opts: ToonOpts = {}): THREE.ShaderMaterial {
  const key = `${color}|${opts.emissive ?? 0}|${opts.rim ?? 1}|${opts.side ?? 0}|${opts.vertexColors ? 1 : 0}|${opts.glow ? 1 : 0}|${opts.noOutline ? 1 : 0}|${opts.gradient ? 1 : 0}|${opts.flat ? 1 : 0}|${opts.foliage ? 1 : 0}|${opts.surfaceDetail ?? 'none'}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const m = new THREE.ShaderMaterial({
    defines: opts.surfaceDetail ? { SURFACE_DETAIL: 1, [{ wood: 'TIMBER_DETAIL', tile: 'TILE_DETAIL', stone: 'STONE_DETAIL' }[opts.surfaceDetail]]: 1 } : {},
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
        uGrad: { value: opts.gradient ? 1 : 0 },
        uPearl: { value: opts.flat ? 0 : 1 },
        uFoliage: { value: opts.foliage ? 1 : 0 },
      },
    ]),
  });
  Object.assign(m.uniforms, shared);
  cache.set(key, m);
  return m;
}

export const MAX_PONDS = 4;
export const MAX_PATHS = 96;

export interface TerrainZones {
  ponds: { dir: THREE.Vector3; radius: number }[];
  paths: [THREE.Vector3, THREE.Vector3][];
  pathHalf: number[];
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
        uGrad: { value: 0 },
        uPearl: { value: 1 },
        uGrassDark: { value: new THREE.Color(z.mood.grassDark) },
        uGrassLight: { value: new THREE.Color(z.mood.grassLight) },
        uSand: { value: new THREE.Color(z.mood.sand) },
        uPath: { value: new THREE.Color(z.mood.path) },
        uPondDir: { value: pad(z.ponds.map((p) => p.dir.clone()), MAX_PONDS, up) },
        uPondR: { value: pad(z.ponds.map((p) => p.radius), MAX_PONDS, 1) },
        uPondCount: { value: Math.min(z.ponds.length, MAX_PONDS) },
        uPathA: { value: pad(z.paths.map((p) => p[0].clone()), MAX_PATHS, up) },
        uPathB: { value: pad(z.paths.map((p) => p[1].clone()), MAX_PATHS, up) },
        uPathW: { value: pad(z.pathHalf, MAX_PATHS, 0) },
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
    transparent: true,
    depthWrite: false,
    uniforms: {
      uRadius: { value: radius },
      uDeep: { value: new THREE.Color(PAL.waterDeep) },
      uMid: { value: new THREE.Color(PAL.water) },
      uLight: { value: new THREE.Color(PAL.waterLight) },
      uTime: shared.uTime,
      uDither: shared.uDither,
      uStyle: shared.uStyle,
    },
    vertexShader: /* glsl */ `
      varying vec3 vLocal; varying vec3 vPosW;
      void main() { vLocal = position; vec4 w = modelMatrix * vec4(position, 1.0); vPosW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      uniform float uRadius; uniform vec3 uDeep; uniform vec3 uMid; uniform vec3 uLight; uniform float uTime; uniform float uDither; uniform float uStyle;
uniform float uPixelSize;
      varying vec3 vLocal; varying vec3 vPosW;
      ${NOISE}
      void main() {
        float r = length(vLocal.xy) / uRadius;
        vec3 p = vPosW * 1.8;
        float w = vnoise3(p + vec3(uTime * 0.25, 0.0, uTime * 0.18)) * 0.65 + vnoise3(p * 2.3 - vec3(0.0, uTime * 0.3, 0.0)) * 0.35;
        w += (1.0 - r) * 0.25 + (bayer4(gl_FragCoord.xy) - 0.5) * 0.12 * min(uDither, 1.0);
        vec3 col;
        if (uStyle > 0.5) {
          col = mix(mix(uMid, uLight, 0.45), uMid, smoothstep(0.3, 0.42, w));
          col = mix(col, uDeep, smoothstep(0.48, 0.6, w));
        } else {
          col = w < 0.52 ? uMid : uDeep;
          if (w < 0.36) col = mix(uMid, uLight, 0.45);
        }
        // Deeper toward the middle; the bed shows through near the bank.
        col = mix(col, uDeep, 0.25 + (1.0 - r) * 0.45);
        vec3 cell = floor(vPosW * 12.0);
        float g = fract(hash13(cell) + uTime * 0.18);
        if (g > 0.992 && r < 0.8) col = uStyle > 0.5 ? vec3(1.4, 1.38, 1.3) : vec3(1.0, 0.99, 0.94);
        // Translucent: the sandy bed is visible through the shallows, less so mid-pond.
        gl_FragColor = vec4(col, mix(0.3, 0.5, 1.0 - r));
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
    #include <skinning_pars_vertex>
    varying vec3 vN;
    void main() {
      #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
      #include <defaultnormal_vertex>
      #include <begin_vertex>
  #include <skinning_vertex>
      #include <project_vertex>
      vN = normalize(transformedNormal);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vN;
    void main() { vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; gl_FragColor = vec4(n * 0.5 + 0.5, 1.0); }
  `,
});
