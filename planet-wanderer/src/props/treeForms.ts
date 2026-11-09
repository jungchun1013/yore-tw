import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { tailoredSurface, type Section } from '../characters/surfaces';
import { paint } from './geo';

type Point = readonly [number, number, number];

/** Curved, tapering branch with smooth welded seam normals. */
export function curvedBranch(points: readonly Point[], baseRadius: number, tipRadius: number): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const steps = 20, sides = 10;
  const geo = new THREE.TubeGeometry(curve, steps, 1, sides, false);
  const positions = geo.getAttribute('position');
  const v = new THREE.Vector3();
  for (let row = 0; row <= steps; row++) {
    const t = row / steps, center = curve.getPointAt(t);
    const radius = THREE.MathUtils.lerp(baseRadius, tipRadius, t * (2 - t));
    for (let side = 0; side <= sides; side++) {
      const i = row * (sides + 1) + side;
      v.fromBufferAttribute(positions, i).sub(center).multiplyScalar(radius).add(center);
      positions.setXYZ(i, v.x, v.y, v.z);
    }
  }
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  const welded = mergeVertices(geo); geo.dispose(); welded.computeVertexNormals();
  return welded;
}

/** A broad, softly lobed foliage mass, with a flatter underside and no ball joints.
 * Pigment colours use local coordinates, so they remain attached as a tree moves. */
export function leafPad(center: Point, radii: Point, seed: number, color: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, 36, 24);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const lobes = 1 + 0.065 * Math.sin(a * 5 + seed) * (1 - y * y)
      + 0.025 * Math.cos(x * 4 + z * 3 + seed);
    // Keep the broad bottom soft and compressed, rather than spherical.
    pos.setXYZ(i, x * lobes, y < 0 ? y * 0.68 : y * (1 + 0.05 * Math.sin(a * 3 + seed)), z * lobes);
  }
  geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
  const smooth = mergeVertices(geo); geo.dispose(); smooth.computeVertexNormals();
  const painted = paint(smooth, color); smooth.dispose();
  const colors = painted.getAttribute('color'), vertices = painted.getAttribute('position');
  const pigment = new THREE.Color();
  for (let i = 0; i < vertices.count; i++) {
    const t = 0.5 + 0.5 * Math.sin(vertices.getX(i) * 2 + seed) * Math.cos(vertices.getZ(i) * 2.5);
    pigment.setRGB(colors.getX(i), colors.getY(i), colors.getZ(i));
    pigment.lerp(new THREE.Color(0x8eafa0), t * 0.1);
    colors.setXYZ(i, pigment.r, pigment.g, pigment.b);
  }
  painted.scale(...radii); painted.translate(...center);
  return painted;
}

/** Smooth sculpted trunk with quiet fluting, shared by small trees and baobabs. */
export function trunkSurface(sections: readonly Section[], flute = 0.025): THREE.BufferGeometry {
  const geo = tailoredSurface(sections, 40), pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const a = Math.atan2(z, x), k = 1 + Math.cos(a * 5 + y * 0.6) * flute;
    pos.setXYZ(i, x * k + Math.sin(y * 1.1) * 0.025, y, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

export function paintedBranch(points: readonly Point[], r0: number, r1: number, color: number): THREE.BufferGeometry {
  const geo = curvedBranch(points, r0, r1), result = paint(geo, color); geo.dispose(); return result;
}

