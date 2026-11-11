import * as THREE from 'three';
import { dirAt } from '../world/planet';
import { makeRand, mesh, type PropModule } from './kit';
import { lumpy } from './geo';
import { shared } from '../render/materials';

/** Small campsite fire: solid flame silhouettes, layered colour, glowing embers. */
export const campfire: PropModule = {
  prepare(planet, p) { planet.flats.push({ dir: dirAt(p.at), radius: planet.ang(0.85) }); },
  build({ planet }, p) {
    const rand = makeRand(607);
    const g = new THREE.Group(); g.name = 'campfire';
    g.userData.inspection = { target: [0, 0.28, 0], camera: [1.7, 1.35, 2.3] };
    const ash = mesh(new THREE.CylinderGeometry(0.39, 0.41, 0.045, 16), 0x694837, { rim: 0.05 });
    ash.position.y = 0.025; g.add(ash);
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * Math.PI * 2;
      const stone = mesh(lumpy(0.12, 1, 0.16, i + 93), [0xb69b80, 0xc4aa89, 0xa58a77][i % 3], { rim: 0.25 });
      stone.position.set(Math.cos(a) * 0.45, 0.07, Math.sin(a) * 0.45);
      stone.scale.set(1.18, 0.72, 0.9); stone.rotation.y = a; g.add(stone);
    }
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Group();
      const wood = mesh(new THREE.CylinderGeometry(0.067, 0.079, 0.66, 9), i % 2 ? 0x82512b : 0x694023, { rim: 0.15 });
      log.add(wood);
      for (const side of [-1, 1]) {
        const cut = mesh(new THREE.CylinderGeometry(0.059, 0.059, 0.008, 9), 0xc79758, { rim: 0.1 });
        cut.position.y = side * 0.332; log.add(cut);
        const heart = mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.009, 8), 0xa46d37, { rim: 0 });
        heart.position.y = side * 0.336; log.add(heart);
      }
      log.rotation.set(Math.PI / 2, 0, i < 2 ? 0.28 : 1.84);
      log.position.set(i < 2 ? (i - 0.5) * 0.20 : 0, i < 2 ? 0.10 : 0.20, i < 2 ? 0 : (i - 2.5) * 0.15);
      g.add(log);
    }
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2, r = Math.sqrt(rand()) * 0.28;
      const coal = mesh(new THREE.IcosahedronGeometry(0.025 + rand() * 0.018, 0), i % 3 ? 0xee6422 : 0xffbc43, { emissive: 0.8, glow: true, rim: 0 });
      coal.position.set(Math.cos(a) * r, 0.06, Math.sin(a) * r); coal.scale.y = 0.5; g.add(coal);
    }
    const flameMat = new THREE.ShaderMaterial({
      uniforms: { uTime: shared.uTime },
      vertexShader: `varying float vHeight; varying vec3 vTint; attribute vec3 color; uniform float uTime;
      void main(){vHeight=position.y;vTint=color;vec3 p=position;
      float tip=smoothstep(0.05,0.7,p.y);p.x+=sin(uTime*5.2+p.y*9.0)*0.045*tip;
      p.z+=cos(uTime*4.1+p.y*7.0)*0.028*tip;p.y*=1.0+0.06*sin(uTime*6.0+p.x*11.0);
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
      fragmentShader: `varying float vHeight;varying vec3 vTint;
      void main(){float band=floor(clamp(vHeight/0.75,0.0,0.999)*3.0)/3.0;
      gl_FragColor=vec4(vTint*mix(1.65,1.05,band),1.0);}`,
    });
    const flameParts = new THREE.Group(); g.add(flameParts);
    const tongue = (x: number, z: number, h: number, width: number, hex: number, phase: number) => {
      const pos: number[] = [], indices: number[] = [], colors: number[] = [];
      const c = new THREE.Color(hex), rows = 16, cols = 14;
      for (let j = 0; j <= rows; j++) {
        const t = j / rows;
        const r = width * Math.pow(Math.sin(Math.PI * (0.12 + t * 0.88)), 0.85) * (1 - t * 0.60);
        for (let i = 0; i <= cols; i++) {
          const a = i / cols * Math.PI * 2;
          pos.push(x + Math.sin(a) * r + Math.sin(t * 3.2 + phase) * t * t * 0.08, 0.13 + h * t, z + Math.cos(a) * r);
          colors.push(c.r, c.g, c.b);
        }
      }
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const k = j * (cols + 1) + i; indices.push(k,k+cols+1,k+1,k+1,k+cols+1,k+cols+2); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors,3)); geo.setIndex(indices); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo,flameMat); m.castShadow = false; flameParts.add(m);
    };
    for (let i = 0; i < 5; i++) { const a=i/5*Math.PI*2; tongue(Math.cos(a)*0.12,Math.sin(a)*0.12,0.33+rand()*0.18,0.085, i%2?0xff8e24:0xf35b18,i); }
    tongue(0,0,0.58,0.105,0xffb52e,0.3);
    tongue(0,0.13,0.23,0.07,0xffe99b,1);
    const sparks = Array.from({length:9},(_,i)=>{
      const m=mesh(new THREE.BoxGeometry(0.014,0.022,0.014),0xffc45b,{emissive:1,glow:true,rim:0});
      m.userData.phase=rand();m.userData.seed=i*2.4;g.add(m);return m;
    });
    // The shared toon shader evaluates this local light too, so nearby surfaces
    // receive warm light instead of merely putting a glow sprite over the ground.
    const light=new THREE.PointLight(0xff9c42,1.35,2.7,2); light.position.set(0,0.48,0);g.add(light);
    const d=dirAt(p.at);planet.place(g,d,p.yaw??0,0);
    return {object:g,obstacles:[{dir:d,radius:0.59}],update(t){
      light.intensity=1.25+0.14*Math.sin(t*7.1)+0.09*Math.sin(t*11.7);
      for(const s of sparks){const life=(t*0.28+s.userData.phase)%1;const seed=s.userData.seed;
        s.position.set(Math.sin(seed+life*5)*(.07+life*.13),.30+life*.90,Math.cos(seed+life*4)*(.06+life*.12));
        s.scale.setScalar(Math.sin(life*Math.PI)*0.85);}
    }};
  },
};
