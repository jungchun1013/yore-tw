/**
 * The character art (directly generated pixel sheet, 2026-11-15, cut by
 * art-reference/redesign/direct-pixel-characters-2026-11-15/prepare.py) stands in for the hero everywhere
 * until the art has equipment layers. Stored at 2x the battle strip like the creatures; every race faces right.
 */
const FACES_LEFT = new Set<string>();
export const heroArtUrl = (race: string): string => `./sprites/hero/${race}.png`;
export const heroFacesLeft = (race: string): boolean => FACES_LEFT.has(race);
