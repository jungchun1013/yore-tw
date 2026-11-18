// DOM menus and in-run overlays. main.ts owns the state; these functions only build markup.
import { clock, getLang, patchText, t, tl } from '../core/i18n';
import { type Save, clearedCount } from '../core/save';
import { CODEX, ENEMY } from '../data/enemies';
import { HEROES, META, PASSIVE, metaCost } from '../data/passives';
import { STAGES } from '../data/stages';
import { WEAPON, WEAPONS } from '../data/weapons';
import type { Choice, HeroId, PassiveId, WeaponId } from '../game/types';
import type { Run } from '../game/world';
import { urlOf } from '../render/kit';
import { spr } from '../render/sprites';

export interface Actions {
  toTitle(): void; toStages(): void; toShrine(): void; toCodex(): void;
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

export function showTitle(save: Save, a: Actions): void {
  show('title',
    h('div', 'logo', icon('chochin', 'logo-ic'), h('h1', '', t('title')), icon('chochin', 'logo-ic flip')),
    h('p', 'tagline', t('tagline')),
    h('div', 'menu',
      btn(t('start'), 'primary big', a.toStages, 'start'),
      btn(t('shrine'), 'big', a.toShrine, 'shrine'),
      btn(t('codex'), 'big', a.toCodex, 'codex'),
    ),
    h('div', 'purse', icon('i_coin', 'ic sm'), h('span', '', String(save.coins))),
    settingsRow(save, a, true),
  );
}

export function showStages(save: Save, a: Actions, picked: number): void {
  const cleared = clearedCount(save);
  const stageOpen = (i: number): boolean => i === 0 || !!save.cleared[i - 1];
  let sel = stageOpen(picked) ? picked : 0;
  let hero: HeroId = HEROES.some((x) => x.id === save.hero && cleared >= x.unlockStage) ? save.hero : 'miko';

  const cards = STAGES.map((s, i) => {
    const open = stageOpen(i);
    const boss = icon(s.boss, `boss-ic${save.bossDown[i] ? '' : ' shade'}`);
    const best = save.best[i];
    const card = h('button', `stage${open ? '' : ' locked'}`,
      h('div', 'stage-no', NUM[getLang()][i]),
      boss,
      h('div', 'stage-name', tl(s.name)),
      h('div', 'stage-blurb', open ? tl(s.blurb) : t('lockStage')),
      h('div', 'tags',
        save.cleared[i] && h('span', 'tag ok', t('cleared')),
        save.bossDown[i] && h('span', 'tag gold', t('bossDown')),
        best && !save.cleared[i] && h('span', 'tag', t('best', { t: clock(best.time) })),
        !open && h('span', 'tag', t('locked')),
      ),
    ) as HTMLButtonElement;
    card.type = 'button'; card.dataset.id = `stage-${i}`;
    card.disabled = !open;
    card.addEventListener('click', () => { sel = i; mark(); });
    return card;
  });
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
    card.addEventListener('click', () => { hero = x.id; mark(); });
    return card;
  });
  function mark(): void {
    cards.forEach((c, i) => c.classList.toggle('on', i === sel));
    heroes.forEach((c, i) => c.classList.toggle('on', HEROES[i].id === hero));
  }
  mark();
  show('stages',
    h('div', 'head', btn(t('back'), 'ghost', a.toTitle, 'back'), h('h2', '', t('chapter')), btn(t('go'), 'primary', () => a.startRun(sel, hero), 'go')),
    h('h3', '', t('pickStage')),
    h('div', 'stage-grid', ...cards),
    h('h3', '', t('pickHero')),
    h('div', 'hero-row', ...heroes),
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
