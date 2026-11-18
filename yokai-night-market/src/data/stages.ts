import type { StageDef } from '../game/types';

export const RUN_SECONDS = 15 * 60;
export const ELITE_AT = [4 * 60, 8 * 60, 11 * 60];
export const BOSS_AT = 13 * 60;
export const PARADE_AT = [6 * 60, 10 * 60 + 30];
export const RING_AT = [7 * 60 + 30, 12 * 60];

// `from` / `to` are minutes. Weights are relative within whatever is active.
export const STAGES: StageDef[] = [
  {
    id: 'torii',
    name: { zh: '鳥居參道', en: 'Torii Approach' },
    blurb: { zh: '通往山上神社的石板路，燈籠一盞一盞亮了。', en: 'The stone path up to the hill shrine. The lanterns are lighting one by one.' },
    roster: [
      { id: 'chochin', from: 0, w: 5 },
      { id: 'hitodama', from: 1, w: 3 },
      { id: 'kasa', from: 3, w: 3 },
      { id: 'daruma', from: 6, w: 2 },
    ],
    elites: ['kasa', 'daruma', 'daruma'],
    boss: 'b_toro',
    hpMul: 1, dmgMul: 1, rate: 1,
    ground: 'stone',
    props: ['torii', 'komainu', 'pine', 'slab'],
  },
  {
    id: 'market',
    name: { zh: '廟口夜市', en: 'Temple Night Market' },
    blurb: { zh: '收攤後的夜市，攤車還亮著，客人換了一批。', en: 'The night market after closing. The stalls are still lit; the customers have changed.' },
    roster: [
      { id: 'wan', from: 0, w: 5 },
      { id: 'fukuro', from: 0.5, w: 4 },
      { id: 'saru', from: 3, w: 3 },
      { id: 'kushi', from: 5, w: 3 },
      { id: 'daruma', from: 8, w: 1 },
    ],
    elites: ['wan', 'kushi', 'saru'],
    boss: 'b_denghou',
    hpMul: 1.35, dmgMul: 1.1, rate: 1.1,
    ground: 'asphalt',
    props: ['stall', 'lanterns', 'stool', 'manhole'],
  },
  {
    id: 'dorm',
    name: { zh: '日式老宿舍', en: 'Old Dormitory' },
    blurb: { zh: '沒人住的木造宿舍，榻榻米上有小小的腳步聲。', en: 'An empty wooden dormitory. Small footsteps on the tatami.' },
    roster: [
      { id: 'hitotsume', from: 0, w: 5 },
      { id: 'akaname', from: 1, w: 3 },
      { id: 'isu', from: 3, w: 2 },
      { id: 'zashiki', from: 5, w: 3 },
      { id: 'kasa', from: 7, w: 2 },
    ],
    elites: ['hitotsume', 'isu', 'zashiki'],
    boss: 'b_kinmei',
    hpMul: 1.75, dmgMul: 1.2, rate: 1.15,
    ground: 'tatami',
    props: ['shoji', 'chabudai', 'andon', 'zabuton'],
  },
  {
    id: 'rail',
    name: { zh: '糖廠鐵道', en: 'Sugar Mill Railway' },
    blurb: { zh: '甘蔗田中間的五分車鐵道，煙囪半夜還在冒煙。', en: 'A narrow-gauge line through the cane fields. The chimney still smokes at midnight.' },
    roster: [
      { id: 'susu', from: 0, w: 5 },
      { id: 'ushi', from: 0, w: 3 },
      { id: 'wanyudo', from: 2, w: 3 },
      { id: 'kansho', from: 5, w: 2 },
      { id: 'kushi', from: 7, w: 2 },
    ],
    elites: ['ushi', 'wanyudo', 'kansho'],
    boss: 'b_train',
    hpMul: 2.2, dmgMul: 1.3, rate: 1.2,
    ground: 'gravel',
    props: ['rail', 'cane', 'signal', 'crate'],
  },
  {
    id: 'bamboo',
    name: { zh: '霧山竹林', en: 'Misty Bamboo Hills' },
    blurb: { zh: '起霧的山路，有人在竹林裡叫你的名字。', en: 'A foggy mountain trail. Someone in the bamboo is calling your name.' },
    roster: [
      { id: 'mosina', from: 0, w: 5 },
      { id: 'kodama', from: 0, w: 4 },
      { id: 'tengu', from: 3, w: 2 },
      { id: 'takesao', from: 5, w: 2 },
      { id: 'hitodama', from: 6, w: 3 },
    ],
    elites: ['kodama', 'tengu', 'takesao'],
    boss: 'b_mosina',
    hpMul: 2.7, dmgMul: 1.4, rate: 1.25,
    ground: 'moss',
    props: ['bamboo', 'rock', 'jizo', 'fern'],
  },
  {
    id: 'onsen',
    name: { zh: '溫泉街', en: 'Hot Spring Street' },
    blurb: { zh: '山腳下的溫泉旅館街，白煙裡有東西在動。', en: 'The inn street at the foot of the hills. Something moves in the steam.' },
    roster: [
      { id: 'suiki', from: 0, w: 5 },
      { id: 'nekomata', from: 0.5, w: 3 },
      { id: 'kappa', from: 3, w: 2 },
      { id: 'oke', from: 5, w: 2 },
      { id: 'akaname', from: 7, w: 3 },
    ],
    elites: ['suiki', 'kappa', 'oke'],
    boss: 'b_tiger',
    hpMul: 3.3, dmgMul: 1.5, rate: 1.3,
    ground: 'cobble',
    props: ['noren', 'spring', 'bucket', 'andon'],
  },
];
