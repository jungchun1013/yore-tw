// English for the interface, applied as a translation layer over the rendered DOM so the game's own
// rendering code stays Chinese-only. Every text node and label attribute is translated from its original
// Chinese through DICT (exact strings) and PATTERNS (strings with numbers or names); untranslated strings
// stay as they are. A MutationObserver keeps re-rendered panels translated. The choice is remembered in
// localStorage 'prism-defense-lang'; the default follows the browser language.
const KEY = 'prism-defense-lang';
const DICT = {
  '稜光防線': 'Prism Defense', '地圖難度選擇': 'Map and difficulty', '配置寶石機關，阻止怪物搶奪水晶。': 'Place gem engines and stop the creatures from taking the crystal.',
  '選擇難度': 'Difficulty', '簡單': 'Easy', '標準': 'Normal', '困難': 'Hard', '開始遊戲 →': 'Start →', '研究樹 ↗': 'Research tree ↗', '研究樹': 'Research tree',
  '蜿蜒': 'Ribbon', '螺旋': 'Spiral', '閃電': 'Zigzag',
  '長路徑與共用轉角，適合建立交叉火網。': 'A long route with shared corners, good for crossfire.',
  '敵人從外圈向內推進；中心區有很高覆蓋率。': 'Enemies push inward from the rim; the centre gets heavy coverage.',
  '直角轉折與縱向長路，必須分散火力，防範高速敵人。': 'Right-angle turns and long straights; spread your fire and watch for fast enemies.',
  '波次': 'WAVE', '資金': 'CRYSTAL', '生命': 'INTEGRITY', '擊破': 'KILLS',
  '防禦陣列': 'Towers', '建造預覽': 'Build preview', '防禦塔資訊': 'Tower', '建造': 'Build', '攻擊優先': 'Target',
  '最接近終點': 'Nearest the exit', '最接近入口': 'Nearest the entrance', '血量最多': 'Most health',
  '傷害': 'Damage', '間隔': 'Interval', '射程': 'Range',
  '脈衝': 'Pulse', '星爆': 'Starburst', '霜靈': 'Frost', '光狙': 'Beam', '連鎖': 'Chain', '雷眩': 'Daze',
  '快速單體射擊。便宜可靠，適合轉角。': 'Fast single-target shots. Cheap and reliable, good on corners.',
  '爆炸範圍傷害。聚集的敵人越多越有效。': 'Explosive area damage. The more enemies bunch up, the better.',
  '減速 48%，持續 1.5 秒。同類減速不疊加。': 'Slows by 48% for 1.5 s. Slows of the same kind do not stack.',
  '長射程、無視護甲。處理重裝與首領。': 'Long range, ignores armour. For armoured enemies and bosses.',
  '向附近三個目標跳電，後續傷害衰減。': 'Arcs to three nearby targets; each jump deals less.',
  '同時打擊範圍內所有敵人。適合密集迴彎。': 'Hits every enemy in range at once. Good on tight bends.',
  '暫停': 'Pause', '繼續': 'Resume', '已暫停': 'Paused', '波次進行中': 'Wave in progress', '準備階段': 'Planning',
  '自動：開': 'Auto: on', '自動：關': 'Auto: off', '開啟自動': 'Turn auto on', '關閉自動': 'Turn auto off', '關閉自動（3秒後開始）': 'Turn auto off (starts in 3 s)', '自動開始下一波': 'Start the next wave automatically',
  '地圖縮放': 'Map zoom', '滾輪／雙指縮放，放大後拖曳': 'Scroll or pinch to zoom, drag when zoomed', '縮小地圖': 'Zoom out', '放大地圖': 'Zoom in', '重設地圖縮放': 'Reset zoom', '回到完整地圖': 'Back to the full map',
  '等角菱形格塔防棋盤：選擇右側防禦塔後點選道路外的格子建造；可用下方按鈕、滾輪或雙指縮放，放大後拖曳。': 'Isometric tower-defence board: pick a tower on the right, then click a tile off the road to build; zoom with the buttons below, the scroll wheel or a pinch, and drag when zoomed.',
  '・本波敵人：': '・This wave: ', '・下一波情報：': '・Next wave: ',
  '一般敵人': 'Normal', '小型敵人': 'Swarm', '高速敵人': 'Fast', '重甲敵人': 'Armoured', '首領': 'Boss',
  'Enter 開始 · Space 暫停 · Z 減速 · X 加速': 'Enter start · Space pause · Z slower · X faster',
  '重開新局': 'New game', '重新佈陣': 'Rebuild', '設定': 'Settings', '開啟設定': 'Open settings', '關閉設定': 'Close settings', '遊戲說明': 'How to play', '關閉說明': 'Close help', '關閉': 'Close', '關閉研究': 'Close research',
  '音效': 'Sound', '完整粒子效果': 'Full particle effects', '字型 Cubic 11 ·': 'Font: Cubic 11 ·',
  '選擇防禦塔，放置於道路以外的空格。': 'Pick a tower and place it on a tile off the road.',
  '點選已建的塔升級、更改攻擊目標、或出售（退還 75%）。': 'Click a built tower to upgrade it, change its target, or sell it (75% back).',
  '選擇開始啟動一波敵人攻勢。可以在開始前的準備階段慢慢思考配置，也可以在戰鬥中追加建造。': 'Press start to launch a wave. Take your time planning before it; you can also build during the fight.',
  '每隻怪物抵達城堡會失去 1 點生命；每五波開啟首領戰，首領抵達城堡會失去 5 點生命。': 'Each creature that reaches the castle costs 1 life; a boss comes every five waves and costs 5.',
  '點亮研究樹改善火力、控制或經濟。開局資金研究會在下一場生效，其餘於攻勢前準備階段生效。': 'Light up the research tree to improve firepower, control or economy. Starting-crystal research applies from the next game; the rest applies in the planning phase.',
  '可以隨時暫停、開啟 2×／3× 加速。': 'Pause at any time, or run at 2× or 3× speed.',
  '技能樹': 'Research tree', '可用晶核': 'Cores', '已完成研究': 'Researched', '已升級完成': 'Upgraded', '可以升級': 'Available', '先完成前置研究': 'Complete the prerequisite first', '需要先完成前置研究': 'Prerequisite research needed',
  '前置研究': 'Requires', '所需晶核': 'Cost', '無': 'None', '升級技能 · ': 'Research · ', '升級技能': 'Research', '免費重置並退還晶核': 'Reset for free and refund cores',
  '每突破 2 波的新紀錄 +1 晶核；首次通關 +4。研究永久保留。': '+1 core for every 2 waves past your record; +4 for the first clear. Research is permanent.',
  '下一場開局生效。': 'Applies from the next game.', '於準備階段套用到全場防禦塔。': 'Applies to every tower during planning.', '研究跨場保留，可在準備階段免費重置。': 'Research carries across games and can be reset for free while planning.',
  '灰白古樹隨技能覺醒逐漸發光，三條主枝各承接五項技能': 'An old white tree that lights up as skills awaken; three boughs, five skills each', '由下往上解鎖的研究樹': 'Research tree, unlocked from the bottom up', '技能詳細資訊': 'Skill details', '由下往上解鎖': 'Unlocked from the bottom up',
  '火力': 'Firepower', '控制': 'Control', '經濟': 'Economy', '火力 / 永久研究': 'Firepower / permanent', '控制 / 永久研究': 'Control / permanent', '經濟 / 永久研究': 'Economy / permanent',
  '聚焦': 'Focus', '共振': 'Resonance', '破甲': 'Pierce', '星芒': 'Starlight', '超頻': 'Overdrive', '折射': 'Refraction', '深冷': 'Deep Cold', '擴散': 'Spread', '迴響': 'Echo', '全光譜': 'Spectrum', '種晶': 'Seed Crystal', '回收': 'Salvage', '晶格': 'Lattice', '自癒': 'Mend', '複利': 'Interest',
  '傷害 +8%': 'Damage +8%', '攻速 +8%': 'Attack speed +8%', '一般攻擊忽略 20% 護甲': 'Normal attacks ignore 20% armour', '每五次攻擊，傷害加倍': 'Every fifth attack deals double damage', '全塔傷害再 +18%': 'All towers +18% damage',
  '射程 +8%': 'Range +8%', '減速持續 +0.7 秒': 'Slows last +0.7 s', '爆炸半徑 +20%': 'Blast radius +20%', '連鎖多跳一個目標': 'Chain jumps to one more target', '每種不同塔使全塔傷害 +3%': 'Each different tower type gives all towers +3% damage',
  '開局資金 +25': 'Starting crystal +25', '擊殺金幣 +12%': 'Kill reward +12%', '建造費用 -8%': 'Build cost -8%', '每完成一波回復 1 點生命': 'Recover 1 life after each wave', '每波獎勵額外 +15 金幣': 'Wave reward +15 extra',
  '尚未解鎖': 'locked', '可研究': 'available', '已完成': 'done',
  '防守成功': 'Field held', '防線失守': 'Line broken', '防線暫時失守。': 'The line broke this time.', '已完成全部波次': 'All waves complete',
  '二十波全部完成。試試不同地圖、研究路線或過載難度。': 'All twenty waves cleared. Try another map, research path or the hard difficulty.',
  '將火力集中在轉角，以霜靈搭配範圍塔；重甲交給光狙。': 'Concentrate fire on corners, pair Frost with area towers, and leave armour to Beam.',
  '到達波次': 'Wave reached', '擊破目標': 'Kills', '儲存空間不可用；本次仍可繼續遊玩。': 'Storage is unavailable; this session still plays.',
  '綠點為入口，粉紅菱形為終點': 'green dot is the entrance, pink diamond the exit', '地圖平面圖': ' map plan',
};
const name = (s) => DICT[s] || s;
const PATTERNS = [
  [/^開始第 (\d+) 波 →$/, (m) => `Start wave ${m[1]} →`],
  [/^第 (\d+) 波$/, (m) => `Wave ${m[1]}`],
  [/^(.+?) Lv\.(\d+)$/, (m) => `${name(m[1])} Lv.${m[2]}`],
  [/^出售 \+(\d+)$/, (m) => `Sell +${m[1]}`],
  [/^升級 (\d+) ◇$/, (m) => `Upgrade ${m[1]} ◇`],
  [/^升級 $/, () => 'Upgrade '],
  [/^([\d.]+) 格$/, (m) => `${m[1]} tiles`],
  [/^(\d+) ◈ \/ 持有 (\d+) ◈$/, (m) => `${m[1]} ◈ / you have ${m[2]} ◈`],
  [/^已投入 (\d+) ◈$/, (m) => `Spent ${m[1]} ◈`],
  [/^可用晶核 (\d+) · 已完成 (\d+) \/ (\d+) 項(.*)$/, (m) => `Cores ${m[1]} · ${m[2]} / ${m[3]} researched${m[4]}`],
  [/^地圖：(.+?) · 難度：(.+)$/, (m) => `Map: ${name(m[1])} · Difficulty: ${name(m[2])}`],
  [/^新紀錄！獲得 (\d+) 顆研究晶核$/, (m) => `New record. ${m[1]} research core${m[1] === '1' ? '' : 's'} earned`],
  [/^(.+?) × (\d+)$/, (m) => `${name(m[1])} × ${m[2]}`],
  [/^(.+?)，(\d+) 隻$/, (m) => `${name(m[1])}, ${m[2]}`],
  [/^(.+?)地圖平面圖，(.+)$/, (m) => `${name(m[1])} map plan, ${name(m[2])}`],
  [/^(.+?) · (.+)$/, (m) => `${name(m[1])} · ${name(m[2])}`],
  [/^(.+?)，(.+?)，(.+)$/, (m) => `${name(m[1])}, ${name(m[2])}, ${name(m[3])}`],
  [/^(\d+) 顆晶核$/, (m) => `${m[1]} cores`],
];
function translate(zh) {
  const t = zh.trim(); if (!t || !/[一-鿿]/.test(t)) return zh;
  const lead = zh.match(/^\s*/)[0], tail = zh.match(/\s*$/)[0];
  if (DICT[t] !== undefined) return lead + DICT[t] + tail;
  for (const [re, fn] of PATTERNS) { const m = t.match(re); if (m) return lead + fn(m) + tail; }
  return zh;
}
const originals = new WeakMap();   // node or attribute holder -> original Chinese text, so switching back restores it
const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
let lang = 'zh', observer = null, applying = false;
function applyNode(n) {
  if (n.nodeType === 3) {
    if (!originals.has(n)) originals.set(n, n.nodeValue); else if (lang === 'zh' && n.nodeValue !== originals.get(n)) { /* re-rendered by the game: keep the new text */ }
    const src = lang === 'zh' ? n.nodeValue : (originals.get(n));
    const out = lang === 'en' ? translate(src) : src;
    if (n.nodeValue !== out) n.nodeValue = out;
    return;
  }
  if (n.nodeType !== 1) return;
  if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
  for (const a of ATTRS) {
    if (!n.hasAttribute(a)) continue;
    const key = a + ':' + '';
    let store = originals.get(n); if (!store) { store = {}; originals.set(n, store); }
    if (!(a in store)) store[a] = n.getAttribute(a);
    const out = lang === 'en' ? translate(store[a]) : store[a];
    if (n.getAttribute(a) !== out) n.setAttribute(a, out);
  }
  for (const c of n.childNodes) applyNode(c);
}
function applyAll() {
  applying = true;
  applyNode(document.body);
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
  document.title = lang === 'en' ? 'Prism Defense · 稜光防線' : '稜光防線 · PRISM DEFENSE';
  const b = document.getElementById('lang-toggle'); if (b) b.textContent = lang === 'en' ? '中文' : 'EN';
  applying = false;
}
// text the game writes after this layer ran: text nodes are new, so their first value is the Chinese original
function observe() {
  observer = new MutationObserver((muts) => {
    if (applying) return;
    applying = true;
    for (const m of muts) {
      if (m.type === 'characterData') { originals.set(m.target, m.target.nodeValue); if (lang === 'en') { const out = translate(m.target.nodeValue); if (out !== m.target.nodeValue) m.target.nodeValue = out; } }
      else if (m.type === 'attributes') { const n = m.target; let store = originals.get(n); if (!store || store instanceof String) { store = {}; originals.set(n, store); } store[m.attributeName] = n.getAttribute(m.attributeName); if (lang === 'en') { const out = translate(store[m.attributeName] || ''); if (out !== n.getAttribute(m.attributeName)) n.setAttribute(m.attributeName, out); } }
      else for (const n of m.addedNodes) { if (n.nodeType === 3) { originals.set(n, n.nodeValue); if (lang === 'en') { const out = translate(n.nodeValue); if (out !== n.nodeValue) n.nodeValue = out; } } else if (n.nodeType === 1) { originals.delete(n); applyNode(n); } }
    }
    applying = false;
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ATTRS });
}
function setLang(next) {
  lang = next === 'en' ? 'en' : 'zh';
  try { localStorage.setItem(KEY, lang); } catch (e) {}
  applyAll();
}
let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
lang = saved || (((navigator.language || '').toLowerCase().indexOf('zh') === 0) ? 'zh' : 'en');
const actions = document.querySelector('.footer-actions');
if (actions) { const b = document.createElement('button'); b.id = 'lang-toggle'; b.setAttribute('aria-label', 'Language / 語言'); b.textContent = lang === 'en' ? '中文' : 'EN'; b.onclick = () => setLang(lang === 'en' ? 'zh' : 'en'); actions.append(b); }
applyAll();
observe();
window.__prismLang = { setLang, translate };
