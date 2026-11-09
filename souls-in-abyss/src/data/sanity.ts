import type { L, ModKey } from '../game/types';
import { rnd } from '../core/rng';

/**
 * Sanity (SAN). It is lost by dying where you do not belong: the further an area's level is above yours,
 * the more each death costs. Safe ground (dread 0) costs nothing and slowly restores it.
 * Below MAD_FROM the Abyss starts to bless and curse your abilities at random; at 0 the mind breaks.
 */
export const SAN_REGEN = 2 / 60;          // per second on safe ground (2 per minute)
export const SAN_WAKE = 40;               // where you wake after a collapse
export const COLLAPSE_SEC = 4;            // the screen stays black this long
export const willResist = (will: number): number => 100 / (100 + will);
export const BOND_CALM = 0.03;            // each bond point of the active pal: -3% loss

/** SAN lost per death, a whole number: 5, plus 2 for every level the area's lowest level is above yours. */
export const DEATH_BASE = 5, DEATH_PER_LV = 2;
export function deathSanLoss(areaMin: number, lvl: number, will: number, drain: number, bond: number): number {
  const raw = DEATH_BASE + DEATH_PER_LV * Math.max(0, areaMin - lvl);
  return Math.max(1, Math.round(raw * willResist(will) * drain * (1 - bond * BOND_CALM)));
}

/** Madness: 0 at SAN 50 and above, 1 at SAN 0. */
export const MAD_FROM = 50;
export const madness = (san: number): number => Math.max(0, Math.min(1, (MAD_FROM - san) / MAD_FROM));
/** The abilities the Abyss plays with. HP and MP are left alone so the bars do not jump. */
export const MAD_KEYS: ModKey[] = ['str', 'dex', 'int', 'will', 'luk', 'atk', 'def', 'speed'];
/**
 * Each ability gets a whole-number percent: centre -4% → -20%, spread ±1% → ±30%,
 * so -3..-5% just below SAN 50 and +10..-50% at SAN 0. Above 0 is a blessing, below a curse.
 */
export function rollMad(m: number): Record<string, number> {
  const centre = -(4 + 16 * m), spread = 1 + 29 * m, out: Record<string, number> = {};
  for (const k of MAD_KEYS) out[k] = Math.round(centre + (rnd() * 2 - 1) * spread);
  return out;
}
/** Seconds between rolls: 5 at the edge of madness, 1 at SAN 0. */
export const madInterval = (m: number): number => 5 - 4 * m;

/** A collapse throws this share (30–50%) of the gold, the bag and this life's EXP into the Abyss; each is rolled on its own. */
export const LOSS_MIN = 0.3, LOSS_MAX = 0.5;

export interface SanTier { min: number; name: L; color: string }
/** Ordered from highest SAN down; names only, the numbers come from madness(). */
export const SAN_TIERS: SanTier[] = [
  { min: 50, name: { zh: '清醒', en: 'Lucid' }, color: '#6b6b6b' },
  { min: 25, name: { zh: '動搖', en: 'Shaken' }, color: '#b07ad1' },
  { min: 0, name: { zh: '瘋狂', en: 'Mad' }, color: '#8e3fd1' },
];
export const sanTier = (san: number): number => (san >= 50 ? 0 : san >= 25 ? 1 : 2);

/** When mad, names sometimes come out wrong. */
export const GLITCH: L[] = [
  { zh: '？？？', en: '???' }, { zh: '它', en: 'It' }, { zh: '不該存在的東西', en: 'The Thing That Should Not' }, { zh: '■■■', en: '■■■' }, { zh: '你自己', en: 'Yourself' },
];
export const HALLUCINATIONS: L[] = [
  { zh: '牆在呼吸。', en: 'The walls are breathing.' },
  { zh: '你數了一下手指。多了一根。', en: 'You count your fingers. There is one too many.' },
  { zh: '有人在你耳邊念你的名字，用的是倒過來的念法。', en: 'Someone whispers your name in your ear, backwards.' },
  { zh: '地上的影子比你先動了一步。', en: 'Your shadow moves a step before you do.' },
  { zh: '你聽見很深很深的地方，有東西在笑。', en: 'Far, far below, something is laughing.' },
];
export const COLLAPSE: L = { zh: '你的理智崩潰了。黑暗吞沒了一切。', en: 'Your mind breaks. The dark swallows everything.' };
export const WAKE: L = { zh: '你在草原的井邊醒來，口袋輕了不少。', en: 'You wake by the well in the meadow. Your pockets feel lighter.' };
