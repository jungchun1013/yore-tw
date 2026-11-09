/** Art study catalogue, separate from progression rules. Regional branches are
 * alternatives, not a claim that Nordic buildings are a higher technology tier. */
export const BUILDING_STUDIES = {
  plank: {
    prop: 'rusticHut', name: '樸素紅頂小屋', materials: ['planks', 'shingles'],
    region: 'fantasy-temperate', stages: [1,2], improvements: ['side window'],
  },
  log: {
    prop: 'logCabin', name: '北地原木屋', materials: ['conifer-logs', 'wood-shingles', 'stone'],
    region: 'boreal-inspired', stages: [1,2], improvements: ['chimney', 'smoke'],
  },
} as const;
