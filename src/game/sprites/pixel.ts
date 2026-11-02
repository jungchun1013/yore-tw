import { PALETTE } from '../../content/palette';
import { COATS, type Coat } from '../../content/coats';

/**
 * Procedural pixel art. Everything is drawn from string templates so the game ships
 * with zero image assets. Legend:
 *   .  transparent    #  outline      b  body fill     s  body shade
 *   e  eye            p  pink (nose / inner ear)      c  cheek blush
 *   w  white          a  accent (accessory colour)    d  dark accent
 */
const OUTLINE = '#5A4038';
const EYE = '#3A2622';
const PINK = '#F28CA3';
const CHEEK = 'rgba(242,140,163,0.55)';
const WHITE = '#FFFFFF';

export const SPRITE_W = 24;
export const SPRITE_H = 24;

// Pusheen-style blob cat: 22 wide, 16 tall, drawn at offset (1, 8) in a 24x24 canvas (room for hats).
export const CAT_W = 22;
export const CAT_H = 16;
const CAT_OPEN = [
  '...##.......##........',
  '..#bb#.....#bb#.......',
  '..#bbb#####bbb#.......',
  '.#bbbbsbsbsbbbbb#.....',
  '.#bbbbsbsbsbbbbb#.....',
  '.#bbbebbbbbebbbb#.....',
  '#bppbbbmbmbbbppbb#....',
  '#bbbbbbbmbbbbbbbb#....',
  '#bbbbbbbbbbbbbbbb#....',
  '#ssbbbbbbbbbbbssb####.',
  '#bbbbbbbbbbbbbbbb#bsb#',
  '#ssbbbbbbbbbbbssb##bb#',
  '#bbbbbbbbbbbbbbbb##sb#',
  '#bbbbbbbbbbbbbbbbbbb#.',
  '.#bbbbb#bb#bbbbb#bb#..',
  '..#####.##.#####.##...',
];
const CAT_BLINK = CAT_OPEN.map((row, y) => {
  if (y === 5) return row.replace(/e/g, 'b');
  if (y === 6) return row.slice(0, 5) + 'm' + row.slice(6, 11) + 'm' + row.slice(12);
  return row;
});
/** Happy frame: eyes squeezed into > < */
const CAT_HAPPY = CAT_OPEN.map((row, y) => {
  const set = (r: string, idxs: number[], ch: string) => { const a = r.split(''); for (const i of idxs) a[i] = ch; return a.join(''); };
  if (y === 4) return set(row, [4, 12], 'm');
  if (y === 5) return set(row, [5, 11], 'm');
  if (y === 6) return set(row, [4, 12], 'm');
  return row;
});
/** Laughing frame: > ∀ < — squeezed eyes and an open mouth shaped like ∀: a wide top bar narrowing to a point, tongue inside. */
const CAT_LAUGH = CAT_HAPPY.map((row, y) => {
  const set = (r: string, idxs: number[], ch: string) => { const a = r.split(''); for (const i of idxs) a[i] = ch; return a.join(''); };
  if (y === 6) return set(row, [6, 7, 8, 9, 10], 'm');
  if (y === 7) return set(set(row, [7, 9], 'm'), [8], 'p');
  if (y === 8) return set(row, [8], 'm');
  return row;
});
export type CatFrame = 'open' | 'blink' | 'happy' | 'laugh';
const SHADE: [number, number][] = [];

/** Patch masks aligned with CAT_OPEN: A = first patch colour, B = second. Applied only over fur pixels. */
const PATTERNS: Record<string, string[]> = {
  bicolor: [
    '...AA.......AA........',
    '...AA.......AA........',
    '...AAA.....AAA........',
    '..AAAAAAAAAAAAAA......',
    '..AAAAAAAAAAAAAA......',
    '..AAA.......AAAA......',
    '.AAA.........AAA......',
    '.AA...........AA......',
    '.A.............A......',
    '...................AAA',
    '..................AAAA',
    '..................AAAA',
    '..................AAA.',
    '......................',
    '......................',
    '......................',
  ],
  calico: [
    '...AA.......BB........',
    '...AA.......BB........',
    '...AAA.....BBB........',
    '..AAAAA...............',
    '..AAAA................',
    '..AAA.................',
    '......................',
    '......................',
    '..............BB......',
    '.............BBBB..AAA',
    '.............BBBB.AAAA',
    '..AAA.........BB..AAAA',
    '.AAAAA............AAA.',
    '.AAAA.................',
    '......................',
    '......................',
  ],
  belly: [
    '......................',
    '......................',
    '......................',
    '......................',
    '......................',
    '......................',
    '......................',
    '......AAAAA...........',
    '.....AAAAAAA..........',
    '....AAAAAAAAA.........',
    '....AAAAAAAAA.........',
    '....AAAAAAAAA.........',
    '.....AAAAAAA..........',
    '......AAAAA...........',
    '......................',
    '......................',
  ],
  cow: [
    '............BB........',
    '............BB........',
    '...........BBB........',
    '..........BBBBB.......',
    '...........BBB........',
    '......................',
    '......................',
    '......................',
    '..BBB.................',
    '.BBBBB.............BBB',
    '.BBBB.............BBBB',
    '..BB..........BBB.BBBB',
    '.............BBBB.BBB.',
    '..............BB......',
    '......................',
    '......................',
  ],
};

/** Accessory overlays: 22-wide rows plus dy = row offset of the overlay's first row relative to the cat's top row. */
const ACCESSORIES: Record<string, { rows: string[]; dy: number }> = {
  none: { rows: [], dy: 0 },
  bow: { rows: [ // bow on the right ear
    '............##.#......',
    '...........#aa#a#.....',
    '............#aa#......',
    '...........#a##a#.....',
    '............#..#......',
  ], dy: -1 },
  hat: { rows: [ // chef toque
    '.....########.........',
    '....#wwwwwwww#........',
    '....#wwwwwwww#........',
    '.....#wwwwww#.........',
    '.....########.........',
  ], dy: -2 },
  tallhat: { rows: [
    '......######..........',
    '.....#wwwwww#.........',
    '.....#wwwwww#.........',
    '.....#wwwwww#.........',
    '....#wwwwwwww#........',
    '.....########.........',
  ], dy: -3 },
  cap: { rows: [ // delivery cap with a brim
    '.....########.........',
    '....#aaaaaaaa#........',
    '...#aaaaaaaaaa#####...',
    '...################...',
  ], dy: -1 },
  glasses: { rows: [], dy: 0 },
  sunglasses: { rows: [], dy: 0 },
  halo: { rows: [
    '......######..........',
    '.....#yyyyyy#.........',
    '......######..........',
  ], dy: -4 },
  clock: { rows: [ // pocket watch on the chest
    '......####............',
    '.....#wwww#...........',
    '.....#wa#w#...........',
    '.....#wwww#...........',
    '......####............',
  ], dy: 8 },
  crown: { rows: [
    '.....#..##..#.........',
    '.....#a#aa#a#.........',
    '.....#aaaaaa#.........',
    '.....########.........',
  ], dy: -2 },
};

const EYEWEAR: Record<string, string[]> = {
  glasses: [
    '...#####.#####........',
    '...#eee###eee#........',
    '...#####.#####........',
  ],
};
/** One pair of shades for everyone (the Influencer Cat and the fans it brings in): dark lenses with a glint, drawn around the eye pixels. */
function drawShades(ctx: CanvasRenderingContext2D, lx: number, rx: number, y: number): void {
  for (const x of [lx, rx]) {
    for (let i = -2; i <= 2; i++) { px(ctx, x + i, y - 1, OUTLINE); px(ctx, x + i, y + 1, OUTLINE); }
    px(ctx, x - 2, y, OUTLINE); px(ctx, x + 2, y, OUTLINE);
    px(ctx, x - 1, y, '#FFFFFF'); px(ctx, x, y, '#2A1E1B'); px(ctx, x + 1, y, '#2A1E1B'); // glint on the left of each lens
  }
  for (let x = lx + 3; x < rx - 2; x++) px(ctx, x, y, OUTLINE); // bridge
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function drawTemplate(ctx: CanvasRenderingContext2D, rows: string[], ox: number, oy: number, colors: Record<string, string>) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const c = colors[ch];
      if (c) px(ctx, ox + x, oy + y, c);
    }
  });
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export interface SpeciesArt { head: string[]; extra?: { rows: string[]; dy: number }; body?: string[] }

/** Happy / blink frames for a custom body: eyes become a closed line (> < at this size). */
function bodyFrame(body: string[], frame: CatFrame): string[] {
  if (frame === 'open') return body;
  return body.map((row) => row.replace(/e/g, '#'));
}

export function drawCat(ctx: CanvasRenderingContext2D, coatKey: string, accessory: string, frame: CatFrame | boolean = 'open', ox = 1, oy = 8, species?: SpeciesArt): void {
  if (frame === true) frame = 'blink'; else if (frame === false) frame = 'open';
  if (species?.body) {
    const coat: Coat = COATS[coatKey] ?? COATS.cream;
    const colors: Record<string, string> = { '#': OUTLINE, b: coat.fill, s: coat.stripe, e: coat.eye ?? EYE, p: PINK, c: CHEEK, w: WHITE, a: PALETTE.pink.accent, d: '#2A1E1B', o: '#F2A65A', m: coat.face ?? OUTLINE, y: '#FFD84D' };
    const rows = bodyFrame(species.body, frame);
    drawTemplate(ctx, rows, ox, SPRITE_H - rows.length, colors);
    return;
  }
  const coat: Coat = COATS[coatKey] ?? COATS.cream;
  const accent = PALETTE.pink.accent;
  const colors: Record<string, string> = { '#': OUTLINE, b: coat.fill, s: coat.stripe, e: coat.eye ?? EYE, p: PINK, c: CHEEK, w: WHITE, a: accent, d: '#2A1E1B', o: '#F2A65A', m: coat.face ?? OUTLINE, y: '#FFD84D' };
  let rows = frame === 'blink' ? CAT_BLINK : frame === 'happy' ? CAT_HAPPY : frame === 'laugh' ? CAT_LAUGH : CAT_OPEN;
  if (species) { const extraRows = species.head.length - 3; rows = [...species.head, ...rows.slice(3)]; oy -= extraRows; }
  drawTemplate(ctx, rows, ox, oy, colors);
  for (const [x, y] of SHADE) if (rows[y][x] === 'b') px(ctx, ox + x, oy + y, coat.stripe);
  const mask = coat.pattern ? PATTERNS[coat.pattern] : null;
  const maskOff = species ? species.head.length - 3 : 0;
  if (mask) {
    mask.forEach((mrow, my) => {
      const y = my + maskOff;
      for (let x = 0; x < mrow.length; x++) {
        const m = mrow[x]; if (m === '.') continue;
        const base = rows[y]?.[x];
        if (base !== 'b' && base !== 's') continue;
        const color = m === 'A' ? (base === 's' ? coat.patchAStripe ?? coat.patchA : coat.patchA) : coat.patchB;
        if (color) px(ctx, ox + x, oy + y, color);
      }
    });
  }
  if (species?.extra) drawTemplate(ctx, species.extra.rows, ox, oy + species.extra.dy + (species.head.length - 3), colors);
  const eyew = EYEWEAR[accessory];
  if (eyew) drawTemplate(ctx, eyew, ox, oy + 4, { '#': OUTLINE, e: 'rgba(196,222,245,0.55)', d: '#2A1E1B' });
  if (accessory === 'sunglasses') drawShades(ctx, ox + 5, ox + 11, oy + 5); // the eyes sit at template columns 5 and 11, row 5
  const acc = ACCESSORIES[accessory];
  if (acc && acc.rows.length) drawTemplate(ctx, acc.rows, ox, oy + acc.dy, colors);
}

export function animalCanvas(species: SpeciesArt, coatKey: string, frame: CatFrame = 'open', sunglasses = false): HTMLCanvasElement {
  const c = makeCanvas(SPRITE_W, SPRITE_H);
  const ctx = c.getContext('2d')!;
  drawCat(ctx, coatKey, 'none', frame, 1, 8, species);
  if (sunglasses) {
    // dark shades across the eye row of whatever body this is (row with 'e' pixels)
    const rows = species.body ?? [];
    const eyeRow = rows.findIndex((r) => r.includes('e'));
    const oy = species.body ? SPRITE_H - rows.length : 8;
    if (eyeRow >= 0) {
      const first = rows[eyeRow].indexOf('e'), last = rows[eyeRow].lastIndexOf('e');
      drawShades(ctx, 1 + first, 1 + last, oy + eyeRow);
    } else {
      drawShades(ctx, 6, 12, 13); // cat-shaped customers share the cat's eye positions
    }
  }
  return c;
}

export function catCanvas(coatKey: string, accessory: string, frame: CatFrame | boolean = 'open'): HTMLCanvasElement {
  const c = makeCanvas(SPRITE_W, SPRITE_H);
  drawCat(c.getContext('2d')!, coatKey, accessory, frame);
  return c;
}

const MACARON = [
  '..####..',
  '.#bbbb#.',
  '#bbbbbb#',
  '#wwwwww#',
  '#ssssss#',
  '.#ssss#.',
  '..####..',
];
export function macaronCanvas(paletteKey: string): HTMLCanvasElement {
  const pal = PALETTE[paletteKey] ?? PALETTE.pink;
  const c = makeCanvas(8, 8);
  drawTemplate(c.getContext('2d')!, MACARON, 0, 0, { '#': OUTLINE, b: pal.fill, s: pal.shade, w: '#FFF3E6' });
  return c;
}

const STAR = [
  '...#...',
  '..#a#..',
  '###a###',
  '#aaaaa#',
  '.#aaa#.',
  '.#a#a#.',
  '##...##',
];
export function starCanvas(): HTMLCanvasElement {
  const c = makeCanvas(7, 7);
  drawTemplate(c.getContext('2d')!, STAR, 0, 0, { '#': OUTLINE, a: '#F4DC9A' });
  return c;
}

/** Generic icon for upgrades: a macaron in the given palette colour. */
export function iconDataUrl(paletteKey: string): string {
  return macaronCanvas(paletteKey).toDataURL();
}

/** Factory stations, one template per tier (0 = starter, 1–3 = bought upgrades). Each tier is a real step of the macaron
 *  process, so the kitchen teaches how macarons are made as it grows. 22 wide, up to 24 tall, bottom-aligned.
 *  Keys: # outline · m metal · s metal shade · d dark · o oven glow · k kraft · a batter/shell accent · w white/meringue
 *        p pink ribbon · c wood · y warm light · b glass/energy · f flame · r red · g mint · l lavender silicone
 *        e grey (mesh, bubbles) · n almond flour · h ganache */
const PROP_TIERS: Record<string, string[][]> = {
  mixer: [
    [ // t0: whipping meringue by hand — a bowl, white peaks, a whisk (the spinning whisk sprite sits here)
      '..........###.........',
      '.........#ccc#........',
      '.........#ccc#........',
      '..........#c#.........',
      '..........#e#.........',
      '.........#e.e#........',
      '........#e...e#.......',
      '...###############....',
      '..#wwwwwwwwwwwwwww#...',
      '..#wwaaaaaaaaaaaww#...',
      '..#aaaaaaaaaaaaaaa#...',
      '...#aaaaaaaaaaaaa#....',
      '....#############.....',
      '.......#mmmm#.........',
      '......########........',
    ],
    [ // t1: flour sifter — almond flour and icing sugar sifted into the bowl (no lumps, smooth shells)
      '....##############....',
      '...#mmmmmmmmmmmmmm#...',
      '...#m#e#e#e#e#e#em#...',
      '...#me#e#e#e#e#e#m#...',
      '....##############....',
      '.....n..n..n..n.......',
      '......n..n..n.........',
      '.....n..n..n..n.......',
      '...###############....',
      '..#nnnnnnnnnnnnnnn#...',
      '..#nnaaaaaaaaaaann#...',
      '..#aaaaaaaaaaaaaaa#...',
      '...#aaaaaaaaaaaaa#....',
      '....#############.....',
      '.......#mmmm#.........',
      '......########........',
    ],
    [ // t2: meringue stand mixer — stiff peaks every time
      '......############....',
      '......#mmmmmmmmmm#....',
      '......#mmmmmmmmmm###..',
      '......#mmssssssmm#m#..',
      '......############m#..',
      '.........#.......#m#..',
      '.........#.......#m#..',
      '...###########...#m#..',
      '..#wwwwwwwwwwww#..#m#.',
      '..#wwwaaaaaaaww#..#m#.',
      '..#aaaaaaaaaaaa#..#m#.',
      '..#aaaaaaaaaaaa#..#m#.',
      '..##aaaaaaaaaa##..#m#.',
      '...############..#m#..',
      '.......###.......#m#..',
      '.......#m#.......#m#..',
      '.......#m#.......#m#..',
      '.......#m#.......#m#..',
      '.......###.......#m#..',
      '.###################..',
      '.#mmmmmmmmmmmmmmmmm#..',
      '.#sssssssssssssssss#..',
      '.###################..',
    ],
    [ // t3: macaronage station — a big spatula folds the batter until it flows like a ribbon, on a marble slab
      '..............####....',
      '.............#cccc#...',
      '............#cccc#....',
      '...........#cccc#.....',
      '..........#cccc#......',
      '.........#llll#.......',
      '........#llllll#......',
      '........#llllll#......',
      '.........#llll#.......',
      '..........#aa#........',
      '...........aa.........',
      '...#################..',
      '..#aaaaaaaaaaaaaaaaa#.',
      '..#aaaaaaaaaaaaaaaaa#.',
      '..#aaaaaaaaaaaaaaaaa#.',
      '...#aaaaaaaaaaaaaaa#..',
      '....###############...',
      '######################',
      '#wwwwwwwwwwwwwwwwwwww#',
      '#ssssssssssssssssssss#',
      '######################',
    ],
  ],
  piping: [
    [ // t0: a spoon — blobs of every size land on the parchment
      '.........####.........',
      '........#mmmm#........',
      '.........#mm#.........',
      '..........#m#.........',
      '..........#m#.........',
      '..........#m#.........',
      '..........a...........',
      '......................',
      '....##############....',
      '....#wwwwwwwwwwwww#...',
      '....#w#aa#ww#aaa#w#...',
      '....#wwwwwwwwwwwww#...',
      '....##############....',
    ],
    [ // t1: piping bag with a round tip — every shell the same size
      '.........###..........',
      '........#aaa#.........',
      '.......#aaaaa#........',
      '.......#aaaaa#........',
      '........#aaa#.........',
      '.........#m#..........',
      '.........#m#..........',
      '..........a...........',
      '......................',
      '.####################.',
      '.#wwwwwwwwwwwwwwwwww#.',
      '.#w#a#w#a#w#a#w#a#ww#.',
      '.#wwwwwwwwwwwwwwwwww#.',
      '.####################.',
    ],
    [ // t2: silicone template mat — printed circles to pipe into, so rows line up
      '.........###..........',
      '........#aaa#.........',
      '.......#aaaaa#........',
      '.......#aaaaa#........',
      '........#aaa#.........',
      '.........#m#..........',
      '.........#m#..........',
      '..........a...........',
      '......................',
      '.####################.',
      '.#llllllllllllllllll#.',
      '.#l#a#l#a#l#e#l#e#ll#.',
      '.#llllllllllllllllll#.',
      '.####################.',
    ],
    [ // t3: two-tone piping bag — two batters in one bag, striped shells
      '.........###..........',
      '........#aal#.........',
      '.......#aaall#........',
      '.......#aaall#........',
      '........#aal#.........',
      '.........#m#..........',
      '.........#m#..........',
      '..........a...........',
      '......................',
      '.####################.',
      '.#llllllllllllllllll#.',
      '.#l#a#l#l#l#a#l#l#ll#.',
      '.#llllllllllllllllll#.',
      '.####################.',
    ],
  ],
  oven: [
    [ // t0: a little toaster oven — one window, one dial, a handle
      '######################',
      '#mmmmmmmmmmmmmmmmmmmm#',
      '#m################mm##',
      '#m#oooooooooooooo#m#d#',
      '#m#oooooooooooooo#m###',
      '#m#oooo#aaa#ooooo#mmm#',
      '#m#ooooaaaaaooooo#m##.',
      '#m#oooo#aaa#ooooo#m#d#',
      '#m#oooooooooooooo#m###',
      '#m################mmm#',
      '#mssssssssssssssssmmm#',
      '######################',
    ],
    [ // t1: resting rack — piped trays rest on the warm oven until a skin forms (that is where the "feet" come from)
      '.###############......',
      '.#w#a#w#a#w#a#w#......',
      '.###############......',
      '.#.............#......',
      '.###############......',
      '.#w#a#w#a#w#a#w#......',
      '.###############......',
      '.#.............#......',
      '.#.............#......',
      '######################',
      '#mmmmmmmmmmmmmmmmmmmm#',
      '#m################mm##',
      '#m#oooooooooooooo#m#d#',
      '#m#oooooooooooooo#m###',
      '#m#oooo#aaa#ooooo#mmm#',
      '#m#ooooaaaaaooooo#m##.',
      '#m#oooo#aaa#ooooo#m#d#',
      '#m#oooooooooooooo#m###',
      '#m################mmm#',
      '#mssssssssssssssssmmm#',
      '######################',
    ],
    [ // t2: convection oven — a fan keeps the heat even, so every shell bakes the same
      '######################',
      '#mmmmmmmmmmmmmmmmmmmm#',
      '#mmmmmmmmmmmmmmmmmmmm#',
      '######################',
      '#mmmmmmmmmmmmmmmm#dd##',
      '#m###############m#d##',
      '#m#oooooooooooo#m#dd##',
      '#m#oooooooooooo#m#####',
      '#m#ooooooooooooo#mmmm#',
      '#m#ooooo#aaa#ooo#m##m#',
      '#m#oooooaaaaaooo#m##m#',
      '#m#ooooo#aaa#ooo#mmmm#',
      '#m#ooooooooooooo#m##m#',
      '#m#ooooooooooooo#m##m#',
      '#m###############mmmm#',
      '######################',
      '#mmmmmmmmmmmmmmmmmmmm#',
      '#ssssssssssssssssssss#',
      '#mmmmmmmmmmmmmmmmmmmm#',
      '######################',
    ],
    [ // t3: deck oven with a cooling rack on top — two decks bake, baked shells cool on the wire rack
      '..aa..aa..aa..aa..aa..',
      '.#aa#.aa#.aa#.aa#.aa#.',
      '.####################.',
      '.#.#.#.#.#.#.#.#.#.#..',
      '######################',
      '#m################mm##',
      '#m#oooooooooooooo#m#d#',
      '#m#ooooo#aaa#oooo#m#d#',
      '#m#oooooaaaaaoooo#m###',
      '#m#ooooo#aaa#oooo#mmm#',
      '#m################mmm#',
      '#ssssssssssssssssssss#',
      '######################',
      '#m################mm##',
      '#m#oooooooooooooo#m#d#',
      '#m#ooooo#aaa#oooo#m#d#',
      '#m#oooooaaaaaoooo#m###',
      '#m#ooooo#aaa#oooo#mmm#',
      '#m################mmm#',
      '#mmmmmmmmmmmmmmmmmmmm#',
      '#ssssssssssssssssssss#',
      '######################',
    ],
  ],
  box: [
    [ // t0: open shipping box with flaps and a label
      '.#######......#######.',
      '.#kkkkk#......#kkkkk#.',
      '.#kkkkk#......#kkkkk#.',
      '.#kkkkk#......#kkkkk#.',
      '.kkkkkkk######kkkkkkk.',
      '.#######dddddd#######.',
      '.#kkkkkkddddddkkkkkk#.',
      '.#kkkkkkkkkkkkkkkkkk#.',
      '.#kkkkkkkkkkkkkkkkkk#.',
      '.#kkkkkkkkkkkkkkkkkk#.',
      '.#kkkkkkk####kkkkkkk#.',
      '.#kkkkkkk#aa#kkkkkkk#.',
      '.#kkkkkkk####kkkkkkk#.',
      '.#kkkkkkkkkkkkkkkkkk#.',
      '.#kkkkkkkkkkkkkkkkkk#.',
      '.#kkkkkkkkkkkkkkkkkk#.',
      '.#kkkkkkkkkkkkkkkkkk#.',
      '.#kkkkkkkkkkkkkkkkkk#.',
      '.####################.',
    ],
    [ // t1: ganache filling — a bag of ganache sandwiches two shells together
      '.........###..........',
      '........#hhh#.........',
      '.......#hhhhh#........',
      '.......#hhhhh#........',
      '........#hhh#.........',
      '.........#m#..........',
      '..........h...........',
      '......................',
      '.####################.',
      '.#w#a#w#a#w#a#w#a#ww#.',
      '.#w#h#w#h#w#h#w#h#ww#.',
      '.#w#a#w#a#w#a#w#a#ww#.',
      '.####################.',
      '...####........####...',
      '...#mm#........#mm#...',
      '...####........####...',
    ],
    [ // t2: gift box with a kraft insert — macarons sit in their own slots under an open mint lid
      '.####################.',
      '.#gggggggggggggggggg#.',
      '.#gggggggggggggggggg#.',
      '.####################.',
      '######################',
      '#kkkkkkkkkkkkkkkkkkkk#',
      '#k#a#k#a#k#a#k#a#k#kk#',
      '#kkkkkkkkkkkkkkkkkkkk#',
      '#k#a#k#a#k#a#k#a#k#kk#',
      '#kkkkkkkkkkkkkkkkkkkk#',
      '######################',
      '#gggggggggggggggggggg#',
      '#gggggggggg#pp#gggggg#',
      '#gggggggggg#pp#gggggg#',
      '#gggggggggggggggggggg#',
      '######################',
    ],
    [ // t3: ripening fridge — filled macarons rest 24 h in the cold so the shell softens into the filling
      '######################',
      '#mmmmmmmmmmmmmmmmmmmm#',
      '#mmbbmmmmmmmmmmmmyymm#',
      '######################',
      '#m##################m#',
      '#m#bbbbbbbbbbbbbbbb#m#',
      '#m#b#a#a#a#a#a#a#bb#m#',
      '#m#bbbbbbbbbbbbbbbb#m#',
      '#m#b##############b#m#',
      '#m#bbbbbbbbbbbbbbbb#m#',
      '#m#b#a#a#a#a#a#a#bb#m#',
      '#m#bbbbbbbbbbbbbbbb#m#',
      '#m#b##############b#m#',
      '#m#bbbbbbbbbbbbbbbb#m#',
      '#m#b#p#p#p#p#p#p#bb#m#',
      '#m#bbbbbbbbbbbbbbbb#m#',
      '#m##################m#',
      '#mmmmmmmmmmmmmmm#d#mm#',
      '#mmmmmmmmmmmmmmm#d#mm#',
      '######################',
      '#ssssssssssssssssssss#',
      '######################',
    ],
  ],
};

export const PROP_NAMES = Object.keys(PROP_TIERS);
/** Metal and accent colours step up with the tier: steel → copper → brushed steel → gold. */
const TIER_METAL = ['#D8D0CA', '#E8B9A0', '#C9CED6', '#F4DC9A'];
const TIER_SHADE = ['#B8AEA8', '#C9937A', '#9FA6B0', '#D9B86A'];
const TIER_ACCENT = ['pink', 'mint', 'rose', 'lavender'];
/** Anchors in canvas pixels (22x24, bottom-aligned): where the moving parts sit for each tier. null = no whisk at that tier. */
export const PROP_ANCHOR: Record<string, ({ x: number; y: number } | null)[]> = {
  mixer: [{ x: 10.5, y: 14.5 }, null, { x: 9.5, y: 11.5 }, null],                                   // whisk centre (sifter and spatula have none)
  piping: [{ x: 10.5, y: 17 }, { x: 10.5, y: 17 }, { x: 10.5, y: 17 }, { x: 10.5, y: 17 }],           // nozzle / spoon tip (drop start)
  oven: [{ x: 10.5, y: 17.5 }, { x: 10.5, y: 17.5 }, { x: 9.5, y: 13.5 }, { x: 10.5, y: 17.5 }],      // window centre (glow)
  box: [{ x: 11, y: 8 }, { x: 11, y: 17 }, { x: 11, y: 14 }, { x: 11, y: 8 }],                         // where a batch lands
};
export function propRows(name: string, tier = 0): number { return (PROP_TIERS[name] ?? PROP_TIERS.box)[Math.max(0, Math.min(3, tier))].length; }
export function propCanvas(name: string, tier = 0): HTMLCanvasElement {
  const t = Math.max(0, Math.min(3, tier));
  const rows = (PROP_TIERS[name] ?? PROP_TIERS.box)[t];
  const pal = PALETTE[TIER_ACCENT[t]] ?? PALETTE.pink;
  const c = makeCanvas(22, 24);
  const ctx = c.getContext('2d')!;
  drawTemplate(ctx, rows, 0, 24 - rows.length, {
    '#': OUTLINE, m: TIER_METAL[t], s: TIER_SHADE[t], d: '#9E948E', o: '#F4B072', k: '#DEBB93', a: pal.fill, w: WHITE,
    p: '#F28CA3', c: '#C98A5A', y: '#FFE28A', b: '#BFE2F7', f: '#F26B4E', r: '#C9534F', g: '#BFE8D4', l: '#DCCBF2', e: '#8E8580', n: '#F2E2C6', h: '#8C5A3C',
  });
  return c;
}

/** What travels the belt before it is a macaron: a white batter ball (from the mixer) and a piped, unbaked shell. */
const DOUGH = [
  '..####..',
  '.#wwww#.',
  '#wWwwww#',
  '#wwwwww#',
  '#wwwwww#',
  '#wwwwww#',
  '.#wwww#.',
  '..####..',
];
const SHELL = [
  '........',
  '........',
  '..####..',
  '.#wwww#.',
  '#wwwwww#',
  '#wwwwww#',
  '.######.',
  '........',
];
/** Macaron energy: a ball in the macaron's colour (pats and working cats make these; the mixer turns them into batches). */
export function doughCanvas(paletteKey?: string): HTMLCanvasElement {
  const pal = paletteKey ? PALETTE[paletteKey] ?? PALETTE.pink : null;
  const c = makeCanvas(8, 8);
  drawTemplate(c.getContext('2d')!, DOUGH, 0, 0, { '#': OUTLINE, w: pal ? mix(pal.fill, '#FFFFFF', 0.35) : '#FFF8EC', W: '#FFFFFF' });
  return c;
}
export function shellCanvas(paletteKey: string): HTMLCanvasElement {
  const pal = PALETTE[paletteKey] ?? PALETTE.pink;
  const c = makeCanvas(8, 8);
  drawTemplate(c.getContext('2d')!, SHELL, 0, 0, { '#': OUTLINE, w: mix(pal.fill, '#FFF8EC', 0.65) });
  return c;
}
function mix(hexA: string, hexB: string, t: number): string {
  const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  const ch = (sh: number) => Math.round(((a >> sh) & 255) * (1 - t) + ((b >> sh) & 255) * t);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

/** Packed goods, by packaging tier: 1 = three bare macarons banded together, 2 = small white box with a stripe in the
 *  macaron's colour, 3 = deluxe ribbon box in the macaron's colour. Also the stock shown on the display counter. */
const PACKS: string[][] = [
  [ // t1: three in a row on a paper band
    '.#####..###...',
    '#bbbbb##bbb#..',
    '#wwwww##www##.',
    '#sssss##sss##.',
    '.#####.#bbbb#.',
    '..#kkkkkwwww#.',
    '..#kkkkkssss#.',
    '...##########.',
  ],
  [ // t2: small white box, lid stripe and tag in the macaron's colour
    '....#b#.......',
    '.############.',
    '.#bbbbbbbbbb#.',
    '.############.',
    '.#wwww#b#www#.',
    '.#wwww#b#www#.',
    '.#wwww#b#www#.',
    '.############.',
  ],
  [ // t3: deluxe ribbon box in the macaron's colour, white ribbon, bow on top
    '....#w#.#w#...',
    '...#www#www#..',
    '....#w#w#w#...',
    '.#####w#w#####',
    '#bbbbb#ww#bbbb#',
    '#wwwwwwwwwwwww#',
    '#bbbbb#ww#bbbb#',
    '#bbbbb#ww#bbbb#',
    '###############',
  ],
];
export function packCanvas(tier: number, paletteKey: string): HTMLCanvasElement {
  const pal = PALETTE[paletteKey] ?? PALETTE.pink;
  const rows = PACKS[Math.max(0, Math.min(2, tier - 1))];
  const c = makeCanvas(Math.max(...rows.map((r) => r.length)), rows.length);
  drawTemplate(c.getContext('2d')!, rows, 0, 0, { '#': OUTLINE, b: pal.fill, s: pal.shade, w: '#FFFDF7', k: '#DEBB93' });
  return c;
}
/** @deprecated kept for the sheet tool */
export const giftCanvas = packCanvas;

/** A tray of three macarons, as it comes out of the packaging machine. */
const TRAY = [
  '.####..####..####.',
  '#bbbb##bbbb##bbbb#',
  '#wwww##wwww##wwww#',
  '#ssss##ssss##ssss#',
  '.####..####..####.',
];
export function trayCanvas(paletteKey: string): HTMLCanvasElement {
  const pal = PALETTE[paletteKey] ?? PALETTE.pink;
  const c = makeCanvas(18, 5);
  drawTemplate(c.getContext('2d')!, TRAY, 0, 0, { '#': OUTLINE, b: pal.fill, s: pal.shade, w: '#FFF3E6' });
  return c;
}

/** Packaging machine at the top-right corner: macarons go in one side, a tray of three comes out the other. */
const PACKER = [
  '....##############....',
  '...#mmmmmmmmmmmmmm#...',
  '...#mmyymmmmmmmmmm#...',
  '...################...',
  '......#mmmmmmmm#......',
  '......#mmmmmmmm#......',
  '......#mssssssm#......',
  '######################',
  '#mmmmmmmmmmmmmmmmmmmm#',
  '#m##################m#',
  '#m#pppppppppppppppp#m#',
  '#m#pp#aa#aa#aa#aapp#m#',
  '#m#pppppppppppppppp#m#',
  '#m##################m#',
  '#mmmmmmmmmmmmmmmmmmmm#',
  '#mmmmmmmmmmmmmmmmmmmm#',
  '#ssssssssssssssssssss#',
  '######################',
];
export function packerCanvas(): HTMLCanvasElement {
  const c = makeCanvas(22, 24);
  drawTemplate(c.getContext('2d')!, PACKER, 0, 24 - PACKER.length, { '#': OUTLINE, m: '#D8D0CA', s: '#B8AEA8', p: '#F9CBD6', a: '#F28CA3', y: '#FFE28A' });
  return c;
}

/** A plain burlap sack standing on the floor under the belt's end, mouth open at the top toward the belt. 20x17. */
const SACK = [
  '..........######....',
  '.........#dddddd#...',
  '........#dddddddd#..',
  '.......#kkkkdddddd#.',
  '......#kkkkkkkk####.',
  '.....#kkkkkkkkkk#...',
  '....#ccccccccccc#...',
  '...#kkkkkkkkkkkkk#..',
  '..#kkkkkkkkkkkkkkk#.',
  '.#kkkkkkkkkkkkkkkkk#',
  '#kkkkkkkkkkkkkkkkkk#',
  '#kkkkkkkkkkkkkkkkkk#',
  '#kkkkkkkkkkkkkkkkkk#',
  '#kkkkkkkkkkkkkkkkkk#',
  '#dkkkkkkkkkkkkkkkkd#',
  '.#ddkkkkkkkkkkkkdd#.',
  '..################..',
];
export function sackCanvas(): HTMLCanvasElement {
  const c = makeCanvas(20, 17);
  drawTemplate(c.getContext('2d')!, SACK, 0, 0, { '#': OUTLINE, k: '#DEBB93', d: '#8E6A48', c: '#A9754F' });
  return c;
}

/** Patting upgrades: a paw pressing down (🫳), with a different flourish per upgrade. 16x16. */
const PAW = [
  '...##.##.##.....',
  '..#cc#cc#cc#....',
  '..#pc#pc#pc#....',
  '..#cc#cc#cc#....',
  '.###cccccc###...',
  '#cccccccccccc#..',
  '#ccc#####cccc#..',
  '#cc#ppppp#ccc#..',
  '#cc#ppppp#ccc#..',
  '.#cc#####ccc#...',
  '..#cccccccc#....',
  '...########.....',
];
const PAW_FLAIR: Record<string, { at: [number, number]; rows: string[] }[]> = {
  click1: [{ at: [6, 14], rows: ['e.e.e.e.e'] }],                                                                   // soft paws: one press line
  click2: [{ at: [6, 14], rows: ['e.e.e.e.e'] }, { at: [15, 2], rows: ['.P.', 'PPP', '.P.'] }, { at: [1, 6], rows: ['.P.', 'PPP', '.P.'] }], // toe beans: pink pops
  click3: [{ at: [5, 14], rows: ['eeeeeeeeeee'] }, { at: [3, 16], rows: ['e.e.e.e.e.e.e.e'] }],                   // double pat: two ripples
  click4: [{ at: [15, 3], rows: ['..y', '.y.', 'y..', 'y..', 'y..', '.y.', '..y'] }, { at: [17, 1], rows: ['..y', '.y.', 'y..', 'y..', 'y..', 'y..', 'y..', '.y.', '..y'] }], // purr: sound arcs
  click5: [{ at: [0, 3], rows: ['eee', '...', 'eeee', '...', 'eee'] }, { at: [0, 13], rows: ['eeeeee'] }, { at: [16, 6], rows: ['ee', '..', 'ee'] }], // zoomies: speed lines
  pct1: [{ at: [0, 5], rows: ['eeee', '....', 'eeee', '....', 'eeee'] }, { at: [16, 5], rows: ['eeee', '....', 'eeee', '....', 'eeee'] }],  // whisker sense: whiskers
  pct2: [{ at: [14, 11], rows: ['.y.y.', 'yyyyy', '.y#y.', 'yyyyy', '.y.y.'] }],                                    // kitchen sync: a gear
  pct3: [{ at: [14, 0], rows: ['.h.h.', 'hhhhh', 'hhhhh', '.hhh.', '..h..'] }, { at: [1, 11], rows: ['.w.', 'www', '.w.'] }], // nine lives: heart + sparkle
};
export function patCanvas(variant: string): HTMLCanvasElement {
  const c = makeCanvas(20, 18);
  const ctx = c.getContext('2d')!;
  drawTemplate(ctx, PAW, 4, 1, { '#': OUTLINE, c: '#FBEAD2', p: '#F3B6C6' });
  for (const f of PAW_FLAIR[variant] ?? PAW_FLAIR.click1) drawTemplate(ctx, f.rows, f.at[0], f.at[1], { e: '#9C8A82', P: '#F28CA3', y: '#F4C65A', h: '#F28CA3', w: '#FFE28A', '#': OUTLINE });
  return c;
}

const BELT = [ // chevrons pointing along +x
  '########',
  'dmdddmdd',
  'ddmdddmd',
  'dddmdddm',
  'dddmdddm',
  'ddmdddmd',
  'dmdddmdd',
  '########',
];
export function beltCanvas(): HTMLCanvasElement {
  const c = makeCanvas(8, 8);
  drawTemplate(c.getContext('2d')!, BELT, 0, 0, { '#': OUTLINE, d: '#9C7B6A', m: '#B79A8A' });
  return c;
}

const BUBBLE = [
  '.############.',
  '#wwwwwwwwwwww#',
  '#wwww####wwww#',
  '#www#aaaa#www#',
  '#www#wwww#www#',
  '#www#ssss#www#',
  '#wwww####wwww#',
  '#wwwwwwwwwwww#',
  '.####.##.####.',
  '.....##.......',
  '.....#........',
];
/** Speech bubble with a macaron: "I'd like one of those". */
export function bubbleCanvas(kind: 'macaron' | 'note' | 'heart' | 'shades' = 'macaron'): HTMLCanvasElement {
  const c = makeCanvas(14, 11);
  const ctx = c.getContext('2d')!;
  if (kind === 'macaron') { drawTemplate(ctx, BUBBLE, 0, 0, { '#': OUTLINE, w: WHITE, a: PALETTE.pink.fill, s: PALETTE.pink.shade }); return c; }
  if (kind === 'shades') { // a fan: "I saw the post" — the influencer's sunglasses in the bubble
    drawTemplate(ctx, BUBBLE, 0, 0, { '#': OUTLINE, w: WHITE, a: WHITE, s: WHITE });
    ctx.fillStyle = WHITE; ctx.fillRect(2, 2, 10, 5);
    drawShades(ctx, 4, 9, 4);
    return c;
  }
  // plain bubble, then the icon inside
  drawTemplate(ctx, BUBBLE, 0, 0, { '#': OUTLINE, w: WHITE, a: WHITE, s: WHITE });
  ctx.fillStyle = WHITE; ctx.fillRect(4, 2, 6, 5);
  const icon = EMOTES[kind === 'note' ? 'note' : 'heart'];
  drawTemplate(ctx, icon.slice(0, 6).map((r) => r.slice(0, 7)), 4, 2, { '#': OUTLINE, a: '#E8453C' });
  return c;
}

const EMOTES: Record<string, string[]> = {
  scratch: [ // three claw marks
    'w..w..w.',
    '.w..w..w',
    '..w..w..',
    '...w..w.',
    'w...w...',
    '.w...w..',
  ],
  speed: [ // ))) motion lines
    '#..#..#.',
    '.#..#..#',
    '.#..#..#',
    '.#..#..#',
    '#..#..#.',
  ],
  love: [ // two hearts on one arrow
    '.rr..rr...pp..pp',
    'rrrrrrr..pppppp.',
    'rrrrrrr#pppppp#.',
    '.rrrrr###pppp###',
    '..rrr#...pp....#',
    '...r......p.....',
  ],
  anger: [ // the little cross-vein mark
    'a......a',
    '.a....a.',
    '..a..a..',
    '........',
    '..a..a..',
    '.a....a.',
    'a......a',
  ],
  window: [ // a window with the sky in it
    '###########',
    '#bbbb#bbbb#',
    '#bwbb#bbbb#',
    '###########',
    '#bbbb#bbbb#',
    '#bbbb#bbbb#',
    '###########',
  ],
  heart: [
    '.aa..aa.',
    'aaaaaaaa',
    'aaaaaaaa',
    '.aaaaaa.',
    '..aaaa..',
    '...aa...',
  ],
  puff: [ // a small cross cloud for a (very cute) hiss
    '..wwww..',
    '.wwwwww.',
    'ww#ww#ww',
    'wwwwwwww',
    '.ww##ww.',
    '..wwww..',
  ],
  zzz: [
    '....###.',
    '......#.',
    '.....#..',
    '....###.',
    '.###....',
    '...#....',
    '..#.....',
    '.###....',
  ],
  question: [
    '..####..',
    '.#....#.',
    '......#.',
    '.....#..',
    '....#...',
    '....#...',
    '........',
    '....#...',
  ],
  note: [
    '....##..',
    '....#.#.',
    '....#..#',
    '....#...',
    '....#...',
    '..###...',
    '.####...',
    '..##....',
  ],
  hourglass: [
    '#######.',
    '.#yyy#..',
    '..#y#...',
    '...#....',
    '..#.#...',
    '.#.y.#..',
    '#yyyyy#.',
    '#######.',
  ],
  sparkle: [
    '...w....',
    '..www...',
    '.wwwww..',
    '..www...',
    '...w....',
  ],
};
export const EMOTE_NAMES = Object.keys(EMOTES);
export function emoteCanvas(name: string, accent = '#F28CA3'): HTMLCanvasElement {
  const rows = EMOTES[name] ?? EMOTES.heart;
  const c = makeCanvas(rows[0].length, rows.length);
  drawTemplate(c.getContext('2d')!, rows, 0, 0, { a: accent, w: '#FFFFFF', '#': '#5A4038', y: '#F2C94C', r: '#E8453C', p: '#F3B6C6', b: '#C4DEF5' });
  return c;
}

const WHISK = [
  '...#...',
  '.#.#.#.',
  '..###..',
  '#######',
  '..###..',
  '.#.#.#.',
  '...#...',
];
export function whiskCanvas(): HTMLCanvasElement {
  const c = makeCanvas(7, 7);
  drawTemplate(c.getContext('2d')!, WHISK, 0, 0, { '#': '#8E8580' });
  return c;
}
const GLOW = [
  '.oooooo.',
  'ooyyyyoo',
  'ooyyyyoo',
  '.oooooo.',
];
export function glowCanvas(): HTMLCanvasElement {
  const c = makeCanvas(8, 4);
  drawTemplate(c.getContext('2d')!, GLOW, 0, 0, { o: '#F7A55A', y: '#FFE08A' });
  return c;
}

const FURNITURE: Record<string, string[]> = {
  scratcher: [ // a sisal post on a wooden base
    '....####....',
    '...#dddd#...',
    '...#ssss#...',
    '...#s##s#...',
    '...#ssss#...',
    '...#s##s#...',
    '...#ssss#...',
    '...#s##s#...',
    '...#ssss#...',
    '...#s##s#...',
    '...#ssss#...',
    '...#s##s#...',
    '...#ssss#...',
    '...#s##s#...',
    '...#ssss#...',
    '...#s##s#...',
    '...#ssss#...',
    '...#s##s#...',
    '...#ssss#...',
    '...#ssss#...',
    '.##########.',
    '#dddddddddd#',
    '#dddddddddd#',
    '.##########.',
  ],
  hangball: [ // the stand: base, pole, arm (the string and ball are a separate swinging sprite)
    '..##########..',
    '..#dddddddd#..',
    '..#dd#######..',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '..#dd#........',
    '.########.....',
    '#dddddddd#....',
    '#dddddddd#....',
    '.########.....',
  ],
  hangball_ball: [ // string + ball, origin at the hook
    '..e..',
    '..e..',
    '..e..',
    '..e..',
    '..e..',
    '..e..',
    '..e..',
    '..e..',
    '.###.',
    '#aaa#',
    '#aaa#',
    '.###.',
  ],
  tent: [ // blue A-frame tent with draped front flaps; cats sleep inside (drawn behind it)
    '............##............',
    '...........#aa#...........',
    '...........#aa#...........',
    '..........#AAAA#..........',
    '..........#aaaaa#.........',
    '.........#aaaaaa#.........',
    '........#aaaaaaaa#........',
    '........#AAAAAAAA#........',
    '.......#aaaa##aaaa#.......',
    '.......#aA......Aa#.......',
    '......#aaA......Aaa#......',
    '.....#AAAA......AAAA#.....',
    '.....#aaA........Aaa#.....',
    '....#aaaA........Aaaa#....',
    '....#aaaA........Aaaaa#...',
    '...#AAAA..........AAAA#...',
    '..#aaaaA..........Aaaaa#..',
    '..#aaaaA..........Aaaaa#..',
    '.#aaaaA............Aaaaa#.',
    '#AAAAAA............AAAAA#.',
    '#aaaaaA............Aaaaaa#',
    '##########################',
  ],
  fish: [ // big dried-fish plush: cats hug it and bunny-kick it
    '..............................',
    '.......##########.............',
    '.....##mmmmmmmmmm##.....#####.',
    '...##mmMmmMmmMmmMmm##...#m###.',
    '..#mmemmmmmmmmmmmmmmm###m#....',
    '..#mmmmMmmMmmMmmMmmmm#mmm#....',
    '..#m#mmmmmmmmmmmmmmmm#mmm#....',
    '..#mm#mMmmMmmMmmMmmmm###m#....',
    '...##mmmmmmmmmmmmmm##...#m###.',
    '.....##mmmmmmmmmm##.....#####.',
    '.......##########.............',
    '..............................',
  ],
  bed: [ // donut bed
    '......##########......',
    '....##aaaaaaaaaa##....',
    '..##aaaaaaaaaaaaaa##..',
    '.#aaaa############aaa#',
    '#aaaa#ssssssssssss#aa#',
    '#aaaa#ssssssssssss#aa#',
    '#aaaaa############aaa#',
    '.#aaaaaaaaaaaaaaaaaa#.',
    '..##aaaaaaaaaaaaaa##..',
    '....##############....',
  ],
  cushion_round: [
    '.....##########.....',
    '...##aaaaaaaaaa##...',
    '..#aaaaaaaaaaaaaa#..',
    '.#aaaaaaaaaaaaaaaa#.',
    '#aaaaaaaaaaaaaaaaaa#',
    '#aaaaaaaaaaaaaaaaaa#',
    '.#ssssssssssssssss#.',
    '..##ssssssssssss##..',
    '....############....',
  ],
  mat: [ // checkered mat
    '######################',
    '#wawawawawawawawawawa#',
    '#awawawawawawawawawaw#',
    '#wawawawawawawawawawa#',
    '#awawawawawawawawawaw#',
    '######################',
  ],
  cattree: [
    '..##########..',
    '.#aaaaaaaaaa#.',
    '..##########..',
    '......##......',
    '.....#ss#.....',
    '.....#ss#.....',
    '..#########...',
    '.#aaaaaaa#....',
    '..#######.....',
    '.....#ss#.....',
    '.....#ss#.....',
    '.....#ss#.....',
    '.....#ss#.....',
    '.....#ss#.....',
    '..###########.',
    '.#aaaaaaaaaaa#',
    '.#############',
  ],
  cushion: [
    '..########..',
    '.#aaaaaaaa#.',
    '#aaaaaaaaaa#',
    '#aaaaaaaaaa#',
    '.#ssssssss#.',
    '..########..',
  ],
  cathouse: [ // 34x28: big corrugated red roof, wide open doorway (cats hide inside, drawn behind the house)
    '................#r#...............',
    '..............#RrrR#..............',
    '.............#rrRrrR#.............',
    '............#RrrRrrRr#............',
    '..........#RrrRrrRrrRrr#..........',
    '.........#rRrrRrrRrrRrrR#.........',
    '........#RrrRrrRrrRrrRrrR#........',
    '......#rrRrrRrrRrrRrrRrrRrr#......',
    '.....#rRrrRrrRrrRrrRrrRrrRrr#.....',
    '....#rrRrrRrrRrrRrrRrrRrrRrrR#....',
    '..#rrRrrRrrRrrRrrRrrRrrRrrRrrR#...',
    '.#RrrRrrRrrRrrRrrRrrRrrRrrRrrRrr#.',
    '#rrRrrRrrRrrRrrRrrRrrRrrRrrRrrRrr#',
    '##################################',
    '...#bbbbbbbbbbbbbbbbbbbbbbbbbb#...',
    '...#bbbb##################bbbb#...',
    '...#bbbb##..............##bbbb#...',
    '...#bbbb#................######...',
    '...#bbbb#................##ww##...',
    '...#bbbb#................##ww##...',
    '...#bbbb#................######...',
    '...#bbbb#................#bbbb#...',
    '...#bbbb#................#bbbb#...',
    '...#bbbb#................#bbbb#...',
    '...#bbbb#................#bbbb#...',
    '...#bbbb#................#bbbb#...',
    '...#bbbb#................#bbbb#...',
    '...######................######...',
  ],
};
export function furnitureCanvas(name: string): HTMLCanvasElement {
  const rows = FURNITURE[name];
  const c = makeCanvas(rows[0].length, rows.length);
  if (name === 'tent') { drawTemplate(c.getContext('2d')!, rows, 0, 0, { '#': OUTLINE, a: '#8FB8E8', A: '#6FA0D8' }); return c; }
  drawTemplate(c.getContext('2d')!, rows, 0, 0, { '#': OUTLINE, a: '#F9CBD6', s: '#D9B48F', r: '#E0605A', R: '#B8423E', b: '#FFF3E6', d: '#6E5247', k: '#DEBB93', w: '#FFFFFF', A: '#6FA0D8', m: '#BFD9EA', M: '#9FC1D8', e: '#3A2622' });
  return c;
}

const TOYS: Record<string, string[]> = {
  yarn: [
    '...####...',
    '..#aaaa#..',
    '.#aaaaaa#.',
    '#aaa#aaaa#',
    '#aa#aaaa##',
    '#aaaaa#aa#',
    '#aaa#aaaa#',
    '.#aaaaaa#.',
    '..#aaaa#..',
    '...####..#',
  ],
  wand: [
    '........##',
    '.......#pp',
    '......#ppp',
    '......#pp#',
    '.....#ww#.',
    '....#ww#..',
    '...#ww#...',
    '..#ss#....',
    '.#ss#.....',
    '#ss#......',
  ],
  mouse: [
    '..........',
    '..##..##..',
    '.#gg##gg#.',
    '#gggggggg#',
    '#egggggg##',
    '#gggggggg#.',
    '.#gggggg#s',
    '..######s.',
    '....#.#...',
    '..........',
  ],
  fish: [
    '..........',
    '..#####...',
    '.#mmmmm#.#',
    '#mmmemmm##',
    '#mmmmmmm##',
    '.#mmmmm#.#',
    '..#####...',
    '....#.....',
    '...#.#....',
    '..........',
  ],
};
export function toyCanvas(name: string): HTMLCanvasElement {
  const rows = TOYS[name] ?? TOYS.yarn;
  const c = makeCanvas(10, 10);
  drawTemplate(c.getContext('2d')!, rows, 0, 0, { '#': OUTLINE, a: '#F28CA3', p: '#F9CBD6', w: '#FFFDFB', s: '#D9B48F', g: '#C9C2BD', e: '#3A2622', m: '#BFE8D4' });
  return c;
}
