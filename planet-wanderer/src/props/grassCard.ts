import * as THREE from 'three';

/**
 * Minecraft-style grass: a tiny pixel-art texture of a few blades, alpha-tested on
 * two crossed quads. The texture is drawn once on a canvas (nearest-filtered, so
 * every texel stays a crisp square) and shared by every clump.
 */

let texture: THREE.CanvasTexture | null = null;
let material: THREE.ShaderMaterial | null = null;

function makeTexture() {
  const N = 16;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, N, N);
  // The meadow's own greens (PAL.grassDark / grass / grassLight) plus one deeper root tone.
  // Lighter and greyer than the meadow so the clumps sit on it quietly.
  const greens = ['#a4c0b2', '#b0c8b4', '#aac5b6', '#bacfb9'];
  // Deterministic blades so the clump looks the same every load.
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let b = 0; b < 7; b++) {
    const x0 = 1 + Math.floor(rnd() * (N - 2));
    const h = 7 + Math.floor(rnd() * 8);
    const lean = rnd() < 0.5 ? -1 : 1;
    const col = greens[b % greens.length];
    for (let y = 0; y < h; y++) {
      const x = x0 + (y > h * 0.55 ? lean : 0) + (y > h * 0.85 ? lean : 0);
      if (x < 0 || x >= N) continue;
      // One colour per blade, root to tip.
      g.fillStyle = col;
      g.fillRect(x, N - 1 - y, 1, 1);
      // A little width near the root.
      if (y < h * 0.4 && x + 1 < N) { g.fillRect(x + 1, N - 1 - y, 1, 1); }
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  // The project runs with colour management off: pass the painted values through untouched.
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

function grassMaterial() {
  if (material) return material;
  texture = makeTexture();
  material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { tMap: { value: texture } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tMap; varying vec2 vUv;
      void main() {
        vec4 t = texture2D(tMap, vUv);
        if (t.a < 0.5) discard;
        // Alpha 0.98 marks "no outline" for the composite (thin blades would turn into specks).
        gl_FragColor = vec4(t.rgb, 0.98);
      }
    `,
  });
  return material;
}

/** A clump: two quads crossed at 90°, `size` units tall, rooted at the origin. */
export function grassCard(size = 0.35, yaw = 0) {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(size, size);
  geo.translate(0, size / 2, 0);
  for (const r of [0, Math.PI / 2]) {
    const m = new THREE.Mesh(geo, grassMaterial());
    m.rotation.y = r + yaw;
    m.castShadow = false;
    m.receiveShadow = false;
    g.add(m);
  }
  return g;
}
