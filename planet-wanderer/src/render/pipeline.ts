import * as THREE from 'three';
import { PAL } from './palette';
import { NOISE } from './glsl';
import type { Mood } from '../scenes/types';
import { normalPassMaterial } from './materials';

/**
 * 3D → pixel-art pipeline.
 *  1. The scene renders into a small target (screen / pxSize) with toon materials.
 *  2. A normal pre-pass renders view-space normals at the same size.
 *  3. A full-resolution composite samples both on the low-res grid (nearest) and adds
 *     depth outlines, light-aware inner edges, then lays the soft sky, the planet's
 *     atmosphere halo and the wisp glow behind/over it. The sky stays smooth on
 *     purpose so the world reads as pixel art while the air stays airy.
 */
export class PixelPipeline {
  pxSize = 3;
  outlines = true;
  lowW = 1;
  lowH = 1;
  private colorRT: THREE.WebGLRenderTarget;
  private normalRT: THREE.WebGLRenderTarget;
  private quadScene = new THREE.Scene();
  private quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  readonly composite: THREE.ShaderMaterial;
  private dpr = 1;

  constructor(readonly renderer: THREE.WebGLRenderer) {
    const mk = (depth: boolean) => {
      const rt = new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        depthBuffer: true,
      });
      if (depth) rt.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
      return rt;
    };
    this.colorRT = mk(true);
    this.normalRT = mk(false);
    this.composite = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tColor: { value: this.colorRT.texture },
        tNormal: { value: this.normalRT.texture },
        tDepth: { value: this.colorRT.depthTexture },
        uLowRes: { value: new THREE.Vector2(1, 1) },
        uScreen: { value: new THREE.Vector2(1, 1) },
        uPx: { value: 3 },
        uNear: { value: 0.5 },
        uFar: { value: 300 },
        uTime: { value: 0 },
        uOutline: { value: 1 },
        uLightView: { value: new THREE.Vector3(0, 1, 0) },
        uSkyTop: { value: new THREE.Color(PAL.skyTop) },
        uSkyMid: { value: new THREE.Color(PAL.skyMid) },
        uSkyLow: { value: new THREE.Color(PAL.skyLow) },
        uCloud: { value: new THREE.Color(PAL.cloud) },
        uCloudShade: { value: new THREE.Color(PAL.cloudShade) },
        uHalo: { value: new THREE.Color(PAL.halo) },
        uSun: { value: new THREE.Color(PAL.sun) },
        uOutlineTint: { value: new THREE.Color(PAL.outline) },
        uWisp: { value: new THREE.Color(PAL.wisp) },
        uSkyScroll: { value: new THREE.Vector2() },
        uPlanet: { value: new THREE.Vector3(0, 0, 0) }, // xy device px, z radius px
        uWispPos: { value: new THREE.Vector3(0, 0, 0) }, // xy device px, z radius px
        uWispVis: { value: 0 },
        uFade: { value: 0 },
        uFadeColor: { value: new THREE.Color(PAL.skyLow) },
      },
      vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: COMPOSITE,
    });
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.composite));
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.dpr = dpr;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(cssW, cssH, false);
    this.lowW = Math.max(1, Math.ceil(cssW / this.pxSize));
    this.lowH = Math.max(1, Math.ceil(cssH / this.pxSize));
    this.colorRT.setSize(this.lowW, this.lowH);
    this.normalRT.setSize(this.lowW, this.lowH);
    const u = this.composite.uniforms;
    u.uLowRes.value.set(this.lowW, this.lowH);
    u.uScreen.value.set(cssW * dpr, cssH * dpr);
    u.uPx.value = this.pxSize * dpr;
  }

  /** A scene's sky and air colours. */
  applyMood(m: Mood) {
    const u = this.composite.uniforms;
    u.uSkyTop.value.setHex(m.skyTop);
    u.uSkyMid.value.setHex(m.skyMid);
    u.uSkyLow.value.setHex(m.skyLow);
    u.uCloud.value.setHex(m.cloud);
    u.uCloudShade.value.setHex(m.cloudShade);
    u.uHalo.value.setHex(m.halo);
    u.uSun.value.setHex(m.sun);
    u.uFadeColor.value.setHex(m.skyLow);
  }

  /** 0 = clear, 1 = the screen is washed in the fade colour (scene changes). */
  set fade(v: number) {
    this.composite.uniforms.uFade.value = v;
  }

  /** Device-pixel scale of one art pixel; used to place screen-space glows. */
  get devicePx() {
    return this.pxSize * this.dpr;
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    const r = this.renderer;
    const u = this.composite.uniforms;
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    u.uOutline.value = this.outlines ? 1 : 0;

    r.setClearColor(0x000000, 0);
    r.shadowMap.needsUpdate = true;
    r.setRenderTarget(this.colorRT);
    r.clear();
    r.render(scene, camera);

    scene.overrideMaterial = normalPassMaterial;
    r.setRenderTarget(this.normalRT);
    r.clear();
    r.render(scene, camera);
    scene.overrideMaterial = null;

    r.setRenderTarget(null);
    r.render(this.quadScene, this.quadCam);
  }
}

const COMPOSITE = /* glsl */ `
#include <packing>
uniform sampler2D tColor; uniform sampler2D tNormal; uniform sampler2D tDepth;
uniform vec2 uLowRes; uniform vec2 uScreen; uniform float uPx;
uniform float uNear; uniform float uFar; uniform float uTime; uniform float uOutline;
uniform vec3 uLightView;
uniform vec3 uSkyTop; uniform vec3 uSkyMid; uniform vec3 uSkyLow; uniform vec3 uCloud; uniform vec3 uCloudShade;
uniform vec3 uHalo; uniform vec3 uSun; uniform vec3 uOutlineTint; uniform vec3 uWisp;
uniform vec2 uSkyScroll; uniform vec3 uPlanet; uniform vec3 uWispPos; uniform float uWispVis;
uniform float uFade; uniform vec3 uFadeColor;
${NOISE}

float depthAt(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return -perspectiveDepthToViewZ(d, uNear, uFar);
}

vec3 sky(vec2 s, vec2 lp) {
  vec3 c = mix(uSkyLow, uSkyMid, smoothstep(0.02, 0.5, s.y));
  c = mix(c, uSkyTop, smoothstep(0.45, 1.05, s.y));
  float aspect = uScreen.x / uScreen.y;
  // Sun bloom up and to the left, where the key light comes from.
  vec2 sd = (s - vec2(0.16, 0.95)) * vec2(aspect, 1.0);
  float sl = length(sd);
  c += uSun * (0.32 * exp(-sl * sl * 14.0) + 0.08 * exp(-sl * 2.5));
  // Clouds sit on the art-pixel grid so their edges match the world's pixels.
  vec2 sp = (lp + 0.5) / uLowRes;
  vec2 q = vec2(sp.x * aspect, sp.y) * vec2(1.6, 3.2) + uSkyScroll + vec2(uTime * 0.006, 0.0);
  float n = fbm2(q) + (0.3 - sp.y) * 0.5;
  float th = (bayer4(lp) - 0.5) * 0.03;
  float shade = step(0.5 + th, n);
  float body = step(0.56 + th, n + (fbm2(q * 2.0 + 7.0) - 0.5) * 0.08);
  c = mix(c, uCloudShade, shade * 0.7);
  c = mix(c, uCloud, body * 0.9);
  return c;
}

void main() {
  vec2 lp = floor(gl_FragCoord.xy / uPx);
  vec2 uv = (lp + 0.5) / uLowRes;
  vec2 texel = 1.0 / uLowRes;
  vec4 c = texture2D(tColor, uv);
  vec2 s = gl_FragCoord.xy / uScreen;
  vec3 col;

  if (c.a < 0.25) {
    col = sky(s, lp);
    // Atmosphere: stepped rings around the planet's silhouette, on the pixel grid.
    float d = (length((lp + 0.5) * uPx - uPlanet.xy) - uPlanet.z) / max(uPlanet.z, 1.0);
    float h = exp(-max(d, 0.0) * 9.0);
    h += (bayer4(lp) - 0.5) * 0.07;
    float steps = floor(clamp(h, 0.0, 1.0) * 3.0) / 3.0;
    col = mix(col, uHalo, steps * 0.55);
  } else {
    col = c.rgb;
    if (uOutline > 0.5 && c.a > 0.9) {
      float d = depthAt(uv);
      vec3 n = texture2D(tNormal, uv).xyz * 2.0 - 1.0;
      float thr = 0.045 * d + 0.12;
      float edge = 0.0;
      float crease = 0.0;
      vec2 offs[4];
      offs[0] = vec2(texel.x, 0.0); offs[1] = vec2(-texel.x, 0.0); offs[2] = vec2(0.0, texel.y); offs[3] = vec2(0.0, -texel.y);
      for (int i = 0; i < 4; i++) {
        vec2 o = uv + offs[i];
        vec4 cn = texture2D(tColor, o);
        float dn = cn.a < 0.25 ? 1e4 : depthAt(o);
        if (dn - d > thr) edge = 1.0;
        vec3 nn = texture2D(tNormal, o).xyz * 2.0 - 1.0;
        // Crease only on the nearer side so inner lines stay one pixel wide.
        if (abs(dn - d) < thr && d <= dn && dot(n, nn) < 0.72) crease += 1.0;
      }
      if (edge > 0.5) {
        col = mix(col * 0.55, uOutlineTint, 0.45);
      } else if (crease > 0.5) {
        // Edges that face the light catch a highlight; the others darken a touch.
        float facing = dot(n, uLightView);
        col = facing > 0.15 ? mix(col, vec3(1.0, 0.97, 0.9), 0.28) : col * 0.82;
      }
    }
  }

  // Wisp glow: soft, full resolution, the one thing allowed to ignore the grid.
  if (uWispVis > 0.0) {
    float r = length(gl_FragCoord.xy - uWispPos.xy) / max(uWispPos.z, 1.0);
    float pulse = 0.85 + 0.15 * sin(uTime * 2.3);
    col += uWisp * (0.35 * exp(-r * r * 2.0) + 0.14 * exp(-r * 0.8)) * uWispVis * pulse;
  }

  // Gentle vignette keeps the eye on the planet.
  vec2 v = s - 0.5;
  col *= 1.0 - dot(v, v) * 0.22;
  // Scene fade dissolves on the art grid, brightest last, like light filling the view.
  if (uFade > 0.0) col = mix(col, uFadeColor, step(bayer4(lp) * 0.94 + 0.03, uFade));
  gl_FragColor = vec4(col, 1.0);
}
`;
