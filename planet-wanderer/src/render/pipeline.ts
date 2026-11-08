import * as THREE from 'three';
import { PAL } from './palette';
import { NOISE } from './glsl';
import type { Mood } from '../scenes/types';
import { normalPassMaterial, shared } from './materials';

export type RenderStyle = 'soft' | 'pixel';
/** none = no lines; tint = a darker, cooler shade of the object's own colour; dark = ink line. */
export type OutlineMode = 'none' | 'tint' | 'dark';

/**
 * Two looks over the same scenes, switchable at runtime.
 *
 * soft (default) — Zelda / Sky: full resolution with 4× MSAA into a half-float target,
 *   soft two-tone cel shading, no outlines, distance haze that melts into the sky,
 *   bloom on emissive things and light motes, smooth clouds and halo.
 * pixel — the scene renders at screen ÷ pxSize, a normal pre-pass feeds depth outlines
 *   and light-facing crease highlights, everything snaps to the art-pixel grid.
 *
 * Both end in one full-screen composite that also draws the sky, the planet halo,
 * the wisp glow, the vignette and the scene fade.
 */
export class PixelPipeline {
  style: RenderStyle = 'soft';
  pxSize = 3;
  outline: OutlineMode = 'tint';
  lowW = 1;
  lowH = 1;
  private pixelRT: THREE.WebGLRenderTarget;
  private normalRT: THREE.WebGLRenderTarget;
  private softRT: THREE.WebGLRenderTarget;
  private bloomA: THREE.WebGLRenderTarget;
  private bloomB: THREE.WebGLRenderTarget;
  private quadScene = new THREE.Scene();
  private quad: THREE.Mesh;
  private quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  readonly composite: THREE.ShaderMaterial;
  private bright: THREE.ShaderMaterial;
  private blur: THREE.ShaderMaterial;
  private dpr = 1;
  private cssW = 1;
  private cssH = 1;

  constructor(readonly renderer: THREE.WebGLRenderer) {
    const nearest = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true };
    this.pixelRT = new THREE.WebGLRenderTarget(1, 1, nearest);
    this.pixelRT.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    this.normalRT = new THREE.WebGLRenderTarget(1, 1, nearest);
    this.softRT = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4,
      depthBuffer: true,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    this.softRT.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    const half = { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    this.bloomA = new THREE.WebGLRenderTarget(1, 1, half);
    this.bloomB = new THREE.WebGLRenderTarget(1, 1, half);

    const vert = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
    this.bright = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } },
      vertexShader: vert,
      fragmentShader: /* glsl */ `
        uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
        void main() {
          vec3 c = vec3(0.0);
          for (int x = -1; x <= 1; x += 2) for (int y = -1; y <= 1; y += 2) {
            vec4 s = texture2D(tSrc, vUv + vec2(x, y) * uTexel);
            float l = max(s.r, max(s.g, s.b));
            c += s.rgb * smoothstep(1.08, 1.5, l);
          }
          gl_FragColor = vec4(c * 0.25, 1.0);
        }`,
    });
    this.blur = new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false,
      uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } },
      vertexShader: vert,
      fragmentShader: /* glsl */ `
        uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
        void main() {
          vec3 c = texture2D(tSrc, vUv).rgb * 0.227;
          c += (texture2D(tSrc, vUv + uDir * 1.385).rgb + texture2D(tSrc, vUv - uDir * 1.385).rgb) * 0.316;
          c += (texture2D(tSrc, vUv + uDir * 3.231).rgb + texture2D(tSrc, vUv - uDir * 3.231).rgb) * 0.07;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });

    this.composite = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tColor: { value: this.softRT.texture },
        tNormal: { value: this.normalRT.texture },
        tDepth: { value: this.softRT.depthTexture },
        tBloom: { value: this.bloomA.texture },
        uSoft: { value: 1 },
        uLowRes: { value: new THREE.Vector2(1, 1) },
        uScreen: { value: new THREE.Vector2(1, 1) },
        uPx: { value: 1 },
        uNear: { value: 0.5 },
        uFar: { value: 300 },
        uFocus: { value: 10 },
        uTime: { value: 0 },
        uOutline: { value: 1 },
        uEdgePx: { value: 1.5 },
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
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.composite);
    this.quadScene.add(this.quad);
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.dpr = dpr;
    this.cssW = cssW;
    this.cssH = cssH;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(cssW, cssH, false);
    const u = this.composite.uniforms;
    const devW = Math.round(cssW * dpr);
    const devH = Math.round(cssH * dpr);
    u.uScreen.value.set(devW, devH);
    u.uEdgePx.value = 0.5 + 1.1 * dpr;
    if (this.style === 'soft') {
      this.lowW = devW;
      this.lowH = devH;
      this.softRT.setSize(devW, devH);
      const bw = Math.max(1, Math.round(devW / 4));
      const bh = Math.max(1, Math.round(devH / 4));
      this.bloomA.setSize(bw, bh);
      this.bloomB.setSize(bw, bh);
      u.uPx.value = 1;
      u.tColor.value = this.softRT.texture;
      u.tDepth.value = this.softRT.depthTexture;
      u.uSoft.value = 1;
    } else {
      this.lowW = Math.max(1, Math.ceil(cssW / this.pxSize));
      this.lowH = Math.max(1, Math.ceil(cssH / this.pxSize));
      this.pixelRT.setSize(this.lowW, this.lowH);
      this.normalRT.setSize(this.lowW, this.lowH);
      u.uPx.value = this.pxSize * dpr;
      u.tColor.value = this.pixelRT.texture;
      u.tDepth.value = this.pixelRT.depthTexture;
      u.uSoft.value = 0;
    }
    u.uLowRes.value.set(this.lowW, this.lowH);
    shared.uStyle.value = this.style === 'soft' ? 1 : 0;
  }

  /** Switch look; main re-runs its own resize afterwards so the camera aspect matches. */
  setStyle(s: RenderStyle) {
    this.style = s;
    this.resize(this.cssW, this.cssH, this.dpr);
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

  /** Distance from the camera to what it looks at; haze starts beyond it. */
  set focus(d: number) {
    this.composite.uniforms.uFocus.value = d;
  }

  private pass(mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCam);
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    const r = this.renderer;
    const u = this.composite.uniforms;
    u.uNear.value = camera.near;
    u.uFar.value = camera.far;
    u.uOutline.value = { none: 0, tint: 1, dark: 2 }[this.outline];
    r.setClearColor(0x000000, 0);
    r.shadowMap.needsUpdate = true;

    if (this.style === 'soft') {
      r.setRenderTarget(this.softRT);
      r.clear();
      r.render(scene, camera);
      // Bloom: bright pass at quarter size, then a separable blur, twice.
      this.bright.uniforms.tSrc.value = this.softRT.texture;
      this.bright.uniforms.uTexel.value.set(1 / this.softRT.width, 1 / this.softRT.height);
      this.pass(this.bright, this.bloomA);
      const tx = 1 / this.bloomA.width;
      const ty = 1 / this.bloomA.height;
      for (const k of [1, 2]) {
        this.blur.uniforms.tSrc.value = this.bloomA.texture;
        this.blur.uniforms.uDir.value.set(tx * k, 0);
        this.pass(this.blur, this.bloomB);
        this.blur.uniforms.tSrc.value = this.bloomB.texture;
        this.blur.uniforms.uDir.value.set(0, ty * k);
        this.pass(this.blur, this.bloomA);
      }
    } else {
      r.setRenderTarget(this.pixelRT);
      r.clear();
      r.render(scene, camera);
      scene.overrideMaterial = normalPassMaterial;
      r.setRenderTarget(this.normalRT);
      r.clear();
      r.render(scene, camera);
      scene.overrideMaterial = null;
    }
    this.pass(this.composite, null);
  }
}

const COMPOSITE = /* glsl */ `
#include <packing>
uniform sampler2D tColor; uniform sampler2D tNormal; uniform sampler2D tDepth; uniform sampler2D tBloom;
uniform float uSoft;
uniform vec2 uLowRes; uniform vec2 uScreen; uniform float uPx;
uniform float uNear; uniform float uFar; uniform float uFocus; uniform float uTime; uniform float uOutline; uniform float uEdgePx;
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

/** The edge colour: a darker, cooler version of the surface (tint) or ink (dark). */
vec3 edgeColor(vec3 c) {
  return uOutline > 1.5 ? mix(c * 0.55, uOutlineTint, 0.45) : c * vec3(0.66, 0.68, 0.8);
}

vec3 skyGradient(vec2 s) {
  vec3 c = mix(uSkyLow, uSkyMid, smoothstep(0.02, 0.5, s.y));
  return mix(c, uSkyTop, smoothstep(0.45, 1.05, s.y));
}

vec3 sky(vec2 s, vec2 lp) {
  vec3 c = skyGradient(s);
  float aspect = uScreen.x / uScreen.y;
  // Sun bloom up and to the left, where the key light comes from.
  vec2 sd = (s - vec2(0.16, 0.95)) * vec2(aspect, 1.0);
  float sl = length(sd);
  c += uSun * (0.32 * exp(-sl * sl * 14.0) + 0.08 * exp(-sl * 2.5));
  // Clouds: on the art-pixel grid in pixel mode, soft-edged in soft mode.
  vec2 sp = uSoft > 0.5 ? s : (lp + 0.5) / uLowRes;
  vec2 q = vec2(sp.x * aspect, sp.y) * vec2(1.6, 3.2) + uSkyScroll + vec2(uTime * 0.006, 0.0);
  float n = fbm2(q) + (0.3 - sp.y) * 0.5;
  float wob = (fbm2(q * 2.0 + 7.0) - 0.5) * 0.08;
  float shade, body;
  if (uSoft > 0.5) {
    shade = smoothstep(0.45, 0.55, n);
    body = smoothstep(0.52, 0.64, n + wob);
  } else {
    float th = (bayer4(lp) - 0.5) * 0.03;
    shade = step(0.5 + th, n);
    body = step(0.56 + th, n + wob);
  }
  c = mix(c, uCloudShade, shade * 0.7);
  c = mix(c, uCloud, body * 0.9);
  return c;
}

void main() {
  vec2 lp = floor(gl_FragCoord.xy / uPx);
  vec2 uv = uSoft > 0.5 ? gl_FragCoord.xy / uScreen : (lp + 0.5) / uLowRes;
  vec2 texel = 1.0 / uLowRes;
  vec4 c = texture2D(tColor, uv);
  vec2 s = gl_FragCoord.xy / uScreen;
  vec3 col;

  if (uSoft > 0.5) {
    // Soft: MSAA coverage is in alpha (cleared to 0), so blend over the sky by it.
    vec3 skyC = sky(s, lp);
    float d = (length(gl_FragCoord.xy - uPlanet.xy) - uPlanet.z) / max(uPlanet.z, 1.0);
    skyC = mix(skyC, uHalo, exp(-max(d, 0.0) * 7.0) * 0.55);
    vec3 obj = c.a > 0.0 ? c.rgb / c.a : vec3(0.0);
    if (c.a > 0.01) {
      float z = depthAt(uv);
      // Silhouette lines from depth jumps. Alpha off the MSAA quarter steps = "never outline".
      bool marked = abs(c.a * 4.0 - floor(c.a * 4.0 + 0.5)) > 0.02;
      if (!marked) {
        float thr = 0.045 * z + 0.12;
        float edge = 0.0;
        float topEdge = 0.0;
        vec2 px = vec2(uEdgePx) / uScreen;
        vec2 offs[4];
        offs[0] = vec2(px.x, 0.0); offs[1] = vec2(-px.x, 0.0); offs[2] = vec2(0.0, px.y); offs[3] = vec2(0.0, -px.y);
        for (int i = 0; i < 4; i++) {
          vec2 o = uv + offs[i];
          float dn = texture2D(tColor, o).a < 0.5 ? 1e4 : depthAt(o);
          float e = smoothstep(thr, thr * 1.8, dn - z);
          if (i == 2) topEdge = e; else edge = max(edge, e);
        }
        // Light catches the top edge of everything; the other edges get the outline.
        if (uOutline > 0.5) obj = mix(obj, edgeColor(obj), edge * (1.0 - topEdge) * (uOutline > 1.5 ? 1.0 : 0.85));
        obj = mix(obj, mix(uSun, vec3(1.0), 0.4) * 1.05, topEdge * 0.42);
      }
      // Aerial perspective: the far side of the world melts into the sky's colour.
      float haze = clamp((z - uFocus * 0.95) / (uFocus * 1.4), 0.0, 1.0);
      vec3 hazeC = mix(skyGradient(vec2(s.x, 0.35)), uHalo, 0.45);
      obj = mix(obj, hazeC, haze * 0.62);
      // Sky-style sunlight wash from the upper left.
      vec2 sd = (s - vec2(0.16, 0.95)) * vec2(uScreen.x / uScreen.y, 1.0);
      obj += uSun * 0.1 * exp(-length(sd) * 1.6);
    }
    col = mix(skyC, min(obj, vec3(1.6)), clamp(c.a, 0.0, 1.0));
    col += texture2D(tBloom, s).rgb * 0.85;
  } else if (c.a < 0.25) {
    col = sky(s, lp);
    // Atmosphere: stepped rings around the planet's silhouette, on the pixel grid.
    float d = (length((lp + 0.5) * uPx - uPlanet.xy) - uPlanet.z) / max(uPlanet.z, 1.0);
    float h = exp(-max(d, 0.0) * 9.0);
    h += (bayer4(lp) - 0.5) * 0.07;
    float steps = floor(clamp(h, 0.0, 1.0) * 3.0) / 3.0;
    col = mix(col, uHalo, steps * 0.55);
  } else {
    col = c.rgb;
    if (c.a > 0.9) {
      float d = depthAt(uv);
      vec3 n = texture2D(tNormal, uv).xyz * 2.0 - 1.0;
      float thr = 0.045 * d + 0.12;
      float edge = 0.0;
      float topEdge = 0.0;
      float crease = 0.0;
      vec2 offs[4];
      offs[0] = vec2(texel.x, 0.0); offs[1] = vec2(-texel.x, 0.0); offs[2] = vec2(0.0, texel.y); offs[3] = vec2(0.0, -texel.y);
      for (int i = 0; i < 4; i++) {
        vec2 o = uv + offs[i];
        vec4 cn = texture2D(tColor, o);
        float dn = cn.a < 0.25 ? 1e4 : depthAt(o);
        if (dn - d > thr) { if (i == 2) topEdge = 1.0; else edge = 1.0; }
        vec3 nn = texture2D(tNormal, o).xyz * 2.0 - 1.0;
        // Crease only on the nearer side so inner lines stay one pixel wide.
        if (abs(dn - d) < thr && d <= dn && dot(n, nn) < 0.72) crease += 1.0;
      }
      if (topEdge > 0.5) {
        // One pale pixel of light along every top silhouette.
        col = mix(col, mix(uSun, vec3(1.0), 0.4), 0.5);
      } else if (edge > 0.5 && uOutline > 0.5) {
        col = edgeColor(col);
      } else if (crease > 0.5 && uOutline > 0.5) {
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

  vec2 v = s - 0.5;
  col *= 1.0 - dot(v, v) * 0.22;
  if (uFade > 0.0) {
    col = uSoft > 0.5
      ? mix(col, uFadeColor, smoothstep(0.0, 1.0, uFade))
      : mix(col, uFadeColor, step(bayer4(lp) * 0.94 + 0.03, uFade));
  }
  gl_FragColor = vec4(col, 1.0);
}
`;
