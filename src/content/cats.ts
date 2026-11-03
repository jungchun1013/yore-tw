import type { GeneratorDef } from '../core/types';
import { CAT_ZH, SPECIAL_ZH } from './zh';
import { lang } from '../i18n';

/**
 * Cat generators. Cost/production ratios follow the classic clicker curve
 * (each tier ~10x cost, ~5-6x production, cost growth 1.15 per unit).
 */
const CATS_EN: GeneratorDef[] = [
  { id: 'kitten',     name: 'Kitten',         desc: 'Bats at the dough. Mostly helps.',            baseCost: 15,       baseProd: 0.2,     costMult: 1.15, color: 'pink', coat: 'orangewhite',      accessory: 'none' },
  { id: 'apprentice', name: 'Apprentice Cat', desc: 'Has read half of one recipe.',               baseCost: 100,      baseProd: 1,       costMult: 1.15, color: 'mint', coat: 'calico',      accessory: 'bow' },
  { id: 'baker',      name: 'Baker Cat',      desc: 'Pipes perfect shells. Never shares the trick.', baseCost: 700,   baseProd: 6,       costMult: 1.15, color: 'lemon', coat: 'white',     accessory: 'kerchief' },
  { id: 'courier',    name: 'Courier Cat',    desc: 'Delivers macarons across town at 3am.',      baseCost: 5000,    baseProd: 35,      costMult: 1.15, color: 'sky', coat: 'black',       accessory: 'cap' },
  { id: 'patissier',  name: 'Pâtissier Cat',  desc: 'Trained in Paris. Judges your ganache.',     baseCost: 40000,   baseProd: 200,     costMult: 1.15, color: 'lavender', coat: 'cow',  accessory: 'tallhat' },
  { id: 'manager',    name: 'Manager Cat',    desc: 'Schedules naps with ruthless efficiency.',    baseCost: 420000,    baseProd: 1400,    costMult: 1.15, color: 'peach', coat: 'orangetabby',     accessory: 'tie' },
  { id: 'influencer', name: 'Influencer Cat', desc: 'One photo, ten thousand orders.',            baseCost: 5.2e+06,   baseProd: 9500,    costMult: 1.15, color: 'rose', coat: 'graywhite',      accessory: 'sunglasses' },
  { id: 'deity',      name: 'Cat Deity',      desc: 'Macarons simply appear. Do not question it.', baseCost: 8.5e+07,  baseProd: 72000,   costMult: 1.15, color: 'gold', coat: 'gold',      accessory: 'halo' },
  { id: 'timecat',    name: 'Time Cat',       desc: 'Bakes yesterday\'s batch tomorrow, today.',   baseCost: 1.7e+09,  baseProd: 650000,  costMult: 1.15, color: 'blueberry', coat: 'blueberry', accessory: 'clock' },
  { id: 'cosmic',     name: 'Cosmic Cat',     desc: 'Whole galaxies, lightly whisked.',           baseCost: 4.2e+10,  baseProd: 7.5e+06,   costMult: 1.15, color: 'cosmic', coat: 'cosmic', accessory: 'crown' },
  { id: 'rainbow',    name: 'Rainbow Cat',    desc: 'Nya nya nya. Found only by the persistent.', baseCost: 7.77e7,  baseProd: 77777,   costMult: 1.15, color: 'rose',      coat: 'rainbow',   accessory: 'none', secret: 'rainbow' },
];

export const CATS: GeneratorDef[] = CATS_EN.map((c) => ({ ...c, zh: CAT_ZH[c.id] }));

export const CAT_BY_ID: Record<string, GeneratorDef> = Object.fromEntries(CATS.map((c) => [c.id, c]));

/** Cats with a special ability, shown with a distinct frame in the shop. */
export const SPECIAL_CATS: Record<string, { label: string; blurb: string; tone: 'rose' | 'gold' | 'sky' | 'cosmic' | 'rainbow' }> = {
  influencer: { label: 'Meowstagram', blurb: 'Pet it when it glows: posts a photo; followers bring customers faster.', tone: 'rose' },
  deity: { label: 'Blessing', blurb: 'Pet it when it glows: ×1.5 production for 45 s (+0.1 per extra Deity, up to ×2) + a 20 s burst.', tone: 'gold' },
  timecat: { label: 'Time warp', blurb: 'Pet it when it glows: ×2 speed for 20 s. +2 h offline cap each.', tone: 'sky' },
  cosmic: { label: 'Stardust', blurb: 'Pet it when it glows: a rain of stardust — +1 stardust (10 = 1 permanent ★) and a 15 s burst. +10% prestige stars each.', tone: 'cosmic' },
  rainbow: { label: 'Nyan dash', blurb: 'Pet it when it glows: zooms across the shop with rainbows, chiptune and +10 s of production.', tone: 'rainbow' },
};

/** Special-cat label and blurb in the current language. */
export function specialText(id: string): { label: string; blurb: string } {
  const en = SPECIAL_CATS[id];
  return lang() === 'zh' && SPECIAL_ZH[id] ? SPECIAL_ZH[id] : { label: en.label, blurb: en.blurb };
}
