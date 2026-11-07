import type { L, Mod } from '../game/types';

/**
 * Pals. Each has a home area where it can be befriended, three growth stages,
 * a bond that rises while it travels with you, and one signature ability.
 * Stage thresholds: Lv 10 and Lv 30.
 */
export interface PetDef {
  key: string;
  home: string;
  chance: number;               // per kill in its home area
  needRebirths?: number;
  hidden?: boolean;             // not listed until met
  stages: { name: L; color: string }[];
  ability: L;
  mods: (stage: number, bond: number, rebirths: number) => Mod[];
  lore: L;
  quips: L[];
}

export const STAGE_LV = [0, 10, 30];
export const BOND_MAX = 10;
export const BOND_SEC = 600; // one bond point per 10 minutes together

const pc = (x: number) => Math.round(x * 100) + '%';

export const PETS: PetDef[] = [
  {
    key: 'pudding', home: 'meadow', chance: 1 / 120,
    stages: [{ name: { zh: '布丁史萊姆', en: 'Pudding Slime' }, color: '#f2d27a' }, { name: { zh: '焦糖史萊姆', en: 'Caramel Slime' }, color: '#d9963f' }, { name: { zh: '布丁王', en: 'Pudding King' }, color: '#f0b33f' }],
    ability: { zh: '替你擋下部分傷害', en: 'Soaks part of the damage you take' },
    mods: (st, b) => [{ key: 'guard', add: 0.05 + st * 0.05 + b * 0.01 }],
    lore: { zh: '原本是冒險者掉在草原上的點心，吸收了晨露之後醒了過來。至今仍然很甜。', en: 'A snack a hero dropped in the meadow. It drank the dawn dew and woke up. Still sweet.' },
    quips: [{ zh: '布丁史萊姆抖了抖。', en: 'The slime wobbles.' }, { zh: '布丁史萊姆偷偷把掉下來的焦糖吃回去了。', en: 'The slime quietly re-absorbs its caramel.' }],
  },
  {
    key: 'potcat', home: 'forest', chance: 1 / 260,
    stages: [{ name: { zh: '鍋盔貓', en: 'Pot-helm Cat' }, color: '#c7c7c7' }, { name: { zh: '廚師鍋盔貓', en: 'Chef Cat' }, color: '#e8e8e8' }, { name: { zh: '伙房大貓將', en: 'Grand Mess Cat' }, color: '#ffffff' }],
    ability: { zh: '戰鬥中做飯，替你回血', en: 'Cooks mid-fight and heals you' },
    mods: (st, b) => [{ key: 'petHeal', add: 0.02 + st * 0.015 + b * 0.003 }],
    lore: { zh: '頭上那口鍋從不拿下來。牠說等找到最好吃的魔物，就要用這口鍋煮。', en: 'Never takes off the pot. Says it is saving it for the tastiest monster in the world.' },
    quips: [{ zh: '鍋盔貓盯著對手，似乎在想要怎麼料理。', en: 'The cat eyes the monster like an ingredient.' }, { zh: '鍋盔貓：「這個要先去毒。」', en: 'Cat: "This one needs de-venoming first."' }],
  },
  {
    key: 'mosskin', home: 'forest', chance: 1 / 300,
    stages: [{ name: { zh: '苔球精', en: 'Mossling' }, color: '#7cbf5a' }, { name: { zh: '葉笛精', en: 'Leafpiper' }, color: '#5ea63f' }, { name: { zh: '森之老爺', en: 'Old Grove' }, color: '#3f8a2f' }],
    ability: { zh: '找到更多寶物', en: 'Finds more treasure' },
    mods: (st, b) => [{ key: 'drop', mul: 0.1 + st * 0.1 + b * 0.03 }, { key: 'gold', mul: 0.05 + b * 0.01 }],
    lore: { zh: '躲在石頭底下，被翻出來時會大喊一聲然後送你一顆種子。種子有什麼用？牠也不知道。', en: 'Hides under rocks. When found, it shouts and hands you a seed. What is the seed for? It does not know either.' },
    quips: [{ zh: '苔球精：「呀哈哈！」', en: 'Mossling: "Ya-ha-ha!"' }, { zh: '苔球精又塞給你一顆種子。', en: 'The mossling hands you another seed.' }],
  },
  {
    key: 'mimipup', home: 'labyrinth', chance: 1 / 320,
    stages: [{ name: { zh: '寶箱汪', en: 'Mimic Pup' }, color: '#c99a3d' }, { name: { zh: '金扣寶箱汪', en: 'Gilded Pup' }, color: '#e6b84a' }, { name: { zh: '國庫犬', en: 'Treasury Hound' }, color: '#ffd166' }],
    ability: { zh: '金幣大幅增加', en: 'Much more gold' },
    mods: (st, b) => [{ key: 'gold', mul: 0.2 + st * 0.2 + b * 0.04 }],
    lore: { zh: '寶箱怪的幼體，還不會假裝成寶箱，只會假裝成小狗。很成功。', en: 'A baby mimic. It cannot pass as a chest yet, only as a puppy. It works.' },
    quips: [{ zh: '寶箱汪把一枚金幣吐在你腳邊。', en: 'The pup spits a coin at your feet.' }],
  },
  {
    key: 'ember', home: 'mine', chance: 1 / 360,
    stages: [{ name: { zh: '火蜥寶寶', en: 'Ember Newt' }, color: '#ff7a3d' }, { name: { zh: '炎鱗龍', en: 'Flamescale' }, color: '#ff5a2a' }, { name: { zh: '爐心龍', en: 'Hearthcore Drake' }, color: '#ffb02e' }],
    ability: { zh: '自己也會噴火，夥伴傷害大增', en: 'Breathes fire: big pal damage' },
    mods: (st, b) => [{ key: 'petPower', mul: 0.6 + st * 0.5 + b * 0.08 }],
    lore: { zh: '在礦工的便當盒裡孵化，所以對炸豬排特別有好感。', en: 'Hatched inside a miner\'s lunchbox, so it is fond of fried cutlets.' },
    quips: [{ zh: '火蜥寶寶打了一個小小的噴嚏，草燒起來了。', en: 'The newt sneezes. The grass catches fire.' }],
  },
  {
    key: 'griffy', home: 'ruins', chance: 1 / 400,
    stages: [{ name: { zh: '獅鷲雛', en: 'Griffon Chick' }, color: '#e3c27f' }, { name: { zh: '風翼獅鷲', en: 'Windwing' }, color: '#d9a94f' }, { name: { zh: '天空之王', en: 'Sky Sovereign' }, color: '#ffe08a' }],
    ability: { zh: '帶起順風，攻擊速度提升', en: 'Tailwind: faster attacks' },
    mods: (st, b) => [{ key: 'speed', mul: 0.06 + st * 0.05 + b * 0.012 }, { key: 'bal', add: 0.02 + st * 0.01 }],
    lore: { zh: '從遺跡的巢裡掉下來，你接住了牠。牠認定你是媽媽。', en: 'Fell out of a ruin nest and you caught it. It decided you are its mother.' },
    quips: [{ zh: '獅鷲雛試著飛，失敗，坐在你頭上。', en: 'The chick tries to fly, fails, sits on your head.' }],
  },
  {
    key: 'nameless', home: 'abyss', chance: 1 / 2500, needRebirths: 1, hidden: true,
    stages: [{ name: { zh: '無名之仔', en: 'The Nameless' }, color: '#4b3a6b' }, { name: { zh: '無名之仔', en: 'The Nameless' }, color: '#5a3d8a' }, { name: { zh: '無名之仔', en: 'The Nameless' }, color: '#7a4dbf' }],
    ability: { zh: '每轉生一次，就更記得你', en: 'Remembers you a little more each rebirth' },
    mods: (st, b, rb) => {
      const x = 0.02 * rb * (1 + st * 0.5) * (1 + b * 0.05);
      return (['str', 'dex', 'int', 'will', 'luk'] as const).map(k => ({ key: k, mul: x }));
    },
    lore: { zh: '牠沒有名字，但牠知道你的。牠說你上一次也選了這條路。', en: 'It has no name, but it knows yours. It says you took this road last time, too.' },
    quips: [{ zh: '無名之仔看著你，像在核對什麼。', en: 'The Nameless watches you, as if checking a list.' }, { zh: '……你剛才好像聽見翻頁的聲音。', en: '...You think you heard a page turn.' }],
  },
];

export const petOf = (k: string): PetDef | undefined => PETS.find(p => p.key === k);
export const stageOf = (lvl: number): number => (lvl >= STAGE_LV[2] ? 2 : lvl >= STAGE_LV[1] ? 1 : 0);
export const petXpNeed = (lvl: number): number => 8 + lvl * 6;
export const fmtPct = pc;
