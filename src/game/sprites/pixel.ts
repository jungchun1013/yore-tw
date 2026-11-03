import { SPRITE_PX } from '../../content/sprites-override';
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
  if (y === 6) return set(row, [7, 8, 9], 'm');
  if (y === 7) return set(set(row, [7, 9], 'm'), [8], 'p');
  if (y === 8) return set(row, [8], 'm');
  return row;
});
/** Seen from behind: the same blob, no face, no cheeks (for a cat staring out of the window). */
const CAT_BACK = CAT_OPEN.map((row) => row.replace(/[emp]/g, 'b'));
/** Asleep: -w- — eyes as flat lines, the little w mouth. */
const CAT_SLEEP = CAT_OPEN.map((row, y) => {
  const set = (r: string, idxs: number[], ch: string) => { const a = r.split(''); for (const i of idxs) a[i] = ch; return a.join(''); };
  if (y === 5) return set(row.replace(/e/g, 'b'), [4, 5, 6, 10, 11, 12], 'm');
  return row;
});
/** Fighting: >^< — squeezed eyes and a little ^ mouth. */
const CAT_FIGHT = CAT_HAPPY.map((row, y) => {
  const set = (r: string, idxs: number[], ch: string) => { const a = r.split(''); for (const i of idxs) a[i] = ch; return a.join(''); };
  if (y === 6) return set(set(row, [7, 9], 'b'), [8], 'm');
  if (y === 7) return set(set(row, [8], 'b'), [7, 9], 'm');
  return row;
});
export type CatFrame = 'open' | 'blink' | 'happy' | 'laugh' | 'back' | 'sleep' | 'fight';
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
  kerchief: { rows: [ // baker's head scarf: pink triangle tied at the back, knot showing on the right
    '....##########........',
    '...#pppPpppPpp#.......',
    '..#ppPpppPpppPp##.....',
    '.#pppppppppppppp#p#...',
    '..##############.##...',
  ], dy: -1 },
  hat: { rows: [ // chef toque
    '.....########.........',
    '....#wwwwwwww#........',
    '....#wwwwwwww#........',
    '.....#wwwwww#.........',
    '.....########.........',
  ], dy: -2 },
  tallhat: { rows: [ // toque blanche: tall pleated chef's hat with a puffed top, the pâtissier's
    '.....########.........',
    '....#wwwwwwww#........',
    '...#wwswwswwsw#.......',
    '...#wwswwswwsw#.......',
    '...#wwwwwwwwww#.......',
    '....#wswwswws#........',
    '....#wwwwwwww#........',
    '....#wwwwwwww#........',
    '.....########.........',
  ], dy: -6 },
  tie: { rows: [ // …and a black bow tie on the chest: two triangles meeting at the knot
    '......d#.#d...........',
    '......ddddd...........',
    '......d#.#d...........',
  ], dy: 9 },
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
  tie: [ // the manager keeps the lens-less glasses…
    '...#####.#####........',
    '...#eee###eee#........',
    '...#####.#####........',
  ],
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

/** Sprites the user drew in the online pixel editor win over everything drawn in code. `recolor` maps a saved hex
 *  colour to another (used to tint packs / macarons / emotes per palette). Returns null when there is no override. */
export function overrideCanvas(key: string, recolor: Record<string, string> = {}): HTMLCanvasElement | null {
  const px = SPRITE_PX[key];
  if (!px) return null;
  const c = makeCanvas(px.rows[0].length, px.rows.length);
  const colors: Record<string, string> = { '#': OUTLINE };
  for (const [k, hex] of Object.entries(px.colors)) colors[k] = recolor[hex.toUpperCase()] ?? hex;
  drawTemplate(c.getContext('2d')!, px.rows, 0, 0, colors);
  return c;
}
const PINK_TINT = (fill: string, shade: string): Record<string, string> => ({ '#F9CBD6': fill, '#E7A3B4': shade });

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
    const colors: Record<string, string> = { '#': OUTLINE, b: coat.fill, s: coat.stripe, e: coat.eye ?? EYE, p: PINK, c: CHEEK, w: WHITE, a: PALETTE.pink.accent, d: '#2A1E1B', o: '#F2A65A', m: coat.face ?? OUTLINE, y: '#FFD84D', r: '#D9534F', P: '#E7A3B4' };
    const rows = bodyFrame(species.body, frame);
    drawTemplate(ctx, rows, ox, SPRITE_H - rows.length, colors);
    return;
  }
  const coat: Coat = COATS[coatKey] ?? COATS.cream;
  const accent = PALETTE.pink.accent;
  const colors: Record<string, string> = { '#': OUTLINE, b: coat.fill, s: coat.stripe, e: coat.eye ?? EYE, p: PINK, c: CHEEK, w: WHITE, a: accent, d: '#2A1E1B', o: '#F2A65A', m: coat.face ?? OUTLINE, y: '#FFD84D', r: '#D9534F', P: '#E7A3B4' };
  let rows = frame === 'blink' ? CAT_BLINK : frame === 'happy' ? CAT_HAPPY : frame === 'laugh' ? CAT_LAUGH : frame === 'back' ? CAT_BACK : frame === 'sleep' ? CAT_SLEEP : frame === 'fight' ? CAT_FIGHT : CAT_OPEN;
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
  const eyew = frame === 'back' ? undefined : EYEWEAR[accessory];
  if (eyew) drawTemplate(ctx, eyew, ox, oy + 4, { '#': OUTLINE, e: 'rgba(196,222,245,0.55)', d: '#2A1E1B' });
  if (accessory === 'sunglasses' && frame !== 'back') drawShades(ctx, ox + 5, ox + 11, oy + 5); // the eyes sit at template columns 5 and 11, row 5
  const acc = ACCESSORIES[accessory];
  if (acc && acc.rows.length && !(frame === 'back' && (accessory === 'tie' || accessory === 'clock'))) drawTemplate(ctx, acc.rows, ox, oy + acc.dy, colors); // chest items are not seen from behind
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
  const ov = overrideCanvas('misc:macaron', PINK_TINT(pal.fill, pal.shade)); if (ov) return ov;
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
  const ov = overrideCanvas('misc:star'); if (ov) return ov;
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
  piping: [ // the tray station (id kept for saves): batter lands on a tray; no piping bag
    [ // t0: a bare metal tray, blobs of every size
      '.####################.',
      '.#mmmmmmmmmmmmmmmmmm#.',
      '.#mm#aa#mm#aaa#m#a#m#.',
      '.#mmmmmmmmmmmmmmmmmm#.',
      '.####################.',
    ],
    [ // t1: parchment-lined tray, even rounds
      '.####################.',
      '.#wwwwwwwwwwwwwwwwww#.',
      '.#w#a#w#a#w#a#w#a#ww#.',
      '.#wwwwwwwwwwwwwwwwww#.',
      '.####################.',
      '...####........####...',
      '...#mm#........#mm#...',
      '...####........####...',
    ],
    [ // t2: silicone template mat with printed circles
      '.####################.',
      '.#llllllllllllllllll#.',
      '.#l#a#l#a#l#e#l#e#ll#.',
      '.#llllllllllllllllll#.',
      '.####################.',
      '...####........####...',
      '...#mm#........#mm#...',
      '...####........####...',
    ],
    [ // t3: resting rack with a fan — the piped rounds dry until a skin forms
      '..............######..',
      '.............#mmmmmm#.',
      '.............#m#ee#m#.',
      '.............#mee#em#.',
      '.............#m#ee#m#.',
      '.............#mmmmmm#.',
      '..............######..',
      '................#m#...',
      '.##############.#m#...',
      '.#w#a#w#a#w#a#w##m#...',
      '.##############.#m#...',
      '.#............#.#m#...',
      '.##############.#m#...',
      '.#w#a#w#a#w#a#w#mmm#..',
      '.##############.###...',
      '...##......##.........',
      '...##......##.........',
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
    [ // t1: a small oven with a baking stone inside and a stone slab on top
      '.####################.',
      '.#ssssssssssssssssss#.',
      '.####################.',
      '######################',
      '#mmmmmmmmmmmmmmmmmmmm#',
      '#m################mm##',
      '#m#oooooooooooooo#m#d#',
      '#m#oooooooooooooo#m###',
      '#m#oooo#aaa#ooooo#mmm#',
      '#m#ooooaaaaaooooo#m##.',
      '#m#oooo#aaa#ooooo#m#d#',
      '#m#ssssssssssssss#m###',
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
  piping: [{ x: 11, y: 21.5 }, { x: 11, y: 18.5 }, { x: 11, y: 18.5 }, { x: 8, y: 16.5 }],           // nozzle / spoon tip (drop start)
  oven: [{ x: 10.5, y: 17.5 }, { x: 10.5, y: 17.5 }, { x: 9.5, y: 13.5 }, { x: 10.5, y: 17.5 }],      // window centre (glow)
  box: [{ x: 11, y: 8 }, { x: 11, y: 17 }, { x: 11, y: 14 }, { x: 11, y: 8 }],                         // where a batch lands
};
export function propRows(name: string, tier = 0): number { return (PROP_TIERS[name] ?? PROP_TIERS.box)[Math.max(0, Math.min(3, tier))].length; }
export function propCanvas(name: string, tier = 0): HTMLCanvasElement {
  const t = Math.max(0, Math.min(3, tier));
  const ov = overrideCanvas(`prop:${name}:${t}`);
  if (ov) return ov;
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
const DOUGH = [ // one pixel smaller all round than a macaron
  '........',
  '..####..',
  '.#wwww#.',
  '.#wWww#.',
  '.#wwww#.',
  '.#wwww#.',
  '..####..',
  '........',
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
  const ov = overrideCanvas('misc:ball', pal ? { '#FBDDE4': mix(pal.fill, '#FFFFFF', 0.35), '#F9CBD6': pal.fill, '#E7A3B4': pal.shade } : {});
  if (ov) return ov;
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
  [ // t1: the user's corrugated box with one macaron, sampled from their edited image
    '....####.....',
    '...#bbbb#....',
    '..#bbbbbb##..',
    '###wwwwww####',
    '#k#bbbbbb####',
    '#kK#bbbb#kKK#',
    '#kKk####kkk##',
    '#kkk####kkkk#',
    '#kKkKkKkKkKK#',
    '#############',
  ],
  [ // t2: the user's white box, sampled from their edited sheet (tag, lid band, thick seam, vertical stripe)
    '.....#b#.....',
    '#############',
    '#bbbbbbbbbbb#',
    '#############',
    '#############',
    '#wwww#b#wwww#',
    '#wwww#b#wwww#',
    '#wwww#b#wwww#',
    '#############',
  ],
  [ // t3: the user's ribbon box, sampled from their edited sheet (two-loop bow with knot, wide lid, cross ribbon)
    '.....##...##....',
    '....#ww###ww#...',
    '...##ww###ww#...',
    '######ww########',
    '#bbbbbbwwbbbbbb#',
    '.######ww######.',
    '.#bbbbbwwbbbbb#.',
    '.#wwwwwwwwwwww#.',
    '.#bbbbbwwbbbbb#.',
    '.#bbbbbwwbbbbb#.',
    '.##############.',
  ],
];
export function packCanvas(tier: number, paletteKey: string): HTMLCanvasElement {
  const pal = PALETTE[paletteKey] ?? PALETTE.pink;
  const ov = overrideCanvas(`pack:${tier}`, PINK_TINT(pal.fill, pal.shade));
  if (ov) return ov;
  const rows = PACKS[Math.max(0, Math.min(2, tier - 1))];
  const c = makeCanvas(Math.max(...rows.map((r) => r.length)), rows.length);
  drawTemplate(c.getContext('2d')!, rows, 0, 0, { '#': OUTLINE, b: pal.fill, s: pal.shade, w: '#FFFDF7', k: '#DEBB93', K: '#CFA97C' });
  return c;
}
/** @deprecated kept for the sheet tool */
export const giftCanvas = packCanvas;

/** A pair of stanchions with a red velvet rope: separates the customer being served from the queue. 22x12. */
const ROPE = [
  '.#.................#..',
  '#y#...............#y#.',
  '.#.................#..',
  '.#.................#..',
  '.#r...............r#..',
  '.#.rr...........rr.#..',
  '.#...rrr.....rrr...#..',
  '.#......rrrrr......#..',
  '.#.................#..',
  '.#.................#..',
  '###...............###.',
  '###...............###.',
];
export function ropeCanvas(): HTMLCanvasElement {
  const ov = overrideCanvas('misc:rope'); if (ov) return ov;
  const c = makeCanvas(22, 12);
  drawTemplate(c.getContext('2d')!, ROPE, 0, 0, { '#': OUTLINE, y: '#F4C65A', r: '#D9534F' });
  return c;
}

/** A little round seat cushion behind the counter. 10x6 */
const SEAT = [
  '..######..',
  '.#pppppp#.',
  '#pppppppp#',
  '#wwwwwwww#',
  '.#wwwwww#.',
  '..######..',
];
export function seatCanvas(): HTMLCanvasElement {
  const ov = overrideCanvas('misc:seat'); if (ov) return ov;
  const c = makeCanvas(10, 6);
  drawTemplate(c.getContext('2d')!, SEAT, 0, 0, { '#': OUTLINE, p: '#F9CBD6', w: '#FFF3E6' });
  return c;
}

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
  const ov = overrideCanvas('misc:sack'); if (ov) return ov;
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
  const ov = overrideCanvas(`pat:${variant}`);
  if (ov) return ov;
  const c = makeCanvas(20, 18);
  const ctx = c.getContext('2d')!;
  drawTemplate(ctx, PAW, 4, 1, { '#': OUTLINE, c: '#FBEAD2', p: '#F3B6C6' });
  for (const f of PAW_FLAIR[variant] ?? PAW_FLAIR.click1) drawTemplate(ctx, f.rows, f.at[0], f.at[1], { e: '#9C8A82', P: '#F28CA3', y: '#F4C65A', h: '#F28CA3', w: '#FFE28A', '#': OUTLINE });
  return c;
}

const BELT = [ // chevrons pointing along +x; the frame is drawn by the scene so corners and ends close properly
  'dmdddmdd',
  'dmdddmdd',
  'ddmdddmd',
  'dddmdddm',
  'dddmdddm',
  'ddmdddmd',
  'dmdddmdd',
  'dmdddmdd',
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
  anger: [ // the vein mark, sampled from Twemoji U+1F4A2 (CC-BY 4.0) rotated 30°
    '........AA.....',
    '........aa.....',
    '..Aa...aa..AA..',
    '..AaaaaaA..aa..',
    '....AaaA..Aa...',
    'AaA.......aa...',
    'Aaaa......aa...',
    '..AaA.....Aaa..',
    '...aa......AaaA',
    '...aa........a.',
    '...aA..Aaaa....',
    '..aa..aaaaaaA..',
    '...A..aa...aA..',
    '.....aa........',
    '......A........',
  ],
  dream: [ // a daydream: a bumpy thought cloud with two trailing bubbles down to the left
    '....##.##...',
    '..##wwwww##.',
    '.#wwwwwwwww#',
    '#wwwwwwwwww#',
    '#wwwwwwwwww#',
    '.#wwwwwwww#.',
    '..########..',
    '...##.......',
    '..#w#.......',
    '...#........',
    '..#.........',
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
  const ov = overrideCanvas(`emote:${name}`, { '#F28CA3': accent });
  if (ov) return ov;
  const rows = EMOTES[name] ?? EMOTES.heart;
  const c = makeCanvas(rows[0].length, rows.length);
  drawTemplate(c.getContext('2d')!, rows, 0, 0, { a: accent, A: accent + 'aa', w: '#FFFFFF', '#': '#5A4038', y: '#F2C94C', r: '#E8453C', p: '#F3B6C6', b: '#C4DEF5' });
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
  scratcher: [ // scratching log: a cylinder — flat cut face the same width as the trunk, bark lines
    '...########...',
    '..#LLLLLLLL#..',
    '.#LLLLLLLLLL#.',
    '.#LLLLLLLLLL#.',
    '.#LLLLLLLLLL#.',
    '.#B##LLLL##B#.',
    '.#BBB####BBB#.',
    '.#BBdBBBBBBB#.',
    '.#BBdBBBBdBB#.',
    '.#BBBBBBBdBB#.',
    '.#BdBBBBBdBB#.',
    '.#BdBBBdBBBB#.',
    '.#BBBBBdBBBB#.',
    '.#BBBBBdBBdB#.',
    '.#BdBBBBBBdB#.',
    '.#BdBBBBBBdB#.',
    '.#BBBBBBBBBB#.',
    '.#BBBBBBBBBB#.',
    '.#dBBBBBBBBd#.',
    '.##BBBBBBBB##.',
    '...########...',
  ],
  hangball: [ // the stand in 3/4 view: round base, pole, arm (the string and ball swing separately)
    '....##########..',
    '....#dddddddd#..',
    '....#dd#######..',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '....#dd#........',
    '...######.......',
    '.#dddddddd#.....',
    '#dddddddddd#....',
    '.#dddddddd#.....',
    '...######.......',
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
  tent: [ // pyramid tent (floral): front face with a dark arched door, shaded right face, stitch lines, mat with one cushion
    '..............#.................',
    '.............#A#................',
    '.............#A#................',
    '............#aaA#...............',
    '............#aaAA#..............',
    '...........#aaaAAA#.............',
    '..........#saasAAA#.............',
    '..........#aaaaAAAA#............',
    '.........#aaaaaAASAA#...........',
    '.........#aaaaaaAAPpA#..........',
    '........#saasaasAAAAA#..........',
    '........#aaaaaaaAAAAAA#.........',
    '.......####aaaaaAASAASA#........',
    '......##ddd#aaaaAAAAAAA#........',
    '......#ddddd#saasAAAAAAA#.......',
    '.....##ddddd#aaaaAAAAAAAA#......',
    '.....#ddddddd#aaaAASAASAAS#.....',
    '....##ddddddd#aaaAAAAAAAAA#.....',
    '...#s#ddddddd#aasAAAAAAAAAA#....',
    '...#a#ddddddd#aaaAAAAAAAAAAA#...',
    '..#aa#ddddddd#aaaaAASAASAASAA#..',
    '..#aa#ddddddd#aaaaAAAAAAAAAAA#..',
    '.#saa#ddddddd#saasAAAAAAAAAAAA#.',
    '.#fffmdddddddmfffmfffmfffmfffm#.',
    '#fpppppdddddmfffmfffmfffmfffmff#',
    '#pppppppfffmfffmfffmfffmfffmfff#',
    '#fpppppfffmfffmfffmfffmfffmfffm#',
    '################################',
  ],
  tent2: [ // pyramid tent (sage canvas): lattice window on the right face, plain mat
    '..............#.................',
    '.............#A#................',
    '.............#g#................',
    '............#gag#...............',
    '............#aaAA#..............',
    '...........#aaaAAA#.............',
    '..........#saasAAA#.............',
    '..........#aaaaAAAA#............',
    '.........#aaaaaAASAA#...........',
    '.........#aaaaaaAAAAA#..........',
    '........#saasaasAAAAA#..........',
    '........#aaaaaaaAAAAAA#.........',
    '.......####aaaaaAASAASA#........',
    '......##ddd#aaaaAAAAAAA#........',
    '......#ddddd#saasAAAA####.......',
    '.....##ddddd#aaaaAAAA#w#w#......',
    '.....#ddddddd#aaaAASA######.....',
    '....##ddddddd#aaaAAAA#w#w##.....',
    '...#s#ddddddd#aasAAAA#####A#....',
    '...#a#ddddddd#aaaAAAAAAAAAAA#...',
    '..#aa#ddddddd#aaaaAASAASAASAA#..',
    '..#aa#ddddddd#aaaaAAAAAAAAAAA#..',
    '.#saa#ddddddd#saasAAAAAAAAAAAA#.',
    '.#ffffdddddddfffffffffffffffff#.',
    '#ffffffdddddfffffffffffffffffff#',
    '#ffffffffffffffffffffffffffffff#',
    '#ffffffffffffffffffffffffffffff#',
    '################################',
  ],
  fishbowl: [ // goldfish bowl on a stand; cats sit and stare
    '....########....',
    '...#wwwwwwww#...',
    '..#wbbbbbbbbw#..',
    '.#wbbbbbbbbbbw#.',
    '#wbbbbbbbbbbbbw#',
    '#wbbgbbbbbbbbbw#',
    '#wbgbbb#oo##bbw#',
    '#wbgbb#ooooo#bw#',
    '#wbgbb#w#ooo##w#',
    '#wbbgbb#ww###bw#',
    '#wbbgbbbbbbbbbw#',
    '.#wbbbbbbbbbbw#.',
    '..#wwbbbbbbww#..',
    '...#dddddddd#...',
    '..#dddddddddd#..',
    '...##########...',
  ],
  fish: [ // fish plush, silhouette sampled from Twemoji U+1F41F (CC-BY 4.0), recoloured
    '.........####.................',
    '........#mmmm###..............',
    '........#wwwwwwm##............',
    '......##mmmmmmmwwm#.......####',
    '....##mmmmmmmmmmmmm##...##MMM#',
    '..##mmmmmmmmmmmmmmmmm#.#MMMM#.',
    '.#mmmmmmmmmmmmmmmmmmmm#MMMM#..',
    '.#mmmmw#mmmmmmmmmmmmmmMMMMM#..',
    '#mmmmmmmmmmmmmmmmmmmmmMMMM#...',
    '##mmmmmmmmmmmmmmmmmmmmMMMM#...',
    '..#mmmmmmmmmmmmmmmmmmmMMMM#...',
    '..#mmmmmmmmmmmmmmmmmmmMMMM#...',
    '..#mmmmmmmmmmmmmmmmmm#MMMMM#..',
    '..#mmmmmmmmmmmmmmmm##.#MMMMM#.',
    '...###mmmmmmmmmmmm#....##MMMM#',
    '......#########mm#.......#####',
    '...............###............',
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
  cattree: [ // scratching post: small cap on top, the post standing on a wide round base seen from above
    '......########......',
    '.....#LLLLLLLL#.....',
    '.....#LLLLLLLL#.....',
    '......########......',
    '......#ssssss#......',
    '......#SSSSSS#......',
    '......#ssssss#......',
    '......#SSSSSS#......',
    '......#ssssss#......',
    '......#SSSSSS#......',
    '......#ssssss#......',
    '......#SSSSSS#......',
    '......#ssssss#......',
    '......#SSSSSS#......',
    '......#ssssss#......',
    '......#SSSSSS#......',
    '......#ssssss#......',
    '......#SSSSSS#......',
    '......#ssssss#......',
    '......#SSSSSS#......',
    '......#ssssss#......',
    '......#SSSSSS#......',
    '.##LL##ssssss##LL##.',
    '#LLLLL#ssssss#LLLLL#',
    '#LLLLLL######LLLLLL#',
    '#LLLLLLLLLLLLLLLLLL#',
    '.#LLLLLLLLLLLLLLLL#.',
    '..################..',
  ],
  basket: [ // wicker basket: 3:1 rim ellipse seen from above, handle, woven front
    '.........######.........',
    '........#kkkkkk#........',
    '.......#kk####kk#.......',
    '......#kk#....#kk#......',
    '......#k#......#k#......',
    '......#k#......#k#......',
    '........########........',
    '.....###KKKKKKKK###.....',
    '...##KKKDDDDDDDDKKK##...',
    '..#KKDDDDDDDDDDDDDDKK#..',
    '.#KKDDDDDDDDDDDDDDDDKK#.',
    '#KKDDDDDDDDDDDDDDDDDDKK#',
    '#KKKDDDDDDDDDDDDDDDDKKK#',
    '#kKKKKDDDDDDDDDDDDKKKKk#',
    '#kkXkKKKKKKKKKKKKKKkXkk#',
    '.#kXkkXkkXkkXkkXkkXkkX#.',
    '.#kkXkkXkkXkkXkkXkkXkk#.',
    '..#kXkkXkkXkkXkkXkkXk#..',
    '...#kkkkkkkkkkkkkkkk#...',
    '....################....',
  ],
  cushion: [
    '..########..',
    '.#aaaaaaaa#.',
    '#aaaaaaaaaa#',
    '#aaaaaaaaaa#',
    '.#ssssssss#.',
    '..########..',
  ],
  cathouse: [ // cabinet projection like a cube: front wall, red gable roof, receding right wall and roof plane
    '...........##########...............',
    '..........#r#RRRRRRRR##.............',
    '.........#rrr#RRRRRRRRR##...........',
    '........#rrrrr#RRRRRRRRRR##.........',
    '.......#rrrrrrr#RRRRRRRRRRR##.......',
    '......#rrrrrrrrr#RRRRRRRRRRRR##.....',
    '.....#rrrrrrrrrrr#RRRRRRRRRRRRR#....',
    '....#rrrrrrrrrrrrr#RRRRRRRRRR##.....',
    '...#rrrrrrrrrrrrrrr#RRRRRRR####.....',
    '..#rrrrrrrrrrrrrrrrr#RRRR###KK#.....',
    '.#rrrrrrrrrrrrrrrrrrr#R###KKKK#.....',
    'WwwWwwWwwWwwWwwWwwWwwWw#KKKKKK#.....',
    '.#####################KKKKKKKK#.....',
    '.#kkkkkkkkkkkkkkkkkkk#KKKKKKKK#.....',
    '.#kkkkkkkkkkkkkddkkkk#KKKKKKKK#.....',
    '.#kkkkkkkkkkkkddddkkk#KKKKKKKK#.....',
    '.#kkkkkkkkkkkddddddkk#KKKKKKKK#.....',
    '.#kkkkkkkkkkkddddddkk#KKKKKKKK#.....',
    '.#wkwwwwkkkkkddddddkk#KKKKKKKK#.....',
    '.#kwkkkkwwkkkddddddkk#KKKKKKKK#.....',
    '.#wkwwwwkkkkkddddddkk#KKKKKKKK#.....',
    '.#kkkkkkkkkkkddddddkk#KKKKKKKK#.....',
    '.#kkkkkkkkkkkddddddkk#KKKKKKKK#.....',
    '.#kkkkkkkkkkkddddddkk#KKKKKK##......',
    '.#kkWkWkkkkkkddddddkk#KKKK##........',
    '.#kkkWkkkkkkkddddddkk#KK##..........',
    '.#kkWWWkkkkkkddddddkk###............',
    '.#####################..............',
  ],
};
/** Furniture sampled from the reference sheet (2026-11-03): rows + per-item palette. Used in preference to the hand-drawn templates. */
export const FURNITURE_PX: Record<string, { rows: string[]; colors: Record<string, string> }> = {
  cathouse: { colors: {"a": "#F3D2B4", "b": "#E9BC8C", "c": "#C88C6B", "d": "#D8514B", "e": "#C24641", "f": "#502F1F"}, rows: [
    '..........#########..............',
    '.........#fffffffdd########......',
    '........#ffddddddddddddddff#.....',
    '.......#ffdddddddddddddddfff#....',
    '.......#dddddddddddddddddfff#....',
    '......#dddddddddeeddddddfffef#...',
    '.....#fdddddddddddddddddffeeef#..',
    '....#fdddddddddddddddddffeeeeef#.',
    '...#fddddddddddddddddddfeeeeeff#.',
    '..#fdddddddddddddddddddeeeeeeff#.',
    '.#fddddddddddddddddddddeeeeeff#..',
    '#ffdddddddddddddddddddfeeeffcc#..',
    '#ffffeffdddeddddddddddffeffccc#..',
    '.#fffffffffeeddddddddffffccccc#..',
    '.#fbbbbbbfff#####fddffffcccccc#..',
    '.#bbbbbbbbb##...##bbfffccccccc#..',
    '.#bbbbbbbbb#.....#bbbfcccccccc#..',
    '.#ebbbbbbb##.....##bbccccccccc#..',
    '.#bbbbbbbb#.......#bbfcccccccc#..',
    '.#bbbbbbbb#.......#bbfcccccccc#..',
    '.#bbbbbbbb#.......#bbfcccccccc#..',
    '.#bbbbbbbb#.......#bbfcccccccc#..',
    '.#bbbbbbbb#.......#bbfcccccccc#..',
    '.#bbbbbbbb#.......#bbfccccccc##..',
    '.#bbbabbbb#.......#bbfcccccc#....',
    '.#bbbbbbbb#.......#bbfccccc#.....',
    '.#bbbbbbbb#.......#fffccc##......',
    '..#########.......#ffffc#........',
    '.................##fff##.........',
    '..................####...........',
  ] },
  scratcher: { colors: {"a": "#EED0AB", "b": "#BE845D", "c": "#AB714E", "d": "#A06747", "e": "#84573E", "f": "#3E2517"}, rows: [
    '....######....',
    '..##aaffaa##..',
    '.#aaaaaaaaaa#.',
    '#faaaaaaaaaaf#',
    '#ffaaaaaaaaff#',
    '#fffaeeeeafff#',
    '#ffbeecceedff#',
    '#fbbbccccdddf#',
    '#fbbbccccdddf#',
    '#fbbbccccdddf#',
    '#fbbccccccddf#',
    '#fbbccccccddf#',
    '#fbbccccccddf#',
    '#fbbccccccedf#',
    '#fbbbcccccddf#',
    '#fbbbcccccddf#',
    '#fbbbcccccddf#',
    '#fbbccccccddf#',
    '#ffbcccccdddf#',
    '.#ffcccccddd#.',
    '..##########..',
    '..............',
  ] },
  cattree: { colors: {"a": "#FCF5EA", "b": "#F7DEBD", "c": "#E5BF97", "d": "#C39B75", "e": "#966D4E", "f": "#41291A"}, rows: [
    '......#######.....',
    '...###fffffbb##...',
    '..#bbbbffdfbbbb#..',
    '..#fbbbeeeebbbf#..',
    '..#ffeeeeeeeeff#..',
    '..#fffeeeeeeeff#..',
    '...#ffffffeeef#...',
    '....#fffddddd#....',
    '....#ffcddddd#....',
    '....#ffcccddd#....',
    '....#ffccccdd#....',
    '....#ffccccdd#....',
    '....#ffccccdd#....',
    '....#ffccccdd#....',
    '....#ffaaaadd#....',
    '....#ffcccccc#....',
    '....#ffaaaacc#....',
    '....#ffcccaaa#....',
    '....#ffcaaaad#....',
    '....#fcccaddd#....',
    '...#fffcaadddd##..',
    '.##fffffaaddddcf#.',
    '#ffffffffffffcccf#',
    '#ffbbbbbbffffccce#',
    '#ffebbbbbbbbbceee#',
    '.#feeeeeeeebbeee#.',
    '..##############..',
    '..................',
  ] },
  basket: { colors: {"a": "#F2CDA5", "b": "#DAAA7D", "c": "#C49166", "d": "#9D6B4A", "e": "#7D5439", "f": "#3F2617"}, rows: [
    '.........#####.........',
    '.......##ccccc#........',
    '......#cccccffc##......',
    '......#bcccfffcc#......',
    '.....#bfffaafffcc#.....',
    '....#bffffaaffffc#.....',
    '....#cffffffffffff#....',
    '...#fffffffffffffff#...',
    '.##fffdddddddfffffff##.',
    '#fffffdddddddeeffffff#.',
    '#ffffffdddddeeeffffccf#',
    '#ffddcfddddeeeeffccccc#',
    '#fddddbbbbbbeecfccccc#.',
    '.#ddddbbbbbddddcccccc#.',
    '.#aaabbbbbdddddbccccf#.',
    '.#aaabbbaaaaaaaccccff#.',
    '..#cbbbbaaaaaaaccccf#..',
    '..#ccbbccaaaaaccccc#...',
    '...###fcceeeecccc##....',
    '......###########......',
  ] },
  tent: { colors: {"a": "#FDEBD5", "b": "#F9E5CB", "c": "#F2D1B5", "d": "#D39F84", "e": "#997859", "f": "#3C2517"}, rows: [
    '............##...##...........',
    '...........#ff#.#f#...........',
    '...........#fff#ff#...........',
    '............#fffff#...........',
    '.............#eff#............',
    '.............#eee#............',
    '............#feeef#...........',
    '...........#fffebbf#..........',
    '..........#ffffebbbb#.........',
    '..........#ccceebbbb#.........',
    '.........#cccceebbbbb#........',
    '........#bbccfeeebbbbb#.......',
    '........#bbbfffeebbbbb#.......',
    '.......#fbbffffeebbbbbb#......',
    '......#cccfffffeebbbbbbb#.....',
    '......#cccffffbeabbbbbbb#.....',
    '.....#ccccffffbeaabbbbbbb#....',
    '....#ccccffeefbeaabbbbbcc#....',
    '....#cccffeeefbeaaabbbbccc#...',
    '...#ccccfeeeefbeaaaaabccccf#..',
    '...#cccffeeeefbeaaaaaacccbb#..',
    '..#ccccfeeeeeffbaaaaaacccbbb#.',
    '.#ccccffeeeeeffbaaaaaaacbbbb#.',
    '.#fccffddddddffbaaddaaaabbbbb#',
    '#fffffdddddddffbaadddaaabbbbd#',
    '#ffffddddddddffaaadddaaaabfff#',
    '.#fffddddddddffaaaadddaaafff#.',
    '..###########fffaaacddfa####..',
    '.............#ffffff####......',
    '..............######..........',
  ] },
  tent2: { colors: {"a": "#E9E2CA", "b": "#C6C2A5", "c": "#AFAC8D", "d": "#968969", "e": "#5F4E3A", "f": "#382314"}, rows: [
    '............##................',
    '...........#ff#####...........',
    '...........#dddfff#...........',
    '............#dddff#...........',
    '.............#ddf#............',
    '............#fddd#............',
    '...........#fffdcc#...........',
    '...........#ffffcc#...........',
    '..........#bbfffccc#..........',
    '.........#bbbffdcccc#.........',
    '........#bbbbffdccccc#........',
    '........#bbbffbdccccc#........',
    '.......#bbbfffbdcccccc#.......',
    '......#bbbbfffbdccccccc#......',
    '......#bbbffffddccccccc#......',
    '.....#bbbbffffddcccccccc#.....',
    '....#bbbbfddfddddccfaaccc#....',
    '....#bbbffdddddddaaaaaccc#....',
    '...#bbbbfddddddddaaaafcccc#...',
    '...#bbbfdddddddddcaaaffccc#...',
    '..#bbbffddddddddccaaaffcccc#..',
    '.#bbbbffdddddfddcccaaffcccc#..',
    '.#bbbbfeedddfebdcccccccccccc#.',
    '#fbbbfbbaaafffddccccccccccccf#',
    '#fffffbbaaaaffddcccccccaacccc#',
    '#fffffbaaaaaffddcccccccaacccc#',
    '.#fffffaaaaffffabbccccccccc##.',
    '..#####afaafffffbbbccccc###...',
    '.......######ffffff#####......',
    '.............######...........',
  ] },
  fishbowl: { colors: {"a": "#D7ECF4", "b": "#D8DACA", "c": "#AFDBE9", "d": "#E7C181", "e": "#78B8BA", "f": "#6F582D"}, rows: [
    '.......##.........',
    '...####ee######...',
    '..#ffeeeeeeeeff#..',
    '..#aaeeeffeeeff#..',
    '..#aaaaeacfffcc#..',
    '..#aaaaacccccaac#.',
    '.#aaaaaaccccaaac#.',
    '#caaaaaacccaaaccc#',
    '#cccccccddddafccc#',
    '#ccccccdddddffccc#',
    '#ccccccdddddfcccc#',
    '.#ccccccdddcccccc#',
    '.#ccffcdddddcccc#.',
    '.#cffddddddddccc#.',
    '..#ffdddddddddc#..',
    '...#fddddddddd#...',
    '....##########....',
    '..................',
  ] },
  hangball: { colors: {"a": "#BA8462", "b": "#A67050", "c": "#A16A4D", "d": "#9B6549", "e": "#956247", "f": "#69442F"}, rows: [
    '....###########...',
    '...#aaaaaaaaaa#...',
    '...#cccaaeeeee#...',
    '...#cccceeeeee#...',
    '...#ccc########...',
    '...#cc#.......#...',
    '...#cc#...........',
    '...#bc#...........',
    '...#bc#...........',
    '...#bc#...........',
    '...#bc#...........',
    '...#bc#...........',
    '...#bc#...........',
    '...#bc#...........',
    '...#bc#...........',
    '...#bc#...........',
    '...#bc#...........',
    '...#cc#...........',
    '...#cc#...........',
    '..#ffff#####......',
    '.#ddddddbbf#......',
    '#ddddddeeef#......',
    '#dddeeeeeef#......',
    '.##########.......',
    '..................',
  ] },
  cushion_round: { colors: {"a": "#FADAD5", "b": "#FBD2D2", "c": "#FBCFD1", "d": "#FBCACB", "e": "#E5B7B4", "f": "#523A2E"}, rows: [
    '...................',
    '...................',
    '....##########.....',
    '...#ccccbaabba##...',
    '.##bbccccbbbbbbd##.',
    '#dbbbbccbbbbbbbddd#',
    '#ddbbbbbbbbbbbbddd#',
    '#ddddbbbbbbbbbdddd#',
    '#dddddbbbbbdddddff#',
    '#fffdddddddddddfff#',
    '#fffffdddddeeffff#.',
    '.##ffaaaeeeeeff##..',
    '...###aeeeeee##....',
    '......#######......',
  ] },
  bed: { colors: {"a": "#FAE4D4", "b": "#F9D6D3", "c": "#F7C6C6", "d": "#E7B8A9", "e": "#C7918E", "f": "#3E2719"}, rows: [
    '........######........',
    '.....###ffffff###.....',
    '...##bbdffffffddd#....',
    '..#bbbeedddfffddde##..',
    '.#fbbeeeddddfffdebbb#.',
    '#fbbbffffdddffffbbbb#.',
    '#fbbbffffaaaaffffbcc#.',
    '#fbbbfffcaaaadffcccc#.',
    '#fbbbfffcccffccccccc#.',
    '#fbbbddccccccccccccc#.',
    '.#fbcddcccccccccddcc#.',
    '..#faaaacccccccfddd#..',
    '...##aaaaaaaacfff##...',
    '.....############.....',
    '......................',
  ] },
  fish: { colors: {"a": "#F6FAFB", "b": "#C7E2EF", "c": "#C2E1EE", "d": "#C1E0ED", "e": "#BADBEA", "f": "#544D48"}, rows: [
    '...........####..............',
    '..........#ffff#.............',
    '.........#aaaaff##...........',
    '.......##aaaaaaaaa##.........',
    '.....##aaaaaaaaaaaaf#....###.',
    '....#bbaaaaaaaaaaaddf#..#eff#',
    '...#fbbaaaaaaaaaaddddd##eeef#',
    '..#fbbbcccaaaaadddddddeeeeee#',
    '.#fbbbbcccbbbccdddddddeeeee#.',
    '#ffbbbbbbbbbccccdddddddeeee#.',
    '#ffbbbbbbbbccccccddddddeee#..',
    '#ffbbbbbbbdccccccddddddeeee#.',
    '.#ffbbbbbdddcccccdddddeeeee#.',
    '..#fbbbbddddddccdddddeeeeeee#',
    '...#fbbcddddddddddddde#eeeee#',
    '....#fdddddddddddddd##.##fff#',
    '.....##dddddddbbbdf#.....####',
    '.......#######bbbf#..........',
    '..............#bff#..........',
    '...............###...........',
  ] },
};

export function furnitureCanvas(name: string): HTMLCanvasElement {
  const ov = overrideCanvas(`furniture:${name}`);
  if (ov) return ov;
  const px = FURNITURE_PX[name];
  if (px) { const c = makeCanvas(px.rows[0].length, px.rows.length); drawTemplate(c.getContext('2d')!, px.rows, 0, 0, { '#': OUTLINE, ...px.colors }); return c; }
  const rows = FURNITURE[name];
  const c = makeCanvas(rows[0].length, rows.length);
  if (name === 'tent') { drawTemplate(c.getContext('2d')!, rows, 0, 0, { '#': OUTLINE, a: '#F3DEC4', A: '#E2C9A8', s: '#E7CFAE', S: '#D1B58F', p: '#F3B6C6', P: '#E7A3B4', d: '#6E5247', c: '#C98A5A', f: '#F6E4D4', m: '#F3B6C6', g: '#8FCDB2' }); return c; }
  if (name === 'tent2') { drawTemplate(c.getContext('2d')!, rows, 0, 0, { '#': OUTLINE, a: '#D6DEC2', A: '#BFCBA2', s: '#CBD6B4', S: '#AEBB94', d: '#6E5247', c: '#C98A5A', C: '#D9A86E', w: '#FFFDF7', g: '#8FCDB2', p: '#F3B6C6', f: '#E8D6B8' }); return c; }
  if (name === 'fishbowl') { drawTemplate(c.getContext('2d')!, rows, 0, 0, { '#': OUTLINE, w: '#E6F2FA', b: '#A9D4F0', o: '#F2A65A', g: '#8FCDB2', d: '#C9A277' }); return c; }
  drawTemplate(c.getContext('2d')!, rows, 0, 0, { '#': OUTLINE, a: '#F9CBD6', s: '#D9B48F', S: '#C49A6C', B: '#9C6B4A', L: '#E8CFA8', D: '#8E6A48', K: '#B98451', X: '#C9955E', W: '#F6EDE2', r: '#E0605A', R: '#B8423E', b: '#FFF3E6', d: '#6E5247', k: '#DEBB93', w: '#FFFFFF', A: '#6FA0D8', m: '#BFD9EA', M: '#9FC1D8', e: '#3A2622' });
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
