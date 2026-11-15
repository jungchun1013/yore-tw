import type { L } from '../game/types';

/** Archetype multipliers on the level formula in game/monsters.ts. */
/**
 * art: creature folder in data/creatures.ts. dyes: only these colours of that art (default: all of them).
 * prefix: the rolled colour goes in front of the name (藍花鹿 / Blue Flower Fawn), the user's 2026-11-15 naming rule.
 */
export interface MonDef { key: string; name: L; hp: number; atk: number; def: number; spd: number; prt: number; color: string; size: number; art: string; dyes?: string[]; prefix?: boolean }
/** dread: SAN lost per kill before WILL resistance. 0 = safe ground where SAN recovers. */
export interface Area { key: string; name: L; flavor: L; min: number; max: number; dread: number; mons: MonDef[]; bg: string }

const m = (key: string, zh: string, en: string, hp: number, atk: number, def: number, spd: number, prt: number, color: string, size: number, art: string, extra: Partial<MonDef> = {}): MonDef =>
  ({ key, name: { zh, en }, hp, atk, def, spd, prt, color, size, art, ...extra });

/**
 * Every monster once; the areas below pick from this list, and a monster may live in several areas
 * (the bestiary artifact of 2026-11-15 is the source of the areas and names).
 */
const P = { prefix: true };
const MON: MonDef[] = [
  m('slime', '小芽怪', 'Sprout', 0.8, 0.8, 0.5, 1.1, 0, '#7fd1ae', 0.8, 'sprout'),
  m('hornrabbit', '花鹿', 'Flower Fawn', 0.7, 1.0, 0.6, 0.8, 0.08, '#e8dcc8', 0.7, 'flower-deer', P),
  m('walkshroom', '花羽貓頭鷹', 'Bloomfeather Owl', 1.2, 0.9, 0.8, 1.2, 0, '#d46a5a', 0.9, 'owl', P),
  m('wolf', '草葉狼', 'Floral Wolf', 0.9, 1.1, 0.8, 0.8, 0.06, '#8a8f99', 1, 'floral-wolf'),
  m('goblin', '花靈', 'Flower Spirit', 1.0, 1.0, 1.0, 1.0, 0.03, '#7aa04a', 1, 'flower-spirit', P),
  m('mooncat', '蝕月貓', 'Eclipse Cat', 0.8, 1.2, 0.7, 0.7, 0.1, '#3f3a4d', 0.9, 'moon-cat'),
  m('direbear', '兇熊', 'Dire Bear', 1.7, 1.3, 1.2, 1.3, 0.02, '#7a4b3a', 1.3, 'bear', P),
  m('livingarmor', '空甲騎士', 'Hollow Knight', 1.3, 1.0, 2.0, 1.2, 0, '#9aa3b5', 1.1, 'hollow-knight'),
  m('scorpion', '大蠍', 'Giant Scorpion', 1.0, 1.2, 1.2, 1.0, 0.04, '#b5683a', 1, 'scorpion', P),
  m('mimic', '寶箱汪', 'Mimic Pup', 1.2, 1.3, 1.2, 1.3, 0, '#c99a3d', 1, 'mimic-puppy'),
  m('tome', '低語書', 'Whispering Tome', 0.9, 1.3, 0.9, 1.1, 0.08, '#526d79', 0.9, 'book'),
  m('stonebat', '石蝠', 'Stone Bat', 0.8, 1.1, 0.8, 0.7, 0.1, '#bcc5bd', 0.9, 'bat'),
  m('pothermit', '陶壺寄居怪', 'Pot Hermit', 1.4, 0.9, 1.8, 1.3, 0, '#b47f76', 1, 'pot-hermit'),
  m('rockturtle', '水晶龜', 'Crystal Tortoise', 1.8, 0.8, 2.2, 1.5, 0, '#776b5d', 1.2, 'crystal-turtle', P),
  m('beetle', '水晶野豬', 'Crystal Boar', 1.1, 1.0, 1.6, 1.0, 0.02, '#4b5563', 1, 'crystal-boar', P),
  m('emberbeetle', '炭殼甲蟲', 'Ember Beetle', 1.2, 0.9, 1.9, 1.2, 0, '#343842', 0.9, 'ember-beetle'),
  m('slagsnail', '熔岩蝸牛', 'Slag Snail', 1.5, 1.1, 1.5, 1.6, 0, '#855c59', 0.9, 'slag-snail'),
  m('emberfox', '火狐狸', 'Ember Fox', 0.8, 1.3, 0.7, 0.7, 0.12, '#b47f76', 1, 'fire-fox'),
  m('wisp', '鬼火', 'Will-o-wisp', 0.7, 1.4, 0.6, 0.7, 0.15, '#a0e8ff', 0.6, 'wisp'),
  m('bogfrog', '瀑布石像', 'Waterfall Golem', 1.6, 1.0, 1.0, 1.2, 0.02, '#5b7a3a', 1.2, 'waterfall-golem'),
  m('murkjelly', '污濁水母', 'Murky Jelly', 1.1, 1.0, 0.8, 1.2, 0.05, '#839da5', 0.9, 'jelly'),
  m('shelldweller', '螺殼客', 'Shell Dweller', 1.3, 1.1, 1.7, 1.3, 0.02, '#cfb49a', 1.1, 'shell-dweller'),
  m('shadowwolf', '黑狼', 'Shadow Wolf', 1.0, 1.4, 0.9, 0.8, 0.08, '#343842', 1.1, 'shadow-wolf'),
  m('griffon', '獅鷲', 'Griffon', 1.1, 1.3, 1.0, 0.8, 0.08, '#d9b26f', 1.1, 'griffin'),
  m('gargoyle', '遺跡石像', 'Ruin Golem', 1.3, 1.1, 1.8, 1.1, 0.02, '#8d8d8d', 1, 'ruin-golem'),
  m('golem', '水晶石獸', 'Crystal Golem', 2.2, 1.1, 2.0, 1.6, 0, '#a89a7c', 1.3, 'crystal-golem'),
  m('mutebell', '失語鐘', 'Mute Bell', 1.8, 1.2, 1.9, 1.5, 0, '#c1a775', 1.4, 'bell'),
  m('starstag', '星群鹿', 'Star Stag', 1.2, 1.3, 1.0, 0.9, 0.1, '#e3ddc9', 1.3, 'star-deer'),
  m('wyvern', '鹿角龍', 'Antler Dragon', 1.4, 1.3, 1.3, 1.0, 0.05, '#7d3c3c', 1.2, 'antler-dragon'),
  m('thunderwolf', '雷狼', 'Thunder Wolf', 1.2, 1.5, 1.1, 0.8, 0.06, '#5f7fd9', 1.1, 'thunder-wolf', P),
  m('dragonkin', '鹿角巨獸', 'Antler Stag', 1.5, 1.3, 1.5, 1.0, 0.03, '#3f7d5c', 1.1, 'antler-stag'),
  m('starfox', '星群狐', 'Star Fox', 1.1, 1.5, 1.0, 0.7, 0.12, '#e3ddc9', 1.1, 'star-fox'),
  m('starwhale', '星群鯨', 'Star Whale', 2.4, 1.2, 1.6, 1.5, 0.02, '#e3ddc9', 1.5, 'star-whale'),
  m('faceless', '無貌者', 'Faceless', 1.2, 1.6, 1.0, 0.9, 0.1, '#2b2b2b', 1, 'faceless'),
  m('starspawn', '星之落子', 'Star-fallen', 2.4, 1.5, 1.6, 1.4, 0, '#5a3d7a', 1.4, 'star-fallen'),
  m('reachinghand', '伸出的手', 'The Reaching Hand', 1.8, 1.6, 1.3, 1.2, 0.05, '#e3ddc9', 1.5, 'hand'),
  m('emptyseat', '空座', 'Empty Seat', 2.0, 1.3, 1.9, 1.5, 0, '#839da5', 1.4, 'seat'),
  m('thegap', '門縫', 'The Gap', 1.0, 1.8, 0.8, 0.8, 0.15, '#e3ddc9', 1.4, 'gap'),
  m('scales', '傾斜天平', 'Leaning Scales', 1.4, 1.4, 1.2, 1.2, 0.06, '#c1a775', 1.5, 'scales'),
  // the spirits: one piece of art, six families told apart by colour; each has a home and all of them haunt the labyrinth
  m('grassspirit', '草靈', 'Grass Spirit', 1.0, 1.2, 1.0, 0.9, 0.05, '#82947b', 1, 'flame-spirit', { dyes: ['sage'] }),
  m('salamander', '火靈', 'Flame Spirit', 1.0, 1.2, 1.0, 0.9, 0.05, '#e0562f', 1, 'flame-spirit', { dyes: ['terracotta', 'rose', 'earth'] }),
  m('waterspirit', '水靈', 'Water Spirit', 1.0, 1.2, 1.0, 0.9, 0.05, '#839da5', 1, 'flame-spirit', { dyes: ['blue', 'silver'] }),
  m('skyspirit', '天靈', 'Sky Spirit', 1.0, 1.2, 1.0, 0.9, 0.05, '#e3ddc9', 1, 'flame-spirit', { dyes: ['cream'] }),
  m('lightspirit', '光靈', 'Light Spirit', 1.0, 1.2, 1.0, 0.9, 0.05, '#c1a775', 1, 'flame-spirit', { dyes: ['gold'] }),
  m('darkspirit', '闇靈', 'Dark Spirit', 1.0, 1.2, 1.0, 0.9, 0.05, '#343842', 1, 'flame-spirit', { dyes: ['midnight', 'lavender'] }),
];
const byKey = Object.fromEntries(MON.map(d => [d.key, d]));
const mons = (...keys: string[]): MonDef[] => keys.map(k => { const d = byKey[k]; if (!d) throw new Error('unknown monster ' + k); return d; });

export const AREAS: Area[] = [
  { key: 'meadow', name: { zh: '啟程草原', en: 'Dawn Meadow' }, flavor: { zh: '草原中央有一口井，沒有人敢往下看。', en: 'There is a well in the middle of the meadow. No one looks down it.' }, min: 1, max: 6, dread: 0, bg: '#5d8a4a',
    mons: mons('slime', 'hornrabbit', 'walkshroom') },
  { key: 'forest', name: { zh: '低語森林', en: 'Whispering Wood' }, flavor: { zh: '樹根全往同一個方向長——往下。', en: 'Every root grows the same way: down.' }, min: 5, max: 14, dread: 0, bg: '#2f5a3a',
    mons: mons('hornrabbit', 'wolf', 'goblin', 'grassspirit', 'mooncat', 'direbear') },
  { key: 'labyrinth', name: { zh: '地下迷宮 一層', en: 'Labyrinth B1' }, flavor: { zh: '牆上寫著：「菜單在下一層。再下一層是深淵。」', en: 'Written on the wall: "The menu is one floor down. The Abyss is the floor after."' }, min: 12, max: 24, dread: 0.15, bg: '#3a3550',
    mons: mons('livingarmor', 'scorpion', 'mimic', 'tome', 'stonebat', 'pothermit', 'rockturtle', 'direbear', 'mooncat', 'emberfox', 'grassspirit', 'salamander', 'waterspirit', 'skyspirit', 'lightspirit', 'darkspirit') },
  { key: 'mine', name: { zh: '熔岩礦坑', en: 'Ember Mine' }, flavor: { zh: '礦工挖得太深，聽見下面也有人在往上挖。', en: 'The miners dug too deep and heard someone digging up.' }, min: 22, max: 36, dread: 0.25, bg: '#5a2e22',
    mons: mons('salamander', 'rockturtle', 'beetle', 'emberbeetle', 'slagsnail', 'emberfox', 'scorpion', 'golem') },
  { key: 'fen', name: { zh: '霧之沼', en: 'Mistfen' }, flavor: { zh: '霧裡的鐘聲，是從水底傳上來的。', en: 'The bell in the mist rings from under the water.' }, min: 34, max: 52, dread: 0.4, bg: '#3d5552',
    mons: mons('wisp', 'bogfrog', 'murkjelly', 'shelldweller', 'shadowwolf', 'waterspirit', 'scorpion') },
  { key: 'ruins', name: { zh: '天空遺跡', en: 'Sky Ruins' }, flavor: { zh: '雲上的城沒有影子。它的影子落在深淵底。', en: 'The city above the clouds casts no shadow. Its shadow lies at the bottom of the Abyss.' }, min: 50, max: 72, dread: 0.55, bg: '#6f8fb5',
    mons: mons('griffon', 'gargoyle', 'golem', 'mutebell', 'starstag', 'skyspirit', 'dragonkin', 'shadowwolf', 'starfox', 'starwhale') },
  { key: 'nest', name: { zh: '古龍之巢', en: 'Elder Nest' }, flavor: { zh: '古龍不是來這裡等死，是來這裡守門的。', en: 'The elder dragons did not come here to die. They came to guard the gate.' }, min: 70, max: 96, dread: 0.7, bg: '#4a2f3a',
    mons: mons('wyvern', 'thunderwolf', 'dragonkin', 'starfox', 'starwhale', 'starstag', 'lightspirit', 'griffon', 'shadowwolf', 'mooncat') },
  { key: 'abyss', name: { zh: '深淵迴廊', en: 'Abyssal Hall' }, flavor: { zh: '牆上的眼睛在數你走了幾步。這不是你第一次來。', en: 'The eyes in the walls count your steps. This is not your first visit.' }, min: 94, max: 130, dread: 1.2, bg: '#1d1a2e',
    mons: mons('faceless', 'starspawn', 'reachinghand', 'emptyseat', 'thegap', 'scales', 'darkspirit', 'wyvern', 'mutebell', 'tome') },
];

export const areaOf = (k: string): Area => AREAS.find(a => a.key === k) || AREAS[0];
