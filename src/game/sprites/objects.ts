/** Shared pixel brush: integer geometry, one-pixel outlines and a restrained café palette. */
const ink = '#5A4038', cream = '#FFF3E6', pink = '#F3B6C6', wood = '#C9956C', shade = '#A87555', mint = '#B9D9C5';
function brush(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  const rect = (a: number, b: number, d: number, e: number, color: string) => { x.fillStyle = color; x.fillRect(a, b, d, e); };
  const box = (a: number, b: number, d: number, e: number, color: string) => { rect(a, b, d, e, ink); rect(a + 1, b + 1, d - 2, e - 2, color); };
  // Scanline ellipses keep edges on the pixel grid, without antialiasing.
  const oval = (a: number, b: number, d: number, e: number, color: string) => {
    for (let y = 0; y < e; y++) { const half = Math.sqrt(1 - Math.pow((y + .5 - e / 2) / (e / 2), 2)) * d / 2; const left = Math.ceil(d / 2 - half); rect(a + left, b + y, d - 2 * left, 1, color); }
  };
  const cushion = (a: number, b: number, d: number, e: number, color = pink) => { oval(a, b, d, e, ink); oval(a + 1, b + 1, d - 2, e - 2, color); rect(a + 4, b + 2, d - 8, 1, cream); };
  return { c, x, rect, box, oval, cushion };
}

export function objectFurniture(name: string): HTMLCanvasElement | undefined {
  const sizes: Record<string, [number, number]> = { cushion_round: [24, 14], bed: [28, 16], scratcher: [14, 22], cattree: [22, 30], basket: [26, 22], cathouse: [34, 30], tent: [32, 32], tent2: [32, 32], hangball: [18, 29], hangball_ball: [7, 15], fishbowl: [22, 22], fish: [30, 20] };
  if (!sizes[name]) return;
  const { c, x, rect, box, oval, cushion } = brush(...sizes[name]);
  if (name === 'cushion_round' || name === 'bed') {
    const w = c.width; cushion(0, 3, w, c.height - 3);
    if (name === 'bed') { oval(5, 5, 18, 8, shade); cushion(6, 6, 16, 6, cream); }
  } else if (name === 'scratcher' || name === 'cattree') {
    const tree = name === 'cattree', mid = tree ? 8 : 3;
    cushion(0, c.height - 6, c.width, 6, wood);
    box(mid, 4, 8, c.height - 7, '#E1BF92');
    for (let y = 7; y < c.height - 5; y += 3) rect(mid + 1, y, 6, 1, shade);
    cushion(tree ? 0 : 2, 0, tree ? 22 : 10, 7, tree ? cream : wood);
  } else if (name === 'basket') {
    oval(6, 0, 14, 17, ink); oval(8, 2, 10, 13, wood); x.clearRect(10, 4, 6, 10);
    cushion(0, 9, 26, 9, shade); cushion(3, 11, 20, 5, pink);
    for (let y = 15; y < 21; y++) { const inset = Math.floor((y - 15) / 2); rect(2 + inset, y, 22 - inset * 2, 1, y === 20 ? ink : wood); }
    for (let y = 16; y < 20; y += 2) for (let a = 5; a < 22; a += 4) rect(a + (y % 4 ? 1 : 0), y, 2, 1, cream);
    rect(2, 14, 22, 1, ink);
  } else if (name === 'cathouse') {
    box(4, 12, 26, 18, '#E6BE91');
    for (let y = 0; y < 14; y++) { const left = 16 - y; rect(left, y, 34 - 2 * left, 1, ink); if (y > 1) rect(left + 2, y, 30 - 2 * left, 1, '#D86F68'); }
    box(12, 18, 11, 12, ink); x.clearRect(13, 20, 9, 10); rect(13, 19, 9, 1, ink);
    rect(6, 15, 5, 1, cream);
  } else if (name === 'tent' || name === 'tent2') {
    const sage = name === 'tent2', cloth = sage ? '#C4D0AF' : '#F4D7C2';
    rect(13, 0, 2, 6, wood); rect(18, 0, 2, 6, wood);
    for (let y = 4; y < 31; y++) {
      const half = Math.floor((y - 3) * .56); rect(16 - half, y, half * 2 + 1, 1, ink);
      if (half > 1) rect(17 - half, y, half * 2 - 1, 1, cloth);
      if (y > 12) { const door = Math.floor((y - 12) * .38); rect(16 - door, y, door * 2 + 1, 1, ink); if (door > 1) rect(17 - door, y, door * 2 - 1, 1, '#785747'); }
    }
    rect(2, 30, 29, 1, ink); cushion(10, 27, 13, 3, sage ? cream : pink);
    rect(9, 21, 2, 3, cream); rect(23, 21, 2, 3, cream);
    if (!sage) for (const [a, b] of [[11, 13], [23, 25], [7, 26]]) { rect(a, b, 3, 1, pink); rect(a + 1, b - 1, 1, 3, pink); }
  } else if (name === 'hangball') {
    box(3, 1, 5, 25, wood); box(3, 1, 14, 4, wood); cushion(0, 24, 15, 5, wood);
  } else if (name === 'hangball_ball') {
    rect(3, 0, 1, 9, ink); cushion(0, 8, 7, 7); rect(2, 10, 2, 1, cream);
  } else if (name === 'fishbowl') {
    cushion(0, 3, 22, 19, '#C5E7ED'); box(4, 1, 14, 4, '#E2F4F3');
    rect(4, 7, 2, 5, cream); rect(5, 18, 12, 2, '#E7CD9E');
    rect(6, 14, 1, 4, '#75AA8B'); rect(5, 13, 1, 2, '#75AA8B');
    oval(10, 10, 6, 5, '#EC9966'); rect(16, 10, 2, 5, '#EC9966'); rect(11, 11, 1, 1, ink);
  } else if (name === 'fish') {
    cushion(0, 3, 25, 15, '#BFDDE4');
    for (let y = 4; y < 17; y++) { const n = Math.floor(Math.abs(y - 10) / 2); rect(24 + n, y, 6 - n, 1, ink); rect(25 + n, y, 4 - n, 1, '#BFDDE4'); }
    rect(5, 8, 2, 2, ink); rect(12, 10, 1, 4, '#82B1C0'); rect(13, 11, 2, 2, '#82B1C0');
    rect(8, 14, 2, 1, cream); rect(10, 15, 2, 1, cream);
  }
  return c;
}

export function objectProp(name: string, tier: number): HTMLCanvasElement {
  const { c, rect, box, cushion } = brush(22, 24);
  const accent = [pink, mint, '#C6CDE3', '#E9CD8B'][tier];
  const tray = (y: number, mat = cream) => { box(1, y, 20, 5, '#B8C5C5'); rect(3, y + 1, 16, 2, mat); for (let a = 4; a < 19; a += 4) rect(a, y + 1, 2, 2, pink); };
  if (name === 'mixer') {
    if (tier === 0 || tier === 2) {
      box(17, 4, 4, 18, accent); box(5, 3, 16, 5, accent); rect(7, 5, 4, 1, cream);
      rect(9, 8, 1, 7, ink); rect(7, 11, 1, 4, '#9AAEAF'); rect(12, 11, 1, 4, '#9AAEAF');
      cushion(2, 14, 15, 7, '#CADAD9'); rect(4, 15, 10, 1, cream); box(1, 21, 21, 3, accent);
    } else if (tier === 1) {
      box(4, 7, 14, 6, '#CADAD9'); box(17, 8, 5, 3, wood); rect(6, 9, 10, 1, cream);
      for (let a = 6; a < 17; a += 2) rect(a, 12, 1, 1, ink);
      for (let a = 7; a < 16; a += 4) rect(a, 15, 1, 2, wood);
      cushion(1, 18, 19, 6, mint);
    } else {
      box(14, 4, 3, 14, wood); box(11, 12, 6, 7, '#D3C4E7');
      cushion(1, 16, 19, 7, accent); rect(4, 17, 12, 1, cream); rect(0, 23, 22, 1, ink);
    }
  } else if (name === 'piping') {
    if (tier === 3) { box(15, 1, 7, 7, accent); rect(18, 3, 1, 3, ink); rect(16, 4, 5, 1, ink); rect(18, 8, 2, 12, wood); tray(16); }
    else { tray(tier === 0 ? 19 : 16, tier === 2 ? mint : cream); }
    if (tier > 0) { box(2, 21, 3, 3, wood); box(17, 21, 3, 3, wood); }
  } else if (name === 'oven') {
    box(0, tier > 1 ? 3 : 10, 22, tier > 1 ? 21 : 14, accent);
    const door = (y: number, h: number) => { box(2, y, 15, h, ink); rect(3, y + 1, 13, h - 2, '#F4BD83'); rect(4, y + 1, 2, h - 3, '#FFE0A9'); rect(5, y + h - 3, 9, 1, shade); };
    if (tier === 3) { door(6, 7); door(15, 7); tray(0); } else door(tier === 2 ? 7 : 13, tier === 2 ? 13 : 8);
    box(18, 13, 3, 3, cream); rect(19, 18, 1, 2, ink); rect(2, 23, 3, 1, ink); rect(17, 23, 3, 1, ink);
    if (tier === 1) rect(3, 19, 13, 2, '#BA9F84');
  } else {
    if (tier === 3) {
      box(1, 0, 20, 24, accent); box(3, 4, 16, 17, '#C5E7ED');
      for (let y = 7; y < 20; y += 4) { rect(4, y + 2, 12, 1, ink); for (let a = 5; a < 16; a += 4) rect(a, y, 2, 2, pink); }
      rect(17, 11, 1, 5, ink);
    } else {
      box(1, 17, 20, 4, wood); box(2, 21, 3, 3, wood); box(17, 21, 3, 3, wood);
      if (tier === 0 || tier === 2) { box(2, 8, 18, 10, tier === 2 ? cream : '#E3BD91'); rect(3, 9, 16, 2, accent); for (let a = 5; a < 19; a += 5) { rect(a, 12, 3, 4, pink); if (tier === 2) rect(a - 1, 11, 1, 6, wood); } }
      else { box(3, 12, 7, 5, cream); rect(12, 4, 3, 9, wood); box(10, 10, 7, 5, '#885C4A'); rect(12, 15, 2, 2, '#885C4A'); }
    }
  }
  return c;
}

export function objectPat(variant: string): HTMLCanvasElement {
  const { c, rect, box, cushion } = brush(24, 24);
  const paw = (a: number, b: number, color: string) => { cushion(a + 2, b + 6, 12, 10, cream); cushion(a + 5, b + 10, 6, 4, color); for (const [dx, dy] of [[0, 4], [4, 0], [9, 0], [13, 4]]) cushion(a + dx, b + dy, 4, 6, color); };
  if (variant === 'click3') { paw(7, 0, mint); paw(0, 7, pink); }
  else paw(3, 4, variant === 'click2' ? '#E99AAE' : pink);
  if (variant === 'click4' || variant === 'pct1') { for (let y = 9; y < 18; y += 4) { rect(0, y, 3, 1, wood); rect(21, y, 3, 1, wood); } }
  if (variant === 'click5') { rect(0, 5, 7, 1, wood); rect(0, 9, 4, 1, wood); rect(0, 13, 3, 1, wood); }
  if (variant === 'pct2') { box(16, 16, 8, 8, mint); rect(19, 17, 2, 6, cream); rect(17, 19, 6, 2, cream); }
  if (variant === 'pct3') { rect(17, 1, 2, 2, '#DF8195'); rect(21, 1, 2, 2, '#DF8195'); rect(17, 3, 6, 2, '#DF8195'); rect(18, 5, 4, 1, '#DF8195'); rect(19, 6, 2, 1, '#DF8195'); }
  if (variant === 'click2') { rect(20, 6, 3, 1, '#DDBB69'); rect(21, 5, 1, 3, '#DDBB69'); }
  return c;
}
