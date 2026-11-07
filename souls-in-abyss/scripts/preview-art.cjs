const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const esbuild = require(path.join(root, 'node_modules/esbuild'));
const source = `import {icon, PALETTE} from '${root}/souls-in-abyss/src/ui/icons';
import {avatarMarkup} from '${root}/souls-in-abyss/src/ui/avatar';
export {icon, PALETTE, avatarMarkup};`;
fs.writeFileSync('/tmp/souls-art-entry.ts',source);
esbuild.buildSync({entryPoints:['/tmp/souls-art-entry.ts'],bundle:true,platform:'node',outfile:'/tmp/souls-art-bundle.cjs'});
const {icon, PALETTE, avatarMarkup} = require('/tmp/souls-art-bundle.cjs');
const card = (key,label) => `<div class="card">${icon(key)}<span>${label}</span><code>${key}</code></div>`;
const groups = [
 ['介面 / Interface',[['equip','裝備'],['pets','夥伴'],['skills','技能'],['map','地圖'],['smith','鍛造'],['titles','稱號'],['rebirth','轉生'],['settings','設定']]],
 ['裝備 / Equipment',[['slot-head','頭盔'],['slot-body','護甲'],['slot-weapon','武器'],['slot-hands','手套'],['slot-feet','靴子'],['slot-acc1','戒指'],['slot-acc2','護符']]],
 ['專屬夥伴 / Companions',[['pet-pudding','布丁史萊姆'],['pet-potcat','鍋盔貓'],['pet-mosskin','苔球精'],['pet-mimipup','寶箱汪'],['pet-ember','火蜥寶寶'],['pet-griffy','獅鷲雛'],['pet-nameless','無名之仔']]],
 ['魔法與地區 / Magic & places',[['sk-firebolt','火焰'],['sk-icebolt','冰晶'],['sk-lightning','雷擊'],['sk-meditation','冥想'],['area-meadow','草原'],['area-forest','森林'],['area-ruins','遺跡'],['area-abyss','深淵']]],
];
const item = (kind,weight,rarity) => ({kind,weight,rarity,plus:3,uid:1,ilvl:10,name:0,affixes:[]});
const outfits = [['未裝備',{}],['輕裝 / 苔綠',Object.fromEntries(['head','body','hands','feet','weapon'].map(k=>[k,item(k,'light',1)]))],['中裝 / 灰藍',Object.fromEntries(['head','body','hands','feet','weapon'].map(k=>[k,item(k,'medium',2)]))],['重裝 / 霧紫',Object.fromEntries(['head','body','hands','feet','weapon','acc1','acc2'].map(k=>[k,item(k,'heavy',5)]))]];
const html = `<!doctype html><meta charset="utf-8"><style>@font-face{font-family:Cubic;src:url('../../souls-in-abyss/src/assets/Cubic_11.woff2')}*{box-sizing:border-box}body{margin:0;padding:40px;background:#eeece3;color:#343842;font-family:Cubic,monospace;width:1200px}h1{font-size:30px; margin:0 0 8px}p{color:#667681;font-size:16px;margin:0 0 24px}h2{font-size:20px;font-weight:normal;margin:24px 0 12px}.grid{display:grid;grid-template-columns:repeat(8,1fr);gap:10px}.card{background:#f9f7f0;padding:14px 4px 10px;display:flex;align-items:center;flex-direction:column;gap:8px;border-bottom:2px solid #d7d7cb}.gi{height:60px;width:60px;image-rendering:pixelated;shape-rendering:crispEdges}.card span{font-size:16px}code{font-size:10px;color:#829084}.swatches{display:flex;gap:8px;margin:18px 0}.swatch{width:70px;height:18px}.outfits{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.outfit{background:#dedfd3;display:flex;align-items:center;flex-direction:column;padding:16px;gap:12px}.avatar{width:96px;height:144px;shape-rendering:crispEdges}footer{font-size:13px;color:#667681;margin-top:24px}</style><h1>SOULS IN ABYSS · 像素美術交接示意</h1><p>目前程式實際繪製素材 / 低飽和日系魔幻 / 16×16 圖示、32×48 角色 / 方格像素、無平滑</p><div class="swatches">${['o','g','G','b','p','P','y','r','w'].map(k=>`<div class="swatch" style="background:${PALETTE[k]}"></div>`).join('')}</div><h2>換裝外觀 / 同步用於裝備頁與戰鬥角色</h2><div class="outfits">${outfits.map(([label,equip])=>`<div class="outfit"><svg class="avatar" viewBox="0 0 32 48">${avatarMarkup('human',equip)}</svg><span>${label}</span></div>`).join('')}</div>${groups.map(([name,entries])=>`<h2>${name}</h2><div class="grid">${entries.map(([key,label])=>card(key,label)).join('')}</div>`).join('')}<footer>來源：src/ui/icons.ts + src/ui/avatar.ts · 此圖為實作素材總覽，並非遊戲版面設計。</footer>`;
fs.writeFileSync(path.join(root,'docs/art-preview/souls-pixel-art.html'),html);
(async()=>{const {chromium}=require(path.join(root,'node_modules/playwright'));const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1200,height:1400},deviceScaleFactor:1});await page.goto('file://'+path.join(root,'docs/art-preview/souls-pixel-art.html'));await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(root,'docs/art-preview/souls-pixel-art.png'),fullPage:true});await browser.close();})();
