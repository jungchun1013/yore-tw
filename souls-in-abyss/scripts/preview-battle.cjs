/* Rebuild the review artifact from the same renderer used by the game. */
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, 'docs/art-preview');
const esbuild = require(path.join(root, 'node_modules/esbuild'));
const source = `
import { Scene } from '${root}/souls-in-abyss/src/ui/scene';
import { drawLandscape } from '${root}/souls-in-abyss/src/ui/landscape';
import { avatarPixels } from '${root}/souls-in-abyss/src/ui/avatar';
const maps = [['meadow','啟程草原'],['forest','低語森林'],['labyrinth','地下迷宮'],['mine','熔岩礦坑'],['fen','霧之沼'],['ruins','天空遺跡'],['nest','古龍之巢'],['abyss','深淵迴廊']];
const equipment = Object.fromEntries(['head','body','hands','feet','weapon'].map(kind => [kind, {kind,weight:'medium',rarity:2,plus:3}]));
for (const [key, label] of maps) {
  const card = document.createElement('article'); const title = document.createElement('h2'); title.textContent = label; card.append(title);
  const cv = document.createElement('canvas'); cv.width=640; cv.height=240; card.append(cv); document.querySelector('#maps')!.append(card);
  const c = cv.getContext('2d')!; c.scale(2,2); drawLandscape(c,key,18,0);
  for(const p of avatarPixels('human',equipment as any)) {c.fillStyle=p.color;c.fillRect(54+p.x,40+p.y,1,1);}
}
const listeners:any[]=[];
const g:any={s:{area:'meadow',race:'human',equip:equipment,pets:[{key:'pudding',lvl:1}],activePet:'pudding'},downFor:0,mon:{hp:100,def:{key:'slime',size:.8,color:'#82947b'}},on:(f:any)=>listeners.push(f)};
const scene = new Scene(g); document.querySelector('#demo')!.append(scene.cv);
const emit=(t:string)=>listeners.forEach(f=>f({t}));
let encounter=0, cycle=0, auto=true;
const spawn=()=>{g.mon.hp=100;emit('spawn');};
const kill=()=>{if(g.downFor>0||g.mon.hp<=0)return;g.mon.hp=0;encounter=.6;emit('kill');};
const death=()=>{if(g.downFor>0)return;g.downFor=5;encounter=0;g.mon.hp=100;emit('death');};
const select=document.querySelector('select')!;for(const [key,label] of maps){const o=document.createElement('option');o.value=key;o.textContent=label;select.append(o);}
select.onchange=()=>{g.s.area=select.value;};
(document.querySelector('#kill') as HTMLButtonElement).onclick=()=>{auto=false;kill();};
(document.querySelector('#death') as HTMLButtonElement).onclick=()=>{auto=false;death();};
(document.querySelector('#auto') as HTMLButtonElement).onclick=()=>{auto=true;cycle=0;};
let last=performance.now();const frame=(now:number)=>{const dt=Math.min(.05,(now-last)/1000);last=now;
 if(g.downFor>0){g.downFor=Math.max(0,g.downFor-dt);if(!g.downFor)spawn();}
 if(encounter>0){encounter-=dt;if(encounter<=0)spawn();}
 if(auto){const previous=cycle;cycle+=dt;if(previous<.8&&cycle>=.8)kill();if(previous<2.4&&cycle>=2.4)death();if(cycle>9){cycle=0;}}
 scene.draw(dt);document.querySelector('#phase')!.textContent=({fight:'交戰',advance:'擊敗 → 踏步前進',death:'倒下 → 淡出',soul:'靈魂離體 → 回歸',rebirth:'靈魂重生 → 淡入'} as any)[scene.cv.dataset.phase!];requestAnimationFrame(frame);};requestAnimationFrame(frame);
`;
const result = esbuild.buildSync({stdin:{contents:source,resolveDir:root,loader:'ts'},bundle:true,write:false,format:'iife',platform:'browser'});
const html=`<!doctype html><meta charset="utf-8"><title>Souls in Abyss · 戰鬥美術預覽</title><style>@font-face{font-family:Cubic;src:url('../../souls-in-abyss/src/assets/Cubic_11.woff2')}*{box-sizing:border-box}body{margin:0;padding:32px;background:#eeece3;color:#343842;font-family:Cubic,monospace}h1{font-size:28px;margin:0 0 10px}p{font-size:15px;color:#667681;margin:0 0 20px}#maps{display:grid;grid-template-columns:1fr 1fr;gap:20px}article{background:#f9f7f0;padding:12px}h2{font-size:18px;margin:0 0 10px;font-weight:normal}canvas{width:100%;display:block;image-rendering:pixelated}#demo{max-width:960px;margin:0 auto 16px}nav{display:flex;justify-content:center;gap:12px;align-items:center;margin-bottom:24px;flex-wrap:wrap}button,select{font:inherit;padding:8px;background:#d7dacc;color:#343842;border:1px solid #9da69b}#phase{display:block;text-align:center;margin:12px;font-size:18px}footer{margin-top:20px;font-size:13px;color:#667681}@media(max-width:700px){#maps{grid-template-columns:1fr}body{padding:16px}}</style><h1>SOULS IN ABYSS · 戰鬥美術預覽</h1><p>16×16 圖示 · 32×48 換裝角色 · 八張像素地景 · 下方動畫使用遊戲實際 Scene 繪製器，事件由示範流程觸發。</p><section id="motion"><div id="demo"></div><span id="phase"></span><nav><select aria-label="地圖"></select><button id="kill">擊敗並前進</button><button id="death">死亡與重生</button><button id="auto">自動示範</button></nav></section><div id="maps"></div><footer>交接入口：src/ui/landscape.ts（背景）· motion.ts（過場時序）· scene.ts（事件與繪製）· avatar.ts（換裝角色）</footer><script>${result.outputFiles[0].text}</script>`;
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'battle-preview.html'),html);
(async()=>{const {chromium}=require(path.join(root,'node_modules/playwright'));const b=await chromium.launch();const page=await b.newPage({viewport:{width:1280,height:1300},deviceScaleFactor:1});await page.goto('file://'+path.join(out,'battle-preview.html'));await page.evaluate(()=>document.fonts.ready);await page.locator('#maps').screenshot({path:path.join(out,'battle-landscapes.png')});await b.close();})();
