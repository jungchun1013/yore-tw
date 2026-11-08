import { AREAS } from '../data/areas';
/** Shared landmark positions for the illustrated map and the review website. */
export const WORLD_MAP_POSITIONS: [number, number][] = [
  [22, 9], [62, 20], [34, 32], [74, 43], [30, 55], [68, 66], [36, 78], [58, 89],
];
/** A smooth route through every landmark: Catmull-Rom segments written as cubic Béziers. */
export const worldMapRoute = (): string => {
  const P = WORLD_MAP_POSITIONS, at = (i: number) => P[Math.max(0, Math.min(P.length - 1, i))];
  const f = (n: number) => +n.toFixed(2);
  let d = `M${P[0][0]} ${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) {
    const [x0, y0] = at(i - 1), [x1, y1] = at(i), [x2, y2] = at(i + 1), [x3, y3] = at(i + 2);
    d += ` C${f(x1 + (x2 - x0) / 6)} ${f(y1 + (y2 - y0) / 6)} ${f(x2 - (x3 - x1) / 6)} ${f(y2 - (y3 - y1) / 6)} ${x2} ${y2}`;
  }
  return d;
};

type RGBA = [number, number, number, number];
/** One layer of shade per area, read off the map from top to bottom. The two surface areas stay clear;
 * from the third one down each step adds more violet, and the gate gets the heaviest. The map, the battle
 * strip and the page background all use these same layers, so a change of area is a visible change of weight. */
const LIGHT = [149, 134, 164], DEEP = [61, 51, 80], CLEAR = 2;
export const AREA_SHADE: RGBA[] = WORLD_MAP_POSITIONS.map((_, i, all) => {
  if (i < CLEAR) return [...LIGHT, 0] as RGBA;
  const t = (i - CLEAR) / (all.length - 1 - CLEAR), a = .12 + .6 * t;
  const [r, g, b] = LIGHT.map((v, k) => Math.round(v + (DEEP[k] - v) * t));
  return [r, g, b, +a.toFixed(3)];
});
/** Page background per area: the first keeps the original light grey, the second the light green,
 * and below that the light green darkens under the area's shade. */
const SURFACE_BG = ['#e6e6e6', '#dedfd3'];
export function areaPageBg(key: string): string {
  const i = Math.max(0, AREAS.findIndex(a => a.key === key));
  return SURFACE_BG[i] ?? shadeOver(SURFACE_BG[SURFACE_BG.length - 1], AREA_SHADE[i]);
}
/** The map's gradient passes through each landmark's layer at the landmark's height. */
export const mapShadeCss = (): string => {
  const stops: [number, RGBA][] = [[0, AREA_SHADE[0]], ...WORLD_MAP_POSITIONS.map(([, y], i) => [y, AREA_SHADE[i]] as [number, RGBA]), [100, AREA_SHADE[AREA_SHADE.length - 1]]];
  return `linear-gradient(${stops.map(([p, c]) => `${rgba(c)} ${p}%`).join(', ')})`;
};
export function areaShade(key: string): RGBA {
  return AREA_SHADE[Math.max(0, AREAS.findIndex(a => a.key === key))];
}
export const rgba = ([r, g, b, a]: RGBA): string => `rgba(${r},${g},${b},${a})`;
/** A solid colour: base under the shade. */
export function shadeOver(base: string, [r, g, b, a]: RGBA): string {
  const n = parseInt(base.slice(1), 16), B = [n >> 16, (n >> 8) & 255, n & 255], C = [r, g, b];
  return '#' + B.map((v, k) => Math.round(v * (1 - a) + C[k] * a).toString(16).padStart(2, '0')).join('');
}
