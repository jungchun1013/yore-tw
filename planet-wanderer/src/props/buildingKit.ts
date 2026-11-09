import * as THREE from 'three';
import { limb } from './fence';
import { makeRand, mesh } from './kit';
import { merge, paint, xf } from './geo';

/** Reusable construction pieces. Roof trim and shingles share an elevation
 * function, so changing pitch/material in a future upgrade preserves clearances. */
export class BuildingKit {
  readonly root = new THREE.Group();
  readonly rand: () => number;
  private parts = new Map<string, THREE.BufferGeometry[]>();
  constructor(seed: number) { this.rand = makeRand(seed); }
  pick(colors: readonly number[]) { return colors[Math.floor(this.rand() * colors.length)]; }
  add(geo: THREE.BufferGeometry, color: number, bucket = 'solid') {
    const parts = this.parts.get(bucket) ?? [];
    parts.push(paint(geo, color, 0.025, this.rand)); this.parts.set(bucket, parts);
  }
  box(w: number, h: number, d: number, x: number, y: number, z: number, color: number) {
    this.add(xf(new THREE.BoxGeometry(w, h, d), { x, y, z }), color);
  }
  beam(a: THREE.Vector3Like, b: THREE.Vector3Like, width: number, color: number) {
    const start = new THREE.Vector3(a.x, a.y, a.z), end = new THREE.Vector3(b.x, b.y, b.z);
    const geo = new THREE.BoxGeometry(width, start.distanceTo(end), width);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), end.clone().sub(start).normalize()));
    const mid = start.add(end).multiplyScalar(0.5); geo.translate(mid.x, mid.y, mid.z); this.add(geo, color);
  }
  log(a: THREE.Vector3, b: THREE.Vector3, radius: number, color: number, endGrain = false) {
    this.add(limb(a, b, radius, radius * 0.98, 14), color);
    if (!endGrain) return;
    const dir = b.clone().sub(a).normalize();
    for (const [p, sign] of [[a,-1],[b,1]] as const) {
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir.clone().multiplyScalar(sign));
      const cap = new THREE.CircleGeometry(radius * 0.93, 20);
      cap.applyQuaternion(q); cap.translate(...p.clone().addScaledVector(dir, sign * 0.001).toArray()); this.add(cap, 0xc3a07a);
      for (const r of [0.43, 0.72]) {
        const ring = new THREE.TorusGeometry(radius * r, 0.0025, 3, 24);
        ring.applyQuaternion(q); ring.translate(...p.clone().addScaledVector(dir, sign * 0.003).toArray()); this.add(ring, 0x9b7959);
      }
    }
  }
  gable(halfW: number, eave: number, ridge: number, z: number, color: number) {
    const outline = new THREE.Shape(); outline.moveTo(-halfW,eave); outline.lineTo(halfW,eave); outline.lineTo(0,ridge); outline.closePath();
    const geo = new THREE.ExtrudeGeometry(outline, { depth: 0.06, bevelEnabled: false }); geo.translate(0,0,z-0.03); this.add(geo,color);
  }
  roof(halfW: number, halfD: number, height: (x: number, z: number) => number, colors: readonly number[], rows: number, trimColor: number) {
    const cols = Math.ceil(halfD * 2 / 0.18), dz = halfD * 2 / cols;
    for (const side of [-1,1]) for (let r=0;r<rows;r++) for (let c=-1;c<cols;c++) {
      const x0=side*halfW*r/rows, x1=side*halfW*(r+1)/rows;
      const z0=Math.max(-halfD,-halfD+(c+(r%2)*0.5)*dz);
      const z1=Math.min(halfD,-halfD+(c+1+(r%2)*0.5)*dz); if(z1<=z0)continue;
      const corners=[[Math.min(x0,x1),z0],[Math.max(x0,x1),z0],[Math.max(x0,x1),z1],[Math.min(x0,x1),z1]];
      const pos:number[]=[]; for(const offset of [0,-0.035]) for(const [x,z] of corners)pos.push(x,height(x,z)+offset,z);
      const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
      geo.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);geo.computeVertexNormals();this.add(geo,this.pick(colors),'roof');
    }
    // Fascia is cut from the same roof function, rather than a square beam
    // offset below a slope: this closes daylight gaps without piercing tiles.
    const fascia=(x0:number,x1:number,z0:number,z1:number)=>{
      const pos:number[]=[];
      for(const offset of [-0.036,-0.155])for(const [x,z]of [[x0,z0],[x1,z0],[x1,z1],[x0,z1]])pos.push(x,height(x,z)+offset,z);
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
      geo.setIndex([0,2,1,0,3,2,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7]);const flat=geo.toNonIndexed();flat.computeVertexNormals();this.add(flat,trimColor);geo.dispose();
    };
    for(let i=0;i<32;i++){
      const x0=-halfW+2*halfW*i/32,x1=-halfW+2*halfW*(i+1)/32;
      fascia(x0,x1,-halfD,-halfD+0.075);fascia(x0,x1,halfD-0.075,halfD);
    }
    for(let i=0;i<24;i++){
      const z0=-halfD+2*halfD*i/24,z1=-halfD+2*halfD*(i+1)/24;
      fascia(-halfW,-halfW+0.07,z0,z1);fascia(halfW-0.07,halfW,z0,z1);
    }
  }

  window(x: number,y: number,z: number,w: number,h: number,side=false,arched=false) {
    const window = new THREE.Group(); window.position.set(x,y,z); if(side)window.rotation.y=Math.PI/2;
    const shape=new THREE.Shape(); const r=w/2;
    shape.moveTo(-r,-h/2);shape.lineTo(r,-h/2);
    if(arched){shape.lineTo(r,h/2-r);shape.absarc(0,h/2-r,r,0,Math.PI,false);}else{shape.lineTo(r,h/2);shape.lineTo(-r,h/2);}
    shape.closePath();
    const frame=new THREE.ExtrudeGeometry(shape,{depth:0.04,bevelEnabled:false});
    window.add(mesh(frame,0x73533c));
    const pane=new THREE.ShapeGeometry(shape); pane.scale(0.77,0.84,1); pane.translate(0,0,0.043);
    window.add(mesh(pane,0xffda91,{emissive:0.35,noOutline:true}));
    const bar=(ww:number,hh:number)=>{const m=mesh(new THREE.BoxGeometry(ww,hh,0.027),0xa77a50);m.position.z=0.063;window.add(m);};
    bar(0.022,h*0.84);bar(w*0.79,0.022);
    const sill=mesh(new THREE.BoxGeometry(w+0.1,0.055,0.11),0xb0875d);sill.position.set(0,-h/2,0.02);window.add(sill);
    this.root.add(window);
  }
  finish() {
    for(const parts of this.parts.values())this.root.add(mesh(merge(parts),0xffffff,{vertexColors:true}));
    return this.root;
  }
}
