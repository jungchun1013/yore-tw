/** Walk-in customer species. Cats are common; rarer animals pay more and fill the codex. */
export interface Species {
  id: string;
  name: string;
  blurb: string;
  /** relative spawn weight */
  weight: number;
  /** multiplier on the customer order bonus */
  orderMult: number;
  /** coat keys (see content/coats) this species can wear */
  coats: string[];
  /** 22-wide rows replacing the cat's ear rows (the last row must be the head top edge); used when no body is given */
  head: string[];
  /** optional feature overlay (nose, beak, ears hanging down…) with its row offset */
  extra?: { rows: string[]; dy: number };
  /** a full 22-wide body of its own (any height); drawn instead of the cat body */
  body?: string[];
}

export const SPECIES: Species[] = [
  {
    id: 'cat', name: 'Neighbourhood Cat', blurb: 'Knows exactly which macaron it wants. Will not say.', weight: 34, orderMult: 1,
    coats: ['orangewhite', 'calico', 'white', 'black', 'cow', 'orangetabby', 'graywhite'],
    head: ['...##.......##........', '..#bb#.....#bb#.......', '..#bbb#####bbb#.......'],
  },
  {
    id: 'dog', name: 'Shiba Regular', blurb: 'Wags at the display case. Buys for the whole family.', weight: 16, orderMult: 1.3,
    coats: ['shiba', 'beagle'],
    head: ['......................', '......................', '..#############.......'],
    body: [
      '...##.........##......',
      '..#bb#.......#bb#.....',
      '..#bbb#.....#bbb#.....',
      '.#bbbbb#####bbbbb#....',
      '.#bbbbbbbbbbbbbbb#....',
      '.#bbbbebbbbbbbebbb#...',
      '#bbbbbbwwwwwwbbbbbb#..',
      '#bbbbbwww##wwwbbbbb#.#',
      '#bbbbbwwwwwwwwbbbbb##s',
      '#bbbbbbwwpwwbbbbbbbbs#',
      '#bbbbbwwwwwwwwbbbbbb#.',
      '#bbbbbwwwwwwwwbbbbb#..',
      '.#bbbbbwwwwwwbbbbb#...',
      '.#bbbbbbbbbbbbbbbb#...',
      '..#bb#bbbbbbbb#bb#....',
      '...##..######..##.....',
    ],
  },
  {
    id: 'rabbit', name: 'Bunny', blurb: 'Only the pistachio ones. Always the pistachio ones.', weight: 14, orderMult: 1.2,
    coats: ['bunnywhite', 'bunnygray'],
    head: ['...##.......##........', '..#pb#.....#bp#.......', '..#pb#.....#bp#.......', '..#bb#.....#bb#.......', '..#bbb#####bbb#.......'],
    body: [
      '.....##.....##........',
      '....#pb#...#bp#.......',
      '....#pb#...#bp#.......',
      '....#pb#...#bp#.......',
      '....#bb#...#bb#.......',
      '....#bb#...#bb#.......',
      '...#bbbb###bbbb#......',
      '..#bbbbbbbbbbbbb#.....',
      '..#bbbebbbbbbebb#.....',
      '..#bbbbbbbpbbbbb#.....',
      '..#bbbbbb#b#bbbb#.....',
      '...#bbbbbbbbbbb#......',
      '..#bbbbbbbbbbbbb#.##..',
      '..#bbbbbbbbbbbbb##ww#.',
      '..#bbbbbbbbbbbbb#.##..',
      '...#bb#bbbbb#bb#......',
      '....##..###..##.......',
    ],
  },
  {
    id: 'bear', name: 'Bear (very polite)', blurb: 'Takes up the whole doorway. Orders two dozen.', weight: 8, orderMult: 1.8,
    coats: ['bear', 'polar'],
    head: ['..###.......###.......', '.#aaa#.....#aaa#......', '..#############.......'],
    body: [
      '..####.........####...',
      '.#pppp#.......#pppp#..',
      '.#pppp####..###pppp#..',
      '..##bbbbbb##bbbbbb##..',
      '...#bbbbbbbbbbbbbb#...',
      '..#bbbbbbbbbbbbbbbb#..',
      '..#bbbebbbbbbbbebbb#..',
      '..#bbbbbwwwwwwbbbbb#..',
      '..#bbbbwww##wwwbbbb#..',
      '..#bbbbwwwwwwwwbbbb#..',
      '..#bbbbbwwwwwwbbbbb#..',
      '..#bbbbbbbbbbbbbbbb#..',
      '..#bbbbbbbbbbbbbbbb#..',
      '..#bbbbbbbbbbbbbbbb#..',
      '...#bb#bbbbbbbb#bb#...',
      '....##..######..##....',
    ],
  },
  {
    id: 'duck', name: 'Duck', blurb: 'Pays in exact change. Nobody knows where it keeps it.', weight: 12, orderMult: 1,
    coats: ['duck'],
    head: ['......................', '.......###............', '..#############.......'],
    body: [
      '........###...........',
      '.......#bbb#..........',
      '......#bbbbb#.........',
      '.....#bbbbbbb#........',
      '....#bbebbbebb#.......',
      '....#bbbbbbbbb#.......',
      '...#bbb#oooo#bb#......',
      '...#bbb#oooo#bbb#.....',
      '..#bbbbb####bbbbb#....',
      '..#bbbbbbbbbbbbbbb#...',
      '.#sbbbbbbbbbbbbbbbs#..',
      '.#ssbbbbbbbbbbbbbss#..',
      '.#sbbbbbbbbbbbbbbbs#..',
      '..#bbbbbbbbbbbbbbb#...',
      '...##bbbbbbbbbbb##....',
      '....#oo#####oo#.......',
    ],
  },
  {
    id: 'hamster', name: 'Hamster', blurb: 'Buys one macaron. Stores it in a cheek for later.', weight: 12, orderMult: 0.6,
    coats: ['hamster'],
    head: ['......................', '...##......##.........', '..#############.......'],
    body: [
      '....##.......##.......',
      '...#bb#.....#bb#......',
      '..#bbbb#####bbbb#.....',
      '.#bbbbbbbbbbbbbbb#....',
      '.#bbbbbbbbbbbbbbb#....',
      '#bbbbebbbbbbbebbbb#...',
      '#bppbbbbb#bbbbbppb#...',
      '#bppbbbb#b#bbbbppb#...',
      '#bbbbbbwwwwwwbbbbb#...',
      '#bbbbbwwwwwwwwbbbb#...',
      '#bbbbbwwwwwwwwbbbb#...',
      '#bbbbbwwwwwwwwbbbb#...',
      '.#bbbbbwwwwwwbbbb#....',
      '.#bbbbbbbbbbbbbbb#....',
      '..#bb#bbbbbbbb#bb#....',
      '...##..######..##.....',
    ],
  },
  {
    id: 'penguin', name: 'Penguin (tourist)', blurb: 'Came a very long way. Buys the entire shelf.', weight: 4, orderMult: 2.5,
    coats: ['penguin'],
    head: ['......................', '......................', '..#############.......'],
    body: [
      '......#######.........',
      '.....#bbbbbbb#........',
      '....#bbbbbbbbb#.......',
      '...#bbwwwwwwwbb#......',
      '...#bwwewwwewwb#......',
      '...#bwww#oo#wwb#......',
      '...#bbww#oo#wbb#......',
      '..#bbbbwwwwwbbbb#.....',
      '.#sbbbwwwwwwwbbbs#....',
      '.#sbbwwwwwwwwwbbs#....',
      '.#sbbwwwwwwwwwbbs#....',
      '.#sbbwwwwwwwwwbbs#....',
      '..#bbbwwwwwwwbbb#.....',
      '...#bbbwwwwwbbb#......',
      '....#bbbbbbbbb#.......',
      '....#oo#...#oo#.......',
    ],
  },
];

export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

export function pickSpecies(rand = Math.random()): Species {
  const total = SPECIES.reduce((a, s) => a + s.weight, 0);
  let r = rand * total;
  for (const s of SPECIES) { r -= s.weight; if (r <= 0) return s; }
  return SPECIES[0];
}
