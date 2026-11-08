import { icon, pixels, PALETTE, type Pixel } from '../src/ui/icons';
import { avatarMarkup, avatarPixels, type Outfit } from '../src/ui/avatar';
import { Scene } from '../src/ui/scene';
import { WORLD_MAP_POSITIONS, worldMapRoute } from '../src/ui/world-map';
import { AREAS } from '../src/data/areas';
import type { Item } from '../src/game/types';

const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s)!;
interface Entry { key: string; name: string; group: string; en?: string; note?: string }
const entries: Entry[] = [];
const group = (category: string, names: [string, string][]) => names.forEach(([key, name]) => entries.push({key, name, group: category}));
group('interface', [['equip','裝備'],['pets','夥伴'],['skills','技能'],['map','地圖'],['smith','鍛造'],['titles','稱號'],['rebirth','轉生'],['settings','設定'],['bag','背包'],['ap','技能點'],['arrow','箭頭'],['star','星章'],['heart','愛心'],['hazard','警示'],['unknown','未知']]);
group('equipment', [['slot-head','頭盔'],['slot-body','護甲'],['slot-legs','護腿'],['slot-feet','靴子'],['slot-hands','手套'],['slot-weapon','劍'],['slot-off','盾'],['slot-ring','戒指'],['slot-neck','護符']]);
group('magic', [['sk-smash','重擊'],['sk-defense','防禦'],['sk-counter','反擊'],['sk-firebolt','火焰'],['sk-icebolt','冰晶'],['sk-lightning','雷擊'],['sk-mastery','武器精通'],['sk-lightArms','輕兵器'],['sk-mediumArms','中兵器'],['sk-heavyArms','重兵器'],['sk-tough','堅韌'],['sk-meditation','冥想'],['sk-fortune','財運'],['sk-insight','洞察']]);
group('world', [['area-meadow','啟程草原'],['area-forest','低語森林'],['area-labyrinth','地下迷宮'],['area-mine','熔岩礦坑'],['area-fen','霧之沼'],['area-ruins','天空遺跡'],['area-nest','古龍之巢'],['area-abyss','深淵迴廊']]);
group('race', [['human','人類'],['elf','精靈'],['dwarf','矮人'],['giant','巨人'],['undead','不死族'],['str','力量'],['dex','靈巧'],['int','智慧'],['will','意志'],['luk','幸運']]);
const pets: Entry[] = [
 {key:'pet-pudding',name:'布丁史萊姆',en:'PUDDING',group:'pet',note:'焦糖頂、小小的酒窩。軟軟的輪廓依然是牠最醒目的特徵。'},
 {key:'pet-potcat',name:'鍋盔貓',en:'POT-HELM CAT',group:'pet',note:'把鍋蓋戴正，露出耳朵與鬍鬚；出門也不忘準備下一頓飯。'},
 {key:'pet-mosskin',name:'苔球精',en:'MOSSLING',group:'pet',note:'圓滾的苔球頂著兩片小葉，腳下還沾著一點森林的泥土。'},
 {key:'pet-mimipup',name:'寶箱汪',en:'MIMIC PUP',group:'pet',note:'寶箱的金扣、兩隻垂耳與吐出的小舌頭，讓寶物也有了表情。'},
 {key:'pet-ember',name:'火蜥寶寶',en:'EMBER NEWT',group:'pet',note:'暖灰紅的身體、奶油色肚皮。細小尾焰與低伏的前腳，在十六格裡重新安排。'},
 {key:'pet-griffy',name:'獅鷲雛',en:'GRIFFON CHICK',group:'pet',note:'短短的喙、剛展開的羽翼與小爪子。金色身體仍然溫柔地留在 B 版的色調裡。'},
 {key:'pet-nameless',name:'無名之仔',en:'THE NAMELESS',group:'pet',note:'霧紫的影子裡，只有兩點安靜的眼睛。牠還是認得你的。'},
];
const all = [...entries,...pets];
$('.brand-icon').innerHTML=icon('area-abyss');
$('#hero-pets').innerHTML=pets.map(p=>icon(p.key)).join('');
$('#pets-grid').innerHTML=pets.map(p=>`<button class="pet-card" data-art="${p.key}" aria-label="查看${p.name}">${icon(p.key)}<strong>${p.name}</strong><span>${p.en}</span></button>`).join('');
$('#icons-grid').innerHTML=entries.map(p=>`<button class="icon-card" data-art="${p.key}" data-group="${p.group}">${icon(p.key)}<span class="name">${p.name}</span><code>${p.key}</code></button>`).join('');
$('#icon-count').textContent=`${entries.length} 張圖示 + 7 位夥伴`;
const swatches=[...new Set(Object.values(PALETTE))];
$('#palette').innerHTML=swatches.map(h=>`<span class="swatch" role="img" tabindex="0" data-hex="${h}" aria-label="色盤 ${h}" style="background:${h}"></span>`).join('');
function canvasArt(art: Pixel[], w: number, h: number): HTMLCanvasElement {
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d')!;
 for(const p of art){c.fillStyle=p.color;c.fillRect(p.x,p.y,1,1);}return cv;
}
function download(art: Pixel[],w:number,h:number,name:string): void {
 const a=document.createElement('a');a.href=canvasArt(art,w,h).toDataURL();a.download=name+'.png';a.click();
}
let selected=pets[0];
const dialog=$<HTMLDialogElement>('#inspector');
function openArt(key:string): void {
 selected=all.find(p=>p.key===key)!;
 $('#detail-name').textContent=selected.name;$('#detail-art').innerHTML=icon(key);$('#detail-native').innerHTML=icon(key);
 $('#detail-description').textContent=selected.note || '直接在 16×16 格點重新描繪，以固定色盤呈現清楚的輪廓與少量材質細節。';
 $('#detail-colours').innerHTML=[...new Set(pixels(key).map(p=>p.color))].map(h=>`<span title="${h}" style="background:${h}"></span>`).join('');
 $<HTMLInputElement>('#show-grid').checked=false;dialog.showModal();
}
document.addEventListener('click',e=>{const b=(e.target as Element).closest<HTMLElement>('[data-art]');if(b)openArt(b.dataset.art!);});
$('#close-inspector').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
$('#show-grid').addEventListener('change',e=>{
 $('#detail-art .grid-lines')?.remove();
 if(!(e.target as HTMLInputElement).checked)return;
 const lines=Array.from({length:17},(_,i)=>`<path d="M${i} 0V16M0 ${i}H16"/>`).join('');
 $('#detail-art').insertAdjacentHTML('beforeend',`<svg class="grid-lines" viewBox="0 0 16 16" fill="none" stroke="#343842" stroke-width=".025" opacity=".4" aria-hidden="true">${lines}</svg>`);
});
$('#download-icon').addEventListener('click',()=>download(pixels(selected.key),16,16,selected.key));
document.querySelectorAll<HTMLElement>('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));
 document.querySelectorAll<HTMLElement>('.icon-card').forEach(card=>{card.hidden=b.dataset.filter!=='all'&&card.dataset.group!==b.dataset.filter;});
}));
document.querySelectorAll<HTMLElement>('[data-zoom]').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('[data-zoom]').forEach(x=>x.classList.toggle('active',x===b));
 $('#icons-grid').style.setProperty('--icon-size',Number(b.dataset.zoom)*16+'px');
}));
const makeItem=(kind:string,weight:string,rarity:number): Item=>({kind,weight,rarity,plus:3,uid:1,ilvl:10,name:0,affixes:[]} as Item);
const outfits: Record<string,Outfit>={bare:{},light:{},medium:{},heavy:{}};
for(const weight of ['light','medium','heavy'])for(const slot of ['head','body','legs','feet','weapon'])
 outfits[weight][slot as keyof Outfit]=makeItem(slot,weight,weight==='heavy'?5:weight==='medium'?2:1);
outfits.medium.off=makeItem('shield','medium',2);outfits.light.neck=makeItem('neck','light',1);
let outfit='bare',race='human';
const outfitNames: Record<string,string>={bare:'旅人布衣 · 灰藍',light:'輕裝皮革 · 舊褐與苔綠',medium:'鱗甲與盾 · 灰藍',heavy:'重騎士鎧 · 銀灰與霧紫'};
function updateCharacter():void {
 $('#main-character').innerHTML=`<svg viewBox="0 0 32 48" aria-label="${race} ${outfit}">${avatarMarkup(race,outfits[outfit])}</svg>`;
 $('#outfit-name').textContent=outfitNames[outfit];
 $('#outfit-lineup').innerHTML=Object.values(outfits).map(o=>`<svg viewBox="0 0 32 48" aria-hidden="true">${avatarMarkup(race,o)}</svg>`).join('');
}
updateCharacter();
document.querySelectorAll<HTMLElement>('[data-outfit]').forEach(b=>b.addEventListener('click',()=>{
 outfit=b.dataset.outfit!;document.querySelectorAll('[data-outfit]').forEach(x=>x.classList.toggle('active',x===b));updateCharacter();
}));
document.querySelectorAll<HTMLElement>('[data-race]').forEach(b=>b.addEventListener('click',()=>{
 race=b.dataset.race!;document.querySelectorAll('[data-race]').forEach(x=>x.classList.toggle('active',x===b));updateCharacter();
}));
$('#download-character').addEventListener('click',()=>download(avatarPixels(race,outfits[outfit]),32,48,`hero-${race}-${outfit}`));
const maps=[['meadow','啟程草原'],['forest','低語森林'],['labyrinth','地下迷宮'],['mine','熔岩礦坑'],['fen','霧之沼'],['ruins','天空遺跡'],['nest','古龍之巢'],['abyss','深淵迴廊']];
const select=$<HTMLSelectElement>('#area-select');
select.innerHTML=maps.map(([key,name])=>`<option value="${key}">${name}</option>`).join('');
const listeners: ((e:any)=>void)[]=[];
const game:any={s:{area:'meadow',race:'human',equip:outfits.medium,pets:[{key:'pudding',lvl:1}],activePet:'pudding'},downFor:0,mon:{hp:100,def:{key:'slime',size:.8,color:PALETTE.g}},on:(f:any)=>listeners.push(f)};
const scene=new Scene(game);$('#battle-canvas').append(scene.cv);
const emit=(t:string)=>listeners.forEach(f=>f({t}));let encounter=0;
select.addEventListener('change',()=>{game.s.area=select.value;});
$('#advance-demo').addEventListener('click',()=>{if(game.downFor>0||encounter>0)return;game.mon.hp=0;encounter=.6;emit('kill');});
$('#death-demo').addEventListener('click',()=>{if(game.downFor>0)return;game.downFor=5;encounter=0;game.mon.hp=100;emit('death');});
for(const [key,name] of maps){
 const b=document.createElement('button');b.className='landscape-card';b.setAttribute('aria-label',`預覽${name}`);
 b.innerHTML=`<h3>${name}<span>${key.toUpperCase()}</span></h3>`;
 const img=document.createElement('img');img.src=`./sprites/battle/bg-${key}.png`;img.width=2048;img.height=768;img.alt=name+'橫向戰鬥像素背景';img.loading='lazy';b.append(img);
 b.addEventListener('click',()=>{game.s.area=key;select.value=key;$('#battle-canvas').scrollIntoView({behavior:'smooth',block:'center'});});
 $('#landscape-grid').append(b);
}
let last=performance.now();
function frame(now:number):void{
 const dt=Math.min(.05,(now-last)/1000);last=now;
 if(game.downFor>0){game.downFor=Math.max(0,game.downFor-dt);if(game.downFor===0){game.mon.hp=100;emit('spawn');}}
 if(encounter>0){encounter-=dt;if(encounter<=0){game.mon.hp=100;emit('spawn');}}
 scene.draw(dt);$('#battle-phase').textContent=({fight:'交戰',advance:'踏步前進',death:'淡出',soul:'靈魂回歸',rebirth:'重新出發'} as Record<string,string>)[scene.cv.dataset.phase!];
 $<HTMLButtonElement>('#advance-demo').disabled=game.downFor>0||encounter>0;$<HTMLButtonElement>('#death-demo').disabled=game.downFor>0;
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Reference loading is isolated from every new-art drawing function.
fetch('./assets/b-icons.json').then(r=>r.json()).then((patterns:Record<string,string>)=>{
 const oldPalette:Record<string,string>={o:'#343842',s:'#667681',h:'#bcc5bd',w:'#e3ddc9',g:'#82947b',G:'#53695e',b:'#839da5',p:'#9586a4',P:'#625575',y:'#c1a775',r:'#b47f76',t:'#ac917b',d:'#725e53',k:'#343842'};
 $('#b-icons').innerHTML=['equip','pets','slot-weapon','pet-pudding','pet-potcat','pet-mimipup','pet-griffy'].map(key=>{
 const marks=patterns[key].split('/').flatMap((row,y)=>[...row.replace(/ /g,'')].map((c,x)=>oldPalette[c]?`<rect x="${x}" y="${y}" width="1" height="1" fill="${oldPalette[c]}"/>`:'')).join('');
 return `<svg viewBox="0 0 8 8" aria-label="B 版 ${key}">${marks}</svg>`;
 }).join('');
}).catch(()=>{$('#b-icons').textContent='B 版原稿載入失敗，請重新整理。';});

const worldMap = $('#illustrated-map');
worldMap.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${worldMapRoute()}" fill="none" stroke="#e3ddc9" stroke-width="1.5" stroke-dasharray="2 4" opacity=".7" vector-effect="non-scaling-stroke"/></svg>`);
AREAS.forEach((area,i)=>{
 const [x,y]=WORLD_MAP_POSITIONS[i];const b=document.createElement('button');
 b.className='world-node'+(i===0?' selected':'');b.style.left=x+'%';b.style.top=y+'%';b.dataset.mapPlace=area.key;
 b.setAttribute('aria-label',area.name.zh);b.setAttribute('aria-pressed',String(i===0));
 b.innerHTML=icon('area-'+area.key)+`<span>${area.name.zh}</span>`;
 b.addEventListener('click',()=>{worldMap.querySelectorAll('button').forEach(n=>{n.classList.toggle('selected',n===b);n.setAttribute('aria-pressed',String(n===b));});$('#map-place-name').textContent=area.name.zh;$('#map-place-lore').textContent=area.flavor.zh;});
 worldMap.append(b);
});
