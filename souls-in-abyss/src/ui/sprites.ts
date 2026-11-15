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
/** a page may ship its images inline (the claude.ai preview does): url -> data: URI */
const inline = (url: string): string => ((window as any).__ART_DATA || {})[url] || url;
/** Any image by URL, loaded once; null until it has arrived. */
export function image(url: string): HTMLImageElement | null {
  if (!cache[url]) { const im = new Image(); im.src = inline(url); cache[url] = im; }
  return cache[url].complete && cache[url].naturalWidth ? cache[url] : null;
}
export function sprite(key: string): HTMLImageElement | null {
  const url = ART[key];
  return url ? image(url) : null;
}
export const artSrc = inline;

/** Fetch every painted background up front (the current area first) so switching areas never shows a blank frame. */
export function preloadArt(first?: string): void {
  if (first) sprite(first);
  for (const key of Object.keys(ART)) sprite(key);
}
