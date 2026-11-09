import * as THREE from 'three';

/** Authored elliptical cross sections: y, half-width, half-depth, forward offset.
 * Shared by torsos, muzzles, limbs and spirit bodies; no visible primitive joints.
 * Duplicate seam vertices share analytical positions and smoothed normals. */
export type Section = readonly [number, number, number, number];
export function tailoredSurface(sections: readonly Section[], segments = 32): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(sections.map(s => new THREE.Vector3(s[1], s[0], s[2])), false, 'centripetal');
  const offsets = new THREE.CatmullRomCurve3(sections.map(s => new THREE.Vector3(0, s[0], s[3])), false, 'centripetal');
  const rows = (sections.length - 1) * 5;
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let j = 0; j <= rows; j++) {
    const s = curve.getPoint(j / rows), o = offsets.getPoint(j / rows);
    for (let i = 0; i <= segments; i++) {
      const a = i / segments * Math.PI * 2;
      positions.push(Math.sin(a) * Math.max(0.001, s.x), s.y, Math.cos(a) * Math.max(0.001, s.z) + o.z);
      uv.push(i / segments, j / rows);
      if (j < rows && i < segments) {
        const k = j * (segments + 1) + i;
        indices.push(k, k + 1, k + segments + 1, k + 1, k + segments + 2, k + segments + 1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const normals = geo.getAttribute('normal');
  for (let j = 0; j <= rows; j++) {
    const a = j * (segments + 1), b = a + segments;
    const n = new THREE.Vector3().fromBufferAttribute(normals, a).add(new THREE.Vector3().fromBufferAttribute(normals, b)).normalize();
    normals.setXYZ(a, n.x, n.y, n.z); normals.setXYZ(b, n.x, n.y, n.z);
  }
  return geo;
}

/** Open, pleated mantle; narrow at the shoulders, scalloped and swept at the hem. */
export function mantleSurface(): THREE.BufferGeometry {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  const rows = 24, cols = 64;
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    for (let i = 0; i <= cols; i++) {
      const u = i / cols, a = 0.48 + u * (Math.PI * 2 - 0.96);
      const fold = Math.cos(u * Math.PI * 16) * 0.012 * t * t;
      const r = 0.145 + 0.19 * Math.pow(t, 0.8) + fold;
      positions.push(Math.sin(a) * r, 0.61 - 0.37 * t + Math.cos(a) * 0.025 * t + Math.cos(u * Math.PI * 8) * 0.012 * t * t,
        Math.cos(a) * r * 0.66 - 0.055 * t);
      uv.push(u, t);
      if (j < rows && i < cols) {
        const k = j * (cols + 1) + i;
        indices.push(k, k + cols + 1, k + 1, k + 1, k + cols + 1, k + cols + 2);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices); geo.computeVertexNormals();
  return geo;
}
