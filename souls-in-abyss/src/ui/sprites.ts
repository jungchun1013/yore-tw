/**
 * Sprite registry. Drop a PNG into public/sprites/ and list its key here; the battle
 * scene draws it instead of the placeholder shape. Keys the scene asks for:
 *   hero.<race>        human, elf, dwarf, beast
 *   mon.<monster key>  see data/areas.ts
 *   pet.<pet key>.<stage 0-2>
 *   bg.<area key>
 */
export const ART: Record<string, string> = {
  'bg.meadow': './sprites/battle/bg-meadow.png',
  'bg.forest': './sprites/battle/bg-forest.png',
  'bg.labyrinth': './sprites/battle/bg-labyrinth.png',
  'bg.mine': './sprites/battle/bg-mine.png',
  'bg.fen': './sprites/battle/bg-fen.png',
  'bg.ruins': './sprites/battle/bg-ruins.png',
  'bg.nest': './sprites/battle/bg-nest.png',
  'bg.abyss': './sprites/battle/bg-abyss.png',
};

const cache: Record<string, HTMLImageElement> = {};
export function sprite(key: string): HTMLImageElement | null {
  const url = ART[key];
  if (!url) return null;
  if (!cache[key]) { const im = new Image(); im.src = url; cache[key] = im; }
  return cache[key].complete && cache[key].naturalWidth ? cache[key] : null;
}
