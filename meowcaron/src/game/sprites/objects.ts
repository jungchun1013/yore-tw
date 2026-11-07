/** Café objects viewed from above and the front-left; light comes from upper-left. */
const ink = '#5A4038', cream = '#FFF3E6', pink = '#F3B6C6', wood = '#C9956C', shade = '#A87555', mint = '#B9D9C5';
function brush(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  const rect = (a: number, b: number, d: number, e: number, color: string) => { x.fillStyle = color; x.fillRect(a, b, d, e); };
  const tint = (color: string, amount: number) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, parseInt(color.slice(i, i + 2), 16) + amount)).toString(16).padStart(2, '0')).join('');
  // Rasterize polygons at pixel centres, so all diagonal edges stay crisp.
  const poly = (points: number[][], color: string) => {
    for (let y = Math.min(...points.map(p => p[1])); y < Math.max(...points.map(p => p[1])); y++) {
      const hits: number[] = [];
      points.forEach((p, i) => { const q = points[(i + 1) % points.length]; if ((p[1] <= y + .5 && q[1] > y + .5) || (q[1] <= y + .5 && p[1] > y + .5)) hits.push(p[0] + (y + .5 - p[1]) * (q[0] - p[0]) / (q[1] - p[1])); });
      hits.sort((a, b) => a - b); for (let i = 0; i + 1 < hits.length; i += 2) rect(Math.ceil(hits[i] - .5), y, Math.ceil(hits[i + 1] - .5) - Math.ceil(hits[i] - .5), 1, color);
    }
  };
  const box = (a: number, b: number, d: number, e: number, color: string) => {
    rect(a, b, d, e, ink); rect(a + 1, b + 1, d - 2, e - 2, color);
    if (d >= 5 && e >= 4) {
      const depth = Math.min(3, Math.floor(d / 4), Math.floor(e / 3));
      poly([[a + 1, b + depth], [a + depth + 1, b + 1], [a + d - 1, b + 1], [a + d - depth - 1, b + depth]], tint(color, 25));
      poly([[a + d - depth - 1, b + depth], [a + d - 1, b + 1], [a + d - 1, b + e - depth - 1], [a + d - depth - 1, b + e - 1]], tint(color, -35));
      rect(a + 1, b + e - 2, d - depth - 2, 1, tint(color, -18));
    }
  };
  // Scanline ellipses keep edges on the pixel grid, without antialiasing.
  const oval = (a: number, b: number, d: number, e: number, color: string) => {
    for (let y = 0; y < e; y++) { const half = Math.sqrt(1 - Math.pow((y + .5 - e / 2) / (e / 2), 2)) * d / 2; const left = Math.ceil(d / 2 - half); rect(a + left, b + y, d - 2 * left, 1, color); }
  };
  const cushion = (a: number, b: number, d: number, e: number, color = pink) => {
    // Shade a single silhouette. Independently sized ellipses can overwrite its rim.
    const inside = (xx: number, yy: number) => xx >= 0 && xx < d && yy >= 0 && yy < e
      && Math.pow((xx + .5 - d / 2) / (d / 2), 2) + Math.pow((yy + .5 - e / 2) / (e / 2), 2) <= 1;
    for (let yy = 0; yy < e; yy++) for (let xx = 0; xx < d; xx++) {
      if (!inside(xx, yy)) continue;
      // Include diagonal neighbours so stair-step corners join edge-to-edge, not just at a point.
      const edge = [-1, 0, 1].some(dy => [-1, 0, 1].some(dx => !inside(xx + dx, yy + dy)));
      const fill = yy >= Math.floor(e * .65) ? tint(color, -28)
        : yy <= Math.floor(e * .3) && xx < d * .65 ? tint(color, 20) : color;
      rect(a + xx, b + yy, 1, 1, edge ? ink : fill);
    }
  };
  return { c, x, rect, box, oval, cushion, poly, tint };
}

export function objectFurniture(name: string): HTMLCanvasElement | undefined {
  const sizes: Record<string, [number, number]> = { cushion_round: [24, 14], bed: [28, 16], scratcher: [14, 22], cattree: [22, 30], cathouse: [34, 30], tent: [32, 32], tent2: [32, 32], hangball: [18, 29], hangball_ball: [7, 15], fishbowl: [22, 22], fish: [30, 20] };
  if (!sizes[name]) return;
  const { c, x, rect, box, oval, cushion, poly } = brush(...sizes[name]);
  if (name === 'cushion_round' || name === 'bed') {
    const w = c.width; cushion(0, 3, w, c.height - 3);
    if (name === 'bed') { oval(5, 5, 18, 8, shade); cushion(6, 6, 16, 6, cream); }
  } else if (name === 'scratcher' || name === 'cattree') {
    const tree = name === 'cattree', mid = tree ? 8 : 3;
    cushion(0, c.height - 6, c.width, 6, wood);
    box(mid, 4, 8, c.height - 7, '#E1BF92');
    rect(mid + 5, 6, 2, c.height - 11, shade);
    for (let y = 7; y < c.height - 5; y += 3) { rect(mid + 1, y, 4, 1, '#C59F75'); rect(mid + 5, y - 1, 2, 1, '#8F694D'); }
    cushion(tree ? 0 : 2, 0, tree ? 22 : 10, 7, tree ? cream : wood);
  } else if (name === 'cathouse') {
    poly([[2, 13], [24, 13], [32, 8], [32, 25], [24, 30], [2, 30]], ink);
    rect(3, 13, 20, 16, '#E6BE91');
    poly([[24, 13], [31, 9], [31, 24], [24, 28]], '#BC8967');
    poly([[1, 14], [11, 3], [22, 0], [34, 10], [25, 16]], ink);
    poly([[3, 13], [11, 5], [22, 2], [32, 10], [24, 14]], '#BD5651');
    poly([[3, 13], [11, 4], [23, 14]], '#EE9481');
    rect(3, 15, 21, 1, '#9D5148');
    box(9, 19, 10, 11, ink); x.clearRect(10, 21, 8, 9);
    rect(4, 17, 4, 1, cream); rect(25, 17, 5, 1, '#A47556');
  } else if (name === 'tent' || name === 'tent2') {
    const sage = name === 'tent2', cloth = sage ? '#CED8B9' : '#F4D7C2';
    poly([[1, 30], [14, 4], [20, 2], [32, 25], [23, 32]], ink);
    poly([[15, 5], [20, 4], [30, 25], [23, 29]], sage ? '#95A284' : '#CCA58F');
    poly([[3, 29], [14, 6], [22, 30]], cloth);
    poly([[8, 29], [14, 14], [19, 30]], ink);
    poly([[10, 28], [14, 18], [17, 29]], '#795B49');
    poly([[3, 29], [14, 7], [11, 21], [8, 29]], sage ? '#E4E9CF' : '#FFE8D5');
    poly([[15, 12], [19, 29], [22, 30]], sage ? '#B0BD9D' : '#E0B79F');
    cushion(9, 27, 10, 4, sage ? cream : pink);
    poly([[23, 16], [26, 18], [27, 23], [23, 22]], ink);
    poly([[24, 18], [25, 19], [26, 22], [24, 21]], '#F8E6BF');
    rect(12, 0, 2, 6, wood); rect(17, 0, 2, 5, shade);
    rect(7, 23, 3, 1, wood); rect(17, 23, 3, 1, wood);
    if (!sage) for (const [a, b] of [[10, 15], [20, 26], [5, 26]]) { rect(a, b, 3, 1, pink); rect(a + 1, b - 1, 1, 3, pink); }
  } else if (name === 'hangball') {
    box(3, 1, 5, 25, wood); box(3, 1, 14, 4, wood); cushion(0, 24, 15, 5, wood);
  } else if (name === 'hangball_ball') {
    rect(3, 0, 1, 9, ink); cushion(0, 8, 7, 7); rect(2, 10, 2, 1, cream);
  } else if (name === 'fishbowl') {
    cushion(0, 3, 22, 19, '#C5E7ED'); cushion(3, 1, 16, 5, '#E2F4F3'); oval(5, 2, 12, 2, '#8AB6BD');
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
  const { c, rect, box, cushion, poly } = brush(22, 24);
  const accent = [pink, mint, '#C6CDE3', '#E9CD8B'][tier];
  const tray = (y: number, mat = cream) => {
    poly([[1, y + 2], [5, y - 1], [21, y - 1], [18, y + 5], [1, y + 5]], ink);
    poly([[3, y + 2], [6, y], [20, y], [17, y + 3], [3, y + 3]], mat);
    rect(2, y + 3, 16, 1, '#9BAEA9');
    for (let a = 6; a < 18; a += 4) { rect(a, y, 2, 1, pink); rect(a - 2, y + 2, 2, 1, pink); }
  };
  if (name === 'mixer') {
    if (tier === 0 || tier === 2) {
      box(17, 4, 4, 18, accent); box(5, 3, 16, 5, accent); rect(7, 5, 4, 1, cream);
      rect(9, 8, 1, 7, ink); rect(7, 11, 1, 4, '#9AAEAF'); rect(12, 11, 1, 4, '#9AAEAF');
      cushion(2, 14, 15, 7, '#CADAD9'); cushion(3, 14, 13, 3, cream); rect(4, 15, 10, 1, '#A2917D'); box(1, 21, 21, 3, accent);
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
    const top = tier > 1 ? 3 : 9;
    poly([[0, top + 3], [4, top], [22, top], [22, 20], [18, 24], [0, 24]], ink);
    rect(1, top + 4, 17, 19 - top, accent);
    poly([[2, top + 2], [5, top + 1], [20, top + 1], [17, top + 3], [1, top + 3]], cream);
    poly([[19, top + 4], [21, top + 2], [21, 20], [19, 22]], '#938D85');
    for (let y = top + 6; y < 20; y += 3) rect(20, y, 1, 1, ink);
    const door = (y: number, h: number) => { box(2, y, 12, h, ink); rect(3, y + 1, 10, h - 2, '#E8A768'); rect(4, y + 1, 2, h - 3, '#FFE0A9'); rect(4, y + h - 3, 8, 1, shade); rect(4, y + 1, 8, 1, cream); };
    if (tier === 3) { door(8, 6); door(16, 6); tray(1); } else door(tier === 2 ? 9 : 14, tier === 2 ? 12 : 8);
    box(15, 14, 3, 3, cream); rect(16, 19, 1, 2, ink); rect(2, 23, 3, 1, ink); rect(15, 23, 3, 1, ink);
    if (tier === 1) rect(3, 20, 10, 1, '#BA9F84');
  } else {
    if (tier === 3) {
      poly([[1, 3], [5, 0], [22, 0], [22, 20], [18, 24], [1, 24]], ink);
      rect(2, 4, 16, 19, accent); poly([[3, 2], [6, 1], [20, 1], [17, 3]], cream);
      poly([[19, 4], [21, 2], [21, 20], [19, 22]], '#B29565');
      box(3, 6, 13, 15, '#C5E7ED');
      for (let y = 8; y < 20; y += 4) { rect(4, y + 2, 10, 1, ink); for (let a = 5; a < 14; a += 4) rect(a, y, 2, 2, pink); }
      rect(16, 11, 1, 5, ink); rect(4, 7, 1, 12, cream);
    } else {
      box(1, 17, 20, 4, wood); box(2, 21, 3, 3, wood); box(17, 21, 3, 3, wood);
      if (tier === 0 || tier === 2) { box(2, 8, 18, 10, tier === 2 ? cream : '#E3BD91'); rect(3, 9, 16, 2, accent); for (let a = 5; a < 19; a += 5) { rect(a, 12, 3, 4, pink); if (tier === 2) rect(a - 1, 11, 1, 6, wood); } }
      else { box(3, 12, 7, 5, cream); rect(12, 4, 3, 9, wood); box(10, 10, 7, 5, '#885C4A'); rect(12, 15, 2, 2, '#885C4A'); }
    }
  }
  return c;
}

export function objectPat(variant: string): HTMLCanvasElement {
  const { c, rect, box, oval, tint } = brush(24, 24);
  // Five separate round pads. No paw silhouette, fingers, nails or wrist.
  const pad = (a: number, b: number, size: number, color: string) => {
    oval(a, b, size, size, ink); oval(a + 1, b + 1, size - 2, size - 2, tint(color, -24));
    oval(a + 1, b + 1, size - 3, size - 3, color);
    if (size >= 5) oval(a + 2, b + 1, Math.max(1, size - 5), 2, tint(color, 30));
  };
  const color = variant === 'click2' ? '#E99AAE' : pink;
  pad(5, 10, 14, color);
  for (const [a, b] of [[0, 6], [6, 0], [13, 0], [18, 6]]) pad(a, b, 6, color);
  if (variant === 'click3') { rect(2, 21, 3, 1, mint); rect(1, 19, 2, 1, mint); }
  if (variant === 'click4' || variant === 'pct1') { for (let y = 9; y < 18; y += 4) { rect(0, y, 3, 1, wood); rect(21, y, 3, 1, wood); } }
  if (variant === 'click5') { rect(0, 5, 7, 1, wood); rect(0, 9, 4, 1, wood); rect(0, 13, 3, 1, wood); }
  if (variant === 'pct2') { box(16, 16, 8, 8, mint); rect(19, 17, 2, 6, cream); rect(17, 19, 6, 2, cream); }
  if (variant === 'pct3') { rect(17, 1, 2, 2, '#DF8195'); rect(21, 1, 2, 2, '#DF8195'); rect(17, 3, 6, 2, '#DF8195'); rect(18, 5, 4, 1, '#DF8195'); rect(19, 6, 2, 1, '#DF8195'); }
  if (variant === 'click2') { rect(20, 6, 3, 1, '#DDBB69'); rect(21, 5, 1, 3, '#DDBB69'); }
  return c;
}
