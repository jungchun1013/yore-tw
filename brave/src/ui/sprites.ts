/**
 * Sprite registry. Drop a PNG into public/sprites/ and list its key here; the battle
 * scene draws it instead of the placeholder shape. Keys the scene asks for:
 *   hero.<race>        human, elf, dwarf, beast
 *   mon.<monster key>  see data/areas.ts
 *   pet.<pet key>.<stage 0-2>
 *   bg.<area key>
 */
export const ART: Record<string, string> = {
  // 'hero.human': './sprites/hero.human.png',
};

const cache: Record<string, HTMLImageElement> = {};
export function sprite(key: string): HTMLImageElement | null {
  const url = ART[key];
  if (!url) return null;
  if (!cache[key]) { const im = new Image(); im.src = url; cache[key] = im; }
  return cache[key].complete && cache[key].naturalWidth ? cache[key] : null;
}
