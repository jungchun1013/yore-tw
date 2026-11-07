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
  title: { zh: 'SOULS IN ABYSS', en: 'SOULS IN ABYSS' },
  tagline: { zh: '世界底下有一道深淵，所有靈魂最後都會落進去。<br>除了你。你總是會回來。', en: 'Beneath the world lies the Abyss. Every soul falls in at last.<br>Except yours. Yours keeps coming back.' },
  play: { zh: '開始遊戲', en: 'Play Game' },
  name: { zh: '名字', en: 'NAME' },
  race: { zh: '種族', en: 'RACE' },
  age: { zh: '年齡', en: 'AGE' },
  lv: { zh: '等級', en: 'LV' },
  hp: { zh: 'HP', en: 'HP' },
  mp: { zh: 'MP', en: 'MP' },
  exp: { zh: '經驗', en: 'EXP' },
  gold: { zh: '金幣', en: 'GOLD' },
  ap: { zh: 'AP', en: 'AP' },
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
  bond: { zh: '羈絆', en: 'Bond' },
  att: { zh: '技能發動', en: 'ATT.' },
  loot: { zh: '本地圖戰利品', en: 'LOOT IN CURRENT MAP' },
  navEquip: { zh: '裝備', en: 'Equipment' },
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
  bag: { zh: '背包', en: 'Bag' },
  all: { zh: '全部', en: 'All' },
  empty: { zh: '（空）', en: '(empty)' },
  autoSell: { zh: '自動賣出低於', en: 'Auto-sell below' },
  sellAll: { zh: '賣出背包全部', en: 'Sell whole bag' },
  chance: { zh: '成功率', en: 'Success' },
  maxed: { zh: '已達上限', en: 'Maxed' },
  failDrop: { zh: '+5 以上失敗會掉一級', en: 'Failing at +5 or higher loses a level' },
  rebirthNeed: { zh: '滿 20 歲，深淵才會回應你', en: 'The Abyss answers at age 20' },
  rebirthKeep: { zh: '讓靈魂沉入深淵，再從頭活一次。帶得回來的：技能、稱號、金幣、AP、夥伴、物品。等級與成長留在深淵底，只有 10% 會跟著你浮上來。', en: 'Let your soul sink into the Abyss and live again. What comes back with you: skills, titles, gold, AP, pals, items. Level and growth stay at the bottom; only 10% floats back up.' },
  rebirthDo: { zh: '沉入深淵', en: 'Sink into the Abyss' },
  initStat: { zh: '初始能力', en: 'Initial Stat' },
  ageGrowth: { zh: '年齡成長', en: 'Age Growth' },
  levelShare: { zh: '（升級成長：年齡成長的 1/4）', en: '(Level-up Growth: 1/4 of Age Growth)' },
  ok: { zh: '確定', en: 'OK' },
  active: { zh: '同行中', en: 'With you' },
  call: { zh: '同行', en: 'Bring' },
  unknownPet: { zh: '？？？', en: '???' },
  petHint: { zh: '在牠的棲地戰鬥，也許會遇見', en: 'Fight in its home and you may meet it' },
  recArea: { zh: '建議戰力', en: 'Suggested CP' },
  kills: { zh: '擊倒', en: 'Kills' },
  deaths: { zh: '倒下', en: 'Falls' },
  rebirths: { zh: '轉生次數', en: 'Rebirths' },
  offline: { zh: '你不在的時候，靈魂仍在戰鬥', en: 'While you were away, your soul kept fighting' },
  language: { zh: '語言', en: 'Language' },
  reset: { zh: '刪除存檔', en: 'Delete save' },
  resetConfirm: { zh: '確定刪除存檔？無法復原。', en: 'Delete your save? This cannot be undone.' },
  credits: { zh: '字型：俐方體11號 Cubic 11（OFL）', en: 'Font: Cubic 11 (OFL)' },
} satisfies Record<string, L>;

export const t = (k: keyof typeof UI): string => UI[k][lang];
