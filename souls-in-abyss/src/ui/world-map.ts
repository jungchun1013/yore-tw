/** Shared landmark positions for the illustrated map and the review website. */
export const WORLD_MAP_POSITIONS: [number, number][] = [
  [22, 9], [62, 20], [34, 32], [74, 43], [30, 55], [68, 66], [36, 78], [58, 89],
];
export const worldMapRoute = (): string => WORLD_MAP_POSITIONS.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
