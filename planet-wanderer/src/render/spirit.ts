import * as THREE from 'three';
import { NOISE } from './glsl';
import { shared } from './materials';

/** A spirit's colour scheme. `day` is the white watercolour deer, `night` the indigo
 *  constellation deer from the user's references. */
export interface SpiritTint {
  body: number; // core colour
  rim: number; // fresnel edge glow
  deep: number; // colour the core fades toward where it is thinnest
  star: number;
  alpha: number; // core opacity
}

export const SPIRIT_DAY: SpiritTint = { body: 0xf4f8fb, rim: 0xbfe9ff, deep: 0x9ecfe8, star: 0xfff6d8, alpha: 0.78 };
export const SPIRIT_NIGHT: SpiritTint = { body: 0x5b82bc, rim: 0x8feaff, deep: 0x344a7e, star: 0xfff3c4, alpha: 0.86 };

/**
 * Patronus-style body material: the form reads by its silhouette and a bright fresnel
 * edge, the interior is a translucent wash with slow light drifting through it and a
 * dusting of star points. Supports skinning so animated GLB bodies keep moving. Rim
 * brightness goes above 1 so the bloom pass picks it up in the soft and sky styles.
 */
export function spiritMaterial(t: SpiritTint, skinned = false, localScale = 1): THREE.ShaderMaterial {
  const m = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide,
    defines: skinned ? { USE_SKINNING: '' } : {},
    uniforms: {
      uBody: { value: new THREE.Color(t.body) },
      uRim: { value: new THREE.Color(t.rim) },
      uDeep: { value: new THREE.Color(t.deep) },
      uStar: { value: new THREE.Color(t.star) },
      uAlpha: { value: t.alpha },
      uLocalScale: { value: localScale },
      uTime: shared.uTime,
      uLightDir: shared.uLightDir,
    },
    vertexShader: /* glsl */ `
      #include <common>
      #include <skinning_pars_vertex>
      varying vec3 vN; varying vec3 vPosW; varying vec3 vLocal;
      void main() {
        #include <beginnormal_vertex>
        #include <skinbase_vertex>
        #include <skinnormal_vertex>
        #include <defaultnormal_vertex>
        #include <begin_vertex>
        #include <skinning_vertex>
        #include <project_vertex>
        vN = normalize(inverseTransformDirection(transformedNormal, viewMatrix));
        vPosW = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vLocal = position;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBody; uniform vec3 uRim; uniform vec3 uDeep; uniform vec3 uStar;
      uniform float uAlpha; uniform float uTime; uniform vec3 uLightDir; uniform float uLocalScale;
      varying vec3 vN; varying vec3 vPosW; varying vec3 vLocal;
      ${NOISE}
      void main() {
        vec3 N = normalize(vN);
        if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(cameraPosition - vPosW);
        float fr = 1.0 - max(dot(N, V), 0.0);
        // Light moving slowly through the body, like breath inside a lantern.
        vec3 lw = vLocal * uLocalScale; // local position in world units, so patterns match across models
        float inner = fbm3(lw * 3.5 + vec3(uTime * 0.12, uTime * 0.07, 0.0));
        float sun = max(dot(N, uLightDir), 0.0);
        vec3 col = mix(uDeep, uBody, 0.45 + 0.45 * inner + 0.1 * sun);
        // Fresnel edge: one wide soft glow, brightest at the rim but never a hard line
        // (a hard line traces every internal contour and reads as a wire drawing).
        float edge = smoothstep(0.25, 1.0, fr);
        col = mix(col, uRim, edge * 0.75);
        col += uRim * edge * edge * 0.35;
        // Star dust: sparse points anchored to the body, twinkling.
        vec3 cell = floor(lw * 16.0); // one cell ≈ 6 cm
        float h = hash13(cell);
        float tw = 0.6 + 0.4 * sin(uTime * (1.5 + h * 2.0) + h * 20.0);
        vec3 inCell = fract(lw * 16.0) - 0.5;
        float dot2 = 1.0 - smoothstep(0.0, 0.14, length(inCell));
        float star = step(0.9, h) * dot2 * tw;
        col += uStar * star * 1.05;
        float a = mix(uAlpha, 1.0, edge * 0.7 + star);
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  return m;
}

/** Antler / horn material: cyan at the root blending to gold at the tips, self-lit. */
export function antlerMaterial(fromHex = 0x8fe9f6, toHex = 0xffd27a, yMin = 0, yMax = 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uFrom: { value: new THREE.Color(fromHex) },
      uTo: { value: new THREE.Color(toHex) },
      uRange: { value: new THREE.Vector2(yMin, yMax) },
      uTime: shared.uTime,
    },
    vertexShader: /* glsl */ `
      varying vec3 vLocal; varying vec3 vN; varying vec3 vPosW;
      void main() { vLocal = position; vN = normalize(normalMatrix * normal); vPosW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uFrom; uniform vec3 uTo; uniform vec2 uRange; uniform float uTime;
      varying vec3 vLocal; varying vec3 vN; varying vec3 vPosW;
      ${NOISE}
      void main() {
        float t = clamp((vLocal.y - uRange.x) / max(uRange.y - uRange.x, 1e-4), 0.0, 1.0);
        vec3 col = mix(uFrom, uTo, pow(t, 1.3));
        float sparkle = step(0.965, hash13(floor(vLocal * 60.0) + floor(uTime * 2.0)));
        col = col * (0.95 + 0.35 * t) + sparkle * 0.5;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

/** Points and lines drawn between a few body vertices: a constellation on the flank. */
export function constellation(positions: THREE.Vector3[], color: number): THREE.Group {
  const g = new THREE.Group();
  const pts = new THREE.BufferGeometry().setFromPoints(positions);
  const starMat = new THREE.PointsMaterial({ color, size: 0.06, sizeAttenuation: true, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending });
  g.add(new THREE.Points(pts, starMat));
  const segs: THREE.Vector3[] = [];
  for (let i = 0; i + 1 < positions.length; i++) segs.push(positions[i], positions[i + 1]);
  const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs), lineMat));
  return g;
}
