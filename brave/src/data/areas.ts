import type { L } from '../game/types';

/** Archetype multipliers on the level formula in game/monsters.ts. */
export interface MonDef { key: string; name: L; hp: number; atk: number; def: number; spd: number; prt: number; color: string; size: number }
export interface Area { key: string; name: L; flavor: L; min: number; max: number; mons: MonDef[]; bg: string }

const m = (key: string, zh: string, en: string, hp: number, atk: number, def: number, spd: number, prt: number, color: string, size = 1): MonDef =>
  ({ key, name: { zh, en }, hp, atk, def, spd, prt, color, size });

export const AREAS: Area[] = [
  { key: 'meadow', name: { zh: '啟程草原', en: 'Dawn Meadow' }, flavor: { zh: '每個勇者都從這裡出發。', en: 'Every hero starts here.' }, min: 1, max: 6, bg: '#5d8a4a',
    mons: [m('slime', '史萊姆', 'Slime', 0.8, 0.8, 0.5, 1.1, 0, '#7fd1ae', 0.8), m('hornrabbit', '角兔', 'Horned Hare', 0.7, 1.0, 0.6, 0.8, 0.08, '#e8dcc8', 0.7), m('walkshroom', '走路菇', 'Walking Mushroom', 1.2, 0.9, 0.8, 1.2, 0, '#d46a5a', 0.9)] },
  { key: 'forest', name: { zh: '低語森林', en: 'Whispering Wood' }, flavor: { zh: '樹在說話，但你聽不懂。', en: 'The trees talk. You cannot follow.' }, min: 5, max: 14, bg: '#2f5a3a',
    mons: [m('wolf', '灰狼', 'Grey Wolf', 0.9, 1.1, 0.8, 0.8, 0.06, '#8a8f99'), m('goblin', '哥布林', 'Goblin', 1.0, 1.0, 1.0, 1.0, 0.03, '#7aa04a'), m('treant', '小樹人', 'Sapling Treant', 1.6, 0.8, 1.4, 1.4, 0, '#6b4f2f', 1.2)] },
  { key: 'labyrinth', name: { zh: '地下迷宮 一層', en: 'Labyrinth B1' }, flavor: { zh: '有人在牆上寫：「菜單在下一層」。', en: 'Someone wrote on the wall: "the menu is one floor down."' }, min: 12, max: 24, bg: '#3a3550',
    mons: [m('livingarmor', '動甲冑', 'Living Armor', 1.3, 1.0, 2.0, 1.2, 0, '#9aa3b5', 1.1), m('scorpion', '大蠍', 'Giant Scorpion', 1.0, 1.2, 1.2, 1.0, 0.04, '#b5683a'), m('mimic', '寶箱怪', 'Mimic', 1.2, 1.3, 1.2, 1.3, 0, '#c99a3d')] },
  { key: 'mine', name: { zh: '熔岩礦坑', en: 'Ember Mine' }, flavor: { zh: '礦工都撤走了，只留下鎬子和便當。', en: 'The miners left their picks and their lunch.' }, min: 22, max: 36, bg: '#5a2e22',
    mons: [m('salamander', '火蜥蜴', 'Salamander', 1.0, 1.2, 1.0, 0.9, 0.05, '#e0562f'), m('rockturtle', '岩甲龜', 'Rockshell Tortoise', 1.8, 0.8, 2.2, 1.5, 0, '#776b5d', 1.2), m('beetle', '鐵甲蟲', 'Ironback Beetle', 1.1, 1.0, 1.6, 1.0, 0.02, '#4b5563')] },
  { key: 'fen', name: { zh: '霧之沼', en: 'Mistfen' }, flavor: { zh: '霧裡傳來的鐘聲，總是早你一拍。', en: 'The bell in the mist always rings a beat before you.' }, min: 34, max: 52, bg: '#3d5552',
    mons: [m('basilisk', '巴西利斯克', 'Basilisk', 1.3, 1.2, 1.2, 1.1, 0.03, '#6f8f4f', 1.1), m('wisp', '鬼火', 'Will-o-wisp', 0.7, 1.4, 0.6, 0.7, 0.15, '#a0e8ff', 0.6), m('bogfrog', '沼地巨蛙', 'Bog Toad', 1.6, 1.0, 1.0, 1.2, 0.02, '#5b7a3a', 1.2)] },
  { key: 'ruins', name: { zh: '天空遺跡', en: 'Sky Ruins' }, flavor: { zh: '雲上的城，沒有人記得是誰蓋的。', en: 'A city above the clouds. No one remembers the builders.' }, min: 50, max: 72, bg: '#6f8fb5',
    mons: [m('griffon', '獅鷲', 'Griffon', 1.1, 1.3, 1.0, 0.8, 0.08, '#d9b26f', 1.1), m('gargoyle', '石像鬼', 'Gargoyle', 1.3, 1.1, 1.8, 1.1, 0.02, '#8d8d8d'), m('golem', '守護魔像', 'Warden Golem', 2.2, 1.1, 2.0, 1.6, 0, '#a89a7c', 1.3)] },
  { key: 'nest', name: { zh: '古龍之巢', en: 'Elder Nest' }, flavor: { zh: '地上的骨頭比樹還多。', en: 'More bones than trees.' }, min: 70, max: 96, bg: '#4a2f3a',
    mons: [m('wyvern', '飛龍', 'Wyvern', 1.4, 1.3, 1.3, 1.0, 0.05, '#7d3c3c', 1.2), m('thunderwolf', '雷狼', 'Thunder Wolf', 1.2, 1.5, 1.1, 0.8, 0.06, '#5f7fd9', 1.1), m('dragonkin', '龍人', 'Dragonkin', 1.5, 1.3, 1.5, 1.0, 0.03, '#3f7d5c', 1.1)] },
  { key: 'abyss', name: { zh: '深淵迴廊', en: 'Abyssal Hall' }, flavor: { zh: '牆上的眼睛在數你走了幾步。', en: 'The eyes in the walls count your steps.' }, min: 94, max: 130, bg: '#1d1a2e',
    mons: [m('deepone', '深潛者', 'Deep One', 1.5, 1.4, 1.3, 1.0, 0.04, '#3e6b6b', 1.1), m('faceless', '無貌者', 'Faceless', 1.2, 1.6, 1.0, 0.9, 0.1, '#2b2b2b'), m('starspawn', '星之落子', 'Star-fallen', 2.4, 1.5, 1.6, 1.4, 0, '#5a3d7a', 1.4)] },
];

export const areaOf = (k: string): Area => AREAS.find(a => a.key === k) || AREAS[0];
