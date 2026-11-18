import type { StageDef } from '../game/types';

export const RUN_SECONDS = 15 * 60;
export const ELITE_AT = [4 * 60, 8 * 60, 11 * 60];
export const BOSS_AT = 13 * 60;
export const PARADE_AT = [6 * 60, 10 * 60 + 30];
export const RING_AT = [7 * 60 + 30, 12 * 60];

// `from` / `to` are minutes. Weights are relative within whatever is active.
export const STAGES: StageDef[] = [
  {
    id: 'shrine',
    name: { zh: '臺南神社參道', en: 'Tainan Shrine Approach' },
    blurb: { zh: '孔廟對面的神社外苑，武德殿剛蓋好，石板路上的燈籠一盞一盞亮了。', en: 'The shrine grounds across from the Confucius Temple, beside the new Butokuden. The lanterns are lighting one by one.' },
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
    props: ['torii', 'komainu', 'phoenix', 'slab', 'festivalGate', 'machiya', 'yukataGirl', 'huye'],
  },
  {
    id: 'ginza',
    name: { zh: '末廣町銀座', en: 'Suehiro-cho Ginza' },
    blurb: { zh: '五層樓仔林百貨打烊了，西門外沙卡里巴的攤子還亮著，客人換了一批。', en: 'The five-storey Hayashi Department Store has closed. The Sakariba stalls past the west gate are still lit; the customers have changed.' },
    roster: [
      { id: 'wan', from: 0, w: 5 },
      { id: 'fukuro', from: 0.5, w: 4 },
      { id: 'saru', from: 3, w: 3 },
      { id: 'kushi', from: 5, w: 3 },
      { id: 'daruma', from: 8, w: 1 },
    ],
    elites: ['wan', 'kushi', 'saru'],
    boss: 'b_lintou',
    hpMul: 1.35, dmgMul: 1.1, rate: 1.1,
    ground: 'asphalt',
    props: ['stall', 'lanterns', 'hayashi', 'noodleStall', 'shennong', 'vendor', 'snackGirl', 'manhole'],
  },
  {
    id: 'ryotei',
    name: { zh: '鶯料理', en: 'Uguisu Ryotei' },
    blurb: { zh: '測候所旁的料亭，客人都走了，榻榻米上還有小小的腳步聲。', en: 'The restaurant beside the weather observatory. The guests have left; small footsteps cross the tatami.' },
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
    props: ['shoji', 'chabudai', 'andon', 'zabuton', 'yukataGirl'],
  },
  {
    id: 'rail',
    name: { zh: '糖廠鐵道', en: 'Sugar Mill Railway' },
    blurb: { zh: '嘉南大圳通水後整片都是甘蔗田，五分車鐵道穿過中間，煙囪半夜還在冒煙。', en: 'Cane fields everywhere since the Chianan Canal opened. A narrow-gauge line runs through them and the chimney still smokes at midnight.' },
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
    props: ['rail', 'cane', 'signal', 'crate', 'postman', 'tudigong'],
  },
  {
    id: 'temple',
    name: { zh: '孔廟・大南門', en: 'Confucius Temple and the Great South Gate' },
    blurb: { zh: '全臺首學的紅牆外，老城門邊的榕樹下，有一道青光在飄。', en: 'Outside the red walls of the island\'s first school, under the banyans by the old gate, a blue-green light is drifting.' },
    roster: [
      { id: 'kodama', from: 0, w: 5 },
      { id: 'mosina', from: 1, w: 3 },
      { id: 'isu', from: 3, w: 2 },
      { id: 'takesao', from: 5, w: 2 },
      { id: 'hitodama', from: 6, w: 3 },
    ],
    elites: ['kodama', 'isu', 'takesao'],
    boss: 'b_shouniang',
    hpMul: 2.7, dmgMul: 1.4, rate: 1.25,
    ground: 'moss',
    props: ['redgate', 'chihkan', 'phoenix', 'ridge', 'altar', 'turtleSpirit', 'musician', 'yuelao', 'qiye', 'baye'],
  },
  {
    id: 'anping',
    name: { zh: '安平', en: 'Anping' },
    blurb: { zh: '運河的盡頭。劍獅咬著劍守在門楣上，鹽田和蚵棚外面就是海。', en: 'Where the canal ends. Sword lions guard the lintels; past the salt pans and oyster racks is the sea.' },
    roster: [
      { id: 'suiki', from: 0, w: 5 },
      { id: 'nekomata', from: 0.5, w: 3 },
      { id: 'kappa', from: 3, w: 2 },
      { id: 'oke', from: 5, w: 2 },
      { id: 'akaname', from: 7, w: 3 },
    ],
    elites: ['suiki', 'kappa', 'oke'],
    boss: 'b_kun',
    hpMul: 3.3, dmgMul: 1.5, rate: 1.3,
    ground: 'sand',
    props: ['swordlion', 'pandan', 'saltpile', 'bucket', 'tileWindow', 'fisherBoy', 'mazu'],
  },
];
