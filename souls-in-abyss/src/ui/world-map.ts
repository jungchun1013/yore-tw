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
