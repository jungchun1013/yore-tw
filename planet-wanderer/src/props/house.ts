import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import { at, blob, box, mesh, type PropModule } from './kit';

/** Cottage with a coral gable roof, glowing windows and chimney smoke. */
export const house: PropModule = {
  prepare(planet, p) {
    planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(1.2) });
  },
  build({ planet, root }, p) {
    const g = new THREE.Group();
    g.add(at(mesh(box(1.95, 0.2, 1.6), PAL.stoneDark), 0, 0.05, 0));
    g.add(at(mesh(box(1.7, 1.0, 1.32), PAL.wall), 0, 0.65, 0));
    // Gable roof: a triangle extruded front to back, with overhang.
    const shape = new THREE.Shape([new THREE.Vector2(-1.08, 0), new THREE.Vector2(1.08, 0), new THREE.Vector2(0, 0.78)]);
    const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: 1.62, bevelEnabled: false });
    roofGeo.translate(0, 0, -0.81);
    g.add(at(mesh(roofGeo, PAL.roof), 0, 1.13, 0));
    g.add(at(mesh(box(0.12, 0.1, 1.7), PAL.roofDark), 0, 1.9, 0));
    // Gable wall (cream triangle under the eaves) so the roof reads as a lid.
    const gable = new THREE.Shape([new THREE.Vector2(-0.85, 0), new THREE.Vector2(0.85, 0), new THREE.Vector2(0, 0.6)]);
    const gableGeo = new THREE.ExtrudeGeometry(gable, { depth: 1.3, bevelEnabled: false });
    gableGeo.translate(0, 0, -0.65);
    g.add(at(mesh(gableGeo, PAL.wall), 0, 1.14, 0));
    // Round attic window.
    const attic = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 14), PAL.windowGlow, { emissive: 0.7 });
    attic.rotation.x = Math.PI / 2;
    g.add(at(attic, 0, 1.4, 0.68));
    g.add(at(mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 16), PAL.woodDark), 0, 1.4, 0.69));
    // Door, lintel, knob, step.
    g.add(at(mesh(box(0.38, 0.62, 0.06), PAL.wood), -0.3, 0.46, 0.67));
    g.add(at(mesh(box(0.46, 0.06, 0.08), PAL.woodDark), -0.3, 0.8, 0.68));
    g.add(at(mesh(new THREE.SphereGeometry(0.025, 6, 4), PAL.gold), -0.18, 0.46, 0.71));
    g.add(at(mesh(box(0.52, 0.08, 0.26), PAL.stone), -0.3, 0.12, 0.84));
    // Window with frame and a flower box.
    g.add(at(mesh(box(0.38, 0.32, 0.05), PAL.windowGlow, { emissive: 0.55 }), 0.38, 0.72, 0.67));
    g.add(at(mesh(box(0.44, 0.04, 0.07), PAL.woodDark), 0.38, 0.9, 0.68));
    g.add(at(mesh(box(0.44, 0.04, 0.07), PAL.woodDark), 0.38, 0.55, 0.68));
    g.add(at(mesh(box(0.035, 0.32, 0.07), PAL.woodDark), 0.38, 0.72, 0.69));
    g.add(at(mesh(box(0.46, 0.1, 0.12), PAL.wood), 0.38, 0.49, 0.74));
    for (let i = 0; i < 4; i++) {
      const c = [PAL.flowerC, PAL.flowerB, PAL.flowerA, PAL.rose][i];
      g.add(at(mesh(blob(0.045, 1), c), 0.24 + i * 0.095, 0.57, 0.75));
    }
    g.add(at(mesh(box(0.05, 0.3, 0.3), PAL.windowGlow, { emissive: 0.55 }), 0.86, 0.72, -0.05));
    // Chimney.
    g.add(at(mesh(box(0.24, 0.6, 0.24), PAL.stone), 0.5, 1.6, -0.3));
    g.add(at(mesh(box(0.3, 0.07, 0.3), PAL.stoneDark), 0.5, 1.92, -0.3));

    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0.04);
    g.updateMatrixWorld(true);

    // Chimney smoke: three puffs on a loop (world space, so they rise straight up).
    const top = g.localToWorld(new THREE.Vector3(0.5, 2.0, -0.3));
    const up = d.clone();
    const smoke = [0, 1, 2].map((i) => {
      const m = mesh(blob(0.1, 1), 0xf4f7f2, { rim: 0 });
      m.castShadow = false;
      m.userData.phase = i / 3;
      root.add(m);
      return m;
    });
    return {
      object: g,
      obstacles: [{ dir: d, radius: 1.05 }],
      update(t) {
        for (const m of smoke) {
          const k = (t * 0.25 + (m.userData.phase as number)) % 1;
          m.position.copy(top).addScaledVector(up, k * 1.1).add(new THREE.Vector3(Math.sin(k * 4 + t) * 0.08, 0, 0));
          m.scale.setScalar(0.5 + k * 1.3 - Math.max(0, k - 0.8) * 5);
        }
      },
    };
  },
};
