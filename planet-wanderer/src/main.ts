import * as THREE from 'three';
import './style.css';
import { PixelPipeline, type OutlineMode, type RenderStyle } from './render/pipeline';
import { shared } from './render/materials';
import { dirOf } from './world/planet';
import { Prince } from './world/prince';
import { FIRST_SCENE } from './scenes';
import { CameraRig } from './game/cameraRig';
import { Input } from './game/input';
import { SceneManager } from './game/sceneManager';
import { newGame } from './game/state';
import { Hud } from './ui/hud';

// Colours are authored in sRGB and passed straight through.
THREE.ColorManagement.enabled = false;

const canvas = document.getElementById('view') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
const pipe = new PixelPipeline(renderer);

const scene = new THREE.Scene();
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

const rig = new CameraRig();
const camera = rig.camera;
const prince = new Prince();
scene.add(prince.root);
const state = newGame(FIRST_SCENE);
const scenes = new SceneManager(scene, pipe, rig, prince, sun, state);

/* ------------------------------------------------------------------ interaction */

const INTERACT_RANGE = 1.7; // world units from the traveller
function nearbyExit() {
  const realm = scenes.realm;
  if (!realm || scenes.busy) return null;
  let best = null;
  let bestD = INTERACT_RANGE;
  for (const it of realm.interactables) {
    const d = it.object.position.distanceTo(prince.root.position);
    if (d < bestD) {
      best = it;
      bestD = d;
    }
  }
  return best;
}
function interact() {
  const it = nearbyExit();
  if (it) scenes.travel(it.exit.to);
}

let goal: THREE.Vector3 | null = null;
const ray = new THREE.Raycaster();
function tapAt(x: number, y: number) {
  const realm = scenes.realm;
  if (!realm || scenes.busy) return;
  const rect = canvas.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1), camera);
  // Tapping a door (the ship) while close enough uses it; otherwise walk there.
  for (const it of realm.interactables) {
    if (ray.intersectObject(it.object, true).length && nearbyExit() === it) return interact();
  }
  const hit = ray.intersectObject(realm.ground, false)[0];
  if (hit) {
    goal = hit.point.clone().normalize();
    rig.followPause = 0;
  }
}

const input = new Input(canvas, {
  drag: (dx, dy) => rig.rotateBy(dx, dy, prince),
  zoom: (d) => (rig.zoomGoal = THREE.MathUtils.clamp(rig.zoomGoal + d, 0, 1)),
  tap: tapAt,
  interact,
});

function steer(): THREE.Vector3 {
  if (scenes.busy) return new THREE.Vector3();
  const s = input.stick;
  if (s.lengthSq() > 0) {
    goal = null;
    rig.followPause = 0;
    const { fwd, right } = rig.groundAxes(prince.dir);
    return fwd.multiplyScalar(s.y).addScaledVector(right, s.x);
  }
  if (goal) {
    if (goal.angleTo(prince.dir) < 0.012) {
      goal = null;
      return new THREE.Vector3();
    }
    return goal.clone().sub(prince.dir);
  }
  return new THREE.Vector3();
}

/* ------------------------------------------------------------------ HUD */

const PX = [3, 4, 2, 1];
const hud = new Hud(document.getElementById('hud')!, {
  toggleView: () => (rig.zoomGoal = rig.zoomGoal > 0.5 ? 0 : 0.85),
  cyclePixel: () => {
    pipe.pxSize = PX[(PX.indexOf(pipe.pxSize) + 1) % PX.length];
    resize();
    return `混色格 ×${pipe.pxSize}`;
  },
  setStyle: (s) => {
    pipe.setStyle(s);
    rig.backlit = s === 'sky';
    resize();
  },
  setOutline: (o) => (pipe.outline = o),
  cycleEdges: () => {
    shared.uDither.value = (shared.uDither.value + 1) % 3;
    return shared.uDither.value;
  },
  interact,
});
function resize() {
  pipe.resize(innerWidth, innerHeight, Math.min(devicePixelRatio || 1, 2));
  camera.aspect = pipe.lowW / pipe.lowH;
  camera.updateProjectionMatrix();
}
scenes.onArrive = (realm) => {
  goal = null;
  hud.arrive(realm.def.name.zh);
};
scenes.load(state.sceneId);

/* ------------------------------------------------------------------ loop */

addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
const tmp = new THREE.Vector3();
let frames = 0;
let portraitView = false;
let inspectName: string | null = null;

function screenOf(p: THREE.Vector3) {
  tmp.copy(p).project(camera);
  const u = pipe.composite.uniforms.uScreen.value as THREE.Vector2;
  return new THREE.Vector2((tmp.x * 0.5 + 0.5) * u.x, (tmp.y * 0.5 + 0.5) * u.y);
}

function frame() {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  const t = clock.elapsedTime;
  shared.uTime.value = t;
  const realm = scenes.realm!;
  const planet = realm.planet;

  prince.move(steer(), dt);
  prince.animate(t);
  realm.update(t, dt);
  scenes.update(dt);
  rig.update(dt, planet, prince);
  // Art-review camera: look straight at the face at body height, without
  // changing the gameplay camera's zoom or orbit settings.
  if (portraitView) {
    const target = prince.root.position.clone().addScaledVector(prince.dir, 0.49);
    camera.position.copy(target).addScaledVector(prince.forward, 2.5);
    camera.up.copy(prince.dir);
    camera.lookAt(target);
    rig.focusDist = camera.position.distanceTo(target);
  }
  const inspected = inspectName ? realm.root.getObjectByName(inspectName) : null;
  if (inspected) {
    const framing = inspected.userData.inspection as { target: number[]; camera: number[] } | undefined;
    const target = inspected.localToWorld(new THREE.Vector3().fromArray(framing?.target ?? [0.35, 1.05, 0]));
    camera.position.copy(inspected.localToWorld(new THREE.Vector3().fromArray(framing?.camera ?? [3.4, 2.8, 5.4])));
    camera.up.copy(inspected.getWorldPosition(new THREE.Vector3())).normalize();
    camera.lookAt(target);
    rig.focusDist = camera.position.distanceTo(target);
  }
  pipe.focus = rig.focusDist;
  // Floating clouds belong to the planet view; close up they would block the camera.
  const clouds = realm.root.getObjectByName('clouds');
  if (clouds) clouds.visible = rig.eased < 0.45;
  shared.uLightDir.value.copy(rig.light);
  sun.position.copy(rig.light).multiplyScalar(planet.radius * 4);
  hud.setView(rig.zoomGoal > 0.5);
  const near = nearbyExit();
  hud.setPrompt(near ? `E · ${near.exit.label.zh}` : null);

  const u = pipe.composite.uniforms;
  u.uTime.value = t;
  u.uSkyScroll.value.copy(rig.skyScroll);
  u.uLightView.value.copy(rig.light).transformDirection(camera.matrixWorldInverse);
  if (pipe.style === 'sky') {
    // Where the sun sits on screen (far along the light direction), for glare and rays.
    // The camera looks down with a narrow lens, so the true sun is above the frame;
    // pin it to the top edge and let glare and rays pour in from there.
    const sp = screenOf(camera.position.clone().addScaledVector(rig.light, 500));
    const sc = u.uScreen.value as THREE.Vector2;
    u.uSunPos.value.set(THREE.MathUtils.clamp(sp.x / sc.x, 0.2, 0.8), THREE.MathUtils.clamp(sp.y / sc.y, 0.6, 1.04));
  } else u.uSunPos.value.set(0.16, 0.95);
  const screenH = (u.uScreen.value as THREE.Vector2).y;
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = camera.position.length();
  const c = screenOf(new THREE.Vector3());
  const rad = (Math.tan(Math.asin(Math.min(0.999, (planet.radius + 0.1) / dist))) / tanHalf) * (screenH / 2);
  u.uPlanet.value.set(c.x, c.y, rad);

  // Soul-light glow (first glow anchor): hidden when the planet is in the way.
  const anchor = realm.glowAnchors[0];
  if (anchor) {
    const wp = anchor.getWorldPosition(new THREE.Vector3());
    const toW = wp.clone().sub(camera.position);
    const len = toW.length();
    ray.set(camera.position, toW.normalize());
    const hitP = ray.ray.intersectSphere(new THREE.Sphere(new THREE.Vector3(), planet.radius), new THREE.Vector3());
    const blocked = hitP && hitP.distanceTo(camera.position) < len - 0.2;
    u.uWispVis.value = THREE.MathUtils.damp(u.uWispVis.value, blocked ? 0 : 1, 8, dt);
    const ws = screenOf(wp);
    u.uWispPos.value.set(ws.x, ws.y, (0.32 / (len * tanHalf)) * (screenH / 2));
  } else u.uWispVis.value = 0;

  pipe.render(scene, camera);
  frames++;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ------------------------------------------------------------------ test hooks */

declare global {
  interface Window {
    __pw: {
      frames: () => number;
      zoom: (z: number) => void;
      teleport: (lat: number, lon: number, heading?: number) => void;
      scene: () => string;
      busy: () => boolean;
      travel: (to: string) => void;
      geometries: () => number;
      nearExit: () => string | null;
      interact: () => void;
      look: (style: RenderStyle, outline: OutlineMode) => void;
      hud: (on: boolean) => void;
      portrait: (on: boolean) => void;
      inspect: (name: string | null) => void;
    };
  }
}
window.__pw = {
  portrait: (on) => { portraitView = on; },
  inspect: (name) => { inspectName = name; },
  frames: () => frames,
  zoom: (z) => {
    rig.zoomGoal = rig.zoom = z;
  },
  teleport: (lat, lon, heading = 180) => {
    const r = scenes.realm!;
    prince.enter(r.planet, r.obstacles, dirOf(lat, lon), heading);
    goal = null;
  },
  scene: () => state.sceneId,
  busy: () => scenes.busy,
  travel: (to) => scenes.travel(to),
  geometries: () => renderer.info.memory.geometries,
  nearExit: () => nearbyExit()?.exit.to ?? null,
  interact,
  look: (style, outline) => hud.setLook(style, outline),
  hud: (on) => ((document.getElementById('hud') as HTMLElement).style.display = on ? '' : 'none'),
};
