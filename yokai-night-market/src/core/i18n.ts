import type { L, Lang, WeaponPatch } from '../game/types';

let lang: Lang = 'zh';
export function setLang(l: Lang): void { lang = l; document.documentElement.lang = l === 'zh' ? 'zh-TW' : 'en'; }
export function getLang(): Lang { return lang; }
export function defaultLang(): Lang { return (navigator.language || 'en').toLowerCase().startsWith('zh') ? 'zh' : 'en'; }
export function tl(o: L): string { return o[lang]; }

const T = {
  title: { zh: '府城夜巡地圖', en: 'Tainan Gazetteer' },
  tagline: { zh: '昭和初年的臺南。撐過十五分鐘，等天亮。', en: 'Tainan, early Showa. Last fifteen minutes and wait for dawn.' },
  start: { zh: '出發', en: 'Set Out' },
  tapStart: { zh: '點一下開始', en: 'Tap to start' },
  rounds: { zh: '夜巡', en: 'Rounds' },
  furniture: { zh: '家具', en: 'Furniture' },
  settings: { zh: '設定', en: 'Settings' },
  codexShort: { zh: '圖鑑', en: 'Codex' },
  done: { zh: '完成', en: 'Done' },
  flip: { zh: '翻面', en: 'Flip' },
  shrine: { zh: '繪馬', en: 'Ema' },
  stall: { zh: '小吃攤', en: 'Snack Stall' },
  stallSub: { zh: '買一份帶進下一局，吃完就沒了。每樣一份。', en: 'Pack a snack for the next run. Eaten once; one of each.' },
  packed: { zh: '已帶上', en: 'Packed' },
  packLine: { zh: '帶著：', en: 'Packed: ' },
  packNone: { zh: '還沒帶小吃，可以到小吃攤買', en: 'No snacks packed. The stall sells some.' },
  codex: { zh: '妖怪圖鑑', en: 'Yokai Codex' },
  back: { zh: '返回', en: 'Back' },
  chapter: { zh: '第一章　府城夜行', en: 'Chapter 1: Tainan by Night' },
  pickStage: { zh: '選擇地點', en: 'Choose a place' },
  pickHero: { zh: '選擇角色', en: 'Choose who goes' },
  locked: { zh: '尚未開放', en: 'Locked' },
  lockStage: { zh: '先撐過上一個地點', en: 'Survive the previous place first' },
  lockHero: { zh: '通過 {n} 個地點後加入', en: 'Joins after {n} places cleared' },
  cleared: { zh: '已天亮', en: 'Dawn seen' },
  bossDown: { zh: '已安魂', en: 'Laid to rest' },
  best: { zh: '最久 {t}', en: 'Best {t}' },
  go: { zh: '開始', en: 'Begin' },
  level: { zh: '等級', en: 'Level' },
  lv: { zh: 'Lv {n}', en: 'Lv {n}' },
  isNew: { zh: '新', en: 'New' },
  evolve: { zh: '進化', en: 'Evolve' },
  levelUp: { zh: '升級', en: 'Level Up' },
  reroll: { zh: '重抽（剩 {n}）', en: 'Reroll ({n} left)' },
  chest: { zh: '賽錢箱', en: 'Offering Box' },
  take: { zh: '收下', en: 'Take' },
  paused: { zh: '暫停', en: 'Paused' },
  resume: { zh: '繼續', en: 'Resume' },
  quit: { zh: '結束這一局', en: 'End Run' },
  sound: { zh: '音效', en: 'Sound' },
  music: { zh: '音樂', en: 'Music' },
  on: { zh: '開', en: 'On' },
  off: { zh: '關', en: 'Off' },
  language: { zh: '語言', en: 'Language' },
  dawn: { zh: '天亮了', en: 'Dawn' },
  dawnSub: { zh: '雞啼第一聲，妖怪散了。', en: 'The first rooster crows and the yokai scatter.' },
  taken: { zh: '被帶走了', en: 'Spirited Away' },
  takenSub: { zh: '離天亮還有 {t}。', en: '{t} short of dawn.' },
  survived: { zh: '存活', en: 'Survived' },
  kills: { zh: '擊退', en: 'Driven off' },
  coins: { zh: '香油錢', en: 'Coins' },
  damage: { zh: '傷害', en: 'Damage' },
  again: { zh: '再來一次', en: 'Again' },
  toTitle: { zh: '回到選單', en: 'Back to Menu' },
  unlockedStage: { zh: '新地點開放：{s}', en: 'New place open: {s}' },
  unlockedHero: { zh: '新角色加入：{s}', en: 'New character: {s}' },
  cost: { zh: '{n}', en: '{n}' },
  maxed: { zh: '已滿', en: 'Max' },
  shrineSub: { zh: '用香油錢寫一塊繪馬，效果永久保留。', en: 'Spend coins on a votive plaque. The effect is permanent.' },
  codexSub: { zh: '遇過的妖怪會記在這裡。', en: 'Yokai you have met are recorded here.' },
  unknown: { zh: '？？？', en: '???' },
  bossWarn: { zh: '{s} 出現', en: '{s} appears' },
  parade: { zh: '百鬼夜行', en: 'Night Parade' },
  ringWarn: { zh: '被包圍了', en: 'Surrounded' },
  howMove: { zh: '方向鍵或 WASD 移動，武器會自動攻擊', en: 'Move with arrows or WASD. Weapons fire on their own.' },
  howTouch: { zh: '按住畫面拖曳移動，武器會自動攻擊', en: 'Drag anywhere to move. Weapons fire on their own.' },
  coinChoice: { zh: '香油錢 +25', en: '25 coins' },
  healChoice: { zh: '回復 30 生命', en: 'Recover 30 HP' },
  coinName: { zh: '撿到零錢', en: 'Loose Change' },
  healName: { zh: '飯糰', en: 'Rice Ball' },
  withItem: { zh: '搭配 {s} 可進化', en: 'Evolves with {s}' },
  reset: { zh: '清除存檔', en: 'Erase Save' },
  resetAsk: { zh: '確定清除所有進度？', en: 'Erase all progress?' },
} satisfies Record<string, L>;

export function t(key: keyof typeof T, vars?: Record<string, string | number>): string {
  let s: string = T[key][lang];
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

export function clock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const PATCH: Record<keyof WeaponPatch, [L, string]> = {
  dmg: [{ zh: '傷害', en: 'Damage' }, ''],
  amount: [{ zh: '數量', en: 'Amount' }, ''],
  pierce: [{ zh: '貫穿', en: 'Pierce' }, ''],
  cdPct: [{ zh: '冷卻', en: 'Cooldown' }, '%'],
  areaPct: [{ zh: '範圍', en: 'Area' }, '%'],
  speedPct: [{ zh: '速度', en: 'Speed' }, '%'],
  durPct: [{ zh: '持續', en: 'Duration' }, '%'],
};

export function patchText(p: WeaponPatch): string {
  const parts: string[] = [];
  for (const k of Object.keys(p) as (keyof WeaponPatch)[]) {
    const v = p[k]!;
    if (k === 'pierce' && v > 50) continue;
    parts.push(`${PATCH[k][0][lang]} ${v > 0 ? '+' : ''}${v}${PATCH[k][1]}`);
  }
  return parts.join(lang === 'zh' ? '、' : ', ');
}
