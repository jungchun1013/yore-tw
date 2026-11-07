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
  title: { zh: '永劫勇者', en: 'Aeon Brave' },
  tabChar: { zh: '角色', en: 'Hero' },
  tabEquip: { zh: '裝備', en: 'Gear' },
  tabSmith: { zh: '鐵匠', en: 'Smith' },
  tabSkills: { zh: '技能', en: 'Skills' },
  tabMap: { zh: '地圖', en: 'Map' },
  tabPets: { zh: '夥伴', en: 'Pals' },
  tabTitles: { zh: '稱號', en: 'Titles' },
  tabRebirth: { zh: '轉生', en: 'Rebirth' },
  lv: { zh: 'Lv', en: 'Lv' },
  age: { zh: '年齡', en: 'Age' },
  gold: { zh: '金幣', en: 'Gold' },
  ap: { zh: 'AP', en: 'AP' },
  cp: { zh: '戰力', en: 'CP' },
  hp: { zh: 'HP', en: 'HP' },
  nextYear: { zh: '下次生日', en: 'Next birthday' },
  equip: { zh: '裝備', en: 'Equip' },
  sell: { zh: '賣出', en: 'Sell' },
  upgrade: { zh: '強化', en: 'Upgrade' },
  learn: { zh: '學習', en: 'Learn' },
  go: { zh: '前往', en: 'Go' },
  here: { zh: '所在地', en: 'Here' },
  bag: { zh: '背包', en: 'Bag' },
  empty: { zh: '（空）', en: '(empty)' },
  autoSell: { zh: '自動賣出低於', en: 'Auto-sell below' },
  sellAll: { zh: '賣出背包全部', en: 'Sell whole bag' },
  chance: { zh: '成功率', en: 'Success' },
  cost: { zh: '費用', en: 'Cost' },
  maxed: { zh: '已達上限', en: 'Maxed' },
  failDrop: { zh: '+5 以上失敗會掉一級', en: 'Failing at +5 or higher loses a level' },
  rebirthNeed: { zh: '滿 20 歲才能轉生', en: 'Rebirth opens at age 20' },
  rebirthKeep: { zh: '保留：技能、稱號、金幣、AP、夥伴、物品。等級與成長歸零，其中 10% 成為永久加成。', en: 'Kept: skills, titles, gold, AP, pals, items. Level and growth reset; 10% of growth becomes permanent.' },
  rebirthDo: { zh: '轉生', en: 'Be reborn' },
  newHero: { zh: '新的勇者', en: 'A new hero' },
  chooseRace: { zh: '種族', en: 'Race' },
  startAge: { zh: '起始年齡', en: 'Starting age' },
  startAgeHint: { zh: '越年輕幸運成長越高，但離 20 歲越遠', en: 'Younger grows more luck, but 20 is further away' },
  name: { zh: '名字', en: 'Name' },
  begin: { zh: '出發', en: 'Set out' },
  active: { zh: '同行中', en: 'With you' },
  call: { zh: '同行', en: 'Bring' },
  bond: { zh: '羈絆', en: 'Bond' },
  unknownPet: { zh: '？？？', en: '???' },
  petHint: { zh: '在牠的棲地戰鬥，也許會遇見', en: 'Fight in its home and you may meet it' },
  locked: { zh: '未取得', en: 'Locked' },
  offline: { zh: '離開期間', en: 'While you were away' },
  kills: { zh: '擊倒', en: 'Kills' },
  deaths: { zh: '倒下', en: 'Falls' },
  rebirths: { zh: '轉生次數', en: 'Rebirths' },
  recArea: { zh: '建議戰力', en: 'Suggested CP' },
  equipped: { zh: '穿戴中', en: 'Worn' },
  stats: { zh: '能力', en: 'Stats' },
  derived: { zh: '戰鬥數值', en: 'Combat' },
  atk: { zh: '攻擊', en: 'ATK' },
  def: { zh: '防禦', en: 'DEF' },
  aspd: { zh: '攻擊間隔', en: 'Attack every' },
  crit: { zh: '爆擊', en: 'Crit' },
  eva: { zh: '迴避', en: 'Evade' },
  hit: { zh: '命中', en: 'Hit' },
  reset: { zh: '刪除存檔', en: 'Delete save' },
  resetConfirm: { zh: '確定刪除存檔？無法復原。', en: 'Delete your save? This cannot be undone.' },
} satisfies Record<string, L>;

export const t = (k: keyof typeof UI): string => UI[k][lang];
