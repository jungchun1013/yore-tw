import * as THREE from 'three';
import { PAL } from '../render/palette';
import { dirAt } from '../world/planet';
import { blob, box, makeRand, mesh, type PropModule } from './kit';

/** A floating soul light that drifts around its spot, trailing beads and motes.
 *  Uses its own random stream so adding wisps never reshuffles the rest of a scene. */
export const wisp: PropModule = {
  build({ planet }, p) {
    const rand = makeRand(4242);
    const group = new THREE.Group();
    const core = mesh(blob(0.13, 2), PAL.wisp, { emissive: 1, glow: true });
    const inner = mesh(blob(0.07, 1), 0xf2feff, { emissive: 1, glow: true });
    core.add(inner);
    inner.position.set(0.02, 0.03, 0.06);
    group.add(core);
    const tail = [0.085, 0.06, 0.04].map((r) => {
      const m = mesh(blob(r, 1), PAL.wisp, { emissive: 1, glow: true });
      group.add(m);
      return m;
    });
    const motes = Array.from({ length: 10 }, () => {
      const m = mesh(box(0.045, 0.045, 0.045), 0xdffcff, { emissive: 1, glow: true });
      m.userData = { life: rand(), from: null as THREE.Vector3 | null };
      group.add(m);
      return m;
    });
    const n = dirAt(p.at);
    const east = new THREE.Vector3(0, 1, 0).cross(n).normalize();
    const north = new THREE.Vector3().crossVectors(n, east);
    const history: THREE.Vector3[] = [];
    const base = planet.surfacePoint(n);
    return {
      object: group,
      glowAnchor: core,
      update(t, dt) {
        const pos = base.clone()
          .addScaledVector(east, Math.sin(t * 0.45) * 0.75 + 0.35)
          .addScaledVector(north, Math.sin(t * 0.31 + 1.2) * 0.5 - 0.35)
          .addScaledVector(n, 1.45 + Math.sin(t * 1.3) * 0.16);
        core.position.copy(pos);
        history.unshift(pos.clone());
        if (history.length > 40) history.pop();
        tail.forEach((m, i) => m.position.copy(history[Math.min(history.length - 1, (i + 1) * 6)]));
        for (const m of motes) {
          const u = m.userData as { life: number; from: THREE.Vector3 | null };
          u.life += dt * 0.45;
          if (u.life > 1) {
            u.life = 0;
            u.from = pos.clone().add(new THREE.Vector3((rand() - 0.5) * 0.5, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.5));
          }
          m.position.copy(u.from ?? pos).addScaledVector(n, u.life * 0.7);
          m.scale.setScalar(Math.sin(u.life * Math.PI) * 1.1);
        }
      },
    };
  },
};
