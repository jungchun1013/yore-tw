// One swappable random source, so the sim can be seeded.
let rand: () => number = Math.random;
export const setRandom = (f: () => number): void => { rand = f; };
export const rnd = (): number => rand();
export const chance = (p: number): boolean => rand() < p;
export const range = (a: number, b: number): number => a + (b - a) * rand();
export const irange = (a: number, b: number): number => Math.floor(range(a, b + 1));
export function pick<T>(xs: readonly T[]): T { return xs[Math.floor(rand() * xs.length)]; }
export function weighted(ws: number[]): number {
  let s = 0; for (const w of ws) s += w;
  let r = rand() * s;
  for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r < 0) return i; }
  return ws.length - 1;
}
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
