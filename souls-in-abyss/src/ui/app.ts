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
import { icon, ICONS } from './icons';
import { curseOf, giftOf, type PactDef } from '../data/pacts';
import { SAN_TIERS, sanTier, willResist } from '../data/sanity';
import { SAN_MAX } from '../game/state';

type View = 'equip' | 'pets' | 'skills' | 'map' | 'smith' | 'titles' | 'rebirth' | 'settings';
const NAV: [View, keyof typeof UI][] = [
  ['equip', 'navEquip'], ['pets', 'navPets'], ['skills', 'navSkills'], ['map', 'navMap'],
  ['smith', 'navSmith'], ['titles', 'navTitles'], ['rebirth', 'navRebirth'], ['settings', 'navSettings'],
];
const STAT: Record<string, L> = {
  str: { zh: '力量', en: 'STR' }, dex: { zh: '靈巧', en: 'DEX' }, int: { zh: '智力', en: 'INT' }, will: { zh: '意志', en: 'WILL' }, luk: { zh: '幸運', en: 'LUCK' },
  hp: { zh: 'HP', en: 'HP' }, mp: { zh: 'MP', en: 'MP' }, atk: { zh: '攻擊', en: 'ATK' }, atkMin: { zh: '最小攻擊', en: 'Min ATK' }, atkMax: { zh: '最大攻擊', en: 'Max ATK' },
  bal: { zh: '平衡', en: 'BAL' }, crit: { zh: '爆擊', en: 'CRT' }, def: { zh: '防禦', en: 'DEF' }, prt: { zh: '保護', en: 'PRT' },
  speed: { zh: '攻速', en: 'Speed' }, magic: { zh: '魔力', en: 'Magic' }, xp: { zh: 'EXP', en: 'EXP' }, gold: { zh: '金幣', en: 'Gold' }, drop: { zh: '掉寶', en: 'Drops' },
  petPower: { zh: '夥伴傷害', en: 'Pal damage' }, sanDrain: { zh: 'SAN 流失', en: 'SAN loss' }, dmgTaken: { zh: '受到傷害', en: 'Damage taken' }, guard: { zh: '減傷', en: 'Guard' }, petHeal: { zh: '夥伴治療', en: 'Pal heal' }, heal: { zh: '擊倒回復', en: 'Kill heal' },
};
const SLOT_NAME: Record<Slot, L> = {
  weapon: { zh: '武器', en: 'Weapon' }, head: { zh: '頭', en: 'Head' }, body: { zh: '身體', en: 'Body' }, hands: { zh: '手', en: 'Hands' },
  feet: { zh: '腳', en: 'Feet' }, acc1: { zh: '飾品 1', en: 'Accessory 1' }, acc2: { zh: '飾品 2', en: 'Accessory 2' },
};
const KIND_OF: Record<Slot, Kind> = { weapon: 'weapon', head: 'head', body: 'body', hands: 'hands', feet: 'feet', acc1: 'acc', acc2: 'acc' };
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
    g.on(e => { if (e.t === 'log') this.addLog(e.parts, e.cls); });
  }

  private build(): void {
    // battle bars carry no numbers: the log already reports every hit, and big numbers would squeeze the bars
    const bar = (id: string, cls: string, lbl: string) =>
      `<div class="kv bar"><span class="lbl">${lbl}</span><div class="line"><div id="${id}" class="${cls}"></div></div></div>`;
    this.root.innerHTML = `
      <div class="game">
        <section class="box sheet" id="sheet"></section>
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
        <section class="box log" id="log"></section>
        <section class="box att" id="att"></section>
        <section class="box loot" id="loot"></section>
        <section class="box side">
          <nav class="nav">${NAV.map(([k, l]) => `<button class="ico" data-a="view" data-k="${k}" title="${t(l)}" aria-label="${t(l)}"><span>${icon(k)}</span></button>`).join('')}</nav>
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
      case 'go': A.goArea(g, k); this.mapSel = null; break;
      case 'mapsel': this.mapSel = k; break;
      case 'pet': A.setPet(g, k || null); break;
      case 'rbRace': this.rbRace = k; break;
      case 'rbAge': this.rbAge = Number(k); break;
      case 'rbPact': this.rbPact = Number(k); break;
      case 'rebirth': A.rebirth(g, this.rbRace, this.rbAge, this.rbPact); this.rbPact = -1; break;
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
    this.text('m-cp', num(m.cp)); this.text('s-cp', num(g.d.cp));
    this.width('m-hp', m.hp / m.maxHp);
    this.width('s-san', g.s.san / SAN_MAX);
    const tier = SAN_TIERS[sanTier(g.s.san)];
    this.text('s-san-v', tr(tier.name)); (document.getElementById('s-san-v') as HTMLElement).style.color = tier.color;
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
      return `<div class="kv"><span class="lbl">${icon(k, 'gi sm')}${tr(STAT[k])}</span><span class="val ${v > b ? 'boost' : 'stat'}">${v}</span><span class="dim">(${b})</span></div>`;
    };
    return `<div class="col">
        <div class="kv"><span class="lbl">${t('name')}</span><span>${esc(s.name)}</span></div>
        <div class="kv"><span class="lbl">${t('race')}</span><span>${tr(r.name)}</span></div>
        <div class="kv"><span class="lbl">${t('age')}</span><span>${s.age} <small class="dim">${clock(YEAR_SEC - s.ageT)}</small></span></div>
        <div class="kv"><span class="lbl">${t('lv')}</span><span>${s.lvl}</span></div>
        <div class="kv bar"><span class="lbl">${t('exp')}</span><div class="line"><div id="s-xp" class="grey"></div></div></div>
        <div class="kv bar"><span class="lbl">${t('san')}</span><div class="line"><div id="s-san" class="purple"></div></div><span class="v" id="s-san-v"></span></div>
        <div class="kv"><span class="lbl">${t('gold')}</span><span>${num(s.gold)}</span></div>
        ${this.pactLine()}
      </div>
      <div class="col">${PRIMARY.map(stat).join('')}
        <div class="kv"><span class="lbl">${t('ap')}</span><span>${s.ap}</span></div>
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
      <div class="kv"><span class="lbl">${t('bond')}</span><span class="hearts">${hearts(p.bond)}</span></div>`;
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
    // [circle x, y, joint x, y] on a 200x260 board; the figure is game-icons' "person"
    const P: Record<Slot, [number, number, number, number]> = {
      head: [100, 18, 100, 44], weapon: [26, 96, 64, 118], body: [174, 86, 112, 96], hands: [178, 140, 136, 120],
      acc1: [24, 156, 90, 84], feet: [100, 242, 100, 214], acc2: [46, 218, 84, 150],
    };
    const ico = (name: string, x: number, y: number, s: number) => `<svg x="${x - s / 2}" y="${y - s / 2}" width="${s}" height="${s}" viewBox="0 0 512 512"><path d="${ICONS[name]}"/></svg>`;
    const lines = SLOTS.map(k => { const [x, y, tx, ty] = P[k]; return `<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}"/><circle class="joint" cx="${tx}" cy="${ty}" r="2.5"/>`; }).join('');
    const circles = SLOTS.map(k => {
      const [x, y] = P[k], it = s.equip[k], on = this.slot === k;
      const ring = it ? RARITY[it.rarity].color : 'none';
      return `<g class="slot ${on ? 'on' : ''} ${it ? 'full' : ''}" data-a="slot" data-k="${k}"><title>${tr(SLOT_NAME[k])}</title>
        <circle cx="${x}" cy="${y}" r="17" style="${it && !on ? `fill:${ring}` : ''}"/>${ico('slot-' + k, x, y, 22)}${it && it.plus ? `<text class="plus" x="${x + 15}" y="${y + 18}">+${it.plus}</text>` : ''}</g>`;
    }).join('');
    return `<svg class="doll" viewBox="0 0 200 260">
      <g class="fig">${ico('figure', 100, 128, 200)}</g>
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
        <span class="${dcp > 0 ? 'up' : dcp < 0 ? 'down' : 'dim'}">${dcp ? icon('arrow', dcp > 0 ? 'gi sm pointup' : 'gi sm') : ''}${num(Math.abs(dcp))}</span>
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
      return `<div class="skill ${can ? 'can' : ''}"><div class="sico">${icon('sk-' + k.key)}</div>
        <div class="grow"><div class="sname">${tr(k.name)} <b>${r ? RANKS[r] : ''}</b></div>
        <div class="istat">${r ? tr(k.desc(r)) : ''}${max ? '' : `${r ? '<br>' : ''}${icon('arrow', 'gi sm pointup')}${RANKS[r + 1]}: ${tr(k.desc(r + 1))}`}</div></div>
        ${max ? `<span class="dim">${t('maxed')}</span>` : `<button class="up-btn" data-a="learn" data-k="${k.key}" ${can ? '' : 'disabled'} title="${cost} ${t('ap')}">${icon('arrow', 'gi pointup')}<small>${cost}</small></button>`}</div>`;
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
    return `<div class="mapboard"><svg class="maproute" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg>${nodes}</div>${card}`;
  }

  private smithHtml(): string {
    const g = this.g, s = g.s;
    const list = [...SLOTS.map(k => s.equip[k]).filter(Boolean) as Item[], ...s.bag];
    return `<p class="dim">${lang === 'zh' ? '每 +1 增加基礎數值 10%。' : 'Each +1 adds 10% to base numbers.'} ${icon('hazard', 'gi sm')}${t('failDrop')}</p>` + list.map(it => {
      if (it.plus >= SMITH_MAX) return `<div class="item"><div class="grow">${this.itemHtml(it)}</div><span class="dim">${t('maxed')}</span></div>`;
      const cost = smithCost(it.ilvl, it.plus), ch = A.smithChance(g, it);
      return `<div class="item"><div class="grow">${this.itemHtml(it)}</div><div class="acts">
        <span class="dim">+${it.plus}→+${it.plus + 1} ${pct(ch)}${it.plus >= SMITH_DROP_FROM ? icon('hazard', 'gi sm') : ''}</span>
        <button data-a="smith" data-uid="${it.uid}" ${s.gold < cost ? 'disabled' : ''}>$${num(cost)}</button></div></div>`;
    }).join('');
  }

  private petsHtml(): string {
    const s = this.g.s;
    const owned = s.pets.map(p => {
      const d = petOf(p.key)!, st = stageOf(p.lvl), on = s.activePet === p.key, next = STAGE_LV[st + 1];
      return `<div class="item ${on ? 'here' : ''}"><div class="dot" style="background:${d.stages[st].color}">${icon('pet-' + p.key)}</div>
        <div class="grow"><div class="iname">${tr(d.stages[st].name)} <small class="dim">Lv ${p.lvl}${next ? ` → Lv ${next}` : ''}</small></div>
        <div class="istat">${tr(d.ability)} · <span class="hearts">${hearts(p.bond)}</span></div>
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

  private rebirthHtml(): string {
    const s = this.g.s, ok = s.age >= REBIRTH_AGE;
    const gain = PRIMARY.map(k => `${tr(STAT[k])} +${Math.floor(s.grown[k] * LEGACY_RATE)}`).join(' · ');
    return `<p>${t('rebirthKeep')}</p><p class="dim">${gain}</p>
      ${raceAgePicker(this.rbRace, this.rbAge, 'rbRace', 'rbAge')}
      ${ok ? this.offersHtml() : ''}
      <p><button class="big" data-a="rebirth" ${ok ? '' : 'disabled'}>${ok ? t('rebirthDo') : t('rebirthNeed') + ` (${s.age})`}</button></p>`;
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
    return `<div class="row"><b>${t('language')}</b><button data-a="lang" data-k="zh" ${lang === 'zh' ? 'disabled' : ''}>中文</button><button data-a="lang" data-k="en" ${lang === 'en' ? 'disabled' : ''}>English</button></div>
      <p><button class="ghost" data-a="reset">${t('reset')}</button></p>
      <p class="dim">${t('credits')}</p><p class="dim">Icons: Lorc, Delapouite, Skoll / game-icons.net (CC BY 3.0)</p>`;
  }
}

/** game-icons' "person", cropped to its body and scaled taller for older ages. */
const figure = (h: number) => `<svg class="pict" viewBox="136 16 240 480" style="height:${h}px;width:${h / 2}px" aria-hidden="true"><path d="${ICONS.figure}"/></svg>`;

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
