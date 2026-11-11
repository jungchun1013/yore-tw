import * as THREE from 'three';
import { shared } from '../render/materials';

/**
 * Top-down koi: a flat card lying just under the pond surface. The silhouette is
 * drawn once per variant as vector shapes on a small canvas (body teardrop, two
 * pectoral fins, forked tail, soft patches), nearest-filtered so it stays crisp.
 * The card has many segments along its length and a vertex shader bends it in an
 * S-wave that grows toward the tail, which is what makes it read as swimming.
 */

export type KoiVariant = 'kohaku' | 'ivory' | 'amber' | 'bekko';

const PALETTE: Record<KoiVariant, { body: string; patch: string[]; fin: string }> = {
  kohaku: { body: '#faf6ee', patch: ['#d9826a', '#cf735c'], fin: '#f1ebe0' },
  ivory: { body: '#f8f3e8', patch: [], fin: '#efe8dc' },
  amber: { body: '#ecc896', patch: ['#d9a26c'], fin: '#ecdcc0' },
  bekko: { body: '#f6f0e4', patch: ['#6f6d6a', '#5e5c59'], fin: '#ece6da' },
};

const textures = new Map<KoiVariant, THREE.CanvasTexture>();

function texture(v: KoiVariant) {
  let t = textures.get(v);
  if (t) return t;
  const W = 48, H = 112;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.clearRect(0, 0, W, H);
  const p = PALETTE[v];
  const cx = W / 2;
  // Head at the top (small y), tail at the bottom.
  const head = 8, tailBase = 72, tailTip = 108;
  // Tail: two soft lobes.
  g.fillStyle = p.fin;
  g.beginPath();
  g.moveTo(cx - 4, tailBase);
  g.bezierCurveTo(cx - 14, tailBase + 14, cx - 18, tailTip - 6, cx - 15, tailTip);
  g.bezierCurveTo(cx - 8, tailTip - 10, cx - 2, tailBase + 22, cx, tailBase + 16);
  g.bezierCurveTo(cx + 2, tailBase + 22, cx + 8, tailTip - 10, cx + 15, tailTip);
  g.bezierCurveTo(cx + 18, tailTip - 6, cx + 14, tailBase + 14, cx + 4, tailBase);
  g.closePath();
  g.fill();
  // Pectoral fins.
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + s * 8, 30);
    g.bezierCurveTo(cx + s * 18, 30, cx + s * 22, 42, cx + s * 16, 46);
    g.bezierCurveTo(cx + s * 12, 44, cx + s * 9, 38, cx + s * 8, 34);
    g.closePath();
    g.fill();
  }
  // Body: teardrop, widest a third of the way down.
  g.fillStyle = p.body;
  g.beginPath();
  g.moveTo(cx, head);
  g.bezierCurveTo(cx + 13, head + 2, cx + 13, 44, cx + 4, tailBase + 2);
  g.lineTo(cx - 4, tailBase + 2);
  g.bezierCurveTo(cx - 13, 44, cx - 13, head + 2, cx, head);
  g.closePath();
  g.fill();
  // Patches, clipped to the body.
  if (p.patch.length) {
    g.save();
    g.clip();
    let seed = v === 'kohaku' ? 3 : v === 'bekko' ? 11 : 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const n = v === 'bekko' ? 3 : 2;
    for (let i = 0; i < n; i++) {
      g.fillStyle = p.patch[i % p.patch.length];
      const y = 16 + rnd() * 44, x = cx + (rnd() - 0.5) * 12, r = 7 + rnd() * 7;
      g.beginPath();
      g.ellipse(x, y, r * 0.8, r * 1.15, (rnd() - 0.5) * 0.8, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
  // Eyes: two dark dots near the head.
  g.fillStyle = '#4a433d';
  g.fillRect(cx - 6, head + 7, 2, 2);
  g.fillRect(cx + 4, head + 7, 2, 2);
  t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  // The project runs with colour management off: pass the painted values through untouched.
  t.colorSpace = THREE.NoColorSpace;
  textures.set(v, t);
  return t;
}

/** A koi card `length` units long, flat in XZ, head toward -z. `phase` offsets its swimming wave. */
export function koiCard(variant: KoiVariant, length: number, phase: number) {
  const geo = new THREE.PlaneGeometry(length * (48 / 112), length, 1, 28);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { tMap: { value: texture(variant) }, uTime: shared.uTime, uPhase: { value: phase }, uLen: { value: length } },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uPhase; uniform float uLen;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        // uv.y = 1 at the head, 0 at the tail. The wave is small at the head and
        // swings wide at the tail, travelling backward along the body.
        float along = 1.0 - uv.y;
        float amp = uLen * (0.02 + 0.11 * along * along);
        p.x += sin(along * 7.0 - uTime * 3.2 + uPhase) * amp;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tMap; varying vec2 vUv;
      void main() {
        vec4 t = texture2D(tMap, vUv);
        if (t.a < 0.5) discard;
        gl_FragColor = vec4(t.rgb, 0.98);
      }
    `,
  });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}
