import * as THREE from 'three';
import { dirAt } from '../world/planet';
import { param, type PropModule } from './kit';
import { BuildingKit } from './buildingKit';

const WOOD=[0x9d886f,0xad9579,0x96816b,0xb19a7e];
/** Narrow utility hut: modest siding and a long red roof, no ornate finials. */
export const rusticHut: PropModule={
  prepare(planet,p){planet.flats.push({dir:dirAt(p.at),radius:planet.ang(1.25)});},
  build({planet},p){
    const k=new BuildingKit(1803); const tier=param(p,'tier',1);
    k.root.name='rustic-red-hut';k.root.userData.building={family:'plank',tier,roof:'red-shingle'};
    const w=0.49,d=0.59,eave=1.27,ridge=2.28;
    const roofY=(x:number)=>ridge-Math.abs(x)*1.72+Math.pow(Math.abs(x)/0.76,4)*0.12;
    // Raised timber platform and spare posts: utility architecture rather than a palace.
    for(const x of [-0.45,0.45])for(const z of [-0.53,0.6])k.box(0.12,0.17,0.12,x,0.07,z,0x786650);
    for(let i=0;i<12;i++)k.box(0.095,0.065,1.52,-0.57+i*0.103,0.17,0.1,k.pick(WOOD));
    for(const side of [-1,1]){
      for(let i=0;i<10;i++){
        const x=-w+(i+0.5)*w/5;
        k.box(w/5-0.003,eave-0.22,0.045,x,(eave+0.22)/2,side*d,k.pick(WOOD));
        const z=-d+(i+0.5)*d/5;
        k.box(0.045,eave-0.22,d/5-0.003,side*w,(eave+0.22)/2,z,k.pick(WOOD));
      }
      k.gable(w,eave,ridge-0.1,side*d,k.pick(WOOD));
      k.box(1.08,0.065,0.07,0,eave-0.09,side*(d+0.02),0x8c7358);
      k.beam({x:0,y:eave,z:side*(d+0.04)},{x:0,y:ridge-0.12,z:side*(d+0.04)},0.05,0x8c7358);
      for(const x of [-w,w])k.box(0.07,eave-0.18,0.07,x,(eave+0.18)/2,side*d,0x8e765c);
    }
    // Dark recess and closed, braced plank door; a tiny vent gives an outhouse-like scale.
    k.box(0.48,0.83,0.02,-0.06,0.64,d+0.03,0x5d5144);
    for(let i=0;i<5;i++)k.box(0.079,0.77,0.035,-0.26+i*0.083,0.64,d+0.052,k.pick(WOOD));
    for(const y of [0.32,0.96])k.box(0.44,0.036,0.025,-0.06,y,d+0.08,0x7d6852);
    k.beam({x:-0.25,y:0.35,z:d+0.08},{x:0.12,y:0.93,z:d+0.08},0.032,0x8b7256);
    k.box(0.035,0.035,0.03,0.09,0.66,d+0.09,0x544b42);
    for(const x of [-0.075,0,0.075])k.box(0.035,0.12,0.012,x,1.59,d+0.036,0x584e44);
    // Small door hood, fully below the main roof.
    const hood=new THREE.BoxGeometry(0.57,0.035,0.2);hood.rotateX(0.22);hood.translate(-0.06,1.13,d+0.12);k.add(hood,0x8f775b);
    k.roof(0.76,0.8,roofY,[0x934346,0xa8514e,0xb15a54,0x9e4a48],11,0x836b51);
    // Simple ridge board and side porch; no rooster, chains or decorative ladders.
    k.box(0.06,0.06,1.64,0,ridge-0.025,0,0x715e4b);
    for(const z of [-0.44,0.57])k.box(0.065,0.8,0.065,0.72,0.58,z,0x8c7358);
    for(let i=0;i<3;i++)k.box(0.61,0.055,0.105,-0.03,0.15-i*0.045,0.9+i*0.1,k.pick(WOOD));
    if(tier>=2){k.window(0.51,0.83,0.05,0.2,0.28,true);}
    const g=k.finish(),dir=dirAt(p.at);planet.place(g,dir,p.yaw??0,0.02);
    return {object:g,obstacles:[{dir,radius:0.92}]};
  },
};
