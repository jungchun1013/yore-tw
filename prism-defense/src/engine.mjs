export const COLS=18,ROWS=12,CELL=32;
export const TOWERS={
 pulse:{name:'脈衝',shape:'diamond',cost:35,range:102,damage:12,rate:.5,color:'#93eedc',desc:'快速單體射擊。便宜可靠，適合轉角。'},
 cannon:{name:'星爆',shape:'square',cost:65,range:124,damage:35,rate:1.65,splash:46,color:'#f5b8c9',desc:'爆炸範圍傷害。聚集的敵人越多越有效。'},
 frost:{name:'霜環',shape:'hex',cost:50,range:94,damage:6,rate:.9,slow:.48,color:'#a9c5ff',desc:'減速 48%，持續 1.5 秒。同類減速不疊加。'},
 beam:{name:'穿光',shape:'triangle',cost:80,range:150,damage:52,rate:1.35,pierce:true,color:'#edd58e',desc:'長射程、無視護甲。處理重裝與首領。'},
 chain:{name:'連鎖',shape:'bolt',cost:75,range:105,damage:23,rate:1.05,chain:3,color:'#cbb0ff',desc:'向附近三個目標跳電，後續傷害衰減。'},
 bloom:{name:'光暈',shape:'cross',cost:85,range:78,damage:17,rate:1.1,aura:true,color:'#e7efad',desc:'同時打擊範圍內所有敵人。適合密集迴彎。'}
};
export const RESEARCH=[
 ['power','聚焦',1,[], 'power','傷害 +8%'],['tempo','共振',2,['power'],'power','攻速 +8%'],['pierce','破甲',2,['tempo'],'power','一般攻擊忽略 20% 護甲'],['critical','星芒',3,['pierce'],'power','每五次攻擊，傷害加倍'],['overdrive','超頻',4,['critical'],'power','全塔傷害再 +18%'],
 ['reach','折射',1,[],'control','射程 +8%'],['cold','深冷',2,['reach'],'control','減速持續 +0.7 秒'],['blast','擴散',2,['cold'],'control','爆炸半徑 +20%'],['jump','迴響',3,['blast'],'control','連鎖多跳一個目標'],['spectrum','全光譜',4,['jump'],'control','每種不同塔使全塔傷害 +3%'],
 ['fund','種晶',1,[],'economy','開局資金 +25'],['bounty','回收',2,['fund'],'economy','擊殺金幣 +12%'],['build','晶格',2,['bounty'],'economy','建造費用 -8%'],['repair','自癒',3,['build'],'economy','每完成一波回復 1 點生命'],['interest','複利',4,['repair'],'economy','每波獎勵額外 +15 金幣']
].map(([id,name,cost,requires,branch,desc])=>({id,name,cost,requires,branch,desc}));
export const MAPS=[
 {id:'ribbon',name:'折返',desc:'長路徑與共用轉角，適合建立交叉火網。',points:[[0,3],[5,3],[5,8],[11,8],[11,3],[17,3]]},
 {id:'spiral',name:'內旋',desc:'敵人從外圈向內推進；中心區有很高覆蓋率。',points:[[0,2],[15,2],[15,9],[3,9],[3,5],[11,5],[11,7]]},
 {id:'switch',name:'交錯',desc:'迴彎較短，必須分散火力，防範高速敵人。',points:[[0,2],[6,2],[6,5],[12,5],[12,9],[17,9]]}
];
export const DIFFICULTIES={calm:{name:'舒緩',hp:.76,speed:.88,cash:200,lives:30},normal:{name:'標準',hp:1,speed:1,cash:170,lives:20},hard:{name:'過載',hp:1.9,speed:1.12,cash:150,lives:15}};
export function makePath(map){const cells=[];for(let i=1;i<map.points.length;i++){let[x,y]=map.points[i-1];const[tx,ty]=map.points[i];while(x!==tx||y!==ty){cells.push([x,y]);x+=Math.sign(tx-x);y+=Math.sign(ty-y);}}cells.push(map.points.at(-1));return cells;}
export function position(path,progress){const i=Math.min(path.length-1,Math.floor(progress/CELL)),t=(progress/CELL)%1,a=path[i],b=path[Math.min(i+1,path.length-1)];return{x:(a[0]+.5+(b[0]-a[0])*t)*CELL,y:(a[1]+.5+(b[1]-a[1])*t)*CELL};}
export function waveInfo(w){const boss=w%5===0;return{count:9+Math.floor(w*1.3),hp:29*Math.pow(1.155,w-1),gap:Math.max(.25,.85-w*.025),boss,label:boss?'首領 + 護衛':w%4===0?'重裝群':w%3===0?'疾行群':'混合群'};}
export class Game{
 constructor({map='ribbon',difficulty='normal',research=[]}={}){this.map=MAPS.find(m=>m.id===map)||MAPS[0];this.difficulty=difficulty;this.rules=DIFFICULTIES[difficulty]||DIFFICULTIES.normal;this.research=new Set(research);this.path=makePath(this.map);this.road=new Set(this.path.map(p=>p.join(',')));this.cash=this.rules.cash+(this.has('fund')?25:0);this.lives=this.rules.lives;this.maxLives=this.lives;this.wave=0;this.state='planning';this.enemies=[];this.towers=[];this.effects=[];this.kills=0;this.time=0;this.nextId=1;this.leaked=0;this.spawned=0;this.onWave=null;this.shots=0;}
 has(k){return this.research.has(k);}
 cost(type){return Math.round(TOWERS[type].cost*(this.has('build')?.92:1));}
 canBuild(x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<COLS&&y<ROWS&&!this.road.has(`${x},${y}`)&&!this.towers.some(t=>t.x===x&&t.y===y);}
 build(type,x,y){if(!TOWERS[type]||['lost','won'].includes(this.state)||!this.canBuild(x,y)||this.cash<this.cost(type))return false;const cost=this.cost(type);this.cash-=cost;const tower={id:this.nextId++,type,x,y,level:1,cooldown:0,spent:cost,kills:0,target:'first',shots:0};this.towers.push(tower);return tower;}
 upgradeCost(t){return Math.round(TOWERS[t.type].cost*(.7+t.level*.45));}
 upgrade(t){if(!this.towers.includes(t)||t.level>=5||this.cash<this.upgradeCost(t)||['lost','won'].includes(this.state))return false;const c=this.upgradeCost(t);this.cash-=c;t.spent+=c;t.level++;return true;}
 sell(t){if(!this.towers.includes(t)||['lost','won'].includes(this.state))return false;this.cash+=Math.floor(t.spent*.75);this.towers=this.towers.filter(x=>x!==t);return true;}
 stats(t){const b=TOWERS[t.type];const diversity=this.has('spectrum')?new Set(this.towers.map(x=>x.type)).size*.03:0;return{...b,range:b.range*(1+(t.level-1)*.055)*(this.has('reach')?1.08:1),damage:b.damage*Math.pow(1.5,t.level-1)*(1+(this.has('power')?.08:0)+(this.has('overdrive')?.18:0)+diversity),rate:b.rate/(1+(t.level-1)*.1)/(this.has('tempo')?1.08:1),splash:(b.splash||0)*(this.has('blast')?1.2:1)};}
 startWave(){if(this.state!=='planning')return false;this.wave++;this.state='running';this.spawned=0;this.spawnTimer=0;this.info=waveInfo(this.wave);return true;}
 spawn(){const i=this.spawned++,w=this.wave;let kind=this.info.boss&&i===0?'boss':w%4===0&&i%2===0?'armor':w%3===0&&i%2===0?'fast':i%5===4?'swarm':'normal';const hp=this.info.hp*this.rules.hp*({boss:9,armor:2,fast:.65,swarm:.5,normal:1}[kind]);this.enemies.push({id:this.nextId++,kind,hp,maxHp:hp,progress:0,speed:({boss:20,armor:25,fast:65,swarm:48,normal:37}[kind])*this.rules.speed,armor:kind==='armor'?.48:kind==='boss'?.25:0,slowUntil:0,slow:0,dead:false});}
 hit(e,dmg,t,s){if(e.dead)return;const armor=s.pierce?0:e.armor*(this.has('pierce')?.8:1);e.hp-=dmg*(1-armor);if(s.slow){e.slow=s.slow;e.slowUntil=this.time+1.5+(this.has('cold')?.7:0);}if(e.hp<=0){e.dead=true;this.kills++;t.kills++;this.cash+=Math.round((e.kind==='boss'?24:3+Math.floor(this.wave/6))*(this.has('bounty')?1.12:1));this.effects.push({kind:'kill',...position(this.path,e.progress),color:TOWERS[t.type].color,size:e.kind==='boss'?12:5});}}
 tick(dt){if(this.state!=='running')return;dt=Math.min(dt,.1);this.time+=dt;this.spawnTimer-=dt;if(this.spawned<this.info.count&&this.spawnTimer<=0){this.spawn();this.spawnTimer+=this.info.gap;}
 for(const e of this.enemies){if(e.dead)continue;e.progress+=e.speed*dt*(this.time<e.slowUntil?1-e.slow:1);if(e.progress>=(this.path.length-1)*CELL){e.dead=true;const n=e.kind==='boss'?5:1;this.lives-=n;this.leaked+=n;this.effects.push({kind:'leak',...position(this.path,e.progress),color:'#fb91a8',size:8});}}
 for(const t of this.towers){t.cooldown-=dt;if(t.cooldown>0)continue;const s=this.stats(t),x=(t.x+.5)*CELL,y=(t.y+.5)*CELL;let targets=this.enemies.filter(e=>!e.dead&&Math.hypot(position(this.path,e.progress).x-x,position(this.path,e.progress).y-y)<=s.range);targets.sort((a,b)=>t.target==='strong'?b.hp-a.hp:t.target==='last'?a.progress-b.progress:b.progress-a.progress);if(!targets.length)continue;t.cooldown=s.rate;t.shots++;this.shots++;const main=targets[0],p=position(this.path,main.progress),damage=s.damage*(this.has('critical')&&t.shots%5===0?2:1);let victims=[main];if(s.aura)victims=targets;else if(s.splash)victims=this.enemies.filter(e=>!e.dead&&Math.hypot(position(this.path,e.progress).x-p.x,position(this.path,e.progress).y-p.y)<=s.splash);else if(s.chain){victims=[main];let from=p;while(victims.length<s.chain+(this.has('jump')?1:0)){const next=this.enemies.filter(e=>!e.dead&&!victims.includes(e)&&Math.hypot(position(this.path,e.progress).x-from.x,position(this.path,e.progress).y-from.y)<85).sort((a,b)=>b.progress-a.progress)[0];if(!next)break;victims.push(next);from=position(this.path,next.progress);}}
 this.effects.push({kind:s.splash?'blast':s.aura?'aura':'shot',x,y,tx:p.x,ty:p.y,color:s.color,radius:s.splash||s.range});victims.forEach((e,i)=>{if(s.chain&&i)this.effects.push({kind:'shot',x:p.x,y:p.y,tx:position(this.path,e.progress).x,ty:position(this.path,e.progress).y,color:s.color});this.hit(e,damage*(s.chain?Math.pow(.78,i):1),t,s);});}
 this.enemies=this.enemies.filter(e=>!e.dead);if(this.lives<=0){this.lives=0;this.state='lost';return;}if(this.spawned===this.info.count&&!this.enemies.length){this.cash+=20+this.wave*2+(this.has('interest')?15:0);if(this.has('repair'))this.lives=Math.min(this.maxLives,this.lives+1);this.state=this.wave===20?'won':'planning';this.onWave?.(this.wave);}}
}
