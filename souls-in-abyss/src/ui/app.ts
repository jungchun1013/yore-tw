import type { Game, Part } from '../game/engine';
import { PRIMARY, SLOTS, type Item, type Kind, type L, type Slot } from '../game/types';
import { lang, setLang, t, tr, UI } from '../core/i18n';
import { clock, num, pct } from '../core/fmt';
import { derive, armorDef, armorPrt, weaponRange, xpNeed } from '../game/stats';
import { nameOf, sellPrice } from '../game/loot';
import { RACES, START_AGES, ageGrowth, raceOf } from '../data/races';
import { BAG_SIZE, RARITY, SMITH_DROP_FROM, SMITH_MAX, WEIGHTS, smithCost } from '../data/items';
import { MAX_RANK, RANKS, SKILLS, rankCost, type Tab as SkillTab } from '../data/skills';
import { AREAS } from '../data/areas';
import { AREA_CP, difficulty } from '../game/monsters';
import { PETS, BOND_MAX, STAGE_LV, petOf, petXpNeed, stageOf } from '../data/pets';
import { TITLES } from '../data/titles';
import { LEGACY_RATE, REBIRTH_AGE, YEAR_SEC, clearSave } from '../game/state';
import { Scene } from './scene';
import * as A from '../game/actions';

type View = 'equip' | 'pets' | 'skills' | 'map' | 'smith' | 'titles' | 'rebirth' | 'settings';
const NAV: [View, keyof typeof UI, string][] = [
  ['equip', 'navEquip', '甲'], ['pets', 'navPets', '伴'], ['skills', 'navSkills', '技'], ['map', 'navMap', '圖'],
  ['smith', 'navSmith', '鍛'], ['titles', 'navTitles', '冠'], ['rebirth', 'navRebirth', '輪'], ['settings', 'navSettings', '設'],
];
const STAT: Record<string, L> = {
  str: { zh: '力量', en: 'STR' }, dex: { zh: '靈巧', en: 'DEX' }, int: { zh: '智力', en: 'INT' }, will: { zh: '意志', en: 'WILL' }, luk: { zh: '幸運', en: 'LUCK' },
  hp: { zh: 'HP', en: 'HP' }, mp: { zh: 'MP', en: 'MP' }, atk: { zh: '攻擊', en: 'ATK' }, atkMin: { zh: '最小攻擊', en: 'Min ATK' }, atkMax: { zh: '最大攻擊', en: 'Max ATK' },
  bal: { zh: '平衡', en: 'BAL' }, crit: { zh: '爆擊', en: 'CRT' }, def: { zh: '防禦', en: 'DEF' }, prt: { zh: '保護', en: 'PRT' },
  speed: { zh: '攻速', en: 'Speed' }, magic: { zh: '魔力', en: 'Magic' }, xp: { zh: '經驗', en: 'EXP' }, gold: { zh: '金幣', en: 'Gold' }, drop: { zh: '掉寶', en: 'Drops' },
  petPower: { zh: '夥伴傷害', en: 'Pal damage' }, guard: { zh: '減傷', en: 'Guard' }, petHeal: { zh: '夥伴治療', en: 'Pal heal' }, heal: { zh: '擊倒回復', en: 'Kill heal' },
};
const SLOT_NAME: Record<Slot, L> = {
  weapon: { zh: '武器', en: 'Weapon' }, head: { zh: '頭', en: 'Head' }, body: { zh: '身體', en: 'Body' }, hands: { zh: '手', en: 'Hands' },
  feet: { zh: '腳', en: 'Feet' }, acc1: { zh: '飾品 1', en: 'Accessory 1' }, acc2: { zh: '飾品 2', en: 'Accessory 2' },
};
const KIND_OF: Record<Slot, Kind> = { weapon: 'weapon', head: 'head', body: 'body', hands: 'hands', feet: 'feet', acc1: 'acc', acc2: 'acc' };
const esc = (x: string) => x.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const PCT_KEYS = new Set(['bal', 'crit', 'prt']);
const modText = (m: { key: string; add?: number; mul?: number }) =>
  `${tr(STAT[m.key] || { zh: m.key, en: m.key })} +${m.add !== undefined ? (PCT_KEYS.has(m.key) ? pct(m.add, 1) : m.add) : pct(m.mul!, 1)}`;

export class App {
  private view: View = 'equip';
  private slot: Slot | 'all' = 'all';
  private skillTab: SkillTab = 'combat';
  private rbRace: string; private rbAge = 17;
  private lastHtml: Record<string, string> = {};
  private logEl!: HTMLElement;
  private scene: Scene;

  constructor(private g: Game, private root: HTMLElement) {
    this.rbRace = g.s.race;
    this.scene = new Scene(g);
    this.build();
    g.on(e => { if (e.t === 'log') this.addLog(e.parts, e.cls); });
  }

  private build(): void {
    this.root.innerHTML = `
      <div class="game">
        <section class="box sheet" id="sheet"></section>
        <section class="box monster">
          <div class="mhead"><span class="lbl">${t('monster')}</span> <b id="m-diff"></b> <span id="m-name"></span></div>
          <div class="stage"></div>
          <div class="kv"><span class="lbl">HP</span><div class="line"><div id="m-hp" class="red"></div></div></div>
          <div class="kv"><span class="lbl">${t('cp')}</span><span id="m-cp"></span></div>
        </section>
        <section class="box petbox" id="petbox"></section>
        <section class="box log" id="log"></section>
        <section class="box att" id="att"></section>
        <section class="box loot" id="loot"></section>
        <section class="box side">
          <nav class="nav">${NAV.map(([k, l, g]) => `<button class="ico" data-a="view" data-k="${k}" title="${t(l)}" aria-label="${t(l)}"><span>${g}</span></button>`).join('')}</nav>
          <div class="vtitle" id="vtitle"></div>
          <div class="view" id="view"></div>
        </section>
      </div>`;
    this.root.querySelector('.stage')!.appendChild(this.scene.cv);
    this.logEl = this.root.querySelector('#log')!;
    this.root.addEventListener('click', e => this.onClick(e));
    this.root.addEventListener('change', e => this.onChange(e));
    this.root.addEventListener('input', e => this.onChange(e));
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
    const el = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
    if (!el || (el as HTMLButtonElement).disabled) return;
    const a = el.dataset.a!, k = el.dataset.k || '', uid = Number(el.dataset.uid);
    const g = this.g;
    switch (a) {
      case 'view': this.setView(k as View); return;
      case 'slot': this.slot = this.slot === k ? 'all' : (k as Slot); break;
      case 'stab': this.skillTab = k as SkillTab; break;
      case 'lang': setLang(k as 'zh' | 'en'); location.reload(); return;
      case 'equip': A.equip(g, uid, this.slot === 'acc1' || this.slot === 'acc2' ? this.slot : undefined); break;
      case 'unequip': A.unequip(g, k as Slot); break;
      case 'sell': A.sell(g, uid); break;
      case 'sellAll': A.sellAll(g); break;
      case 'smith': A.upgrade(g, uid); break;
      case 'learn': A.learn(g, k); break;
      case 'go': A.goArea(g, k); break;
      case 'pet': A.setPet(g, k || null); break;
      case 'rbRace': this.rbRace = k; break;
      case 'rbAge': this.rbAge = Number(k); break;
      case 'rebirth': A.rebirth(g, this.rbRace, this.rbAge); break;
      case 'reset': if (confirm(t('resetConfirm'))) { clearSave(); (window as any).__noSave = true; location.reload(); } return;
    }
    this.lastHtml = {};
    this.render();
  }

  private onChange(e: Event): void {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    if (el.dataset.a === 'autoSell') this.g.s.autoSell = Number(el.value);
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
    this.scene.draw(dt);
    const g = this.g, m = g.mon;
    const dif = difficulty(m.cp, g.d.cp);
    this.text('m-diff', tr(dif.name)); (document.getElementById('m-diff') as HTMLElement).style.color = dif.color;
    this.text('m-name', `${tr(m.def.name)} Lv${m.lvl}`); (document.getElementById('m-name') as HTMLElement).style.color = g.monColor;
    this.text('m-cp', num(m.cp));
    this.width('m-hp', m.hp / m.maxHp);
    this.width('s-hp', g.hp / g.d.hp); this.width('s-mp', g.mp / g.d.mp); this.width('s-xp', g.s.xp / xpNeed(g.s.lvl));
  }
  private text(id: string, v: string) { const el = document.getElementById(id); if (el && el.textContent !== v) el.textContent = v; }
  private width(id: string, f: number) { const el = document.getElementById(id); if (el) el.style.width = (Math.max(0, Math.min(1, f)) * 100).toFixed(1) + '%'; }

  /** A few times a second: panels whose HTML changed get replaced. */
  render(): void {
    this.put('sheet', this.sheetHtml());
    this.put('petbox', this.petBoxHtml());
    this.put('att', this.attHtml());
    this.put('loot', this.lootHtml());
    this.put('view', this.viewHtml());
  }
  private put(id: string, html: string): void {
    if (this.lastHtml[id] === html) return;
    this.lastHtml[id] = html;
    const el = document.getElementById(id)!;
    const st = el.scrollTop;
    el.innerHTML = html;
    el.scrollTop = st;
  }

  // ---------- fixed panels ----------

  private sheetHtml(): string {
    const { s, d } = this.g, r = raceOf(s.race);
    const base = (k: string) => r.base[k as 'str'] + s.grown[k as 'str'] + s.legacy[k as 'str'];
    const stat = (k: string) => {
      const v = Math.floor(d.prim[k as 'str']), b = Math.floor(base(k));
      return `<div class="kv"><span class="lbl">${tr(STAT[k])}</span><span class="val ${v > b ? 'boost' : 'stat'}">${v}</span><span class="dim">(${b})</span></div>`;
    };
    const bar = (id: string, cls: string, lbl: string) => `<div class="kv"><span class="lbl">${lbl}</span><div class="line"><div id="${id}" class="${cls}"></div></div></div>`;
    return `<div class="col">
        <div class="kv"><span class="lbl">${t('name')}</span><span>${esc(s.name)}</span></div>
        <div class="kv"><span class="lbl">${t('race')}</span><span>${tr(r.name)}</span></div>
        <div class="kv"><span class="lbl">${t('age')}</span><span>${s.age} <small class="dim">${clock(YEAR_SEC - s.ageT)}</small></span></div>
        <div class="kv"><span class="lbl">${t('lv')}</span><span>${s.lvl}</span></div>
        ${bar('s-hp', 'red', t('hp'))}${bar('s-mp', 'blue', t('mp'))}${bar('s-xp', 'grey', t('exp'))}
        <div class="kv"><span class="lbl">${t('gold')}</span><span>${num(s.gold)}</span></div>
      </div>
      <div class="col">${PRIMARY.map(stat).join('')}
        <div class="kv"><span class="lbl">${t('ap')}</span><span>${s.ap}</span></div>
        <div class="kv"><span class="lbl">${t('cp')}</span><span>${num(d.cp)}</span></div>
      </div>
      <div class="col">
        <div class="kv"><span class="lbl">${t('atk')}</span><span>${Math.floor(d.atkMin)}~${Math.floor(d.atkMax)}</span></div>
        <div class="kv"><span class="lbl">${t('bal')}</span><span>${Math.round(d.bal * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('crt')}</span><span>${Math.round(d.crit * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('crtm')}</span><span>${Math.round(d.critDmg * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('def')}</span><span>${Math.floor(d.def)}</span></div>
        <div class="kv"><span class="lbl">${t('prt')}</span><span>${Math.round(d.prt * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('spd')}</span><span>${d.interval.toFixed(2)}s</span></div>
      </div>`;
  }

  private petBoxHtml(): string {
    const s = this.g.s, p = s.pets.find(x => x.key === s.activePet);
    if (!p) return `<div class="kv"><span class="lbl">${t('pet')}</span></div><div class="kv"><span class="lbl">${t('lv')}</span></div><div class="kv"><span class="lbl">${t('exp')}</span><div class="line"></div></div>`;
    const d = petOf(p.key)!, st = stageOf(p.lvl);
    return `<div class="kv"><span class="lbl">${t('pet')}</span><span class="petname">${tr(d.stages[st].name)}</span></div>
      <div class="kv"><span class="lbl">${t('lv')}</span><span>${p.lvl}</span></div>
      <div class="kv"><span class="lbl">${t('exp')}</span><div class="line"><div class="grey" style="width:${(p.xp / petXpNeed(p.lvl) * 100).toFixed(0)}%"></div></div></div>
      <div class="kv"><span class="lbl">${t('bond')}</span><span class="hearts">${'♥'.repeat(p.bond)}${'♡'.repeat(BOND_MAX - p.bond)}</span></div>`;
  }

  private attHtml(): string {
    const s = this.g.s;
    const rows = SKILLS.filter(k => k.act && s.skills[k.key]).map(k => `<div class="kv"><span>${tr(k.name)}</span><span>${pct(k.act!.chance(s.skills[k.key]), 1)}</span></div>`).join('');
    return `<h3>${t('att')}</h3>${rows}`;
  }

  private lootHtml(): string {
    const l = this.g.loot;
    return `<h3>${t('loot')}</h3>
      <div class="kv"><span class="gold">$</span><span>${num(l.gold)}</span></div>
      <div class="kv"><span class="xp">${t('exp')}</span><span>${num(l.xp)}</span></div>
      ${RARITY.map((r, i) => `<div class="kv"><span style="color:${r.color}">${tr(r.name)}</span><span>${l.items[i]}</span></div>`).join('')}`;
  }

  // ---------- side views ----------

  private viewHtml(): string {
    switch (this.view) {
      case 'equip': return this.equipHtml();
      case 'pets': return this.petsHtml();
      case 'skills': return this.skillsHtml();
      case 'map': return this.mapHtml();
      case 'smith': return this.smithHtml();
      case 'titles': return this.titlesHtml();
      case 'rebirth': return this.rebirthHtml();
      case 'settings': return this.settingsHtml();
    }
  }

  private itemHtml(it: Item): string {
    const r = RARITY[it.rarity];
    let base = '';
    if (it.kind === 'weapon') { const [a, b] = weaponRange(it); base = `${t('atk')} ${Math.floor(a)}~${Math.floor(b)} · ${WEIGHTS[it.weight!].interval}s`; }
    else if (it.kind !== 'acc') { base = `${t('def')} ${Math.floor(armorDef(it))}${armorPrt(it) > 0 ? ` · ${t('prt')} ${pct(armorPrt(it), 1)}` : ''}`; }
    const aff = it.affixes.map(modText).join(' · ');
    const wt = it.weight ? `<span class="wt">${tr(WEIGHTS[it.weight].name)}</span>` : '';
    return `<div class="iname" style="color:${r.color}">${wt}${tr(nameOf(it))}${it.plus ? ' +' + it.plus : ''} <small class="dim">iLv ${it.ilvl}</small></div>
      <div class="istat">${base}${base && aff ? ' · ' : ''}${aff}</div>`;
  }

  private cpDelta(it: Item, slot: Slot): number {
    const s = this.g.s, old = s.equip[slot];
    s.equip[slot] = it;
    const after = derive(s).cp;
    s.equip[slot] = old;
    return after - this.g.d.cp;
  }

  /** BWE's paper doll: seven circles around a figure. */
  private dollSvg(): string {
    const s = this.g.s;
    const P: Record<Slot, [number, number, number, number, string]> = {
      head: [100, 20, 100, 38, '頭'], weapon: [28, 92, 66, 112, '武'], body: [174, 84, 108, 92, '身'], hands: [178, 136, 134, 116, '手'],
      acc1: [24, 150, 88, 82, '飾'], feet: [100, 238, 100, 206, '足'], acc2: [44, 214, 80, 124, '飾'],
    };
    const lines = SLOTS.map(k => { const [x, y, tx, ty] = P[k]; return `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}"/><circle class="joint" cx="${tx}" cy="${ty}" r="2.5"/>`; }).join('');
    const circles = SLOTS.map(k => {
      const [x, y, , , glyph] = P[k], it = s.equip[k], on = this.slot === k;
      const ring = it ? RARITY[it.rarity].color : 'none';
      return `<g class="slot ${on ? 'on' : ''} ${it ? 'full' : ''}" data-a="slot" data-k="${k}"><title>${tr(SLOT_NAME[k])}</title>
        <circle cx="${x}" cy="${y}" r="17" style="stroke:${ring}"/><text x="${x}" y="${y + 5}">${it && it.plus ? '+' + it.plus : glyph}</text></g>`;
    }).join('');
    return `<svg class="doll" viewBox="0 0 200 260">
      <g class="fig"><circle cx="100" cy="52" r="14"/><path d="M84 70h32l8 54h-12l-2 22 6 56h-12l-6-50-6 50h-12l6-56-2-22h-12z"/><path d="M84 72l-18 40 6 3 16-30zM116 72l18 40-6 3-16-30z"/></g>
      <g class="links">${lines}</g>${circles}</svg>`;
  }

  private equipHtml(): string {
    const s = this.g.s, sel = this.slot;
    const kind = sel === 'all' ? null : KIND_OF[sel];
    const worn = sel === 'all' ? '' : (() => {
      const it = s.equip[sel];
      return `<div class="item worn"><div class="grow"><div class="dim">${tr(SLOT_NAME[sel])}</div>${it ? this.itemHtml(it) : t('empty')}</div>${it ? `<button data-a="unequip" data-k="${sel}">${t('unequip')}</button>` : ''}</div>`;
    })();
    const bag = s.bag.filter(it => !kind || it.kind === kind).map(it => {
      const slot = sel !== 'all' && KIND_OF[sel] === it.kind ? sel : A.targetSlot(s, it);
      const dcp = this.cpDelta(it, slot);
      return `<div class="item"><div class="grow">${this.itemHtml(it)}</div><div class="acts">
        <span class="${dcp > 0 ? 'up' : dcp < 0 ? 'down' : 'dim'}">${dcp > 0 ? '▲' : dcp < 0 ? '▼' : '='}${num(Math.abs(dcp))}</span>
        <button data-a="equip" data-uid="${it.uid}">${t('equip')}</button>
        <button class="ghost" data-a="sell" data-uid="${it.uid}">$${num(sellPrice(it))}</button></div></div>`;
    }).join('') || `<p class="dim">${t('empty')}</p>`;
    const opts = RARITY.map((r, i) => `<option value="${i}" ${s.autoSell === i ? 'selected' : ''}>${i === 0 ? '-' : tr(r.name)}</option>`).join('');
    return `${this.dollSvg()}${worn}
      <div class="row between"><b>${t('bag')} ${s.bag.length}/${BAG_SIZE}${kind ? ` · ${tr(SLOT_NAME[sel as Slot])}` : ''}</b>
        <span class="row"><label class="dim">${t('autoSell')} <select data-a="autoSell">${opts}</select></label><button class="ghost" data-a="sellAll">${t('sellAll')}</button></span></div>
      ${bag}`;
  }

  private skillsHtml(): string {
    const s = this.g.s;
    const tabs = (['combat', 'magic', 'passive'] as SkillTab[]).map(k => `<button class="stab ${this.skillTab === k ? 'on' : ''}" data-a="stab" data-k="${k}">${t(k)}</button>`).join('');
    const rows = SKILLS.filter(k => k.tab === this.skillTab).map(k => {
      const r = s.skills[k.key] || 0, cost = rankCost(r), max = r >= MAX_RANK, can = !max && s.ap >= cost;
      return `<div class="skill ${can ? 'can' : ''}"><div class="sico">${tr(k.name).slice(0, 1)}</div>
        <div class="grow"><div class="sname">${tr(k.name)} <b>${r ? RANKS[r] : ''}</b></div>
        <div class="istat">${r ? tr(k.desc(r)) : ''}${max ? '' : `${r ? '<br>' : ''}→ ${RANKS[r + 1]}: ${tr(k.desc(r + 1))}`}</div></div>
        ${max ? `<span class="dim">${t('maxed')}</span>` : `<button class="up-btn" data-a="learn" data-k="${k.key}" ${can ? '' : 'disabled'} title="${cost} AP">▲<small>${cost}</small></button>`}</div>`;
    }).join('');
    return `<div class="stabs">${tabs}</div><p class="dim">AP ${s.ap}</p>${rows}`;
  }

  private mapHtml(): string {
    const { s, d } = this.g;
    return AREAS.map((a, i) => {
      const here = s.area === a.key, cp = AREA_CP[i];
      const cls = d.cp >= cp ? 'up' : d.cp >= cp * 0.6 ? 'warn' : 'down';
      const pals = PETS.filter(p => p.home === a.key && !p.hidden).map(p => s.pets.some(x => x.key === p.key) ? tr(p.stages[0].name) : '？').join(' · ');
      return `<div class="item ${here ? 'here' : ''}"><div class="swatch" style="background:${a.bg}"></div>
        <div class="grow"><div class="iname">${tr(a.name)} <small class="dim">Lv ${a.min}–${a.max}</small></div>
        <div class="istat">${t('recArea')} <b class="${cls}">${num(cp)}</b> · ${tr(a.flavor)}${pals ? ` · ${t('pet')}: ${pals}` : ''}</div></div>
        ${here ? `<span class="dim">${t('here')}</span>` : `<button data-a="go" data-k="${a.key}">${t('go')}</button>`}</div>`;
    }).join('');
  }

  private smithHtml(): string {
    const g = this.g, s = g.s;
    const list = [...SLOTS.map(k => s.equip[k]).filter(Boolean) as Item[], ...s.bag];
    return `<p class="dim">${lang === 'zh' ? '每 +1 增加基礎數值 10%。' : 'Each +1 adds 10% to base numbers.'} ⚠ ${t('failDrop')}</p>` + list.map(it => {
      if (it.plus >= SMITH_MAX) return `<div class="item"><div class="grow">${this.itemHtml(it)}</div><span class="dim">${t('maxed')}</span></div>`;
      const cost = smithCost(it.ilvl, it.plus), ch = A.smithChance(g, it);
      return `<div class="item"><div class="grow">${this.itemHtml(it)}</div><div class="acts">
        <span class="dim">+${it.plus}→+${it.plus + 1} ${pct(ch)}${it.plus >= SMITH_DROP_FROM ? ' ⚠' : ''}</span>
        <button data-a="smith" data-uid="${it.uid}" ${s.gold < cost ? 'disabled' : ''}>$${num(cost)}</button></div></div>`;
    }).join('');
  }

  private petsHtml(): string {
    const s = this.g.s;
    const owned = s.pets.map(p => {
      const d = petOf(p.key)!, st = stageOf(p.lvl), on = s.activePet === p.key, next = STAGE_LV[st + 1];
      return `<div class="item ${on ? 'here' : ''}"><div class="dot" style="background:${d.stages[st].color}"></div>
        <div class="grow"><div class="iname">${tr(d.stages[st].name)} <small class="dim">Lv ${p.lvl}${next ? ` → Lv ${next}` : ''}</small></div>
        <div class="istat">${tr(d.ability)} · <span class="hearts">${'♥'.repeat(p.bond)}${'♡'.repeat(BOND_MAX - p.bond)}</span></div>
        <p class="lore">${tr(d.lore)}</p></div>
        ${on ? `<span class="dim">${t('active')}</span>` : `<button data-a="pet" data-k="${p.key}">${t('call')}</button>`}</div>`;
    }).join('');
    const unknown = PETS.filter(p => !p.hidden && !s.pets.some(x => x.key === p.key)).map(p =>
      `<div class="item faded"><div class="dot q">?</div><div class="grow"><div class="iname">${t('unknownPet')}</div><div class="istat">${t('petHint')}：${tr(AREAS.find(a => a.key === p.home)!.name)}</div></div></div>`).join('');
    return owned + unknown;
  }

  private titlesHtml(): string {
    const s = this.g.s;
    return TITLES.map(ti => {
      const got = s.titles.includes(ti.key);
      if (ti.secret && !got) return `<div class="item faded"><div class="grow"><div class="iname">？？？</div></div></div>`;
      return `<div class="item ${got ? 'here' : 'faded'}"><div class="grow"><div class="iname">${got ? '★' : '☆'} ${tr(ti.name)}</div><div class="istat">${tr(ti.how)} · ${ti.mods.map(modText).join(' · ')}</div></div></div>`;
    }).join('') + `<p class="dim">${t('kills')} ${num(s.counters.kills)} · ${t('deaths')} ${num(s.counters.deaths)} · ${t('rebirths')} ${s.counters.rebirths}</p>`;
  }

  private rebirthHtml(): string {
    const s = this.g.s, ok = s.age >= REBIRTH_AGE;
    const gain = PRIMARY.map(k => `${tr(STAT[k])} +${Math.floor(s.grown[k] * LEGACY_RATE)}`).join(' · ');
    return `<p>${t('rebirthKeep')}</p><p class="dim">${gain}</p>
      ${raceAgePicker(this.rbRace, this.rbAge, 'rbRace', 'rbAge')}
      <p><button class="big" data-a="rebirth" ${ok ? '' : 'disabled'}>${ok ? t('rebirthDo') : t('rebirthNeed') + ` (${s.age})`}</button></p>`;
  }

  private settingsHtml(): string {
    return `<div class="row"><b>${t('language')}</b><button data-a="lang" data-k="zh" ${lang === 'zh' ? 'disabled' : ''}>中文</button><button data-a="lang" data-k="en" ${lang === 'en' ? 'disabled' : ''}>English</button></div>
      <p><button class="ghost" data-a="reset">${t('reset')}</button></p><p class="dim">${t('credits')}</p>`;
  }
}

/** Race list + age figures + growth readout. Shared by the creation screen and rebirth. */
export function raceAgePicker(race: string, age: number, raceAction: string, ageAction: string): string {
  const r = raceOf(race), g = ageGrowth(r, age);
  const list = RACES.map(x => `<button class="rrow ${x.key === race ? 'on' : ''}" data-a="${raceAction}" data-k="${x.key}"><span class="rico">${x.icon}</span><span>${tr(x.name)}</span></button>`).join('');
  const figs = START_AGES.map(a => `<button class="fig ${a === age ? 'on' : ''}" data-a="${ageAction}" data-k="${a}" title="${a}" style="--h:${28 + (a - 10) * 3}px"><i></i><b></b></button>`).join('');
  const line = (o: Record<string, number>, plus: boolean) => PRIMARY.map(k => `${tr(STAT[k])}${plus ? '+' : ' '}${o[k]}`).join('  ');
  return `<div class="picker"><div class="rlist">${list}</div><div class="rinfo">
      <div class="agehead">${t('age')}:${age}</div><div class="figs">${figs}</div>
      <p>${t('initStat')}: ${line(r.base, false)}</p>
      <p>${t('ageGrowth')}: ${line(g, true)}</p><p class="dim small">${t('levelShare')}</p>
      <p class="dim">${tr(r.desc)}</p></div></div>`;
}

/** Title screen, then creation. */
export function creation(root: HTMLElement, done: (name: string, race: string, age: number) => void): void {
  let race = 'human', age = 13, name = lang === 'zh' ? '勇者' : 'Hero';
  const titleScreen = () => {
    root.innerHTML = `<div class="title"><h1 class="glow">${t('title')}</h1><p class="tagline">${t('tagline')}</p><button class="link" id="t-play">${t('play')}</button></div>`;
    root.querySelector<HTMLElement>('#t-play')!.onclick = draw;
  };
  const draw = () => {
    root.innerHTML = `<div class="create"><h1 class="glow small">${t('title')}</h1>
      <label class="kv"><span class="lbl">${t('name')}</span><input id="c-name" maxlength="12" value="${esc(name)}" /></label>
      ${raceAgePicker(race, age, 'cRace', 'cAge')}
      <button class="link big" id="c-go">${t('ok')}</button></div>`;
    root.querySelectorAll<HTMLElement>('[data-a="cRace"]').forEach(b => b.onclick = () => { keep(); race = b.dataset.k!; draw(); });
    root.querySelectorAll<HTMLElement>('[data-a="cAge"]').forEach(b => b.onclick = () => { keep(); age = Number(b.dataset.k); draw(); });
    root.querySelector<HTMLElement>('#c-go')!.onclick = () => { keep(); done((name.trim() || 'Hero').slice(0, 12), race, age); };
  };
  const keep = () => { name = (root.querySelector('#c-name') as HTMLInputElement).value; };
  titleScreen();
}
