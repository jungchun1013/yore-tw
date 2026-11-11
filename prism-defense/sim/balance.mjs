import {Game,TOWERS,MAPS,makePath,CELL,position} from '../src/engine.mjs';
export function plan(g,policy='mixed'){
 const allowed=TOWERS[policy]?[policy]:policy==='no-slow'?['pulse','cannon','beam','chain','bloom']:['pulse','cannon','frost','beam','chain','bloom'];
 let actions=0;while(actions++<80){let best=null,score=0;
 for(const type of allowed){if(g.cost(type)>g.cash)continue;const s=TOWERS[type];for(let x=0;x<18;x++)for(let y=0;y<12;y++){if(!g.canBuild(x,y))continue;const center={x:(x+.5)*CELL,y:(y+.5)*CELL};const covered=g.path.filter(p=>Math.hypot((p[0]+.5)*CELL-center.x,(p[1]+.5)*CELL-center.y)<s.range).length;
 const counts=g.towers.filter(t=>t.type===type).length;const factor=type==='frost'?(g.towers.length>2&&counts<Math.ceil(g.towers.length/6)?1.8:.12):type==='cannon'?1.65:type==='chain'?1.85:type==='bloom'?2.5:type==='beam'?1.1:1;
 const value=covered*s.damage/s.rate/g.cost(type)*factor/(1+counts*.035);if(value>score){score=value;best={type,x,y};}}}
 for(const t of g.towers){if(t.level>=5||g.upgradeCost(t)>g.cash)continue;const s=g.stats(t);const covered=g.path.filter(p=>Math.hypot((p[0]+.5)*CELL-(t.x+.5)*CELL,(p[1]+.5)*CELL-(t.y+.5)*CELL)<s.range).length;const factor=t.type==='cannon'?1.65:t.type==='chain'?1.85:t.type==='bloom'?2.5:t.type==='frost'?.2:1;const v=covered*s.damage/s.rate*.6/g.upgradeCost(t)*factor;if(v>score){score=v;best={upgrade:t};}}
 if(!best||score<=0)break;if(best.upgrade)g.upgrade(best.upgrade);else g.build(best.type,best.x,best.y);
 }
}
export function simulate(map,difficulty,policy='mixed',research=[]){const g=new Game({map,difficulty,research});let steps=0;while(!['lost','won'].includes(g.state)&&steps<100000){if(g.state==='planning'){if(policy!=='empty')plan(g,policy);g.startWave();}g.tick(.05);g.effects.length=0;steps++;}return{map,difficulty,policy,state:g.state,wave:g.wave,lives:g.lives,leaked:g.leaked,kills:g.kills,towers:g.towers.length,seconds:Math.round(steps*.05),composition:g.towers.reduce((o,t)=>(o[t.type]=(o[t.type]||0)+1,o),{})};}
if(typeof process!=='undefined'&&process.argv[1]?.endsWith('balance.mjs')){const results=[];for(const m of MAPS)for(const d of ['calm','normal','hard'])for(const p of ['empty','pulse','mixed'])results.push(simulate(m.id,d,p));console.table(results);console.log(JSON.stringify(results,null,2));}
