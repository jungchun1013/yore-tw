import * as THREE from 'three';
import { applyMaterialMood } from '../render/materials';
import type { PixelPipeline } from '../render/pipeline';
import { SCENES } from '../scenes';
import { buildRealm, type Realm } from '../world/realm';
import { dirAt } from '../world/planet';
import type { Prince } from '../world/prince';
import type { CameraRig } from './cameraRig';
import { sceneSlot, type GameState } from './state';

type Phase = 'idle' | 'lift' | 'fadeOut' | 'fadeIn';

/** Loads one scene at a time and plays the trip between them:
 *  board → camera pulls back to the whole planet → the view dissolves into light →
 *  the next scene loads → the view clears → the camera settles behind the traveller. */
export class SceneManager {
  realm: Realm | null = null;
  private phase: Phase = 'idle';
  private timer = 0;
  private dest = '';
  onArrive: (realm: Realm) => void = () => {};

  constructor(
    private readonly scene: THREE.Scene,
    private readonly pipe: PixelPipeline,
    private readonly rig: CameraRig,
    private readonly prince: Prince,
    private readonly sun: THREE.DirectionalLight,
    private readonly state: GameState,
  ) {}

  get busy() {
    return this.phase !== 'idle';
  }

  load(id: string, byShip = false) {
    const def = SCENES[id];
    if (!def) throw new Error(`unknown scene ${id}`);
    this.realm?.dispose();
    const realm = buildRealm(def);
    this.realm = realm;
    this.scene.add(realm.root);
    applyMaterialMood(def.mood);
    this.pipe.applyMood(def.mood);

    const spot = (byShip && def.arrival) || def.spawn;
    const at = dirAt(spot.at);
    this.prince.enter(realm.planet, realm.obstacles, at, spot.heading);
    this.prince.root.visible = true;
    this.rig.reset(at);
    this.rig.zoom = byShip ? 0.05 : 0.82;
    this.rig.zoomGoal = 0.82;

    // Shadow frustum sized to this world.
    const r = def.planet.radius;
    Object.assign(this.sun.shadow.camera, { left: -r * 1.3, right: r * 1.3, top: r * 1.3, bottom: -r * 1.3, near: 1, far: r * 9 });
    this.sun.shadow.camera.updateProjectionMatrix();

    this.state.sceneId = id;
    sceneSlot(this.state, id).visits++;
    this.onArrive(realm);
  }

  travel(to: string) {
    if (this.busy || !SCENES[to]) return;
    this.dest = to;
    this.phase = 'lift';
    this.timer = 0;
    this.prince.root.visible = false; // boarded
    this.rig.zoomGoal = 0;
  }

  update(dt: number) {
    if (this.phase === 'idle') return;
    this.timer += dt;
    if (this.phase === 'lift' && this.timer > 1.1) {
      this.phase = 'fadeOut';
      this.timer = 0;
    } else if (this.phase === 'fadeOut') {
      this.pipe.fade = Math.min(1, this.timer / 0.6);
      if (this.timer > 0.7) {
        this.load(this.dest, true);
        this.phase = 'fadeIn';
        this.timer = 0;
      }
    } else if (this.phase === 'fadeIn') {
      this.pipe.fade = Math.max(0, 1 - this.timer / 0.8);
      if (this.timer > 0.8) {
        this.pipe.fade = 0;
        this.phase = 'idle';
      }
    }
  }
}
