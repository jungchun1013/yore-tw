import { pick } from '../core/rng';

/**
 * Creature art (Codex handoff 2026-11-13, background removed, stored at 2x the battle strip).
 * Every creature comes in several dyes; a monster or pal takes one at random.
 * Files: public/sprites/mon/<creature>/<dye>.png. Art faces left (toward the hero).
 */
export const CREATURE_DYES: Record<string, string[]> = {
  'sprout': ["sage", "blue", "lavender", "terracotta", "earth", "gold"],
  'flower-deer': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'owl': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'crystal-turtle': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'flower-spirit': ["sage", "blue", "lavender", "terracotta", "earth", "gold"],
  'mimic-puppy': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'floral-wolf': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'hollow-knight': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'scorpion': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'flame-spirit': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'ruin-golem': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'crystal-boar': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'waterfall-golem': ["gold-eyes", "blue-eyes"],
  'crystal-golem': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'griffin': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'antler-stag': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'antler-dragon': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  // 2026-11-15 batch (Codex handoff new-creatures-claude-handoff-2026-11-15; same tone pass as the rest)
  'wisp': ["blue"],
  'thunder-wolf': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'faceless': ["blue"],
  'star-fallen': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'jelly': ["blue"],
  'bear': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'book': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'shell-dweller': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'shadow-wolf': ["blue"],
  'ember-beetle': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'slag-snail': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'moon-cat': ["blue", "terracotta", "cream", "silver", "midnight"],
  'bell': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'hand': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'seat': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'scales': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'star-whale': ["blue"],
  'gap': ["blue"],
  'bat': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'pot-hermit': ["sage", "blue", "lavender", "terracotta", "earth", "gold", "cream", "rose", "silver", "midnight"],
  'star-deer': ["blue"],
  'star-fox': ["blue"],
  'fire-fox': ["terracotta", "gold", "cream", "silver", "midnight"],
};

/** The star-swarm creatures are made of light, and so is the gold spirit (光靈): the battle strip draws a soft pulsing glow behind them. */
export const GLOW_ART = new Set(['star-whale', 'star-deer', 'star-fox']);
export const glows = (art: string, dye: string): boolean => GLOW_ART.has(art) || (art === 'flame-spirit' && dye === 'gold');

/** The colour word a dye puts in front of a monster's name (user rule 2026-11-15: 藍花鹿, 綠色大蠍 …). */
export const DYE_WORD: Record<string, { zh: string; en: string }> = {
  sage: { zh: '綠', en: 'Green' }, blue: { zh: '藍', en: 'Blue' }, lavender: { zh: '紫', en: 'Violet' }, terracotta: { zh: '赤', en: 'Red' }, earth: { zh: '褐', en: 'Brown' },
  gold: { zh: '金', en: 'Gold' }, cream: { zh: '白', en: 'White' }, rose: { zh: '粉', en: 'Rose' }, silver: { zh: '銀', en: 'Silver' }, midnight: { zh: '黑', en: 'Black' },
  'gold-eyes': { zh: '金眼', en: 'Gold-eyed' }, 'blue-eyes': { zh: '藍眼', en: 'Blue-eyed' },
};

/** Monsters without their own art yet show the flame spirit, the Abyss's stray soul. */
export const SOUL_ART = 'flame-spirit';

export const creatureUrl = (art: string, dye: string): string => `./sprites/mon/${art}/${dye}.png`;
export const randomDye = (art: string): string => pick(CREATURE_DYES[art] || CREATURE_DYES[SOUL_ART]);
