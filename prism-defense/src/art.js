import { TOWERS, CELL, COLS, ROWS, position } from './engine.mjs';
import { VIEW, project, cellCenter, groundRadius } from './projection.mjs';

const images = {};
const sources = { garden: 'garden', towers: 'towers-pixel-v2', towerEdits: 'towers-mixed-v4', cannon: 'towers-original-trim-l2-r1', enemies: 'enemies-original-local-v10' };
for (const [key, file] of Object.entries(sources)) {
  const im = new Image();
  im.src = import.meta.env.BASE_URL + 'art/' + file + '.png';
  images[key] = im;
}
const ready = im => im.complete && im.naturalWidth > 0;
export const artReady = () => Object.values(images).every(ready);
const indexes = { pulse: 0, cannon: 1, frost: 2, beam: 3, chain: 4, bloom: 5, normal: 0, fast: 1, armor: 2, swarm: 3, boss: 4 };

function object(c, key, index, x, y, size, drop = .09) {
  if (key === 'towers' && index === 1) key = 'cannon';
  else if (key === 'towers' && index === 4) key = 'towerEdits';
  const im = images[key];
  if (!ready(im)) return;
  const cell = im.naturalWidth / 3;
  // Anchor by the sprite's own footprint: its horizontal centre on the cell centre and its base
  // straddling it (bottom edge a little below), so bases sit on the tile instead of above it.
  const bb = footprint(im, key, index, cell);
  c.drawImage(im, index % 3 * cell, Math.floor(index / 3) * cell, cell, cell,
    Math.round(x - bb.cx * size), Math.round(y + size * drop - bb.bottom * size), size, size);
}
// how far below the tile centre each tower's footprint bottom sits (fraction of sprite size); beam has feet under its ring
const TOWER_DROP = { beam: .11 };
const footprints = new Map();
function footprint(im, key, index, cell) {
  const id = key + ':' + index;
  if (footprints.has(id)) return footprints.get(id);
  let out = { cx: .5, bottom: .9 };
  try {
    const cv = document.createElement('canvas'); cv.width = cv.height = cell;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(im, index % 3 * cell, Math.floor(index / 3) * cell, cell, cell, 0, 0, cell, cell);
    const d = g.getImageData(0, 0, cell, cell).data;
    let left = cell, right = -1, bottom = -1;
    for (let yy = 0; yy < cell; yy++) for (let xx = 0; xx < cell; xx++) {
      if (d[(yy * cell + xx) * 4 + 3] > 40) { if (xx < left) left = xx; if (xx > right) right = xx; bottom = yy; }
    }
    if (right >= 0) out = { cx: (left + right + 1) / 2 / cell, bottom: (bottom + 1) / cell };
  } catch (e) { /* tainted or unavailable: keep the default anchor */ }
  footprints.set(id, out);
  return out;
}
function fill(c, x, y, w, h, color) {
  c.fillStyle = color; c.fillRect(Math.round(x), Math.round(y), w, h);
}
function polygon(c, points, color) {
  c.beginPath();
  points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y));
  c.closePath();
  if (color) { c.fillStyle = color; c.fill(); }
}
function corners(x, y) {
  return [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]].map(([a, b]) => project(a * CELL, b * CELL));
}
function tile(c, x, y, color) { polygon(c, corners(x, y), color); }
function groundEllipse(c, x, y, radius) {
  const p = project(x, y), r = groundRadius(radius);
  c.beginPath(); c.ellipse(p.x, p.y, r.x, r.y, 0, 0, Math.PI * 2);
}
function hash(x, y) { return ((x * 374761393 ^ y * 668265263) >>> 0) % 997; }

const terrainCache = new Map();
function terrain(game) {
  const key = game.map.id + ':' + ready(images.garden);
  if (terrainCache.has(key)) return terrainCache.get(key);
  const cv = document.createElement('canvas');
  cv.width = VIEW.width; cv.height = VIEW.height;
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
  const south = project(COLS * CELL, ROWS * CELL), east = project(COLS * CELL, 0), west = project(0, ROWS * CELL);
  const lowered = p => ({ x: p.x, y: p.y + VIEW.depth });

  // Front faces expose soil beneath a continuous, level playing surface.
  polygon(c, [project(0, 0), east, south, west].map(p => ({ x: p.x + 7, y: p.y + VIEW.depth + 4 })), '#69775b18');
  polygon(c, [west, south, lowered(south), lowered(west)], '#908268');
  polygon(c, [east, south, lowered(south), lowered(east)], '#77755d');
  for (const [length, point, shade] of [
    [COLS, i => project(i * CELL, ROWS * CELL), '#a09275'],
    [ROWS, i => project(COLS * CELL, i * CELL), '#858067'],
  ]) {
    for (let i = 0; i < length; i++) {
      const a = point(i), b = point(i + 1);
      polygon(c, [a, b, { x: b.x, y: b.y + 3 }, { x: a.x, y: a.y + 3 }], '#82906b');
      if (i % 3 !== 1) {
        const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
        fill(c, x - 2, y + 7, 4, 2, shade);
        fill(c, x + 5, y + 12, 2, 1, '#c1ad87');
      }
    }
  }

  const grass = ['#9daa83', '#a2ad85', '#a6af87', '#99a57e'];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) tile(c, x, y, grass[hash(x, y) % grass.length]);
  // Texture comes from the existing meadow, preserving its painted palette.
  if (ready(images.garden)) {
    c.save();
    c.transform(VIEW.halfWidth / CELL, VIEW.halfHeight / CELL, -VIEW.halfWidth / CELL, VIEW.halfHeight / CELL, VIEW.originX, VIEW.originY);
    c.globalAlpha = .55;
    c.drawImage(images.garden, 350, 160, 850, 700, 0, 0, COLS * CELL, ROWS * CELL);
    c.restore();
  }
  c.lineWidth = .6; c.strokeStyle = '#60735432';
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    tile(c, x, y); c.stroke();
    if (!game.road.has(x + ',' + y) && hash(x + 19, y) % 5 === 0) {
      const p = cellCenter(x, y);
      fill(c, p.x - 2, p.y, 2, 1, '#d6d7ae');
      fill(c, p.x + 3, p.y + 3, 1, 2, '#849772');
    }
  }
  const dirt = ['#c9b698', '#cfbd9f', '#c6b294'];
  for (const [x, y] of game.path) tile(c, x, y, dirt[hash(x, y) % dirt.length]);
  // Adjacent road cells merge, leaving only grass-facing edges.
  c.lineWidth = 1; c.strokeStyle = '#ae9e80';
  for (const [x, y] of game.path) {
    const ps = corners(x, y), neighbors = [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]];
    neighbors.forEach(([nx, ny], i) => {
      if (game.road.has(nx + ',' + ny)) return;
      c.beginPath(); c.moveTo(ps[i].x, ps[i].y); c.lineTo(ps[(i + 1) % 4].x, ps[(i + 1) % 4].y); c.stroke();
    });
    const p = project((x + .3) * CELL, (y + .4) * CELL);
    fill(c, p.x, p.y, 2, 1, '#e4d3b4'); fill(c, p.x + 6, p.y + 3, 2, 1, '#b6a285');
  }
  terrainCache.set(key, cv);
  return cv;
}

export function drawScene(c, game, selected, hover, buildType, flashes, particles, time) {
  c.imageSmoothingEnabled = false;
  fill(c, 0, 0, VIEW.width, VIEW.height, '#2b2e33');
  c.drawImage(terrain(game), 0, 0);
  c.save();
  polygon(c, [project(0, 0), project(COLS * CELL, 0), project(COLS * CELL, ROWS * CELL), project(0, ROWS * CELL)]);
  c.clip();
  const rangeT = selected || hover && game.canBuild(hover.x, hover.y) && { type: buildType, x: hover.x, y: hover.y, level: 1 };
  if (rangeT) {
    const s = game.stats(rangeT);
    c.fillStyle = s.color; c.globalAlpha = .12;
    groundEllipse(c, (rangeT.x + .5) * CELL, (rangeT.y + .5) * CELL, s.range); c.fill();
    c.globalAlpha = .65; c.strokeStyle = s.color; c.lineWidth = .8; c.setLineDash([3, 4]); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  }
  const mark = selected || hover;
  if (mark) {
    const valid = selected || game.canBuild(mark.x, mark.y);
    tile(c, mark.x, mark.y, valid ? '#e8e6b75c' : '#bd867151');
    c.strokeStyle = valid ? '#e7ddac' : '#b58472'; c.lineWidth = 1; c.stroke();
  }
  c.restore();

  const end = game.path.at(-1), endPos = cellCenter(...end);
  object(c, 'enemies', 5, endPos.x, endPos.y, 26);
  const actors = game.towers.map(t => ({ ...cellCenter(t.x, t.y), t }));
  for (const e of game.enemies) {
    const p = position(game.path, e.progress);
    actors.push({ ...project(p.x, p.y), e });
  }
  if (hover && !selected && game.canBuild(hover.x, hover.y)) actors.push({ ...cellCenter(hover.x, hover.y), ghost: true });
  actors.sort((a, b) => a.y - b.y || a.x - b.x);
  for (const a of actors) {
    if (a.ghost) {
      c.save(); c.globalAlpha = .5; object(c, 'towers', indexes[buildType], a.x, a.y, 35, TOWER_DROP[buildType] ?? .17); c.restore();
    } else if (a.t) {
      const t = a.t;
      shadow(c, a.x, a.y, 35); gemLight(c, a.x, a.y, TOWERS[t.type].color);
      object(c, 'towers', indexes[t.type], a.x, a.y, 35, TOWER_DROP[t.type] ?? .17); gemSpark(c, a.x, a.y, t, time);
      if (selected === t) polygon(c, [{ x: a.x - 3, y: a.y - 35 }, { x: a.x + 3, y: a.y - 35 }, { x: a.x, y: a.y - 31 }], '#72866a');
      for (let i = 0; i < t.level; i++) fill(c, a.x - 5 + i * 3, a.y + 4, 2, 1, '#a28b5d');
    } else {
      const e = a.e, size = e.kind === 'boss' ? 39 : e.kind === 'swarm' ? 19 : 26;
      shadow(c, a.x, a.y, size);
      c.save(); c.translate(a.x, a.y + Math.round(Math.sin(time * 8 + e.id)));
      const breath = Math.sin(game.time * 4 + e.id) * (e.kind === 'boss' ? .025 : .045);
      c.scale(1 + breath, 1 - breath); object(c, 'enemies', indexes[e.kind], 0, 0, size); c.restore();
      if (e.slowUntil > game.time) {
        fill(c, a.x - 6, a.y + 1, 2, 2, '#87bbbf'); fill(c, a.x + 4, a.y, 2, 2, '#87bbbf');
      }
      if (e.hp < e.maxHp) {
        fill(c, a.x - 8, a.y - size * .83, 16, 2, '#3a3d44');
        fill(c, a.x - 8, a.y - size * .83, 16 * Math.max(0, e.hp / e.maxHp), 2, e.kind === 'boss' ? '#9690c5' : '#6b9f9d');
      }
    }
  }
  for (const f of flashes) {
    c.globalAlpha = Math.max(0, 1 - f.age / f.life); c.strokeStyle = f.color; c.lineWidth = f.kind === 'blast' ? 2 : 1;
    if (f.kind === 'shot') {
      const a = project(f.x, f.y), b = project(f.tx, f.ty);
      c.beginPath(); c.moveTo(Math.round(a.x), Math.round(a.y - 19)); c.lineTo(Math.round(b.x), Math.round(b.y - 6)); c.stroke();
      fill(c, b.x - 1, b.y - 7, 3, 3, '#fff0ce');
    } else {
      groundEllipse(c, f.kind === 'blast' ? f.tx : f.x, f.kind === 'blast' ? f.ty : f.y, f.radius * f.age / f.life); c.stroke();
    }
  }
  c.globalAlpha = 1;
  for (const p of particles) {
    const q = project(p.x, p.y);
    c.globalAlpha = Math.max(0, 1 - p.age / p.life); fill(c, q.x, q.y + p.z, p.size, p.size, p.color);
  }
  c.globalAlpha = 1;
}

function shadow(c, x, y, size) {
  c.fillStyle = '#455b4530'; c.beginPath(); c.ellipse(x, y + 1, size * .25, size * .08, 0, 0, Math.PI * 2); c.fill();
}
function gemLight(c, x, y, color) {
  c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = color;
  for (const [r, alpha] of [[18, .06], [11, .08]]) {
    c.globalAlpha = alpha;
    for (let dy = -6; dy <= 6; dy += 2) {
      const half = Math.floor(Math.sqrt(Math.max(0, 1 - dy * dy / 49)) * r / 2) * 2;
      c.fillRect(Math.round(x - half), Math.round(y + dy), half * 2, 2);
    }
  }
  c.restore();
}
function gemSpark(c, x, y, t, time) {
  const firing = t.cooldown > Math.max(0, TOWERS[t.type].rate - .14);
  if (!firing && Math.sin(time * 2 + t.id * .7) <= .8) return;
  const dx = t.type === 'chain' ? 5 : 0, dy = t.type === 'frost' ? -24 : t.type === 'bloom' ? -22 : -30;
  c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = firing ? .95 : .65;
  fill(c, x + dx - 1, y + dy - 2, 2, 5, '#fff2cf'); fill(c, x + dx - 3, y + dy, 6, 1, '#fff2cf'); c.restore();
}
