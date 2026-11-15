import type { L, Mod } from '../game/types';

/**
 * Pals are picked up like loot, not unlocked: some monsters spawn with the "friendly" label, and defeating a friendly one may make it join you
 * (it keeps its dye). Each one that joins is its own pal with its own level and bond, so you can keep several of a kind, up to PAL_SIZE,
 * and part with the ones you do not want. Three growth stages, a bond that rises while it travels with you, and one signature ability.
 * Stage thresholds: Lv 10 and Lv 30.
 */
export interface PetDef {
  key: string;
  home: string;
  mon: string;                  // the monster that may join you when defeated
  art: string;                  // creature folder in data/creatures.ts
  chance: number;               // per kill of a friendly one
  stages: { name: L; color: string }[];
  ability: L;
  mods: (stage: number, bond: number, rebirths: number) => Mod[];
  lore: L;
  quips: L[];
}

export const STAGE_LV = [0, 10, 30];
/** How often a monster that could be a pal spawns with the "friendly" label (never while your pals are full). */
export const FRIENDLY_CHANCE = 0.05;
/** How many pals you can keep, like the bag's size. */
export const PAL_SIZE = 20;
/** the label's name, shown before the monster's */
export const FRIENDLY: L = { zh: '友善的', en: 'Friendly ' };
export const BOND_MAX = 10;
export const BOND_SEC = 600; // one bond point per 10 minutes together

const pc = (x: number) => Math.round(x * 100) + '%';
/** the art does not change with stage yet, so all three stages share a name */
const same = (name: L, color: string) => [0, 1, 2].map(() => ({ name, color }));

export const PETS: PetDef[] = [
  {
    key: 'owl', home: 'meadow', mon: 'walkshroom', art: 'owl', chance: 0.5,
    stages: same({ zh: '花羽貓頭鷹', en: 'Bloomfeather Owl' }, '#9586a4'),
    ability: { zh: '戰鬥獲得的 EXP 增加', en: 'More EXP from every fight' },
    mods: (st, b) => [{ key: 'xp', mul: 0.08 + st * 0.06 + b * 0.01 }],
    lore: { zh: '同行時，每場戰鬥獲得的 EXP 增加。等級和羈絆越高，加成越多。', en: 'While it travels with you, every fight gives more EXP. The bonus grows with its level and your bond.' },
    quips: [{ zh: '花羽貓頭鷹轉頭看了看四周。', en: 'The owl turns its head and looks around.' }],
  },
  {
    key: 'bloom', home: 'forest', mon: 'goblin', art: 'flower-spirit', chance: 0.35,
    stages: same({ zh: '花靈', en: 'Flower Spirit' }, '#82947b'),
    ability: { zh: '戰鬥中替你回復 HP', en: 'Restores your HP mid-fight' },
    mods: (st, b) => [{ key: 'petHeal', add: 0.02 + st * 0.015 + b * 0.003 }],
    lore: { zh: '同行時，戰鬥中會替你回復 HP。等級和羈絆越高，回復越多。', en: 'While it travels with you, it restores your HP during fights. It heals more as its level and your bond grow.' },
    quips: [{ zh: '花靈身上落下幾片花瓣。', en: 'A few petals drift off the flower spirit.' }],
  },
  {
    key: 'mimipup', home: 'labyrinth', mon: 'mimic', art: 'mimic-puppy', chance: 0.3,
    stages: same({ zh: '寶箱汪', en: 'Mimic Pup' }, '#c1a775'),
    ability: { zh: '擊敗怪物獲得的金幣增加', en: 'More gold from every kill' },
    mods: (st, b) => [{ key: 'gold', mul: 0.2 + st * 0.2 + b * 0.04 }],
    lore: { zh: '同行時，擊敗怪物獲得的金幣增加。等級和羈絆越高，加成越多。', en: 'While it travels with you, every kill gives more gold. The bonus grows with its level and your bond.' },
    quips: [{ zh: '寶箱汪闔上箱蓋，又打開。', en: 'The mimic pup snaps its lid shut, then opens it again.' }],
  },
  {
    key: 'griffy', home: 'ruins', mon: 'griffon', art: 'griffin', chance: 0.25,
    stages: same({ zh: '獅鷲', en: 'Griffon' }, '#c1a775'),
    ability: { zh: '攻擊速度與平衡提升', en: 'Faster attacks and better balance' },
    mods: (st, b) => [{ key: 'speed', mul: 0.06 + st * 0.05 + b * 0.012 }, { key: 'bal', add: 0.02 + st * 0.01 }],
    lore: { zh: '同行時，你的攻擊速度和平衡提升。等級和羈絆越高，提升越多。', en: 'While it travels with you, you attack faster and with better balance. Both grow with its level and your bond.' },
    quips: [{ zh: '獅鷲張開翅膀，又收了回去。', en: 'The griffon spreads its wings, then folds them.' }],
  },
];

/** Old pals from earlier saves become the closest new one (or leave, if none fits). */
export const OLD_PETS: Record<string, string> = { pudding: 'owl', potcat: 'bloom', mosskin: 'bloom', mimipup: 'mimipup', griffy: 'griffy' };

export const petOf = (k: string): PetDef | undefined => PETS.find(p => p.key === k);
export const stageOf = (lvl: number): number => (lvl >= STAGE_LV[2] ? 2 : lvl >= STAGE_LV[1] ? 1 : 0);
export const petXpNeed = (lvl: number): number => 8 + lvl * 6;
export const fmtPct = pc;
