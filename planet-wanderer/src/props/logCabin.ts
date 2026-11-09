import * as THREE from 'three';
import { dirAt } from '../world/planet';
import { blob, mesh, param, type PropModule } from './kit';
import { BuildingKit } from './buildingKit';

const LOGS=[0x997b5e,0xa38565,0xaf8f6b,0x917458];
/** Boreal branch: horizontal logs, projecting corner joints and warm small windows. */
export const logCabin: PropModule={
  prepare(planet,p){planet.flats.push({dir:dirAt(p.at),radius:planet.ang(1.5)});},
  build({planet},p){
    const k=new BuildingKit(904);const tier=param(p,'tier',2);
    k.root.name='nordic-log-cabin';k.root.userData.inspection={target:[0,1.3,0],camera:[4.1,3.1,6.4]};k.root.userData.building={family:'log',tier,roof:'wood-shingle'};
    const w=0.83,d=0.67,base=0.19,step=0.17,eave=1.42,ridge=2.12;
    for(const x of [-0.79,0.79])for(const z of [-0.61,0.61])k.box(0.27,0.22,0.26,x,0.1,z,0xa6b0b4);
    k.box(1.78,0.11,1.47,0,0.17,0,0x735e49);
    // Split front logs around door and window: no stacked wood behind the glass.
    const spans=(y:number):[number,number][]=>{
      let result:[number,number][]=[[-0.97,0.97]];
      const openings:[number,number][]=[];
      if(y<1.18)openings.push([0.07,0.56]);
      if(y>0.55&&y<1.06)openings.push([-0.67,-0.21]);
      for(const [a,b]of openings)result=result.flatMap(([l,r])=>r<=a||l>=b?[[l,r] as [number,number]]:[...(l<a?[[l,a] as [number,number]]:[]),...(r>b?[[b,r] as [number,number]]:[])]);
      return result;
    };
    for(let row=0;row<7;row++){
      const y=base+step/2+row*step;
      for(const [a,b]of spans(y))k.log(new THREE.Vector3(a,y,d),new THREE.Vector3(b,y,d),0.095,k.pick(LOGS));
      k.log(new THREE.Vector3(-0.97,y,-d),new THREE.Vector3(0.97,y,-d),0.095,k.pick(LOGS));
      for(const x of [-w,w]){
        const yy=y+step/2;
        k.log(new THREE.Vector3(x,yy,-0.82),new THREE.Vector3(x,yy,0.82),0.095,k.pick(LOGS),true);
      }
    }
    // Shorter logs fill both gables and leave a real arched-window recess.
    for(let row=0;row<5;row++){
      const y=eave+row*0.145;const half=Math.max(0.08,(ridge-y)/0.83);
      for(const z of [-d,d]){
        if(z>0&&row<3){
          if(half>0.21){k.log(new THREE.Vector3(-half,y,z),new THREE.Vector3(-0.21,y,z),0.079,k.pick(LOGS));k.log(new THREE.Vector3(0.21,y,z),new THREE.Vector3(half,y,z),0.079,k.pick(LOGS));}
        }else k.log(new THREE.Vector3(-half,y,z),new THREE.Vector3(half,y,z),0.079,k.pick(LOGS));
      }
    }
    // Deep-set timber door, lintel, sill and two quiet glowing windows.
    k.box(0.53,1.04,0.035,0.32,0.72,d+0.023,0x65513e);
    for(let i=0;i<6;i++)k.box(0.068,0.94,0.04,0.115+i*0.076,0.72,d+0.06,k.pick(LOGS));
    for(const x of [0.045,0.6])k.box(0.075,1.06,0.12,x,0.72,d+0.07,0xbd9a6e);
    k.box(0.7,0.09,0.13,0.32,1.28,d+0.07,0xbd9a6e);
    const knob=mesh(blob(0.024,1),0x514b43);knob.position.set(0.14,0.72,d+0.1);k.root.add(knob);
    k.window(-0.44,0.81,d+0.09,0.44,0.5);
    k.window(0,1.66,d+0.07,0.33,0.43,false,true);
    // Lower-pitched brown shingles; broader silhouette than the red utility hut.
    const roofY=(x:number,z:number)=>ridge+0.075-Math.abs(x)*0.83+0.022*Math.pow(Math.abs(z)/0.96,2);
    k.roof(1.12,0.96,roofY,[0x746252,0x806e5b,0x8d7760,0x796453],8,0xb4936e);
    k.log(new THREE.Vector3(0,ridge+0.077,-0.99),new THREE.Vector3(0,ridge+0.077,0.99),0.068,0x8d7154,true);
    for(let i=0;i<10;i++)k.box(0.185,0.075,0.51,-0.94+i*0.205,0.15,0.99,k.pick(LOGS));
    k.box(0.95,0.07,0.2,0.24,0.06,1.31,0xad8c65);
    const smoke:THREE.Mesh[]=[];
    if(tier>=2){
      for(let row=0;row<6;row++)for(let c=0;c<2;c++){
        k.box(0.15,0.115,0.29,-0.64+c*0.15,1.78+row*0.115,-0.2,k.pick([0xa49b8b,0xb5aa96,0x8c887e]));
      }
      k.box(0.38,0.065,0.35,-0.56,2.46,-0.2,0x777b78);
      for(let i=0;i<3;i++){
        const puff=mesh(blob(0.065,2),0xe6e2d5,{noOutline:true});puff.castShadow=false;k.root.add(puff);smoke.push(puff);
      }
    }
    // A few modest stones and a wood pile instead of elaborate ornaments.
    for(const [x,z,r]of [[-1.08,0.95,0.12],[0.99,1.13,0.09],[-0.62,1.35,0.08]]){
      const rock=mesh(new THREE.DodecahedronGeometry(r),0xa9b4b4);rock.scale.y=0.65;rock.position.set(x,0.035,z);k.root.add(rock);
    }
    const g=k.finish(),dir=dirAt(p.at);planet.place(g,dir,p.yaw??0,0.02);
    return {object:g,obstacles:[{dir,radius:1.1}],update(t){smoke.forEach((puff,i)=>{const a=(t*0.18+i/3)%1;puff.position.set(-0.56+Math.sin(t+a*2)*0.04,2.52+a*0.65,-0.2-a*0.12);puff.scale.setScalar(0.55+Math.sin(a*Math.PI)*0.65);puff.visible=a<0.93;});}};
  },
};
