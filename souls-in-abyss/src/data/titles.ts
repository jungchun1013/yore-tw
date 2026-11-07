import type { Counters, L, Mod, Save } from '../game/types';

export interface TitleDef { key: string; name: L; how: L; secret?: boolean; test: (c: Counters, s: Save) => boolean; mods: Mod[] }

export const TITLES: TitleDef[] = [
  { key: 'rookie', name: { zh: '見習冒險者', en: 'Apprentice' }, how: { zh: '擊倒 100 隻', en: '100 kills' }, test: c => c.kills >= 100, mods: [{ key: 'atk', mul: 0.03 }] },
  { key: 'veteran', name: { zh: '百戰', en: 'Veteran' }, how: { zh: '擊倒 2,000 隻', en: '2,000 kills' }, test: c => c.kills >= 2000, mods: [{ key: 'atk', mul: 0.06 }, { key: 'hp', mul: 0.06 }] },
  { key: 'legend', name: { zh: '萬夫莫敵', en: 'Unstoppable' }, how: { zh: '擊倒 20,000 隻', en: '20,000 kills' }, test: c => c.kills >= 20000, mods: [{ key: 'atk', mul: 0.12 }, { key: 'hp', mul: 0.12 }] },
  { key: 'smith5', name: { zh: '鐵匠的熟客', en: 'Smith\'s Regular' }, how: { zh: '強化到 +5', en: 'Reach +5' }, test: c => c.bestPlus >= 5, mods: [{ key: 'def', mul: 0.05 }] },
  { key: 'smith10', name: { zh: '傳說的鍛造', en: 'Legendary Forging' }, how: { zh: '強化到 +10', en: 'Reach +10' }, test: c => c.bestPlus >= 10, mods: [{ key: 'atk', mul: 0.1 }, { key: 'def', mul: 0.1 }] },
  { key: 'fallen', name: { zh: '不屈', en: 'Unbowed' }, how: { zh: '倒下 25 次', en: 'Fall 25 times' }, test: c => c.deaths >= 25, mods: [{ key: 'will', add: 8 }] },
  { key: 'reborn', name: { zh: '轉生者', en: 'Reborn' }, how: { zh: '轉生 1 次', en: 'Rebirth once' }, test: c => c.rebirths >= 1, mods: [{ key: 'xp', mul: 0.15 }] },
  { key: 'cycle', name: { zh: '輪迴之人', en: 'Of the Cycle' }, how: { zh: '轉生 5 次', en: 'Rebirth 5 times' }, test: c => c.rebirths >= 5, mods: (['str', 'dex', 'int', 'will', 'luk'] as const).map(k => ({ key: k, mul: 0.08 })) },
  { key: 'tamer', name: { zh: '夥伴們', en: 'Pack Leader' }, how: { zh: '結識 3 位夥伴', en: 'Meet 3 pals' }, test: (_c, s) => s.pets.length >= 3, mods: [{ key: 'petPower', mul: 0.25 }] },
  { key: 'gazer', name: { zh: '凝視深淵', en: 'Abyss Gazer' }, how: { zh: '抵達深淵迴廊', en: 'Reach the Abyssal Hall' }, test: c => c.deepest >= 7, mods: [{ key: 'crit', add: 0.03 }] },
  { key: 'broken', name: { zh: '見過深淵的人', en: 'Seen the Abyss' }, how: { zh: '理智崩潰 1 次', en: 'Lose your mind once' }, test: c => (c.collapses || 0) >= 1, mods: [{ key: 'will', add: 10 }] },
  { key: 'reader', name: { zh: '讀過結局的人', en: 'Read the Ending' }, how: { zh: '？？？', en: '???' }, secret: true, test: c => c.fateLines >= 3, mods: [{ key: 'luk', add: 7 }] },
];
