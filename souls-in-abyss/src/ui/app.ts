import type { Game, Part } from '../game/engine';
import { PRIMARY, SLOTS, twoHanded, type Item, type L, type Slot } from '../game/types';
import { lang, setLang, t, tr, UI } from '../core/i18n';
import { clock, num, pct } from '../core/fmt';
import { derive, armorDef, armorPrt, weaponRange, xpNeed } from '../game/stats';
import { nameOf, sellPrice } from '../game/loot';
import { RACES, START_AGES, ageGrowth, raceOf } from '../data/races';
import { BAG_SIZE, RARITY, SMITH_BREAK_FROM, SMITH_DROP_FROM, SMITH_MAX, WEIGHTS, smithCost } from '../data/items';
import { MAX_RANK, RANKS, SKILLS, rankCost, type Tab as SkillTab } from '../data/skills';
import { AREAS } from '../data/areas';
import { AREA_CP, difficulty } from '../game/monsters';
import { PETS, BOND_MAX, STAGE_LV, petOf, petXpNeed, stageOf } from '../data/pets';
import { TITLES } from '../data/titles';
import { REBIRTH_AGE, YEAR_SEC, clearSave } from '../game/state';
import { Scene } from './scene';
import * as A from '../game/actions';
import { icon, pixelMarkup } from './icons';
import { heroMarkup } from './hero';
import { curseOf, giftOf, type PactDef } from '../data/pacts';
import { SAN_TIERS, sanTier, willResist } from '../data/sanity';
import { SAN_MAX } from '../game/state';

type View = 'equip' | 'bag' | 'pets' | 'skills' | 'map' | 'smith' | 'titles' | 'settings';
const NAV: [View, keyof typeof UI][] = [
  ['equip', 'navEquip'], ['bag', 'navBag'], ['pets', 'navPets'], ['skills', 'navSkills'], ['map', 'navMap'],
  ['smith', 'navSmith'], ['titles', 'navTitles'], ['settings', 'navSettings'],
];
const STAT: Record<string, L> = {
  str: { zh: '力量', en: 'STR' }, dex: { zh: '靈巧', en: 'DEX' }, int: { zh: '智力', en: 'INT' }, will: { zh: '意志', en: 'WILL' }, luk: { zh: '幸運', en: 'LUCK' },
  hp: { zh: 'HP', en: 'HP' }, mp: { zh: 'MP', en: 'MP' }, atk: { zh: '攻擊', en: 'ATK' }, atkMin: { zh: '最小攻擊', en: 'Min ATK' }, atkMax: { zh: '最大攻擊', en: 'Max ATK' },
  bal: { zh: '平衡', en: 'BAL' }, crit: { zh: '爆擊', en: 'CRT' }, def: { zh: '防禦', en: 'DEF' }, prt: { zh: '保護', en: 'PRT' },
  speed: { zh: '攻速', en: 'Speed' }, magic: { zh: '魔力', en: 'Magic' }, xp: { zh: 'EXP', en: 'EXP' }, gold: { zh: '金幣', en: 'Gold' }, drop: { zh: '掉寶', en: 'Drops' },
  petPower: { zh: '夥伴傷害', en: 'Pal damage' }, sanDrain: { zh: 'SAN 流失', en: 'SAN loss' }, dmgTaken: { zh: '受到傷害', en: 'Damage taken' }, guard: { zh: '減傷', en: 'Guard' }, petHeal: { zh: '夥伴治療', en: 'Pal heal' }, heal: { zh: '擊倒回復', en: 'Kill heal' },
};
const SLOT_NAME: Record<Slot, L> = {
  head: { zh: '頭盔', en: 'Helmet' }, body: { zh: '護甲', en: 'Armor' }, legs: { zh: '褲子', en: 'Leggings' }, feet: { zh: '鞋子', en: 'Boots' },
  ring: { zh: '戒指', en: 'Ring' }, neck: { zh: '項鍊', en: 'Necklace' }, weapon: { zh: '主武器', en: 'Main hand' }, off: { zh: '副武器', en: 'Off hand' },
};
const hearts = (n: number) => Array.from({ length: BOND_MAX }, (_, i) => icon('heart', i < n ? 'gi hrt on' : 'gi hrt')).join('');
const esc = (x: string) => x.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const PCT_KEYS = new Set(['bal', 'crit', 'prt']);
const modText = (m: { key: string; add?: number; mul?: number }) =>
  `${tr(STAT[m.key] || { zh: m.key, en: m.key })} +${m.add !== undefined ? (PCT_KEYS.has(m.key) ? pct(m.add, 1) : m.add) : pct(m.mul!, 1)}`;

export class App {
  private view: View = 'equip';
  private slot: Slot | 'all' = 'all';
  private skillTab: SkillTab = 'combat';
  private mapSel: string | null = null;
  private rbRace: string; private rbAge = 17; private rbPact = -1;
  private lastHtml: Record<string, string> = {};
  private logEl!: HTMLElement;
  private scene: Scene;

  constructor(private g: Game, private root: HTMLElement) {
    this.rbRace = g.s.race;
    this.scene = new Scene(g);
    this.build();
    this.root.addEventListener('click', e => this.onClick(e));
    this.installTips();
    this.root.addEventListener('change', e => this.onChange(e));
    this.root.addEventListener('input', e => this.onChange(e));
    g.on(e => { if (e.t === 'log') this.addLog(e.parts, e.cls); });
  }

  private build(): void {
    // battle bars carry no numbers: the log already reports every hit, and big numbers would squeeze the bars
    const bar = (id: string, cls: string, lbl: string) =>
      `<div class="kv bar"><span class="lbl">${lbl}</span><div class="line"><div id="${id}" class="${cls}"></div></div></div>`;
    this.root.innerHTML = `
      <div class="game">
        <div class="colL">
        <section class="box sheet" id="sheet"></section>
        <section class="box log"><div class="loglist" id="log"></div></section>
        </div>
        <div class="colM">
        <section class="box monster">
          <div class="mhead"><span class="lbl">${t('monster')}</span> <b id="m-diff"></b> <span id="m-name"></span></div>
          <div class="stage"></div>
          <div class="fight">
            <div class="side-hero">
              <div class="kv cp"><span class="lbl">${t('cp')}</span><span id="s-cp" class="v"></span></div>
              ${bar('s-hp', 'red', t('hp'))}${bar('s-mp', 'blue', t('mp'))}
            </div>
            <div class="side-mon">
              <div class="kv cp"><span class="lbl">${t('cp')}</span><span id="m-cp" class="v"></span></div>
              ${bar('m-hp', 'red', t('hp'))}
            </div>
          </div>
        </section>
        <section class="box petbox" id="petbox"></section>
        <section class="box att" id="att"></section>
        </div>
        <section class="box side">
          <nav class="nav">${NAV.map(([k, l]) => `<button class="ico" data-a="view" data-k="${k}" title="${t(l)}" aria-label="${t(l)}"><span>${icon(k)}</span></button>`).join('')}</nav>
          <div class="vtitle" id="vtitle"></div>
          <div class="view" id="view"></div>
        </section>
      </div>`;
    this.root.querySelector('.stage')!.appendChild(this.scene.cv);
    this.logEl = this.root.querySelector('#log')!;
    this.setView(this.view);
  }

  private setView(v: View): void {
    this.view = v;
    this.root.querySelectorAll('.nav .ico').forEach(b => b.classList.toggle('on', (b as HTMLElement).dataset.k === v));
    const label = NAV.find(n => n[0] === v)![1];
    (this.root.querySelector('#vtitle') as HTMLElement).textContent = t(label);
    this.lastHtml.view = '';
    this.render();
  }

  private onClick(e: Event): void {
    if (this.overlay) return; // the rebirth screen binds its own handlers
    const el = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
    // a click anywhere else closes an open pixel dropdown
    this.root.querySelectorAll<HTMLElement>('.ddmenu:not([hidden])').forEach(m => { if (!m.parentElement!.contains(e.target as Node)) m.hidden = true; });
    if (!el || (el as HTMLButtonElement).disabled) return;
    const a = el.dataset.a!, k = el.dataset.k || '', uid = Number(el.dataset.uid);
    const g = this.g;
    switch (a) {
      case 'view': this.setView(k as View); return;
      case 'slot': this.slot = this.slot === k ? 'all' : (k as Slot); break;
      case 'stab': this.skillTab = k as SkillTab; break;
      case 'lang': setLang(k as 'zh' | 'en'); location.reload(); return;
      case 'equip': A.equip(g, uid); break;
      case 'petTap': if (g.petTap()) setTimeout(() => this.root.querySelectorAll('.petspr').forEach(el => { el.classList.remove('hop'); void (el as HTMLElement).offsetWidth; el.classList.add('hop'); }), 0); break;
      case 'unequip': A.unequip(g, k as Slot); break;
      case 'sell': A.sell(g, uid); break;
      case 'sellAll': A.sellAll(g); break;
      case 'smith': A.upgrade(g, uid); break;
      case 'learn': A.learn(g, k); break;
      case 'go': A.goArea(g, k); this.mapSel = null; break;
      case 'mapsel': this.mapSel = k; break;
      case 'pet': A.setPet(g, k || null); break;
      case 'ddToggle': { const m = el.parentElement!.querySelector<HTMLElement>('.ddmenu'); if (m) m.hidden = !m.hidden; return; }
      case 'autoSell': g.s.autoSell = Number(k); break;
      case 'rebirthOpen': if (confirm(t('rebirthConfirm'))) this.rebirthScreen(); return;
      case 'reset': if (confirm(t('resetConfirm'))) { clearSave(); (window as any).__noSave = true; location.reload(); } return;
    }
    this.lastHtml = {};
    this.render();
  }

  private onChange(e: Event): void {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    if (el.dataset.a === 'rbAge') { this.rbAge = Number(el.value); this.lastHtml = {}; this.render(); }
  }

  addLog(parts: Part[] | string, cls = ''): void {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    const d = new Date();
    const ts = document.createElement('span'); ts.className = 'ts';
    ts.textContent = `[${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}]`;
    p.appendChild(ts);
    for (const part of typeof parts === 'string' ? [parts] : parts) {
      if (typeof part === 'string') { p.appendChild(document.createTextNode(part)); continue; }
      const s = document.createElement('span');
      s.textContent = part.text + (part.cls?.includes('crit') ? '!' : '');
      if (part.cls) s.className = part.cls;
      if (part.color) s.style.color = part.color;
      p.appendChild(s);
    }
    const stick = this.logEl.scrollTop + this.logEl.clientHeight >= this.logEl.scrollHeight - 8;
    this.logEl.appendChild(p);
    while (this.logEl.childElementCount > 120) this.logEl.firstElementChild!.remove();
    if (stick) this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  /** Every frame: canvas and bars. */
  frame(dt: number): void {
    if (this.overlay) return;
    this.scene.draw(dt);
    const g = this.g, m = g.mon;
    const dif = difficulty(m.cp, g.d.cp);
    this.text('m-diff', tr(dif.name)); (document.getElementById('m-diff') as HTMLElement).style.color = dif.color;
    this.text('m-name', `${tr(m.def.name)} Lv${m.lvl}`); (document.getElementById('m-name') as HTMLElement).style.color = g.monColor;
    this.text('m-cp', num(m.cp)); this.text('s-cp', num(g.d.cp));
    this.width('m-hp', m.hp / m.maxHp);
    this.width('s-hp', g.hp / g.d.hp); this.width('s-mp', g.mp / g.d.mp);
    if (g.petMaxHp > 0) { this.width('p-hp', g.petHp / g.petMaxHp); this.width('p-mp', g.petMp / g.petMaxMp); }
    this.syncSheetBars();
  }
  /** EXP and SAN live in the sheet, which is rebuilt when its text changes; fill them right away so they never flash empty. */
  private syncSheetBars(): void {
    const s = this.g.s, tier = SAN_TIERS[sanTier(s.san)];
    this.width('s-xp', s.xp / xpNeed(s.lvl));
    this.width('s-san', s.san / SAN_MAX);
    this.text('s-san-v', tr(tier.name));
    const el = document.getElementById('s-san-v'); if (el) el.style.color = tier.color;
  }
  private text(id: string, v: string) { const el = document.getElementById(id); if (el && el.textContent !== v) el.textContent = v; }
  private width(id: string, f: number) { const el = document.getElementById(id); if (el) el.style.width = (Math.max(0, Math.min(1, f)) * 100).toFixed(1) + '%'; }

  /** A few times a second: panels whose HTML changed get replaced. */
  render(): void {
    if (this.overlay) return;
    this.put('sheet', this.sheetHtml());
    this.put('petbox', this.petBoxHtml());
    this.put('att', this.attHtml());
    // an open dropdown must not be replaced under the player's finger: hold the view until it closes
    const busy = !!document.querySelector('#view .ddmenu:not([hidden])');
    if (!busy) this.put('view', this.viewHtml());
    if (this.view === 'map') this.text('loot-sec', clock(this.g.loot.sec));
    this.markLatin();
  }
  /**
   * In Chinese, a label that starts with a Latin letter or "$" sits a little left of the
   * Chinese labels above and below it (Cubic 11 gives CJK glyphs a wider left bearing).
   * Nudge those labels so every label column lines up.
   */
  private markLatin(): void {
    if (lang !== 'zh') return;
    this.root.querySelectorAll<HTMLElement>('.lbl, .loot .kv > span:first-child').forEach(el => {
      el.classList.toggle('lat', /^[A-Za-z$]/.test((el.textContent || '').trim()));
    });
  }
  private put(id: string, html: string): void {
    if (this.lastHtml[id] === html) return;
    this.lastHtml[id] = html;
    const el = document.getElementById(id)!;
    const st = el.scrollTop;
    el.innerHTML = html;
    el.scrollTop = st;
    if (id === 'sheet') this.syncSheetBars();
  }

  // ---------- fixed panels ----------

  private sheetHtml(): string {
    const { s, d } = this.g, r = raceOf(s.race);
    const base = (k: string) => r.base[k as 'str'] + s.grown[k as 'str'] + s.legacy[k as 'str'];
    const stat = (k: string) => {
      const v = Math.floor(d.prim[k as 'str']), b = Math.floor(base(k));
      return `<div class="kv"><span class="lbl">${icon(k, 'gi sm')}${tr(STAT[k])}</span><span class="val ${v > b ? 'boost' : 'stat'}">${v}</span><span class="dim">(${b})</span></div>`;
    };
    // the name gets a row of its own: a title will prefix it (「XXXX 的奧雷里亞諾」) and must not squeeze the first column
    return `<div class="kv name"><span class="lbl">${t('name')}</span><span>${esc(s.name)}</span></div>
      <div class="col">
        <div class="kv"><span class="lbl">${t('race')}</span><span>${tr(r.name)}</span></div>
        <div class="kv"><span class="lbl">${t('age')}</span><span>${s.age} <small class="dim">${clock(YEAR_SEC - s.ageT)}</small></span></div>
        <div class="kv"><span class="lbl">${t('lv')}</span><span>${s.lvl}</span></div>
        <div class="kv bar"><span class="lbl">${t('exp')}</span><div class="line"><div id="s-xp" class="grey"></div></div></div>
        <div class="kv bar"><span class="lbl">${t('san')}</span><div class="line"><div id="s-san" class="purple"></div></div><span class="v" id="s-san-v"></span></div>
        <div class="kv"><span class="lbl">${t('gold')}</span><span>${num(s.gold)}</span></div>
        ${this.pactLine()}
      </div>
      <div class="col">${PRIMARY.map(stat).join('')}
        <div class="kv"><span class="lbl">${icon('ap', 'gi sm')}${t('ap')}</span><span>${s.ap}</span></div>
      </div>
      <div class="col">
        <div class="kv"><span class="lbl">${t('atk')}</span><span>${Math.floor(d.atkMin)}~${Math.floor(d.atkMax)}</span></div>
        <div class="kv"><span class="lbl">${t('bal')}</span><span>${Math.round(d.bal * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('crt')}</span><span>${Math.round(d.crit * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('crtm')}</span><span>${Math.round(d.critDmg * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('def')}</span><span>${Math.floor(d.def)}</span></div>
        <div class="kv"><span class="lbl">${t('prt')}</span><span>${Math.round(d.prt * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('spd')}</span><span>${Math.round(d.spd)}</span></div>
      </div>`;
  }

  private petBoxHtml(): string {
    const s = this.g.s, p = s.pets.find(x => x.key === s.activePet);
    if (!p) return `<div class="kv"><span class="lbl">${t('pet')}</span></div><div class="kv"><span class="lbl">${t('lv')}</span></div><div class="kv"><span class="lbl">${t('exp')}</span><div class="line"></div></div>`;
    const d = petOf(p.key)!, st = stageOf(p.lvl);
    // text only: the pal itself stands on the equipment board, where it can be tapped.
    // Two columns in the middle, as the user sketched: HP / MP on the left, level / EXP on the right.
    const bar = (id: string, cls: string, lbl: string) => `<div class="kv bar"><span class="lbl">${lbl}</span><div class="line"><div id="${id}" class="${cls}"></div></div></div>`;
    const rest = this.g.petDownFor > 0 ? ` <small class="dim">${t('petRest')}</small>` : '';
    return `<div class="kv"><span class="lbl">${t('pet')}</span><span class="petname">${tr(d.stages[st].name)}${rest}</span></div>
      <div class="petgrid">
        ${bar('p-hp', 'red', t('hp'))}<div class="kv"><span class="lbl">${t('lv')}</span><span>${p.lvl}</span></div>
        ${bar('p-mp', 'blue', t('mp'))}<div class="kv"><span class="lbl">${t('exp')}</span><div class="line"><div class="grey" style="width:${(p.xp / petXpNeed(p.lvl) * 100).toFixed(0)}%"></div></div></div>
      </div>
      <div class="kv"><span class="lbl">${t('bond')}</span><span class="hearts">${hearts(p.bond)}</span></div>`;
  }

  private attHtml(): string {
    const s = this.g.s;
    const rows = SKILLS.filter(k => k.act && s.skills[k.key]).map(k => `<div class="kv"><span>${tr(k.name)}</span><span>${pct(k.act!.chance(s.skills[k.key]), 1)}</span></div>`).join('');
    return `<h3>${t('att')}</h3>${rows}`;
  }

  /** Map stats for the area the hero is in, under the map: time, kills, falls, gold, EXP | loot total and by rarity. */
  private lootHtml(): string {
    const l = this.g.loot;
    const kv = (k: string, v: string, cls = '') => `<div class="kv"><span${cls ? ` class="${cls}"` : ''}>${k}</span><span>${v}</span></div>`;
    return `<div class="loot"><h3>${t('mapStats')}</h3><div class="lootcols">
      <div class="lcol">${kv(t('stay'), '<span id="loot-sec"></span>')}${kv(t('kills'), num(l.kills))}${kv(t('deaths'), num(l.deaths))}${kv('$', num(l.gold), 'gold')}${kv(t('exp'), num(l.xp), 'xp')}</div>
      <div class="lcol">${kv(t('loot'), num(l.items.reduce((a, b) => a + b, 0)))}${RARITY.map((r, i) => `<div class="kv sub"><span style="color:${r.color}">${tr(r.name)}</span><span>${l.items[i]}</span></div>`).join('')}</div>
    </div></div>`;
  }

  // ---------- side views ----------

  private viewHtml(): string {
    switch (this.view) {
      case 'equip': return this.equipHtml();
      case 'bag': return this.bagHtml();
      case 'pets': return this.petsHtml();
      case 'skills': return this.skillsHtml();
      case 'map': return this.mapHtml();
      case 'smith': return this.smithHtml();
      case 'titles': return this.titlesHtml();
      case 'settings': return this.settingsHtml();
    }
  }

  /** One-line item name; the stats live in the tooltip (data-tip="item:<uid>"). */
  private itemHtml(it: Item): string {
    const r = RARITY[it.rarity];
    // weight lives in the tooltip (rarity · weight), not in front of the name
    return `<div class="iname" style="color:${r.color}">${icon('slot-' + it.kind, 'gi sm item-icon')}${tr(nameOf(it))}${it.plus ? `<span class="plusn"> +${it.plus}</span>` : ''}</div>`;
  }
  private itemTip(it: Item): string {
    const r = RARITY[it.rarity];
    const lines: string[] = [];
    if (it.kind === 'weapon') { const [a, b] = weaponRange(it); lines.push(`${t('atk')} ${Math.floor(a)}~${Math.floor(b)}`, `${t('spd')} ${WEIGHTS[it.weight!].spd}`); }
    else if (it.weight) { lines.push(`${t('def')} ${Math.floor(armorDef(it))}`); if (armorPrt(it) > 0) lines.push(`${t('prt')} ${pct(armorPrt(it), 1)}`); }
    return `<div class="tname" style="color:${r.color}">${tr(nameOf(it))}${it.plus ? ' +' + it.plus : ''}</div>
      <div class="dim">${tr(r.name)}${it.weight ? ` · ${tr(WEIGHTS[it.weight].name)}` : ''}</div>
      ${lines.length ? `<div class="tsec">${lines.join('<br>')}</div>` : ''}
      ${it.affixes.length ? `<div class="tsec next">${it.affixes.map(modText).join('<br>')}</div>` : ''}
      <div class="tcost">${t('sell')} $${num(sellPrice(it))}</div>`;
  }

  private cpDelta(it: Item, slot: Slot): number {
    const s = this.g.s, old = s.equip[slot];
    s.equip[slot] = it;
    const after = derive(s).cp;
    s.equip[slot] = old;
    return after - this.g.d.cp;
  }

  /** BWE's paper doll: seven circles around a figure. */
  /**
   * The equipment board, 280x240, laid out like an inventory screen: four armour cells down the
   * far left (裝備), ring and necklace top-aligned on the far right (加護), the figure in the middle
   * with a hand cell on each side (level with the gap between the second and third armour cells,
   * never over the figure): the main hand is the figure's right hand, so it sits on the viewer's left.
   * The pal stands at its master's side. Cells are frameless; selection is a fill change.
   * The figure is the B-original 24×32 hero (hero.ts), drawn bare-handed: the hand cells show what is held.
   */
  private dollSvg(): string {
    const s = this.g.s;
    const CELL = 36;
    const cells: [Slot, number, number][] = [
      // 8px between the figure (x 104..176) and the hand cells, and 8px again to the columns
      ['head', 34, 44], ['body', 34, 90], ['legs', 34, 136], ['feet', 34, 182],
      ['ring', 246, 44], ['neck', 246, 90], ['weapon', 78, 113], ['off', 202, 113],
    ];
    const ico = (name: string, x: number, y: number, sz: number) => `<svg x="${x - sz / 2}" y="${y - sz / 2}" width="${sz}" height="${sz}" viewBox="0 0 16 16" shape-rendering="crispEdges">${pixelMarkup(name)}</svg>`;
    const cellSvg = cells.map(([k, x, y]) => {
      const it = s.equip[k], on = this.slot === k, locked = k === 'off' && twoHanded(s.equip.weapon);
      const x0 = x - CELL / 2, y0 = y - CELL / 2;
      const cross = locked ? `<line x1="${x0 + 6}" y1="${y0 + 6}" x2="${x0 + CELL - 6}" y2="${y0 + CELL - 6}"/><line x1="${x0 + CELL - 6}" y1="${y0 + 6}" x2="${x0 + 6}" y2="${y0 + CELL - 6}"/>` : '';
      return `<g class="slot ${on ? 'on' : ''} ${it ? 'full' : ''} ${locked ? 'locked' : ''}" data-a="slot" data-k="${k}" ${it ? `data-tip="item:${it.uid}"` : ''}><title>${locked ? t('twoHanded') : tr(SLOT_NAME[k])}</title>
        <rect class="cell" x="${x0}" y="${y0}" width="${CELL}" height="${CELL}"/>${locked ? cross : ico('slot-' + k, x, y, 24)}</g>`;
    }).join('');
    // the pal is not a cell: it stands at its master's feet
    const pet = s.pets.find(p => p.key === s.activePet);
    const petSvg = pet ? `<g class="petspr" data-a="petTap"><title>${tr(petOf(pet.key)!.stages[stageOf(pet.lvl)].name)}</title>${ico('pet-' + pet.key, 202, 168, 40)}</g>` : '';
    return `<svg class="doll" viewBox="0 0 280 240">
      <text class="cap" x="34" y="16">${t('navEquip')}</text><text class="cap" x="246" y="16">${t('charms')}</text>
      <text class="cap" x="78" y="89">${t('capAttack')}</text><text class="cap" x="202" y="89">${t('capSupport')}</text>
      <svg x="92" y="48" width="96" height="128" viewBox="0 0 24 32" shape-rendering="crispEdges" data-avatar="${s.race}">${heroMarkup(s.race, { ...s.equip, weapon: undefined, off: undefined })}</svg>
      ${cellSvg}${petSvg}</svg>`;
  }

  /** Equipment page: the figure with its slots, and the worn piece of the selected slot. The bag is its own page. */
  private equipHtml(): string {
    const s = this.g.s, sel = this.slot;
    const worn = sel === 'all' ? '' : (() => {
      const it = s.equip[sel];
      return `<div class="item worn" ${it ? `data-tip="item:${it.uid}"` : ''}><div class="grow"><div class="dim">${tr(SLOT_NAME[sel])}</div>${it ? this.itemHtml(it) : t('empty')}</div>${it ? `<button data-a="unequip" data-k="${sel}">${t('unequip')}</button>` : ''}</div>`;
    })();
    return `${this.dollSvg()}${worn}`;
  }

  /** Bag page: every carried item with its CP change, equip and sell, plus auto-sell and sell-all. */
  private bagHtml(): string {
    const s = this.g.s;
    const bag = s.bag.map(it => {
      const dcp = this.cpDelta(it, A.targetSlot(s, it));
      return `<div class="item" data-tip="item:${it.uid}"><div class="grow">${this.itemHtml(it)}</div><div class="acts">
        <span class="${dcp > 0 ? 'up' : dcp < 0 ? 'down' : 'dim'}">${dcp ? icon('arrow', dcp > 0 ? 'gi sm pointup' : 'gi sm') : ''}${num(Math.abs(dcp))}</span>
        <button data-a="equip" data-uid="${it.uid}">${t('equip')}</button>
        <button class="ghost" data-a="sell" data-uid="${it.uid}">$${num(sellPrice(it))}</button></div></div>`;
    }).join('') || `<p class="dim">${t('empty')}</p>`;
    const opts = RARITY.map((r, i) => [String(i), i === 0 ? '-' : tr(r.name)] as [string, string]);
    return `<div class="row between"><b>${t('bag')} ${s.bag.length}/${BAG_SIZE}</b>
        <span class="row"><span class="dim">${t('autoSell')} ${dropdown('autoSell', opts, String(s.autoSell))}</span><button class="ghost" data-a="sellAll">${t('sellAll')}</button></span></div>
      ${bag}`;
  }

  /** Tooltip shared by every [data-tip] element: hover on desktop, tap on touch screens. */
  private tipEl!: HTMLElement;
  private tipFor: HTMLElement | null = null;
  private tipByTap = false;
  private lastPointer = 'mouse';
  private installTips(): void {
    this.tipEl = document.createElement('div');
    this.tipEl.className = 'tip'; this.tipEl.hidden = true;
    document.body.appendChild(this.tipEl);
    const show = (el: HTMLElement) => {
      const html = this.tipHtml(el.getAttribute('data-tip') || '');
      if (!html) return;
      this.tipFor = el; this.tipEl.innerHTML = html; this.tipEl.hidden = false;
      const r = el.getBoundingClientRect(), w = this.tipEl.offsetWidth, h = this.tipEl.offsetHeight;
      // prefer the left of the row (like the side panel's neighbour), fall back below it on narrow screens
      let x = r.left - w - 8, y = r.top;
      if (x < 8) { x = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)); y = r.bottom + 6; }
      y = Math.max(8, Math.min(window.innerHeight - h - 8, y));
      this.tipEl.style.left = x + 'px'; this.tipEl.style.top = y + 'px';
    };
    const hide = () => { this.tipFor = null; this.tipByTap = false; this.tipEl.hidden = true; };
    this.root.addEventListener('pointerover', e => {
      if ((e as PointerEvent).pointerType === 'touch') return;
      const el = (e.target as HTMLElement).closest('[data-tip]') as HTMLElement | null;
      if (el && el !== this.tipFor) { this.tipByTap = false; show(el); } else if (!el && this.tipFor && !this.tipByTap) hide();
    });
    this.root.addEventListener('pointerleave', e => { if ((e as PointerEvent).pointerType !== 'touch' && !this.tipByTap) hide(); }); // a lifted finger 'leaves' too
    this.root.addEventListener('pointerdown', e => { this.lastPointer = (e as PointerEvent).pointerType || 'mouse'; }, true);
    this.root.addEventListener('click', e => {
      const el = (e.target as HTMLElement).closest('[data-tip]') as HTMLElement | null;
      if ((e.target as HTMLElement).closest('[data-a]')) { if (this.tipFor) setTimeout(() => this.tipFor && document.contains(this.tipFor) ? show(this.tipFor) : hide(), 0); return; }
      if (!el) { hide(); return; }
      if (this.lastPointer === 'touch') { if (el === this.tipFor) hide(); else { this.tipByTap = true; show(el); } } // tap toggles
      else if (el !== this.tipFor) show(el); // a mouse click keeps the hover tip
    });
    // close when the page or the panel holding the row scrolls, not when the log scrolls itself
    window.addEventListener('scroll', e => {
      const tgt = e.target as Node;
      // a tapped tip stays until the next tap: phones re-anchor the page as panels refresh
      if (this.tipFor && !this.tipByTap && (tgt === document || (tgt as Element).contains?.(this.tipFor))) hide();
    }, true);
  }
  private tipHtml(key: string): string {
    const [kind, id] = key.split(':');
    if (kind === 'item') { const it = this.g.itemOf(Number(id)); return it ? this.itemTip(it) : ''; }
    if (kind !== 'skill') return '';
    const k = SKILLS.find(x => x.key === id); if (!k) return '';
    const r = this.g.s.skills[k.key] || 0, max = r >= MAX_RANK;
    return `<div class="tname">${tr(k.name)} ${r ? RANKS[r] : ''}</div>
      <div class="tsec">${r ? tr(k.desc(r)) : `<span class="dim">${t('notLearned')}</span>`}</div>
      ${max ? `<div class="tsec dim">${t('maxed')}</div>` : `<div class="tnext">${t('nextRank')} ${RANKS[r + 1]}</div><div class="tsec next">${tr(k.desc(r + 1))}</div>
      <div class="tcost">${t('ap')} ${rankCost(r)}</div>`}`;
  }

  private skillsHtml(): string {
    const s = this.g.s;
    const tabs = (['combat', 'magic', 'passive'] as SkillTab[]).map(k => `<button class="stab ${this.skillTab === k ? 'on' : ''}" data-a="stab" data-k="${k}">${t(k)}</button>`).join('');
    const rows = SKILLS.filter(k => k.tab === this.skillTab).map(k => {
      const r = s.skills[k.key] || 0, cost = rankCost(r), max = r >= MAX_RANK, can = !max && s.ap >= cost;
      // one fixed-height row; the effect text lives in a hover/tap tooltip so ranking up never changes the layout
      return `<div class="skill ${can ? 'can' : ''}" data-tip="skill:${k.key}"><div class="sico">${icon('sk-' + k.key)}</div>
        <div class="grow"><div class="sname">${tr(k.name)} <b>${r ? RANKS[r] : ''}</b></div></div>
        ${max ? `<span class="dim">${t('maxed')}</span>` : `<button class="up-btn" data-a="learn" data-k="${k.key}" ${can ? '' : 'disabled'} title="${cost} ${t('ap')}"><small>${cost}</small>${icon('arrow', 'gi sm pointup')}</button>`}</div>`;
    }).join('');
    return `<div class="stabs">${tabs}</div><p class="dim">${t('ap')} ${s.ap}</p>${rows}`;
  }

  /** The map as a descent: icon nodes winding down into the Abyss. Tap a node for details. */
  private mapHtml(): string {
    const { s, d } = this.g;
    const sel = this.mapSel || s.area;
    // positions in % of the board: a winding path, top = surface, bottom = the Abyss
    const POS: [number, number][] = [[22, 9], [62, 20], [34, 32], [74, 43], [30, 55], [68, 66], [36, 78], [58, 89]];
    const path = POS.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
    const nodes = AREAS.map((a, i) => {
      const [x, y] = POS[i], here = s.area === a.key, cp = AREA_CP[i];
      const state = here ? 'here' : d.cp >= cp ? 'ok' : d.cp >= cp * 0.6 ? 'risky' : 'far';
      return `<button class="node ${state} ${sel === a.key ? 'sel' : ''}" style="left:${x}%;top:${y}%" data-a="mapsel" data-k="${a.key}" title="${tr(a.name)}">
        <span class="nico">${icon('area-' + a.key)}</span><span class="nname">${tr(a.name)}</span></button>`;
    }).join('');
    const i = AREAS.findIndex(a => a.key === sel), a = AREAS[i], cp = AREA_CP[i], here = s.area === a.key;
    const cls = d.cp >= cp ? 'up' : d.cp >= cp * 0.6 ? 'warn' : 'down';
    const pals = PETS.filter(p => p.home === a.key && !p.hidden).map(p => s.pets.some(x => x.key === p.key) ? tr(p.stages[0].name) : t('unknown')).join(' · ');
    const card = `<div class="item mapcard"><div class="dot" style="background:${a.bg}">${icon('area-' + a.key)}</div>
      <div class="grow"><div class="iname">${tr(a.name)} <small class="dim">Lv ${a.min}–${a.max}</small></div>
      <div class="istat">${t('recArea')} <b class="${cls}">${num(cp)}</b> · ${a.dread ? `<span class="madtxt">${t('dread')} -${(a.dread * willResist(d.prim.will) * d.sanDrain).toFixed(2)}</span>` : `<span class="up">${t('safe')}</span>`}${pals ? ` · ${t('pet')}${t('sep')}${pals}` : ''}</div>
      <p class="lore">${tr(a.flavor)}</p></div>
      ${here ? `<span class="dim">${t('here')}</span>` : `<button data-a="go" data-k="${a.key}">${t('go')}</button>`}</div>`;
    return `<div class="mapboard"><svg class="maproute" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg>${nodes}</div>${card}${this.lootHtml()}`;
  }

  /** Blacksmith: the rules in three lines, then what is worn and what is carried. */
  private smithHtml(): string {
    const g = this.g, s = g.s;
    const row = (it: Item) => {
      if (it.plus >= SMITH_MAX) return `<div class="item" data-tip="item:${it.uid}"><div class="grow">${this.itemHtml(it)}</div><span class="dim">${t('maxed')}</span></div>`;
      const cost = smithCost(it.ilvl, it.plus), ch = A.smithChance(g, it);
      return `<div class="item" data-tip="item:${it.uid}"><div class="grow">${this.itemHtml(it)}</div><div class="acts">
        <span class="dim">${it.plus >= SMITH_BREAK_FROM ? icon('warn-hard', 'gi sm') : it.plus >= SMITH_DROP_FROM ? icon('warn-soft', 'gi sm') : ''}${pct(ch)}</span>
        <button data-a="smith" data-uid="${it.uid}" ${s.gold < cost ? 'disabled' : ''}>$${num(cost)}</button></div></div>`;
    };
    const rule = (k: string, v: string) => `<div class="kv"><span class="lbl">${k}</span><span>${v}</span></div>`;
    const worn = SLOTS.map(k => s.equip[k]).filter(Boolean) as Item[];
    const empty = `<p class="dim">${t('empty')}</p>`;
    return `<div class="rules">${rule('LV +1', t('smithGain'))}${rule(`LV 1–${SMITH_DROP_FROM}`, t('smithKeep'))}${rule(`LV ${SMITH_DROP_FROM}–${SMITH_BREAK_FROM - 1} ${icon('warn-soft', 'gi sm')}`, t('smithDrop'))}${rule(`LV ${SMITH_BREAK_FROM}+ ${icon('warn-hard', 'gi sm')}`, t('smithBreak'))}</div>
      <h4>${t('smithWorn')}</h4>${worn.map(row).join('') || empty}
      <h4>${t('bag')}</h4>${s.bag.map(row).join('') || empty}`;
  }

  private petsHtml(): string {
    const s = this.g.s;
    const owned = s.pets.map(p => {
      const d = petOf(p.key)!, st = stageOf(p.lvl), on = s.activePet === p.key, next = STAGE_LV[st + 1];
      return `<div class="item ${on ? 'here' : ''}"><div class="dot" style="background:${d.stages[st].color}">${icon('pet-' + p.key)}</div>
        <div class="grow"><div class="iname">${tr(d.stages[st].name)} <small class="dim">Lv ${p.lvl}${next ? ` → Lv ${next}` : ''}</small></div>
        <div class="istat">${tr(d.ability)}<br><span class="hearts">${hearts(p.bond)}</span></div>
        <p class="lore">${tr(d.lore)}</p></div>
        ${on ? `<span class="dim">${t('active')}</span>` : `<button data-a="pet" data-k="${p.key}">${t('call')}</button>`}</div>`;
    }).join('');
    const unknown = PETS.filter(p => !p.hidden && !s.pets.some(x => x.key === p.key)).map(p =>
      `<div class="item faded"><div class="dot q">${icon('unknown')}</div><div class="grow"><div class="iname">${t('unknownPet')}</div><div class="istat">${t('petHint')}${t('sep')}${tr(AREAS.find(a => a.key === p.home)!.name)}</div></div></div>`).join('');
    return owned + unknown;
  }

  private titlesHtml(): string {
    const s = this.g.s;
    return TITLES.map(ti => {
      const got = s.titles.includes(ti.key);
      if (ti.secret && !got) return `<div class="item faded"><div class="grow"><div class="iname">${icon('unknown', 'gi sm')}${t('unknownPet')}</div></div></div>`;
      return `<div class="item ${got ? 'here' : 'faded'}"><div class="grow"><div class="iname">${icon('star', got ? 'gi sm star on' : 'gi sm star')}${tr(ti.name)}</div><div class="istat">${tr(ti.how)} · ${ti.mods.map(modText).join(' · ')}</div></div></div>`;
    }).join('') + `<p class="dim">${t('kills')} ${num(s.counters.kills)} · ${t('deaths')} ${num(s.counters.deaths)} · ${t('rebirths')} ${s.counters.rebirths}</p>`;
  }

  /** Rebirth takes over the page with the creation screen: race and age picker, the Abyss's offers, one button. */
  private overlay = false;
  private rebirthScreen(): void {
    const g = this.g, root = this.root;
    this.overlay = true; this.rbPact = -1; this.rbRace = g.s.race;
    const back = () => { this.overlay = false; this.build(); this.lastHtml = {}; this.setView('equip'); };
    const draw = () => {
      root.innerHTML = `<div class="create">${banner(true)}
        <div class="rbtext"><p class="rblead">${t('rebirthLead')}</p>
        <div class="kv left"><span class="lbl">${t('inherit')}</span><span>${t('inheritList')}</span></div>
        <div class="kv left"><span class="lbl">${t('lose')}</span><span>${t('loseList')}</span></div></div>
        ${raceAgePicker(this.rbRace, this.rbAge, 'rbRace', 'rbAge')}
        <div class="rbtext">${this.offersHtml()}</div>
        <div class="cfoot"><button class="link play" id="rb-go">${t('rebirthDo')}</button><button class="link" id="rb-back">${t('back')}</button></div></div>`;
      root.querySelectorAll<HTMLElement>('[data-a="rbRace"]').forEach(b => b.onclick = () => { this.rbRace = b.dataset.k!; draw(); });
      root.querySelectorAll<HTMLElement>('[data-a="rbAge"]').forEach(b => b.onclick = () => { this.rbAge = Number(b.dataset.k); draw(); });
      root.querySelectorAll<HTMLElement>('[data-a="rbPact"]').forEach(b => b.onclick = () => { this.rbPact = Number(b.dataset.k); draw(); });
      root.querySelector<HTMLElement>('#rb-back')!.onclick = back;
      root.querySelector<HTMLElement>('#rb-go')!.onclick = () => { back(); A.rebirth(g, this.rbRace, this.rbAge, this.rbPact); this.rbPact = -1; this.lastHtml = {}; this.render(); };
    };
    draw();
  }

  private pactLine(): string {
    const p = this.g.s.pact;
    if (!p) return '';
    const gi = giftOf(p[0]), cu = curseOf(p[1]);
    return `<div class="kv pactline"><span class="lbl">${t('pact')}</span><span><span class="gift">${gi ? tr(gi.name) : ''}</span> / <span class="curse">${cu ? tr(cu.name) : ''}</span></span></div>`;
  }

  private offersHtml(): string {
    const offers = A.pactOffers(this.g);
    const fx = (d: PactDef) => d.mods.map(modText).join(' · ').replace(/\+-/g, '-');
    const cards = offers.map(([gk, ck], i) => {
      const gi = giftOf(gk)!, cu = curseOf(ck)!;
      return `<button class="pact ${this.rbPact === i ? 'on' : ''}" data-a="rbPact" data-k="${i}">
        <span class="gift">${tr(gi.name)}</span><small>${fx(gi)}</small><em>${tr(gi.line)}</em>
        <span class="curse">${tr(cu.name)}</span><small>${fx(cu)}</small><em>${tr(cu.line)}</em></button>`;
    }).join('');
    return `<h3>${t('pact')}</h3><p class="dim">${t('offerHead')}</p><div class="pacts">${cards}
      <button class="pact refuse ${this.rbPact === -1 ? 'on' : ''}" data-a="rbPact" data-k="-1">${t('refuse')}</button></div>`;
  }

  private settingsHtml(): string {
    const ok = this.g.s.age >= REBIRTH_AGE;
    return `<div class="row"><b>${t('language')}</b><button data-a="lang" data-k="zh" ${lang === 'zh' ? 'disabled' : ''}>中文</button><button data-a="lang" data-k="en" ${lang === 'en' ? 'disabled' : ''}>English</button></div>
      <p><button class="danger" data-a="rebirthOpen" ${ok ? '' : 'disabled'}>${t('navRebirth')}</button>${ok ? '' : ` <span class="dim">${t('rebirthNeed')}</span>`}</p>
      <p><button class="ghost" data-a="reset">${t('reset')}</button></p>
      <p class="dim">${t('credits')}</p><p class="dim">Original pixel artwork · Souls in Abyss</p>`;
  }
}

/** A pixel-styled dropdown: a button showing the choice, a menu of options; picking one fires `action` with data-k. */
const dropdown = (action: string, items: [string, string][], value: string) => {
  const cur = items.find(([v]) => v === value)?.[1] ?? items[0][1];
  return `<span class="dd"><button type="button" class="ddbtn" data-a="ddToggle">${cur}${icon('arrow', 'gi sm ddarrow')}</button>
    <div class="ddmenu" hidden>${items.map(([v, l]) => `<button type="button" class="ddopt ${v === value ? 'on' : ''}" data-a="${action}" data-k="${v}">${l}</button>`).join('')}</div></span>`;
};

/** Age preview uses the same pixel character as the equipment and battle views. */
const figure = (h: number) => `<svg class="pict" viewBox="0 0 24 32" style="height:${h}px;width:${h * 0.75}px" shape-rendering="crispEdges" aria-hidden="true">${heroMarkup('human')}</svg>`;

/** Race icons (left), age figures (right), and a stat table below. Shared by creation and rebirth. */
export function raceAgePicker(race: string, age: number, raceAction: string, ageAction: string): string {
  const r = raceOf(race), g = ageGrowth(r, age);
  const list = RACES.map(x => `<button class="rrow ${x.key === race ? 'on' : ''}" data-a="${raceAction}" data-k="${x.key}" title="${tr(x.name)}" aria-pressed="${x.key === race}">
      <span class="rico">${icon(x.key)}</span><span class="rname">${tr(x.name)}</span></button>`).join('');
  const figs = START_AGES.map(a => `<button class="fig ${a === age ? 'on' : ''}" data-a="${ageAction}" data-k="${a}" title="${t('age')} ${a}" aria-pressed="${a === age}">
      <span class="agev">${a === age ? `<small>${t('age')}</small>${a}` : ''}</span>${figure(40 + (a - 10) * 3)}</button>`).join('');
  const head = PRIMARY.map(k => `<th>${icon(k, 'gi sm')}${tr(STAT[k])}</th>`).join('');
  const row = (o: Record<string, number>, plus: boolean) => PRIMARY.map(k => `<td class="${plus ? 'plus' : ''}">${plus ? '+' : ''}${o[k]}</td>`).join('');
  return `<div class="picker"><div class="rcol"><div class="rlist">${list}</div><p class="rdesc">${tr(r.name)}${t('sep')}${tr(r.desc)}</p></div><div class="rinfo">
      <div class="figs">${figs}</div>
      <table class="sttable"><thead><tr><th></th>${head}</tr></thead>
        <tbody><tr><th>${t('initStat')}</th>${row(r.base, false)}</tr><tr><th>${t('ageGrowth')}</th>${row(g, true)}</tr></tbody></table>
      <p class="dim small center">${t('levelShare')}</p></div></div>`;
}

/** CJK lines use the pixel font's own metrics so the glow banner does not overlap. */
const cjk = (s: string) => (/[\u3400-\u9fff]/.test(s) ? ' cjk' : '');
const banner = (small = false) => `<div class="banner ${small ? 'small' : ''}"><h1 class="glow${cjk(t('title'))}">${t('title')}</h1>${t('subtitle') ? `<div class="subtitle${cjk(t('subtitle'))}">${t('subtitle')}</div>` : ''}</div>`;

/** Gear in the bottom-right corner of the entry screens: opens a language menu. */
const cogHtml = () => `<div class="cogwrap"><div class="cogmenu" hidden>
    <button data-lang="zh" ${lang === 'zh' ? 'class="on"' : ''}>中文</button><button data-lang="en" ${lang === 'en' ? 'class="on"' : ''}>English</button></div>
  <button class="cog" aria-label="${t('language')}" title="${t('language')}">${icon('settings')}</button></div>`;
function bindCog(root: HTMLElement): void {
  const menu = root.querySelector<HTMLElement>('.cogmenu')!;
  root.querySelector<HTMLElement>('.cog')!.onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  menu.querySelectorAll<HTMLElement>('[data-lang]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const l = b.dataset.lang as 'zh' | 'en';
    if (l !== lang) { setLang(l); location.reload(); } else menu.hidden = true;
  });
}

/** Title banner, then creation. */
export function creation(root: HTMLElement, done: (name: string, race: string, age: number) => void): void {
  let race = 'elf', age = 13, name = lang === 'zh' ? '奧雷里亞諾' : 'Aureliano'; // after One Hundred Years of Solitude
  const titleScreen = () => {
    root.innerHTML = `<div class="titlescreen">${banner()}<button class="link play" id="t-play">${t('play')}</button></div>${cogHtml()}`;
    root.querySelector<HTMLElement>('#t-play')!.onclick = intro;
    bindCog(root);
  };
  /** The tagline as a short interlude: each line fades in, then both fade out. Click to skip. */
  const intro = () => {
    const lines = t('tagline').split('<br>');
    root.innerHTML = `<div class="intro" role="button" tabindex="0" aria-label="${t('play')}">${lines.map((l, i) => `<p class="introline" style="--d:${i * 1.4}s">${l}</p>`).join('')}</div>`;
    const box = root.querySelector<HTMLElement>('.intro')!;
    let done = false;
    const next = () => { if (!done) { done = true; draw(); } };
    box.onclick = next;
    box.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') next(); };
    box.focus();
    box.addEventListener('animationend', e => { if ((e.target as HTMLElement) === box) next(); });
  };
  const draw = () => {
    root.innerHTML = `<div class="create">${banner(true)}
      ${raceAgePicker(race, age, 'cRace', 'cAge')}
      <div class="cfoot"><label class="namebox"><span>${t('name')}</span><input id="c-name" maxlength="12" value="${esc(name)}" /></label>
      <button class="link play" id="c-go">${t('ok')}</button></div></div>${cogHtml()}`;
    bindCog(root);
    root.querySelectorAll<HTMLElement>('[data-a="cRace"]').forEach(b => b.onclick = () => { keep(); race = b.dataset.k!; draw(); });
    root.querySelectorAll<HTMLElement>('[data-a="cAge"]').forEach(b => b.onclick = () => { keep(); age = Number(b.dataset.k); draw(); });
    root.querySelector<HTMLElement>('#c-go')!.onclick = () => { keep(); done((name.trim() || (lang === 'zh' ? '奧雷里亞諾' : 'Aureliano')).slice(0, 12), race, age); };
  };
  const keep = () => { name = (root.querySelector('#c-name') as HTMLInputElement).value; };
  titleScreen();
}
