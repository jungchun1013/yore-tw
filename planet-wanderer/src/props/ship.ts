import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import { at, cyl, mesh, type PropModule } from './kit';

/** The traveller's little ship: an ivory teardrop with a gold band, a round porthole,
 *  swept fins, three legs and a star on the antenna with a yellow pennant. */
export const ship: PropModule = {
  prepare(planet, p) {
    planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(0.8) });
  },
  build({ planet }, p) {
    const g = new THREE.Group();
    const body = new THREE.Group();
    const profile = [
      [0.0, 0.0], [0.22, 0.04], [0.4, 0.16], [0.5, 0.36], [0.52, 0.56], [0.47, 0.8],
      [0.36, 1.04], [0.22, 1.24], [0.09, 1.38], [0.0, 1.44],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    body.add(mesh(new THREE.LatheGeometry(profile, 20), PAL.hull));
    const band = mesh(new THREE.TorusGeometry(0.52, 0.035, 6, 24), PAL.gold);
    band.rotation.x = Math.PI / 2;
    body.add(at(band, 0, 0.52, 0));
    const glass = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16), PAL.glass, { emissive: 0.45 });
    glass.rotation.x = Math.PI / 2;
    body.add(at(glass, 0, 0.82, 0.45));
    body.add(at(mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 18), PAL.gold), 0, 0.82, 0.47));
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 3;
      // Fin: a thin swept curve hugging the lower hull.
      const finShape = new THREE.Shape();
      finShape.moveTo(0, 0.42);
      finShape.quadraticCurveTo(0.2, 0.2, 0.22, -0.08);
      finShape.lineTo(0.1, -0.04);
      finShape.quadraticCurveTo(0.04, 0.1, 0, 0.12);
      finShape.closePath();
      const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.04, bevelEnabled: false });
      finGeo.translate(0, 0, -0.02);
      const fin = mesh(finGeo, PAL.fin);
      fin.rotation.y = -Math.PI / 2;
      const hold = new THREE.Group();
      hold.add(at(fin, 0, 0, 0.4));
      hold.rotation.y = a;
      hold.position.y = 0.1;
      body.add(hold);
      const leg = mesh(cyl(0.025, 0.025, 0.42, 5), PAL.gold);
      const lh = new THREE.Group();
      lh.add(at(leg, 0, 0, 0.36));
      leg.rotation.x = -0.45;
      lh.add(at(mesh(cyl(0.07, 0.08, 0.04, 8), PAL.gold), 0, -0.2, 0.45));
      lh.rotation.y = a + Math.PI / 3;
      lh.position.y = 0.06;
      body.add(lh);
    }
    body.add(at(mesh(cyl(0.015, 0.02, 0.38, 5), PAL.gold), 0, 1.6, 0));
    const star = mesh(new THREE.OctahedronGeometry(0.09, 0), PAL.gold, { emissive: 0.35 });
    body.add(at(star, 0, 1.82, 0));
    const flag = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.3, -0.06), new THREE.Vector2(0, -0.14)]);
    const pennant = mesh(new THREE.ShapeGeometry(flag), PAL.scarf, { side: THREE.DoubleSide });
    body.add(at(pennant, 0.015, 1.74, 0));
    body.position.y = 0.26;
    body.rotation.z = 0.06;
    g.add(body);
    const d = dirAt(p.at);
    planet.place(g, d, p.yaw ?? 0, 0);
    return {
      object: g,
      obstacles: [{ dir: d, radius: 0.6 }],
      update(t) {
        star.rotation.y = t * 1.2;
        pennant.rotation.y = Math.sin(t * 2.4) * 0.35;
      },
    };
  },
};
