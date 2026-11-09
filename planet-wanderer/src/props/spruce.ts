import * as THREE from 'three';
import { dirAt } from '../world/planet';
import { limb } from './fence';
import { makeRand, mesh, param, type PropModule } from './kit';
import { merge, paint } from './geo';

/** Stylized Norway-spruce study: tapering leader and drooping, lobed whorls.
 * Each skirt has a closed underside; the silhouette is not a stack of cones. */
export const spruce:PropModule={
  build({planet},p){
    const rand=makeRand(param(p,'seed',718));const scale=param(p,'scale',1);
    const bark:THREE.BufferGeometry[]=[],needles:THREE.BufferGeometry[]=[];
    bark.push(paint(limb(new THREE.Vector3(0,-0.06,0),new THREE.Vector3(0.015,2.95,0),0.09,0.012,10),0x8a7760));
    const tones=[0x557f75,0x638c7b,0x719984,0x81a18a];
    for(let tier=0;tier<6;tier++){
      const base=0.38+tier*0.365,r=0.73*(1-tier/7.2),rise=0.78-tier*0.045;
      const points=[new THREE.Vector2(0.018,base+0.12),new THREE.Vector2(r*0.67,base+0.025),new THREE.Vector2(r,base),new THREE.Vector2(r*0.81,base+0.16),new THREE.Vector2(r*0.37,base+rise*0.65),new THREE.Vector2(0.012,base+rise)];
      const geo=new THREE.LatheGeometry(points,48);const pos=geo.getAttribute('position');
      const phase=tier*0.8+rand()*0.25;
      for(let i=0;i<pos.count;i++){
        const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i);const a=Math.atan2(z,x);const radial=Math.hypot(x,z);
        const bough=Math.cos(a*7+phase);const influence=Math.min(1,radial/r);
        const k=1+0.1*bough*influence;
        pos.setXYZ(i,x*k,y-0.065*(0.5+bough*0.5)*influence*influence,z*k);
      }
      geo.computeVertexNormals();needles.push(paint(geo,tones[Math.min(3,Math.floor(tier/2))],0.035,rand));
      for(let b=0;b<7;b++){
        const a=b/7*Math.PI*2+phase;
        bark.push(paint(limb(new THREE.Vector3(0,base+0.22,0),new THREE.Vector3(Math.cos(a)*r*0.9,base+0.015,Math.sin(a)*r*0.9),0.016,0.005,5),0x8a7760));
      }
    }
    const tip=new THREE.LatheGeometry([new THREE.Vector2(0.001,2.39),new THREE.Vector2(0.13,2.42),new THREE.Vector2(0.035,2.88),new THREE.Vector2(0.001,3.15)],24);
    needles.push(paint(tip,0x8ba78b));
    const g=new THREE.Group();g.name='norway-spruce';g.userData.inspection={target:[0,1.55,0],camera:[3.3,2.8,6]};g.userData.species='Picea abies (stylized)';
    g.add(mesh(merge(bark),0xffffff,{vertexColors:true}),mesh(merge(needles),0xffffff,{vertexColors:true}));
    g.scale.setScalar(scale);const dir=dirAt(p.at);planet.place(g,dir,p.yaw??0,0.025);
    return {object:g,obstacles:[{dir,radius:0.27*scale}]};
  },
};
