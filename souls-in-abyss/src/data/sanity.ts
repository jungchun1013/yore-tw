import type { L, Mod } from '../game/types';

/**
 * Sanity (SAN). Deep areas drain it per kill; safe ground (dread 0) restores it.
 * Low SAN is power with a price: the Abyss lends you its sight.
 */
export const SAN_REGEN = 2 / 60;          // per second on safe ground (2 per minute)
export const SAN_WAKE = 40;               // where you wake after a collapse
export const COLLAPSE_SEC = 12;
export const willResist = (will: number): number => 100 / (100 + will);
export const BOND_CALM = 0.03;            // each bond point of the active pal: -3% drain

export interface SanTier { min: number; name: L; color: string; mods: Mod[] }
/** Ordered from highest SAN down; a tier applies when SAN is below the previous tier's min. */
export const SAN_TIERS: SanTier[] = [
  { min: 50, name: { zh: '清醒', en: 'Lucid' }, color: '#6b6b6b', mods: [] },
  { min: 25, name: { zh: '動搖', en: 'Shaken' }, color: '#b07ad1', mods: [{ key: 'crit', add: 0.05 }, { key: 'dmgTaken', mul: 0.1 }] },
  { min: 0, name: { zh: '瘋狂', en: 'Mad' }, color: '#8e3fd1', mods: [{ key: 'crit', add: 0.1 }, { key: 'drop', mul: 0.3 }, { key: 'dmgTaken', mul: 0.25 }] },
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
export const COLLAPSE: L = { zh: '你的理智崩潰了。你抱著頭蹲在地上，直到聲音停下來。', en: 'Your mind breaks. You crouch with your head in your hands until the voices stop.' };
