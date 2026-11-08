import type { L } from '../game/types';

export type Lang = 'zh' | 'en';
const KEY = 'yore.lang'; // shared with the yore-tw.com entry site

function detect(): Lang {
  try {
    const s = localStorage.getItem(KEY);
    if (s === 'zh' || s === 'en') return s;
  } catch (e) { /* storage blocked */ }
  if (typeof navigator !== 'undefined' && (navigator.language || '').toLowerCase().startsWith('zh')) return 'zh';
  return 'en';
}

export let lang: Lang = typeof window === 'undefined' ? 'zh' : detect();
export function setLang(l: Lang): void {
  lang = l;
  try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ }
}
export const tr = (x: L): string => x[lang];

/** UI strings. Content strings live next to their data. */
export const UI = {
  title: { zh: '輪迴無止盡', en: 'SOULS IN ABYSS' },
  subtitle: { zh: 'SOULS IN ABYSS', en: '' },
  tagline: { zh: '所有靈魂最後都會落入深淵<br>而你，總是會回來', en: 'Every soul falls into the Abyss in the end.<br>And you, you always come back.' },
  play: { zh: '開始遊戲', en: 'Play Game' },
  name: { zh: '名字', en: 'NAME' },
  race: { zh: '種族', en: 'RACE' },
  age: { zh: '年齡', en: 'AGE' },
  lv: { zh: '等級', en: 'LV' },
  hp: { zh: 'HP', en: 'HP' },
  mp: { zh: 'MP', en: 'MP' },
  exp: { zh: 'EXP', en: 'EXP' },
  gold: { zh: '金幣', en: 'GOLD' },
  ap: { zh: '技能點', en: 'AP' },
  cp: { zh: '戰力', en: 'CP' },
  atk: { zh: '攻擊', en: 'ATK' },
  bal: { zh: '平衡', en: 'BAL' },
  crt: { zh: '爆擊', en: 'CRT' },
  crtm: { zh: '爆傷', en: 'CRT.M' },
  def: { zh: '防禦', en: 'DEF' },
  prt: { zh: '保護', en: 'PRT' },
  spd: { zh: '攻速', en: 'SPD' },
  monster: { zh: '怪物', en: 'MONSTER' },
  pet: { zh: '夥伴', en: 'Pet' },
  petRest: { zh: '休息中', en: 'resting' },
  bond: { zh: '羈絆', en: 'Bond' },
  att: { zh: '技能發動', en: 'ATT.' },
  loot: { zh: '戰利品', en: 'Loot' },
  mapStats: { zh: '地圖統計', en: 'Map stats' },
  stay: { zh: '停留', en: 'Time here' },
  navEquip: { zh: '裝備', en: 'Equipment' },
  charms: { zh: '加護', en: 'Charms' },
  capAttack: { zh: '攻擊', en: 'Attack' },
  capSupport: { zh: '輔助', en: 'Support' },
  twoHanded: { zh: '雙手持', en: 'Two-handed' },
  navBag: { zh: '背包', en: 'Bag' },
  navPets: { zh: '夥伴', en: 'Pals' },
  navSkills: { zh: '技能', en: 'Skills' },
  navMap: { zh: '地圖', en: 'Map' },
  navSmith: { zh: '鐵匠', en: 'Smith' },
  navTitles: { zh: '稱號', en: 'Titles' },
  navRebirth: { zh: '轉生', en: 'Rebirth' },
  navSettings: { zh: '設定', en: 'Settings' },
  combat: { zh: '戰鬥', en: 'COMBAT' },
  magic: { zh: '魔法', en: 'MAGIC' },
  passive: { zh: '被動', en: 'PASSIVE' },
  equip: { zh: '裝備', en: 'Equip' },
  unequip: { zh: '卸下', en: 'Remove' },
  sell: { zh: '賣出', en: 'Sell' },
  upgrade: { zh: '強化', en: 'Upgrade' },
  go: { zh: '前往', en: 'Go' },
  here: { zh: '所在地', en: 'Here' },
  clickGo: { zh: '點擊前往', en: 'Click to go' },
  bag: { zh: '背包', en: 'Bag' },
  all: { zh: '全部', en: 'All' },
  empty: { zh: '（空）', en: '(empty)' },
  autoSell: { zh: '自動賣出低於', en: 'Auto-sell below' },
  sellAll: { zh: '賣出背包全部', en: 'Sell whole bag' },
  chance: { zh: '成功率', en: 'Success' },
  maxed: { zh: '已達上限', en: 'Maxed' },
  smithWorn: { zh: '裝備中', en: 'Equipped' },
  smithGain: { zh: '基礎數值增加 10%', en: 'base numbers +10%' },
  smithKeep: { zh: '升級失敗 LV 不變', en: 'a failed upgrade keeps the LV' },
  smithDrop: { zh: '升級失敗 LV −1', en: 'a failed upgrade costs one LV' },
  smithBreak: { zh: '升級失敗 裝備消失', en: 'a failed upgrade destroys the item' },
  rebirthNeed: { zh: '直到你成年（20），深淵才會回應你', en: 'Only when you come of age (20) will the Abyss answer' },
  rebirthLead: { zh: '讓靈魂沉入深淵，轉生為新的種族。', en: 'Let your soul sink into the Abyss and be reborn as a new race.' },
  inherit: { zh: '繼承', en: 'Kept' },
  inheritList: { zh: '裝備、夥伴、金幣、技能、技能點、稱號', en: 'Gear, pals, gold, skills, AP, titles' },
  lose: { zh: '遺落', en: 'Lost' },
  loseList: { zh: '等級、經驗', en: 'Level, EXP' },
  rebirthDo: { zh: '沉入深淵', en: 'Sink into the Abyss' },
  rebirthConfirm: { zh: '確定要轉生嗎？等級與經驗會歸零。', en: 'Rebirth now? Level and EXP go back to zero.' },
  initStat: { zh: '初始能力', en: 'Base' },
  ageGrowth: { zh: '年齡成長', en: 'Age growth' },
  levelShare: { zh: '每長一歲，獲得 1x 年齡成長加成<br>每升一級，獲得 0.25x 年齡成長加成', en: 'Each birthday grants 1x age growth<br>Each level-up grants 0.25x age growth' },
  ok: { zh: '確定', en: 'OK' },
  back: { zh: '返回', en: 'Back' },
  active: { zh: '同行中', en: 'With you' },
  call: { zh: '同行', en: 'Bring' },
  unknownPet: { zh: '？？？', en: '???' },
  petHint: { zh: '在牠的棲地戰鬥，也許會遇見', en: 'Fight in its home and you may meet it' },
  recArea: { zh: '建議戰力', en: 'Suggested CP' },
  kills: { zh: '擊倒', en: 'Kills' },
  deaths: { zh: '死亡', en: 'Deaths' },
  rebirths: { zh: '轉生次數', en: 'Rebirths' },
  offline: { zh: '你不在的時候，靈魂仍在戰鬥', en: 'While you were away, your soul kept fighting' },
  language: { zh: '語言', en: 'Language' },
  reset: { zh: '刪除存檔', en: 'Delete save' },
  resetConfirm: { zh: '確定刪除存檔？無法復原。', en: 'Delete your save? This cannot be undone.' },
  san: { zh: 'SAN', en: 'SAN' },
  pact: { zh: '契約', en: 'Pact' },
  gift: { zh: '餽贈', en: 'Gift' },
  curse: { zh: '詛咒', en: 'Curse' },
  refuse: { zh: '拒絕深淵', en: 'Refuse the Abyss' },
  offerHead: { zh: '深淵願意給你一樣東西，也要拿走一樣東西。選一組，或者拒絕。契約只維持這一世。', en: 'The Abyss will give you one thing and take another. Pick a pair, or refuse. A pact lasts one life.' },
  noPact: { zh: '這一世沒有契約', en: 'No pact this life' },
  safe: { zh: '安全：SAN 會恢復', en: 'Safe: SAN recovers' },
  dread: { zh: 'SAN 每擊倒', en: 'SAN per kill' },
  sep: { zh: '：', en: ': ' },
  unknown: { zh: '？', en: '?' },
  notLearned: { zh: '尚未學習', en: 'Not learned' },
  skillOff: { zh: '已卸下', en: 'Unequipped' },
  clickOff: { zh: '點擊卸下', en: 'Click to unequip' },
  clickOn: { zh: '點擊裝上', en: 'Click to equip' },
  nextRank: { zh: '下一級', en: 'Next rank' },
  credits: { zh: '字型：俐方體11號 Cubic 11（OFL）', en: 'Font: Cubic 11 (OFL)' },
} satisfies Record<string, L>;

export const t = (k: keyof typeof UI): string => UI[k][lang];
