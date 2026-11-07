import type { Game } from '../game/engine';
import { PRIMARY, SLOTS, type Item, type Save, type Slot } from '../game/types';
import { lang, setLang, t, tr, UI } from '../core/i18n';
import { clock, num, pct } from '../core/fmt';
import { derive, itemAtk, itemDef, xpNeed } from '../game/stats';
import { nameOf, sellPrice } from '../game/loot';
import { RACES, raceOf } from '../data/races';
import { RARITY, SMITH_DROP_FROM, SMITH_MAX, WEIGHTS, smithCost } from '../data/items';
import { SKILLS } from '../data/skills';
import { AREAS } from '../data/areas';
import { AREA_CP } from '../game/monsters';
import { PETS, BOND_MAX, STAGE_LV, petOf, petXpNeed, stageOf } from '../data/pets';
import { TITLES } from '../data/titles';
import { LEGACY_RATE, REBIRTH_AGE, YEAR_SEC, clearSave } from '../game/state';
import { Scene } from './scene';
import * as A from '../game/actions';

type Tab = 'char' | 'equip' | 'smith' | 'skills' | 'map' | 'pets' | 'titles' | 'rebirth';
const TABS: [Tab, keyof typeof UI][] = [
  ['char', 'tabChar'], ['equip', 'tabEquip'], ['smith', 'tabSmith'], ['skills', 'tabSkills'],
  ['map', 'tabMap'], ['pets', 'tabPets'], ['titles', 'tabTitles'], ['rebirth', 'tabRebirth'],
];
const STAT_NAME: Record<string, { zh: string; en: string }> = {
  str: { zh: '力量', en: 'STR' }, dex: { zh: '靈巧', en: 'DEX' }, int: { zh: '智力', en: 'INT' },
  vit: { zh: '體力', en: 'VIT' }, agi: { zh: '敏捷', en: 'AGI' }, luk: { zh: '幸運', en: 'LUK' },
  hp: { zh: 'HP', en: 'HP' }, atk: { zh: '攻擊', en: 'ATK' }, def: { zh: '防禦', en: 'DEF' }, speed: { zh: '攻速', en: 'Speed' },
  crit: { zh: '爆擊', en: 'Crit' }, xp: { zh: '經驗', en: 'XP' }, gold: { zh: '金幣', en: 'Gold' }, drop: { zh: '掉寶', en: 'Drops' },
};
const esc = (x: string) => x.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export class App {
  private tab: Tab = 'char';
  private root: HTMLElement;
  private panel!: HTMLElement;
  private logEl!: HTMLElement;
  private lastPanel = '';
  private scene: Scene;
  private rbRace: string; private rbAge = 17;

  constructor(private g: Game, root: HTMLElement) {
    this.root = root;
    this.rbRace = g.s.race;
    this.scene = new Scene(g);
    this.build();
    g.on(e => { if (e.t === 'log') this.addLog(e.text, e.cls); });
  }

  private build(): void {
    this.root.innerHTML = `
      <header class="bar">
        <div class="who"><b id="h-name"></b> <span id="h-race"></span></div>
        <div class="chips">
          <span class="chip"><i>${t('lv')}</i><b id="h-lv"></b></span>
          <span class="chip"><i>${t('age')}</i><b id="h-age"></b></span>
          <span class="chip gold"><i>${t('gold')}</i><b id="h-gold"></b></span>
          <span class="chip"><i>${t('ap')}</i><b id="h-ap"></b></span>
          <span class="chip cp"><i>${t('cp')}</i><b id="h-cp"></b></span>
        </div>
        <button class="lang" data-a="lang">${lang === 'zh' ? 'EN' : '中文'}</button>
      </header>
      <main class="layout">
        <section class="left">
          <div class="stage"></div>
          <div class="bars">
            <div class="bar-row"><span>${t('hp')}</span><div class="meter hp"><div id="m-hp"></div></div><em id="t-hp"></em></div>
            <div class="bar-row"><span>XP</span><div class="meter xp"><div id="m-xp"></div></div><em id="t-xp"></em></div>
            <div class="bar-row"><span id="t-mon"></span><div class="meter mon"><div id="m-mon"></div></div><em id="t-monhp"></em></div>
          </div>
          <div class="log" id="log"></div>
        </section>
        <section class="right">
          <nav class="tabs">${TABS.map(([k, l]) => `<button data-a="tab" data-k="${k}">${t(l)}</button>`).join('')}</nav>
          <div class="panel" id="panel"></div>
        </section>
      </main>`;
    this.root.querySelector('.stage')!.appendChild(this.scene.cv);
    this.panel = this.root.querySelector('#panel')!;
    this.logEl = this.root.querySelector('#log')!;
    this.root.addEventListener('click', e => this.onClick(e));
    this.root.addEventListener('change', e => this.onChange(e));
    this.root.addEventListener('input', e => this.onChange(e));
    this.selectTab(this.tab);
  }

  private selectTab(k: Tab): void {
    this.tab = k;
    this.root.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', (b as HTMLElement).dataset.k === k));
    this.lastPanel = '';
    this.renderPanel();
  }

  private onClick(e: Event): void {
    const el = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
    if (!el || (el as HTMLButtonElement).disabled) return;
    const a = el.dataset.a!, k = el.dataset.k || '', uid = Number(el.dataset.uid);
    const g = this.g;
    switch (a) {
      case 'tab': this.selectTab(k as Tab); return;
      case 'lang': setLang(lang === 'zh' ? 'en' : 'zh'); location.reload(); return;
      case 'equip': A.equip(g, uid); break;
      case 'unequip': A.unequip(g, k as Slot); break;
      case 'sell': A.sell(g, uid); break;
      case 'sellAll': A.sellAll(g); break;
      case 'smith': A.upgrade(g, uid); break;
      case 'learn': A.learn(g, k); break;
      case 'go': A.goArea(g, k); break;
      case 'pet': A.setPet(g, k || null); break;
      case 'rbRace': this.rbRace = k; break;
      case 'rebirth': A.rebirth(g, this.rbRace, this.rbAge); break;
      case 'reset': if (confirm(t('resetConfirm'))) { clearSave(); (window as any).__noSave = true; location.reload(); } return;
    }
    this.lastPanel = '';
    this.renderPanel();
  }

  private onChange(e: Event): void {
    const el = e.target as HTMLInputElement | HTMLSelectElement;
    if (el.dataset.a === 'autoSell') { this.g.s.autoSell = Number(el.value); }
    if (el.dataset.a === 'rbAge') { this.rbAge = Number(el.value); this.lastPanel = ''; this.renderPanel(); }
  }

  addLog(text: string, cls = ''): void {
    const p = document.createElement('p');
    p.className = cls; p.textContent = text;
    this.logEl.prepend(p);
    while (this.logEl.childElementCount > 80) this.logEl.lastElementChild!.remove();
  }

  /** Called every frame: canvas + live numbers. */
  frame(dt: number): void {
    this.scene.draw(dt);
    const g = this.g, s = g.s, d = g.d;
    const set = (id: string, v: string) => { const el = document.getElementById(id); if (el && el.textContent !== v) el.textContent = v; };
    const w = (id: string, f: number) => { const el = document.getElementById(id); if (el) el.style.width = Math.max(0, Math.min(100, f * 100)).toFixed(1) + '%'; };
    set('h-name', s.name); set('h-race', tr(raceOf(s.race).name));
    set('h-lv', String(s.lvl)); set('h-age', `${s.age} · ${clock(YEAR_SEC - s.ageT)}`);
    set('h-gold', num(s.gold)); set('h-ap', String(s.ap)); set('h-cp', num(d.cp));
    w('m-hp', g.hp / d.hp); set('t-hp', `${num(g.hp)}/${num(d.hp)}`);
    w('m-xp', s.xp / xpNeed(s.lvl)); set('t-xp', pct(s.xp / xpNeed(s.lvl), 1));
    const m = g.mon;
    set('t-mon', `${tr(m.def.name)} Lv${m.lvl}`); w('m-mon', m.hp / m.maxHp); set('t-monhp', num(Math.max(0, m.hp)));
  }

  /** Called a few times a second; only touches the DOM when the panel's HTML changed. */
  renderPanel(): void {
    const html = this.panelHtml();
    if (html === this.lastPanel) return;
    this.lastPanel = html;
    const st = this.panel.scrollTop;
    this.panel.innerHTML = html;
    this.panel.scrollTop = st;
  }

  private panelHtml(): string {
    switch (this.tab) {
      case 'char': return this.charHtml();
      case 'equip': return this.equipHtml();
      case 'smith': return this.smithHtml();
      case 'skills': return this.skillsHtml();
      case 'map': return this.mapHtml();
      case 'pets': return this.petsHtml();
      case 'titles': return this.titlesHtml();
      case 'rebirth': return this.rebirthHtml();
    }
  }

  // ---------- panels ----------

  private charHtml(): string {
    const { s, d } = this.g, r = raceOf(s.race);
    const rows = PRIMARY.map(k => `<tr><th>${tr(STAT_NAME[k])}</th><td>${Math.floor(d.prim[k])}</td><td class="dim">${lang === 'zh' ? '永久' : 'legacy'} +${Math.floor(s.legacy[k])}</td></tr>`).join('');
    return `
      <h3>${esc(s.name)} · ${tr(r.name)}</h3><p class="dim">${tr(r.desc)}</p>
      <div class="cols">
        <div><h4>${t('stats')}</h4><table class="kv">${rows}</table></div>
        <div><h4>${t('derived')}</h4><table class="kv">
          <tr><th>${t('hp')}</th><td>${num(d.hp)}</td></tr>
          <tr><th>${t('atk')}</th><td>${num(d.atk)}</td></tr>
          <tr><th>${lang === 'zh' ? '魔力' : 'Magic'}</th><td>${num(d.magic)}</td></tr>
          <tr><th>${t('def')}</th><td>${num(d.def)}</td></tr>
          <tr><th>${t('aspd')}</th><td>${d.interval.toFixed(2)}s</td></tr>
          <tr><th>${t('crit')}</th><td>${pct(d.crit, 1)} ×${d.critDmg.toFixed(2)}</td></tr>
          <tr><th>${t('eva')}</th><td>${pct(d.eva, 1)}</td></tr>
          <tr><th>${tr(STAT_NAME.xp)} / ${tr(STAT_NAME.gold)} / ${tr(STAT_NAME.drop)}</th><td>${pct(d.xp)} / ${pct(d.gold)} / ${pct(d.drop)}</td></tr>
        </table></div>
      </div>
      <table class="kv small"><tr><th>${t('kills')}</th><td>${num(s.counters.kills)}</td><th>${t('deaths')}</th><td>${num(s.counters.deaths)}</td><th>${t('rebirths')}</th><td>${s.counters.rebirths}</td></tr></table>
      <p><button class="ghost" data-a="reset">${t('reset')}</button></p>`;
  }

  private itemLine(it: Item): string {
    const r = RARITY[it.rarity];
    const base = it.slot === 'weapon' ? `${t('atk')} ${num(itemAtk(it))} · ${WEIGHTS[it.weight!].interval}s`
      : it.slot === 'armor' ? `${t('def')} ${num(itemDef(it))}${WEIGHTS[it.weight!].eva ? ' · ' + t('eva') + ' ' + pct(WEIGHTS[it.weight!].eva) : ''}${WEIGHTS[it.weight!].speedPenalty ? ' · ' + (lang === 'zh' ? '攻速 -10%' : 'speed -10%') : ''}` : '';
    const aff = it.affixes.map(m => `${tr(STAT_NAME[m.key] || { zh: m.key, en: m.key })} +${m.add !== undefined ? (m.key === 'crit' ? pct(m.add, 1) : m.add) : pct(m.mul!, 1)}`).join(' · ');
    const wt = it.weight ? `<span class="wt">${tr(WEIGHTS[it.weight].name)}</span>` : '';
    return `<div class="iname" style="color:${r.color}">${wt}${tr(nameOf(it))}${it.plus ? ' +' + it.plus : ''} <small>iLv ${it.ilvl}</small></div>
      <div class="istat">${base}${base && aff ? ' · ' : ''}${aff}</div>`;
  }

  private cpDelta(it: Item): number {
    const s = this.g.s, old = s.equip[it.slot];
    const before = this.g.d.cp;
    s.equip[it.slot] = it;
    const after = derive(s).cp;
    s.equip[it.slot] = old;
    return after - before;
  }

  private equipHtml(): string {
    const s = this.g.s;
    const slotName: Record<Slot, { zh: string; en: string }> = { weapon: { zh: '武器', en: 'Weapon' }, armor: { zh: '防具', en: 'Armor' }, ring: { zh: '戒指', en: 'Ring' }, amulet: { zh: '護符', en: 'Amulet' } };
    const worn = SLOTS.map(k => {
      const it = s.equip[k];
      return `<div class="item worn"><div class="slot">${tr(slotName[k])}</div>${it ? `<div class="grow">${this.itemLine(it)}</div><button class="ghost" data-a="unequip" data-k="${k}">✕</button>` : `<div class="grow dim">${t('empty')}</div>`}</div>`;
    }).join('');
    const bag = s.bag.map(it => {
      const dcp = this.cpDelta(it);
      return `<div class="item"><div class="slot">${tr(slotName[it.slot])}</div><div class="grow">${this.itemLine(it)}</div>
        <div class="acts"><span class="${dcp > 0 ? 'up' : dcp < 0 ? 'down' : 'dim'}">${dcp > 0 ? '▲' : dcp < 0 ? '▼' : '='}${num(Math.abs(dcp))}</span>
        <button data-a="equip" data-uid="${it.uid}">${t('equip')}</button>
        <button class="ghost" data-a="sell" data-uid="${it.uid}">${t('sell')} ${num(sellPrice(it))}</button></div></div>`;
    }).join('') || `<p class="dim">${t('empty')}</p>`;
    const opts = RARITY.map((r, i) => `<option value="${i}" ${s.autoSell === i ? 'selected' : ''}>${i === 0 ? (lang === 'zh' ? '不賣' : 'off') : tr(r.name)}</option>`).join('');
    return `<h4>${t('equipped')}</h4>${worn}
      <div class="row between"><h4>${t('bag')} ${s.bag.length}/30</h4>
        <div class="row"><label class="dim">${t('autoSell')} <select data-a="autoSell">${opts}</select></label>
        <button class="ghost" data-a="sellAll">${t('sellAll')}</button></div></div>${bag}`;
  }

  private smithHtml(): string {
    const g = this.g, s = g.s;
    const list = [...SLOTS.map(k => s.equip[k]).filter(Boolean) as Item[], ...s.bag];
    const rows = list.map(it => {
      if (it.plus >= SMITH_MAX) return `<div class="item"><div class="grow">${this.itemLine(it)}</div><span class="dim">${t('maxed')}</span></div>`;
      const cost = smithCost(it.ilvl, it.plus), ch = A.smithChance(g, it);
      return `<div class="item"><div class="grow">${this.itemLine(it)}</div>
        <div class="acts"><span class="dim">+${it.plus}→+${it.plus + 1} · ${t('chance')} ${pct(ch)}${it.plus >= SMITH_DROP_FROM ? ' ⚠' : ''}</span>
        <button data-a="smith" data-uid="${it.uid}" ${s.gold < cost ? 'disabled' : ''}>${t('upgrade')} ${num(cost)}</button></div></div>`;
    }).join('');
    return `<p class="dim">${lang === 'zh' ? '每 +1 增加基礎攻擊或防禦 10%。' : 'Each +1 adds 10% base ATK or DEF.'} ⚠ ${t('failDrop')}</p>${rows}`;
  }

  private skillsHtml(): string {
    const s = this.g.s;
    return `<p><b>${t('ap')} ${s.ap}</b> <span class="dim">${lang === 'zh' ? '每次生日與每 5 級獲得 AP' : 'AP comes from birthdays and every 5 levels'}</span></p>` + SKILLS.map(d => {
      const lv = s.skills[d.key] || 0, cost = d.cost(lv), max = lv >= d.max;
      return `<div class="item"><div class="grow"><div class="iname">${tr(d.name)} <small>${lv}/${d.max}</small></div>
        <div class="istat">${lv ? tr(d.desc(lv)) : t('locked')}${max ? '' : ` → <span class="up">${tr(d.desc(lv + 1))}</span>`}</div></div>
        ${max ? `<span class="dim">${t('maxed')}</span>` : `<button data-a="learn" data-k="${d.key}" ${s.ap < cost ? 'disabled' : ''}>${t('learn')} ${cost} AP</button>`}</div>`;
    }).join('');
  }

  private mapHtml(): string {
    const { s, d } = this.g;
    return AREAS.map((a, i) => {
      const here = s.area === a.key, cp = AREA_CP[i];
      const cls = d.cp >= cp ? 'up' : d.cp >= cp * 0.6 ? 'warn' : 'down';
      const pals = PETS.filter(p => p.home === a.key && !p.hidden).map(p => s.pets.some(x => x.key === p.key) ? tr(p.stages[0].name) : '？').join(' · ');
      return `<div class="item area ${here ? 'here' : ''}"><div class="swatch" style="background:${a.bg}"></div>
        <div class="grow"><div class="iname">${tr(a.name)} <small>Lv ${a.min}–${a.max}</small></div>
        <div class="istat">${t('recArea')} <span class="${cls}">${num(cp)}</span> · ${tr(a.flavor)}${pals ? ` · ${lang === 'zh' ? '夥伴' : 'Pals'}: ${pals}` : ''}</div></div>
        ${here ? `<span class="dim">${t('here')}</span>` : `<button data-a="go" data-k="${a.key}">${t('go')}</button>`}</div>`;
    }).join('');
  }

  private petsHtml(): string {
    const s = this.g.s;
    const owned = s.pets.map(p => {
      const d = petOf(p.key)!, st = stageOf(p.lvl), on = s.activePet === p.key;
      const next = STAGE_LV[st + 1];
      return `<div class="item pet ${on ? 'here' : ''}"><div class="dot" style="background:${d.stages[st].color}"></div>
        <div class="grow"><div class="iname">${tr(d.stages[st].name)} <small>Lv ${p.lvl}${next ? ` · ${lang === 'zh' ? '進化於' : 'grows at'} Lv ${next}` : ''}</small></div>
        <div class="istat">${tr(d.ability)} · ${t('bond')} ${'♥'.repeat(p.bond)}${'♡'.repeat(BOND_MAX - p.bond)}</div>
        <div class="meter xp thin"><div style="width:${(p.xp / petXpNeed(p.lvl) * 100).toFixed(0)}%"></div></div>
        <p class="lore">${tr(d.lore)}</p></div>
        ${on ? `<span class="dim">${t('active')}</span>` : `<button data-a="pet" data-k="${p.key}">${t('call')}</button>`}</div>`;
    }).join('');
    const unknown = PETS.filter(p => !p.hidden && !s.pets.some(x => x.key === p.key)).map(p => {
      const a = AREAS.find(a => a.key === p.home)!;
      return `<div class="item dimbox"><div class="dot q">?</div><div class="grow"><div class="iname">${t('unknownPet')}</div><div class="istat">${t('petHint')}：${tr(a.name)}</div></div></div>`;
    }).join('');
    return (owned || '') + unknown;
  }

  private titlesHtml(): string {
    const s = this.g.s;
    return TITLES.map(ti => {
      const got = s.titles.includes(ti.key);
      if (ti.secret && !got) return `<div class="item dimbox"><div class="grow"><div class="iname">？？？</div></div></div>`;
      const eff = ti.mods.map(m => `${tr(STAT_NAME[m.key] || { zh: m.key, en: m.key })} +${m.add !== undefined ? (m.key === 'crit' ? pct(m.add) : m.add) : pct(m.mul!)}`).join(' · ');
      return `<div class="item ${got ? 'here' : 'dimbox'}"><div class="grow"><div class="iname">${got ? '★' : '☆'} ${tr(ti.name)}</div><div class="istat">${tr(ti.how)} · ${eff}</div></div></div>`;
    }).join('');
  }

  private rebirthHtml(): string {
    const s = this.g.s, ok = s.age >= REBIRTH_AGE;
    const gain = PRIMARY.map(k => `${tr(STAT_NAME[k])} +${Math.floor(s.grown[k] * LEGACY_RATE)}`).join(' · ');
    const races = RACES.map(r => `<button class="race ${this.rbRace === r.key ? 'on' : ''}" data-a="rbRace" data-k="${r.key}"><b>${tr(r.name)}</b><small>${tr(r.desc)}</small></button>`).join('');
    return `<p>${t('rebirthKeep')}</p>
      <p class="dim">${lang === 'zh' ? '這次轉生可帶走' : 'This rebirth keeps'}：${gain}</p>
      <h4>${t('chooseRace')}</h4><div class="races">${races}</div>
      <h4>${t('startAge')}：${this.rbAge}</h4>
      <input type="range" min="10" max="17" value="${this.rbAge}" data-a="rbAge" /><p class="dim">${t('startAgeHint')}</p>
      <p><button class="big" data-a="rebirth" ${ok ? '' : 'disabled'}>${ok ? t('rebirthDo') : t('rebirthNeed') + ` (${s.age})`}</button></p>`;
  }
}

/** First-run screen: name, race, starting age. */
export function creation(root: HTMLElement, done: (name: string, race: string, age: number) => void): void {
  let race = 'human', age = 14;
  const draw = () => {
    root.innerHTML = `<div class="create"><h1>${t('title')}</h1><p class="dim">${t('newHero')}</p>
      <label>${t('name')} <input id="c-name" maxlength="12" value="${lang === 'zh' ? '勇者' : 'Hero'}" /></label>
      <h4>${t('chooseRace')}</h4><div class="races">${RACES.map(r => `<button class="race ${race === r.key ? 'on' : ''}" data-r="${r.key}"><b>${tr(r.name)}</b><small>${tr(r.desc)}</small></button>`).join('')}</div>
      <h4>${t('startAge')}：<span id="c-agev">${age}</span></h4><input id="c-age" type="range" min="10" max="17" value="${age}" />
      <p class="dim">${t('startAgeHint')}</p>
      <button class="big" id="c-go">${t('begin')}</button>
      <button class="lang" id="c-lang">${lang === 'zh' ? 'EN' : '中文'}</button></div>`;
    root.querySelectorAll<HTMLElement>('[data-r]').forEach(b => b.onclick = () => { race = b.dataset.r!; keepName(); });
    (root.querySelector('#c-age') as HTMLInputElement).oninput = e => { age = Number((e.target as HTMLInputElement).value); root.querySelector('#c-agev')!.textContent = String(age); };
    root.querySelector<HTMLElement>('#c-go')!.onclick = () => done(((root.querySelector('#c-name') as HTMLInputElement).value.trim() || 'Hero').slice(0, 12), race, age);
    root.querySelector<HTMLElement>('#c-lang')!.onclick = () => { setLang(lang === 'zh' ? 'en' : 'zh'); location.reload(); };
  };
  const keepName = () => { const n = (root.querySelector('#c-name') as HTMLInputElement).value; draw(); (root.querySelector('#c-name') as HTMLInputElement).value = n; };
  draw();
}

export type { Save };
