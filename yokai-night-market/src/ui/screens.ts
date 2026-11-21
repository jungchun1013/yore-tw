// DOM menus and in-run overlays. main.ts owns the state; these functions only build markup.
import { clock, getLang, patchText, t, tl } from '../core/i18n';
import { type Save, clearedCount } from '../core/save';
import { CODEX, ENEMY } from '../data/enemies';
import { HEROES, META, PASSIVE, metaCost } from '../data/passives';
import { STAGES } from '../data/stages';
import { FOODS_FOR_SALE } from '../data/foods';
import { hasArt } from '../render/paperAtlas';
import { WEAPON, WEAPONS } from '../data/weapons';
import type { Choice, HeroId, PassiveId, WeaponId } from '../game/types';
import type { Run } from '../game/world';
import { urlOf } from '../render/kit';
import { spr } from '../render/sprites';

export interface Actions {
  toTitle(): void; toStreet(): void; toSettings(): void; toFurniture(): void; toStages(): void; toShrine(): void; toStall(): void; toCodex(): void;
  buyFood(id: string): void;
  startRun(stage: number, hero: HeroId): void;
  buyMeta(id: string): void;
  pick(index: number): void; reroll(): void; closeChest(): void;
  resume(): void; quit(): void;
  toggleSound(): void; toggleMusic(): void; toggleLang(): void; resetSave(): void;
}

type Child = Node | string | null | undefined | false;
export function h(tag: string, cls?: string, ...kids: Child[]): HTMLElement {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  for (const k of kids) if (k) el.append(k);
  return el;
}
function btn(label: string, cls: string, on: () => void, id?: string): HTMLButtonElement {
  const b = h('button', `btn ${cls}`, label) as HTMLButtonElement;
  b.type = 'button';
  if (id) b.dataset.id = id;
  b.addEventListener('click', on);
  return b;
}
export function icon(key: string, cls = 'ic'): HTMLImageElement {
  const img = document.createElement('img');
  img.src = urlOf(spr(key)); img.className = cls; img.alt = ''; img.draggable = false;
  return img;
}
const NUM = { zh: ['一', '二', '三', '四', '五', '六'], en: ['1', '2', '3', '4', '5', '6'] };

let root: HTMLElement;
export function initScreens(el: HTMLElement): void { root = el; }
export function clearOverlay(): void { root.replaceChildren(); root.className = ''; }
function show(cls: string, ...kids: Child[]): void {
  root.className = `open ${cls}`;
  root.replaceChildren(h('div', 'sheet', ...kids));
}

function settingsRow(save: Save, a: Actions, withReset: boolean): HTMLElement {
  return h('div', 'settings',
    btn(`${t('sound')} ${save.sound ? t('on') : t('off')}`, 'ghost', a.toggleSound, 'sound'),
    btn(`${t('music')} ${save.music ? t('on') : t('off')}`, 'ghost', a.toggleMusic, 'music'),
    btn(getLang() === 'zh' ? 'English' : '中文', 'ghost', a.toggleLang, 'lang'),
    withReset && btn(t('reset'), 'ghost', () => { if (window.confirm(t('resetAsk'))) a.resetSave(); }, 'reset'),
  );
}

// Entry page: the street behind, the title, tap anywhere.
export function showSplash(a: Actions): void {
  show('title splash',
    h('div', 'logo', h('h1', '', t('title'))),
    h('p', 'tagline tap', t('tapStart')),
  );
  root.dataset.id = 'tap';
  root.addEventListener('click', function once() { root.removeEventListener('click', once); delete root.dataset.id; a.toStreet(); });
}

export function showSettings(save: Save, a: Actions): void {
  show('pause',
    h('div', 'head', btn(t('back'), 'ghost', a.toStreet, 'back'), h('h2', '', t('settings')), h('span', 'spacer')),
    settingsRow(save, a, true),
  );
}

const ICONS: Record<string, string> = {
  rounds: '<path d="M15 3a8 8 0 1 0 6 13.2A7 7 0 0 1 15 3z"/><path d="M5 4v2M4 5h2M8 9v2M7 10h2"/>',
  furniture: '<path d="M6 4v9h9M6 13v7M15 13v7M6 9h9V4"/><path d="M19 20v-9h-3"/>',
  codex: '<path d="M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z"/>',
  shrine: '<path d="M4 9l8-5 8 5v10H4zM9 3l3-1 3 1M8 12h8M8 15h5"/>',
  settings: '<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>',
};
function iconBtn(id: string, icon: string, label: string, on: () => void, cls = ''): HTMLElement {
  const b = h('button', `street-btn ${cls}`) as HTMLButtonElement;
  b.type = 'button'; b.dataset.id = id;
  b.innerHTML = `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[icon]}</svg>`;
  b.append(h('span', '', label));
  b.addEventListener('click', on);
  return b;
}

// The icon column at the lower right of the street.
export function buildStreetBar(el: HTMLElement, save: Save, a: Actions): void {
  el.replaceChildren(
    h('div', 'street-purse', icon('i_coin', 'ic sm'), h('span', '', String(save.coins))),
    h('div', 'street-col',
      iconBtn('settings', 'settings', t('settings'), a.toSettings),
      iconBtn('shrine', 'shrine', t('shrine'), a.toShrine),
      iconBtn('codex', 'codex', t('codexShort'), a.toCodex),
      iconBtn('furniture', 'furniture', t('furniture'), a.toFurniture),
      iconBtn('start', 'rounds', t('rounds'), a.toStages, 'main'),
    ),
  );
}

// The town map. Each stop shows one building, all the same height, spaced for a phone screen;
// other buildings stand smaller in a back row between the stops. Keys without art are skipped.
const STOP_GAP = 168, STOP0 = 120, BUILD_H = 104, BACK_H = 74;
const STOPS = ['torii', 'hayashi', 'woodHouse', 'brickHouse', 'confucius', 'shennong'];
const BACK_ROW: [string, number][] = [
  ['machiya', 0.5], ['noodleStall', 1.5], ['literature', 2.5], ['chihkan', 3.6], ['swordLionWall', 4.5], ['censer', 5.45],
];
const stopX = (i: number): number => STOP0 + i * STOP_GAP;
const MAP_W = stopX(5) + 260, MAP_H = 236, ROAD_Y = 200;
const DECOR: [string, number, number][] = [
  ['sakura', 30, ROAD_Y + 8], ['lantern', stopX(1) - 70, ROAD_Y - 30], ['stoneLantern', stopX(2) - 64, ROAD_Y + 6], ['maple', stopX(3) + 70, ROAD_Y + 4],
  ['lantern', stopX(4) - 70, ROAD_Y - 30], ['tileFlower', stopX(5) + 80, ROAD_Y + 8],
];

function sprImg(key: string, height: number, cls: string): HTMLImageElement {
  const s = spr(key);
  const img = icon(key, cls);
  img.style.height = `${height}px`;
  img.style.width = `${(height * s.w) / s.h}px`;
  return img;
}

// Scrolling paper map of the town: pick a place by its buildings, then who goes.
export function showStages(save: Save, a: Actions, picked: number): void {
  const cleared = clearedCount(save);
  const stageOpen = (i: number): boolean => i === 0 || !!save.cleared[i - 1];
  let sel = stageOpen(picked) ? picked : 0;
  let hero: HeroId = HEROES.some((x) => x.id === save.hero && cleared >= x.unlockStage) ? save.hero : 'miko';

  const strip = h('div', 'map-strip');
  strip.style.width = `${MAP_W}px`; strip.style.height = `${MAP_H}px`;
  // paper layers: far hills, near hills, the road, and the sea past Anping
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${MAP_W} ${MAP_H}`); svg.setAttribute('class', 'map-layers');
  const hills = (base: number, amp: number, step: number, seed: number): string => {
    let d = `M0 ${MAP_H} L0 ${base}`;
    for (let x = 0; x <= MAP_W; x += step) d += ` Q${x + step / 2} ${base - amp * (0.6 + 0.4 * Math.sin(x * 0.01 + seed))} ${x + step} ${base}`;
    return d + ` L${MAP_W} ${MAP_H} Z`;
  };
  const road = STOPS.map((_, i) => `${i ? 'L' : 'M'}${stopX(i)} ${ROAD_Y}`).join(' ');
  svg.innerHTML = `
    <path d="${hills(84, 50, 220, 0)}" fill="#dfd0ad"/>
    <path d="${hills(120, 36, 170, 2)}" fill="#c9cf9f"/>
    <path d="M${MAP_W - 200} ${MAP_H} L${MAP_W - 200} 170 Q${MAP_W - 90} 158 ${MAP_W} 164 L${MAP_W} ${MAP_H} Z" fill="#8fb4b8"/>
    <path d="M${MAP_W - 170} 192 q30 -10 60 0 t60 0 t60 0" fill="none" stroke="#e9f1ec" stroke-width="5" stroke-linecap="round"/>
    <rect x="0" y="${ROAD_Y - 16}" width="${MAP_W - 190}" height="${MAP_H - ROAD_Y + 16}" fill="#ead9b6"/>
    <path d="${road}" fill="none" stroke="#c6a77a" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${road}" fill="none" stroke="#f6ead0" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>`;
  strip.append(svg);
  for (const [key, at] of BACK_ROW) {
    if (!hasArt(key)) continue;
    const d = sprImg(key, key === 'censer' ? 34 : key === 'swordLionWall' ? 46 : BACK_H, 'map-decor back');
    d.style.left = `${STOP0 + at * STOP_GAP}px`; d.style.top = `${ROAD_Y - 34}px`;
    strip.append(d);
  }
  for (const [key, x, y] of DECOR) {
    if (!hasArt(key)) continue;
    const d = sprImg(key, key === 'tileFlower' ? 24 : key === 'lantern' ? 40 : key === 'stoneLantern' ? 54 : 96, 'map-decor');
    d.style.left = `${x}px`; d.style.top = `${y}px`;
    strip.append(d);
  }

  const walker = sprImg('miko', 52, 'map-walker');
  const nodes = STAGES.map((st, i) => {
    const open = stageOpen(i);
    const pics = h('div', 'map-pics', sprImg(STOPS[i], BUILD_H, 'map-pic'));
    const node = h('button', `map-node${open ? '' : ' locked'}`,
      pics,
      h('div', 'map-plate', h('span', 'map-no', NUM[getLang()][i]), h('span', '', tl(st.name))),
      h('div', 'map-tags',
        save.cleared[i] && h('span', 'tag ok', t('cleared')),
        save.bossDown[i] && h('span', 'tag gold', t('bossDown')),
        !open && h('span', 'tag', t('locked')),
      ),
    ) as HTMLButtonElement;
    node.type = 'button'; node.dataset.id = `stage-${i}`;
    node.disabled = !open;
    node.style.left = `${stopX(i)}px`; node.style.top = `${ROAD_Y}px`;
    node.addEventListener('click', () => { sel = i; mark(true); });
    strip.append(node);
    return node;
  });
  strip.append(walker);

  const map = h('div', 'scroll-map', strip);
  map.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { map.scrollLeft += e.deltaY; e.preventDefault(); }
  }, { passive: false });
  // drag to scroll with a mouse; touch scrolls natively
  let dragX = -1, startLeft = 0, moved = false;
  map.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') { dragX = e.clientX; startLeft = map.scrollLeft; moved = false; } });
  window.addEventListener('pointermove', (e) => { if (dragX >= 0) { const d = e.clientX - dragX; if (Math.abs(d) > 4) moved = true; map.scrollLeft = startLeft - d; } });
  window.addEventListener('pointerup', () => { dragX = -1; });
  map.addEventListener('click', (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } }, true);

  const info = h('div', 'map-info');
  const heroes = HEROES.map((x) => {
    const open = cleared >= x.unlockStage;
    const card = h('button', `hero${open ? '' : ' locked'}`,
      icon(`hero:${x.id}:0`, `hero-ic${open ? '' : ' shade'}`),
      h('div', 'hero-text',
        h('div', 'hero-name', open ? `${tl(x.name)}` : t('unknown')),
        h('div', 'hero-title', open ? tl(x.title) : ''),
        h('div', 'hero-desc', open ? tl(x.desc) : t('lockHero', { n: x.unlockStage })),
      ),
    ) as HTMLButtonElement;
    card.type = 'button'; card.dataset.id = `hero-${x.id}`;
    card.disabled = !open;
    card.addEventListener('click', () => { hero = x.id; mark(false); });
    return card;
  });
  function mark(scroll: boolean): void {
    nodes.forEach((c, i) => c.classList.toggle('on', i === sel));
    heroes.forEach((c, i) => c.classList.toggle('on', HEROES[i].id === hero));
    walker.style.left = `${stopX(sel) - 58}px`; walker.style.top = `${ROAD_Y + 4}px`;
    const st = STAGES[sel], best = save.best[sel];
    info.replaceChildren(
      h('div', 'map-info-name', `${NUM[getLang()][sel]}　${tl(st.name)}`),
      h('p', 'stage-blurb', tl(st.blurb)),
      h('div', 'tags', best && !save.cleared[sel] && h('span', 'tag', t('best', { t: clock(best.time) }))),
      save.pack.length
        ? h('div', 'map-pack', t('packLine'), ...save.pack.filter(hasArt).map((f) => sprImg(f, 26, 'pack-ic')))
        : h('div', 'map-pack muted', t('packNone')),
    );
    if (scroll) map.scrollTo({ left: stopX(sel) - map.clientWidth / 2, behavior: 'smooth' });
  }
  mark(false);
  show('stages map',
    h('div', 'head', btn(t('back'), 'ghost', a.toTitle, 'back'), h('h2', '', t('chapter')), btn(t('go'), 'primary', () => a.startRun(sel, hero), 'go')),
    map,
    info,
    h('h3', '', t('pickHero')),
    h('div', 'hero-row', ...heroes),
  );
  requestAnimationFrame(() => { map.scrollLeft = stopX(sel) - map.clientWidth / 2; });
}

export function showStall(save: Save, a: Actions): void {
  const cards = FOODS_FOR_SALE.filter((f) => hasArt(f.id)).map((f) => {
    const packed = save.pack.includes(f.id);
    const card = h('button', `ema food${packed ? ' full' : ''}`,
      sprImg(f.id, 46, 'food-ic'),
      h('div', 'ema-text', h('div', 'ema-name', tl(f.name)), h('div', 'ema-desc', tl(f.desc))),
      packed ? h('div', 'price', t('packed')) : h('div', 'price', icon('i_coin', 'ic sm'), h('span', '', String(f.price))),
    ) as HTMLButtonElement;
    card.type = 'button'; card.dataset.id = `food-${f.id}`;
    card.disabled = packed || save.coins < f.price;
    card.addEventListener('click', () => a.buyFood(f.id));
    return card;
  });
  show('shrine',
    h('div', 'head', btn(t('back'), 'ghost', a.toTitle, 'back'), h('h2', '', t('stall')), h('div', 'purse', icon('i_coin', 'ic sm'), h('span', '', String(save.coins)))),
    h('p', 'sub', t('stallSub')),
    h('div', 'ema-grid', ...cards),
  );
}

export function showShrine(save: Save, a: Actions): void {
  const cards = META.map((m) => {
    const lv = save.meta[m.id] ?? 0, full = lv >= m.max, cost = metaCost(m, lv);
    const pips = h('div', 'pips');
    for (let i = 0; i < m.max; i++) pips.append(h('i', i < lv ? 'on' : ''));
    const card = h('button', `ema${full ? ' full' : ''}`,
      icon('i_ema', 'ic'),
      h('div', 'ema-text', h('div', 'ema-name', tl(m.name)), h('div', 'ema-desc', tl(m.desc)), pips),
      full ? h('div', 'price', t('maxed')) : h('div', 'price', icon('i_coin', 'ic sm'), h('span', '', String(cost))),
    ) as HTMLButtonElement;
    card.type = 'button'; card.dataset.id = `meta-${m.id}`;
    card.disabled = full || save.coins < cost;
    card.addEventListener('click', () => a.buyMeta(m.id));
    return card;
  });
  show('shrine',
    h('div', 'head', btn(t('back'), 'ghost', a.toTitle, 'back'), h('h2', '', t('shrine')), h('div', 'purse', icon('i_coin', 'ic sm'), h('span', '', String(save.coins)))),
    h('p', 'sub', t('shrineSub')),
    h('div', 'ema-grid', ...cards),
  );
}

export function showCodex(save: Save, a: Actions): void {
  const seen = new Set(save.seen);
  const detail = h('div', 'codex-detail');
  const cells = CODEX.map((e) => {
    const known = seen.has(e.id);
    const cell = h('button', `cell${known ? '' : ' unknown'}${e.boss ? ' boss' : ''}`, icon(e.id, `cell-ic${known ? '' : ' shade'}`), h('div', 'cell-name', known ? tl(e.name) : t('unknown'))) as HTMLButtonElement;
    cell.type = 'button';
    cell.disabled = !known;
    cell.addEventListener('click', () => { detail.replaceChildren(icon(e.id, 'detail-ic'), h('div', '', h('div', 'detail-name', tl(e.name)), h('p', 'detail-lore', tl(e.lore)))); cells.forEach((c) => c.classList.toggle('on', c === cell)); });
    return cell;
  });
  show('codex',
    h('div', 'head', btn(t('back'), 'ghost', a.toTitle, 'back'), h('h2', '', t('codex')), h('span', 'count', `${CODEX.filter((e) => seen.has(e.id)).length} / ${CODEX.length}`)),
    h('p', 'sub', t('codexSub')),
    detail,
    h('div', 'codex-grid', ...cells),
  );
}

function choiceCard(run: Run, c: Choice): { ic: string; name: string; tag: string; desc: string; cls: string } {
  if (c.kind === 'weapon') {
    const def = WEAPON[c.id as WeaponId];
    const pair = tl(PASSIVE[def.pair].name);
    return c.level === 1
      ? { ic: `i_${c.id}`, name: tl(def.name), tag: t('isNew'), desc: `${tl(def.desc)} ${t('withItem', { s: pair })}`, cls: 'new' }
      : { ic: `i_${c.id}`, name: tl(def.name), tag: t('lv', { n: c.level }), desc: patchText(def.ups[c.level - 2]), cls: '' };
  }
  if (c.kind === 'passive') {
    const def = PASSIVE[c.id as PassiveId];
    const evo = WEAPONS.find((w) => w.pair === def.id && run.weapons.some((o) => o.id === w.id && !o.evolved));
    return { ic: `i_${c.id}`, name: tl(def.name), tag: c.level === 1 ? t('isNew') : t('lv', { n: c.level }), desc: tl(def.desc) + (evo ? ` (${tl(evo.name)} → ${tl(evo.evoName)})` : ''), cls: c.level === 1 ? 'new' : '' };
  }
  if (c.kind === 'evolve') {
    const def = WEAPON[c.id as WeaponId];
    return { ic: `i_${c.id}`, name: tl(def.evoName), tag: t('evolve'), desc: tl(def.evoDesc), cls: 'evo' };
  }
  if (c.kind === 'coin') return { ic: 'i_coin', name: t('coinName'), tag: '', desc: t('coinChoice'), cls: '' };
  return { ic: 'i_heal', name: t('healName'), tag: '', desc: t('healChoice'), cls: '' };
}

function choiceEl(run: Run, c: Choice, i: number, on?: () => void): HTMLElement {
  const d = choiceCard(run, c);
  const el = h(on ? 'button' : 'div', `choice ${d.cls}`, icon(d.ic, 'choice-ic'), h('div', 'choice-text', h('div', 'choice-name', d.name, d.tag && h('span', 'tag', d.tag)), h('div', 'choice-desc', d.desc)));
  if (on) { (el as HTMLButtonElement).type = 'button'; el.dataset.id = `choice-${i}`; el.addEventListener('click', on); }
  return el;
}

export function showLevelUp(run: Run, a: Actions): void {
  const list = run.choices ?? [];
  show('levelup',
    h('h2', '', `${t('levelUp')}　${t('lv', { n: run.player.level - run.pending + 1 })}`),
    h('div', 'choices', ...list.map((c, i) => choiceEl(run, c, i, () => a.pick(i)))),
    btn(t('reroll', { n: run.rerolls }), `ghost${run.rerolls > 0 ? '' : ' off'}`, a.reroll, 'reroll'),
  );
}

export function showChest(run: Run, a: Actions): void {
  const c = run.chest!;
  show('chest',
    h('div', 'chest-top', icon('chest', 'chest-ic'), h('h2', '', t('chest'))),
    h('div', 'choices', ...c.items.map((it, i) => choiceEl(run, it, i))),
    h('div', 'purse', icon('i_coin', 'ic sm'), h('span', '', `+${c.coins}`)),
    btn(t('take'), 'primary big', a.closeChest, 'take'),
  );
}

function loadout(run: Run): HTMLElement {
  const row = h('div', 'loadout');
  for (const w of run.weapons) row.append(h('div', `slot${w.evolved ? ' evo' : ''}`, icon(`i_${w.id}`, 'ic'), h('span', '', String(w.level))));
  for (const p of run.passives) row.append(h('div', 'slot', icon(`i_${p.id}`, 'ic'), h('span', '', String(p.level))));
  return row;
}

export function showPause(run: Run, save: Save, a: Actions): void {
  show('pause',
    h('h2', '', t('paused')),
    loadout(run),
    h('div', 'menu', btn(t('resume'), 'primary big', a.resume, 'resume'), btn(t('quit'), 'big', a.quit, 'quit')),
    settingsRow(save, a, false),
  );
}

export interface Summary { run: Run; coins: number; newStage: number | null; newHero: HeroId | null }

export function showResult(s: Summary, a: Actions): void {
  const run = s.run, clear = run.over === 'clear';
  const rows = Object.entries(run.dealt).sort((x, y) => (y[1] ?? 0) - (x[1] ?? 0));
  const top = rows.length ? rows[0][1] ?? 1 : 1;
  const stat = (label: string, value: string): HTMLElement => h('div', 'stat', h('div', 'stat-v', value), h('div', 'stat-l', label));
  show(`result ${clear ? 'clear' : 'dead'}`,
    h('h2', '', clear ? t('dawn') : t('taken')),
    h('p', 'sub', clear ? t('dawnSub') : t('takenSub', { t: clock(15 * 60 - run.t) })),
    h('div', 'stats', stat(t('survived'), clock(run.t)), stat(t('level'), String(run.player.level)), stat(t('kills'), String(run.kills)), stat(t('coins'), `+${s.coins}`)),
    s.newStage !== null && h('div', 'unlock', t('unlockedStage', { s: tl(STAGES[s.newStage].name) })),
    s.newHero && h('div', 'unlock', t('unlockedHero', { s: tl(HEROES.find((x) => x.id === s.newHero)!.name) })),
    h('div', 'dmg', ...rows.map(([id, v]) => {
      const w = run.weapons.find((o) => o.id === id), def = WEAPON[id as WeaponId];
      const bar = h('i', '');
      bar.style.width = `${Math.max(2, ((v ?? 0) / top) * 100)}%`;
      return h('div', 'dmg-row', icon(`i_${id}`, 'ic sm'), h('span', 'dmg-name', tl(w?.evolved ? def.evoName : def.name)), h('div', 'dmg-bar', bar), h('span', 'dmg-v', String(Math.round(v ?? 0))));
    })),
    h('div', 'menu', btn(t('again'), 'primary big', () => a.startRun(run.stageIndex, run.hero.id), 'again'), btn(t('toTitle'), 'big', a.toTitle, 'title')),
  );
}

export function bossName(id: string): string { return tl(ENEMY[id].name); }
