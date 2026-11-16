import type { Game, Part } from '../game/engine';
import { PRIMARY, SLOTS, SLOT_OF, twoHanded, type BagSort, type Item, type L, type PetState, type Slot } from '../game/types';
import { lang, setLang, t, tr, UI, DEFAULT_NAME, heroName } from '../core/i18n';
import { clock, gold, num, pct } from '../core/fmt';
import { derive, armorDef, armorPrt, weaponRange, xpNeed } from '../game/stats';
import { nameOf, sellPrice } from '../game/loot';
import { RACES, START_AGES, ageGrowth, raceOf } from '../data/races';
import { BAG_SIZE, RARITY, SMITH_BREAK_FROM, SMITH_DROP_FROM, SMITH_MAX, WEIGHTS, smithCost } from '../data/items';
import { MAX_RANK, RANKS, SKILLS, activeRank, canToggle, isOff, rankCost, type Tab as SkillTab } from '../data/skills';
import { AREAS } from '../data/areas';
import { AREA_CP, difficulty } from '../game/monsters';
import { FRIENDLY, BOND_MAX, PAL_SIZE, STAGE_LV, petOf, petXpNeed, stageOf } from '../data/pets';
import { CREATURE_DYES, creatureUrl } from '../data/creatures';
import { artSrc } from './sprites';
import { heroArtUrl, heroFacesLeft } from './hero-art';
import { TITLES } from '../data/titles';
import { REBIRTH_AGE, YEAR_SEC, clearSave } from '../game/state';
import { Scene } from './scene';
import * as A from '../game/actions';
import { SILVER, icon, pixelMarkup, silhouetteMarkup } from './icons';
import { WORLD_MAP_POSITIONS, areaPageBg, mapShadeCss, worldMapRoute } from './world-map';
import { curseOf, giftOf, type PactDef } from '../data/pacts';
import { COLLAPSE, SAN_TIERS, deathSanLoss, madness, sanTier } from '../data/sanity';
import { SAN_MAX } from '../game/state';

type View = 'equip' | 'bag' | 'pets' | 'skills' | 'map' | 'smith' | 'titles' | 'settings';
// the equipment page lives in the hero box on the left (its own tab beside the sheet); the side panel keeps the rest
const NAV: [View, keyof typeof UI][] = [
  ['bag', 'navBag'], ['pets', 'navPets'], ['skills', 'navSkills'], ['map', 'navMap'],
  ['smith', 'navSmith'], ['titles', 'navTitles'], ['settings', 'navSettings'],
];
type HeroTab = 'info' | 'equip'; type BattleTab = 'scene' | 'log';
/** the palette's mid tone under each light tab colour (sage 82947b under a8b59a, earth ac917b under cfb49a) */
const TAB_OFF: Record<string, string> = { '#a8b59a': '#82947b', '#cfb49a': '#ac917b' };
const HERO_TABS: [HeroTab, keyof typeof UI, string][] = [['info', 'tabInfo', '#a8b59a'], ['equip', 'navEquip', '#a8b59a']];
const BATTLE_TABS: [BattleTab, keyof typeof UI, string][] = [['scene', 'tabBattle', '#cfb49a'], ['log', 'tabLog', '#cfb49a']];
/** Each tab is a coloured index tab (palette light tones); the open one stands taller and its colour runs along the card's top edge. */
const TAB_COLOR: Record<View, string> = {
  equip: '#a8b59a', bag: '#bcc5bd', pets: '#d9c49b', skills: '#c1b3c6', map: '#cfb49a', smith: '#9fb4bb', titles: '#e3ccb0', settings: '#b9b3c4',
};
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
  private view: View = 'bag';
  private heroTab: HeroTab = 'info'; private battleTab: BattleTab = 'scene';
  private slot: Slot | 'all' = 'all';
  private skillTab: SkillTab = 'combat';
  private rbRace: string; private rbAge = 17; private rbPact = -1; private rbOpen = false;
  /** true while the pact panel is being shown for the first time ever on this device: it fades in after the rest */
  private rbFirst = false;
  /** which settings action is waiting for its in-page confirmation (artifact viewers refuse window.confirm) */
  private armed: '' | 'rebirthOpen' | 'reset' = '';
  /** uid of the pal whose Part button is waiting for its confirmation */
  private palArmed = 0;
  private lastHtml: Record<string, string> = {};
  private logEl!: HTMLElement;
  private scene: Scene;

  constructor(private g: Game, private root: HTMLElement) {
    this.rbRace = g.s.race;
    this.scene = new Scene(g);
    this.build();
    // desktop canvas: the 1280x800 layout scales to fill the window (up or down, keeping its shape); phones use the flowing layout
    const fit = () => { const s = window.innerWidth > 900 ? Math.min(window.innerWidth / 1280, window.innerHeight / 800) : 1; document.documentElement.style.setProperty('--s', s.toFixed(4)); };
    fit(); window.addEventListener('resize', fit);
    this.root.addEventListener('click', e => this.onClick(e));
    this.installTips();
    this.root.addEventListener('change', e => this.onChange(e));
    this.root.addEventListener('input', e => this.onChange(e));
    g.on(e => { if (e.t === 'log') this.addLog(e.parts, e.cls); else if (e.t === 'wake') this.render(); });
    this.fx = document.createElement('div'); this.fx.className = 'madfx'; document.body.appendChild(this.fx);
    this.black = document.createElement('div'); this.black.className = 'blackout'; document.body.appendChild(this.black);
  }
  private fx!: HTMLElement; private black!: HTMLElement;
  /** Madness on screen: the edges close in over the whole page and the battle strip sways; at 0 the screen goes black. */
  private madFx(): void {
    const g = this.g, m = madness(g.s.san), st = this.root.querySelector('.stage') as HTMLElement | null;
    // only the corners: the opening stays wide, the colour deepens and the breathing quickens as SAN falls
    const r = (90 - 8 * m).toFixed(1), a = m > 0 ? (0.4 + 0.35 * m).toFixed(2) : '0', bp = (4 - 2.4 * m).toFixed(2);
    if (this.fx.dataset.v !== r + a + bp) { this.fx.dataset.v = r + a + bp; this.fx.style.setProperty('--vr', r + '%'); this.fx.style.setProperty('--va', a); this.fx.style.setProperty('--bp', bp + 's'); }
    this.fx.classList.toggle('on', m > 0);
    if (st) { st.classList.toggle('mad', m > 0.15); st.style.setProperty('--wob', (m * m).toFixed(2)); }
    const on = g.collapsing;
    if (this.black.classList.contains('on') !== on) { this.black.classList.toggle('on', on); if (on) this.black.textContent = tr(COLLAPSE); }
  }

  private build(): void {
    // battle bars carry no numbers: the log already reports every hit, and big numbers would squeeze the bars
    const bar = (id: string, cls: string, lbl: string) =>
      `<div class="kv bar"><span class="lbl">${lbl}</span><div class="line"><div id="${id}" class="${cls}"></div></div></div>`;
    const ttabs = (tabs: [string, keyof typeof UI, string][], action: string, on: string) => `<nav class="nav tabs" style="--tab-on:${tabs.find(x => x[0] === on)![2]}">${tabs.map(([k, l, c]) => `<button class="ttab ${k === on ? 'on' : ''}" data-a="${action}" data-k="${k}" style="--tab:${c};--tab-off:${TAB_OFF[c] || c}"><span>${t(l)}</span></button>`).join('')}</nav>`;
    this.root.innerHTML = `
      <div class="game">
        <div class="colL">
        <section class="box hero tabbed">
          ${ttabs(HERO_TABS, 'htab', this.heroTab)}
          <div class="tbody">
          <div class="sheet pane" id="sheet" ${this.heroTab === 'info' ? '' : 'hidden'}></div>
          <div class="view v-equip pane" id="equippane" ${this.heroTab === 'equip' ? '' : 'hidden'}></div>
          </div>
        </section>
        <section class="box battle tabbed">
          ${ttabs(BATTLE_TABS, 'btab', this.battleTab)}
          <div class="tbody">
          <div class="pane monster" id="battlepane" ${this.battleTab === 'scene' ? '' : 'hidden'}>
          <div class="stage"></div>
          <div class="fight">
            <div class="side-hero">
              <div class="kv fname"><span id="h-name"></span></div>
              <div class="kv cp"><span class="lbl">${t('cp')}</span><span id="s-cp" class="v"></span></div>
              ${bar('s-hp', 'red', t('hp'))}${bar('s-mp', 'blue', t('mp'))}
            </div>
            <div class="side-pal" id="palbars"></div>
            <div class="vsep" aria-hidden="true"></div>
            <div class="side-mon">
              <div class="kv fname"><span><span id="m-label" class="mlabel"></span><span id="m-name"></span></span><span id="m-diff" class="diff"></span></div>
              <div class="kv cp"><span class="lbl">${t('cp')}</span><span id="m-cp" class="v"></span></div>
              ${bar('m-hp', 'red', t('hp'))}
            </div>
          </div>
          </div>
          <div class="pane log" id="logpane" ${this.battleTab === 'log' ? '' : 'hidden'}><div class="loglist" id="log"></div></div>
          </div>
        </section>
        </div>
        <section class="box side">
          <nav class="nav">${NAV.map(([k, l]) => `<button class="ico" data-a="view" data-k="${k}" title="${t(l)}" aria-label="${t(l)}" style="--tab:${TAB_COLOR[k]}"><span>${icon(k)}</span></button>`).join('')}</nav>
          <div class="tbody">
          <div class="vtitle" id="vtitle"></div>
          <div class="view" id="view"></div>
          </div>
        </section>
      </div>`;
    this.root.querySelector('.stage')!.appendChild(this.scene.cv);
    this.logEl = this.root.querySelector('#log')!;
    this.setView(this.view);
  }

  private setView(v: View): void {
    this.view = v; this.palArmed = 0;
    this.root.querySelectorAll('.side .nav .ico').forEach(b => b.classList.toggle('on', (b as HTMLElement).dataset.k === v));
    this.root.querySelector<HTMLElement>('.side .nav')?.style.setProperty('--tab-on', TAB_COLOR[v]);
    const label = NAV.find(n => n[0] === v)![1];
    (this.root.querySelector('#vtitle') as HTMLElement).textContent = t(label);
    (this.root.querySelector('#view') as HTMLElement).className = `view v-${v}`;
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
    // picking an option closes its menu; render() holds the view while a menu is open, so the choice would not show until then
    if (el.classList.contains('ddopt')) el.closest<HTMLElement>('.ddmenu')!.hidden = true;
    switch (a) {
      case 'view': this.setView(k as View); return;
      case 'htab': this.heroTab = k as HeroTab; this.tabTo('.hero', k); break;
      case 'btab': this.battleTab = k as BattleTab; this.tabTo('.battle', k); break;
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
      case 'sktoggle':
        // on a touch screen the first tap on a skill only shows its tooltip; the second tap toggles it
        if (this.lastPointer === 'touch' && this.tipFor !== el) { this.showTip(el); this.tipByTap = true; return; }
        A.toggleSkill(g, k); break;
      case 'go':
        // on a touch screen the first tap on a map node only shows its tooltip; the second tap goes
        if (this.lastPointer === 'touch' && el.classList.contains('node') && this.tipFor !== el) { this.showTip(el); this.tipByTap = true; return; }
        A.goArea(g, k); break;
      case 'pet': A.setPet(g, uid); this.palArmed = 0; break;
      case 'palPart': this.palArmed = uid; break;
      case 'palPartYes': A.releasePet(g, uid); this.palArmed = 0; break;
      case 'ddToggle': { const m = el.parentElement!.querySelector<HTMLElement>('.ddmenu'); if (m) m.hidden = !m.hidden; return; }
      case 'autoSell': g.s.autoSell = Number(k); break;
      case 'bagSort': g.s.bagSort = k as BagSort; break;
      case 'rebirthOpen': case 'reset': this.armed = a as 'rebirthOpen' | 'reset'; break;
      case 'disarm': this.armed = ''; this.palArmed = 0; break;
      case 'report': this.reportDialog(); return;
      case 'rebirthYes': this.armed = ''; this.rebirthScreen(); return;
      case 'resetYes': clearSave(); (window as any).__noSave = true; location.reload(); return;
    }
    this.lastHtml = {};
    this.render();
  }

  /** Flip a tabbed box: the clicked tab stands up, the band takes its colour, its pane shows. */
  private tabTo(box: string, k: string): void {
    const b = this.root.querySelector<HTMLElement>(box)!;
    b.querySelectorAll<HTMLElement>('.ttab').forEach(x => x.classList.toggle('on', x.dataset.k === k));
    const on = b.querySelector<HTMLElement>('.ttab.on'); if (on) b.querySelector<HTMLElement>('.tabs')!.style.setProperty('--tab-on', on.style.getPropertyValue('--tab'));
    b.querySelectorAll<HTMLElement>('.pane').forEach(pn => { pn.hidden = !pn.id.startsWith(k === 'info' ? 'sheet' : k === 'equip' ? 'equippane' : k === 'scene' ? 'battlepane' : 'logpane'); });
    if (k === 'log') this.logEl.scrollTop = this.logEl.scrollHeight;
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
    this.text('h-name', heroName(g.s.name));
    this.text('m-label', m.label === 'friendly' ? tr(FRIENDLY) : '');
    this.text('m-name', tr(m.name)); (document.getElementById('m-name') as HTMLElement).style.color = g.monColor;
    this.text('m-diff', tr(dif.name)); (document.getElementById('m-diff') as HTMLElement).style.color = dif.color;
    this.text('m-cp', num(m.cp)); this.text('s-cp', num(g.d.cp));
    this.width('m-hp', m.hp / m.maxHp);
    this.width('s-hp', g.hp / g.d.hp); this.width('s-mp', g.mp / g.d.mp);
    if (g.petMaxHp > 0) { this.width('p-hp', g.petHp / g.petMaxHp); this.width('p-mp', g.petMp / g.petMaxMp); }
    this.syncSheetBars();
    this.madFx();
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
  /** The page background takes the map's shade for the area the hero is in, like the battle strip does. */
  private shadedFor = '';
  private shadePage(): void {
    const area = this.g.s.area;
    if (area === this.shadedFor) return;
    this.shadedFor = area;
    document.documentElement.style.setProperty('--bg', areaPageBg(area));
  }
  render(): void {
    if (this.overlay) return;
    this.shadePage();
    this.put('sheet', this.sheetHtml());
    this.put('equippane', this.equipHtml()); // always laid out (invisible when the info tab is open) so the card is the taller of the two pages
    this.put('palbars', this.palBarsHtml());
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
    const st = el.scrollTop, inner = el.querySelector('.keepscroll'), ist = inner ? inner.scrollTop : 0;
    el.innerHTML = html;
    el.scrollTop = st;
    const inner2 = el.querySelector('.keepscroll'); if (inner2) inner2.scrollTop = ist;
    if (id === 'sheet') this.syncSheetBars();
  }

  // ---------- fixed panels ----------

  private sheetHtml(): string {
    const { s, d } = this.g, r = raceOf(s.race);
    const base = (k: string) => r.base[k as 'str'] + s.grown[k as 'str'] + s.legacy[k as 'str'];
    const mad = (k: string) => { const v = s.madRoll?.[k]; return v ? ` ${v > 0 ? 'bless' : 'cursed'}" data-tip="mad:${k}` : ''; };
    const stat = (k: string) => {
      const v = Math.round(d.prim[k as 'str']), b = Math.round(base(k));
      return `<div class="kv"><span class="lbl">${icon(k, 'gi sm')}${tr(STAT[k])}</span><span class="val ${v > b ? 'boost' : 'stat'}${mad(k)}">${v}</span><span class="dim">(${b})</span></div>`;
    };
    // the name gets a row of its own: a title will prefix it (「XXXX 的奧雷里亞諾」) and must not squeeze the first column
    return `<div class="kv name"><span class="lbl">${t('name')}</span><span>${esc(heroName(s.name))}</span></div>
      <div class="col">
        <div class="kv"><span class="lbl">${t('race')}</span><span>${tr(r.name)}</span></div>
        <div class="kv"><span class="lbl">${t('age')}</span><span>${s.age} <small class="dim">${clock(YEAR_SEC - s.ageT)}</small></span></div>
        <div class="kv"><span class="lbl">${t('lv')}</span><span>${s.lvl}</span></div>
        <div class="kv bar"><span class="lbl">${t('exp')}</span><div class="line"><div id="s-xp" class="grey"></div></div></div>
        <div class="kv bar"><span class="lbl">${t('san')}</span><div class="line"><div id="s-san" class="purple"></div></div><span class="v" id="s-san-v"></span></div>
        <div class="kv"><span class="lbl">${t('gold')}</span><span>${gold(s.gold)}</span></div>
        ${this.pactLine()}
      </div>
      <div class="col">${PRIMARY.map(stat).join('')}
        <div class="kv"><span class="lbl">${icon('ap', 'gi sm')}${t('ap')}</span><span>${s.ap}</span></div>
      </div>
      <div class="col">
        <div class="kv"><span class="lbl">${t('atk')}</span><span class="${mad('atk')}">${Math.round(d.atkMin)}~${Math.round(d.atkMax)}</span></div>
        <div class="kv"><span class="lbl">${t('bal')}</span><span>${Math.round(d.bal * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('crt')}</span><span>${Math.round(d.crit * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('crtm')}</span><span>${Math.round(d.critDmg * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('def')}</span><span class="${mad('def')}">${Math.round(d.def)}</span></div>
        <div class="kv"><span class="lbl">${t('prt')}</span><span>${Math.round(d.prt * 100)}</span></div>
        <div class="kv"><span class="lbl">${t('spd')}</span><span class="${mad('speed')}">${Math.round(d.spd)}</span></div>
      </div>`;
  }

  /** The pal's name, HP and MP beside the hero's bars in the battle box; empty when nobody walks along. */
  private palBarsHtml(): string {
    const s = this.g.s, p = s.pets.find(x => x.uid === s.activePet);
    if (!p) return '';
    const d = petOf(p.key)!, st = stageOf(p.lvl);
    const bar = (id: string, cls: string, lbl: string) => `<div class="kv bar"><span class="lbl">${lbl}</span><div class="line"><div id="${id}" class="${cls}"></div></div></div>`;
    const rest = this.g.petDownFor > 0 ? ` <small class="dim">${t('petRest')}</small>` : '';
    return `<div class="kv fname"><span class="petname">${tr(d.stages[st].name)}${rest}</span></div><div class="kv cp"><span class="lbl">${t('cp')}</span><span class="v">${num(this.g.petCp)}</span></div>${bar('p-hp', 'red', t('hp'))}${bar('p-mp', 'blue', t('mp'))}`;
  }
  /** The pal on the info page: who walks with you, level and EXP, bond, what it does. */
  private palCardHtml(): string {
    const s = this.g.s, p = s.pets.find(x => x.uid === s.activePet);
    if (!p) return `<div class="kv"><span class="lbl">${t('pet')}</span><span class="dim">-</span></div><p class="hint">${t('palHint').replace('{i}', icon('pets', 'gi sm ol'))}</p>`;
    const d = petOf(p.key)!, st = stageOf(p.lvl);
    return `<div class="kv"><span class="lbl">${t('pet')}</span><span class="petname">${tr(d.stages[st].name)}</span></div>
      <div class="kv"><span class="lbl">${t('lv')}</span><span>${p.lvl}</span></div>
      <div class="kv bar"><span class="lbl">${t('exp')}</span><div class="line"><div class="grey" style="width:${(p.xp / petXpNeed(p.lvl) * 100).toFixed(0)}%"></div></div></div>
      <div class="kv"><span class="lbl">${t('bond')}</span><span class="hearts">${hearts(p.bond)}</span></div>
      <div class="tsec">${tr(d.ability)}</div><p class="lore dim">${tr(d.lore)}</p>`;
  }

  private attHtml(): string {
    const s = this.g.s;
    const rows = SKILLS.filter(k => k.act && activeRank(s, k.key)).map(k => `<div class="kv"><span>${tr(k.name)}</span><span>${pct(k.act!.chance(s.skills[k.key]), 1)}</span></div>`).join('');
    // nothing equipped yet: one grey line pointing at the skills tab
    return `<h3>${t('att')}</h3>${rows || `<p class="hint">${t('attHint').replace('{i}', icon('skills', 'gi sm'))}</p>`}`;
  }

  /** Map stats for the area the hero is in, under the map: time, kills, falls, gold, EXP | loot total and by rarity. */
  private lootHtml(): string {
    const l = this.g.loot;
    const kv = (k: string, v: string, cls = '') => `<div class="kv"><span${cls ? ` class="${cls}"` : ''}>${k}</span><span>${v}</span></div>`;
    return `<div class="loot"><h3>${t('mapStats')}</h3><div class="lootcols">
      <div class="lcol">${kv(t('stay'), '<span id="loot-sec"></span>')}${kv(t('kills'), num(l.kills))}${kv(t('deaths'), num(l.deaths))}${kv('$', gold(l.gold), 'gold')}${kv(t('exp'), num(l.xp), 'xp')}</div>
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
      ${this.cpTip(it)}
      <div class="tcost">${t('sell')} $${gold(sellPrice(it))}</div>`;
  }
  /** For an item in the bag: CP after equipping it, as a change from now. */
  private cpTip(it: Item): string {
    const s = this.g.s;
    if (!s.bag.includes(it)) return '';
    const dcp = this.cpDelta(it, A.targetSlot(s, it));
    const cls = dcp > 0 ? 'up' : dcp < 0 ? 'down' : 'dim';
    return `<div class="tsec">${t('cpIfEquip')} <span class="${cls}">${dcp > 0 ? '+' : dcp < 0 ? '−' : '±'}${num(Math.abs(dcp))}</span></div>`;
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
      ['ring', 246, 44], ['neck', 246, 90], ['weapon', 78, 90], ['off', 202, 90],
    ];
    // an empty slot shows a silver silhouette; a filled one shows the icon in full colour on its rarity colour
    const ico = (name: string, x: number, y: number, sz: number, color: string | null) => `<svg x="${x - sz / 2}" y="${y - sz / 2}" width="${sz}" height="${sz}" viewBox="0 0 16 16" shape-rendering="crispEdges">${color ? silhouetteMarkup(name, color) : pixelMarkup(name)}</svg>`;
    // a cell is a square with one small pixel step (2 units) taken off each corner
    const N = 2, S = CELL - N * 2;
    const cellPath = (x: number, y: number) => `M${x + N} ${y}h${S}v${N}h${N}v${S}h${-N}v${N}h${-S}v${-N}h${-N}v${-S}h${N}z`;
    const cellSvg = cells.map(([k, x, y]) => {
      const it = s.equip[k], on = this.slot === k, locked = k === 'off' && twoHanded(s.equip.weapon);
      const x0 = x - CELL / 2, y0 = y - CELL / 2;
      const cross = locked ? `<line x1="${x0 + 6}" y1="${y0 + 6}" x2="${x0 + CELL - 6}" y2="${y0 + CELL - 6}"/><line x1="${x0 + CELL - 6}" y1="${y0 + 6}" x2="${x0 + 6}" y2="${y0 + CELL - 6}"/>` : '';
      return `<g class="slot ${on ? 'on' : ''} ${it ? 'full' : ''} ${locked ? 'locked' : ''}" data-a="slot" data-k="${k}" ${it ? `data-tip="item:${it.uid}"` : ''}><title>${locked ? t('twoHanded') : tr(SLOT_NAME[k])}</title>
        <path class="cell" d="${cellPath(x0, y0)}"${it ? ` style="fill:${RARITY[it.rarity].color}"` : ''}/>${locked ? cross : ico('slot-' + k, x, y, 24, it ? null : SILVER)}</g>`;
    }).join('');
    // the pal is not a cell: it stands at its master's feet
    const pet = s.pets.find(p => p.uid === s.activePet);
    // no pal yet: the spirit's body (no flames or orbs) as a silver silhouette keeps the spot
    // the pal's own art at 1.2x, mirrored to face right like it does in battle; centred between the support and charm
    // columns (x 224), level with the legs row; labelled underneath
    const petSvg = pet ? `<g class="petspr" data-a="petTap"><title>${tr(petOf(pet.key)!.stages[stageOf(pet.lvl)].name)}</title><g transform="translate(448 0) scale(-1 1)"><image href="${petSrc(pet)}" x="200" y="122" width="48" height="57" preserveAspectRatio="xMidYMid meet"/></g></g>`
      : `<g class="petghost"><title>${t('palHint').replace(' {i}', '')}</title><image href="${artSrc('./sprites/pal-shadow.png')}" x="200" y="122" width="48" height="57" preserveAspectRatio="xMidYMid meet"/></g>`;
    return `<svg class="doll" viewBox="0 0 280 240">
      <text class="cap" x="34" y="16">${t('navEquip')}</text><text class="cap" x="246" y="16">${t('charms')}</text><text class="cap" x="224" y="200">${t('pet')}</text>
      <text class="cap" x="78" y="66">${t('capAttack')}</text><text class="cap" x="202" y="66">${t('capSupport')}</text>
      <g data-avatar="${s.race}"${heroFacesLeft(s.race) ? ' transform="translate(280 0) scale(-1 1)"' : ''}><image href="${artSrc(heroArtUrl(s.race))}" x="97" y="48" width="86" height="128" preserveAspectRatio="xMidYMax meet" style="image-rendering:pixelated"/></g>
      ${cellSvg}${petSvg}</svg>`;
  }

  /** Equipment page: the figure with its slots, and the worn piece of the selected slot. The bag is its own page. */
  private equipHtml(): string {
    const s = this.g.s, sel = this.slot;
    const worn = sel === 'all' ? '' : (() => {
      const it = s.equip[sel];
      return `<div class="item worn" ${it ? `data-tip="item:${it.uid}"` : ''}><div class="grow"><div class="dim">${tr(SLOT_NAME[sel])}</div>${it ? this.itemHtml(it) : t('empty')}</div>${it ? `<button data-a="unequip" data-k="${sel}">${t('unequip')}</button>` : ''}</div>`;
    })();
    const ORDER: Slot[] = ['weapon', 'off', 'head', 'body', 'legs', 'feet', 'neck', 'ring'];
    const list = ORDER.map(k => { const it = s.equip[k];
      return `<div class="kv" ${it ? `data-tip="item:${it.uid}"` : ''}><span class="lbl">${tr(SLOT_NAME[k])}</span>${it ? this.itemHtml(it) : '<span class="dim">-</span>'}</div>`; }).join('');
    const p = s.pets.find(x => x.uid === s.activePet), d = p && petOf(p.key);
    const pal = p && d ? `<div class="tname">${tr(d.stages[stageOf(p.lvl)].name)} <small class="dim">Lv ${p.lvl}</small></div>
        <div class="tsec">${tr(d.ability)}</div><p class="lore dim">${tr(d.lore)}</p>` : `<p class="dim">${t('noPal')}</p>`;
    void pal;
    void list; // the worn list went away: the slot tooltips on the figure already say what is worn
    return `<div class="eqgrid"><div>${this.dollSvg()}${worn}</div><div class="palcard">${this.palCardHtml()}</div><div class="attlist">${this.attHtml().replace('<h3>', '<h4>').replace('</h3>', '</h4>')}</div></div>`;
  }

  /** Bag page: every carried item with its CP change, equip and sell, plus auto-sell and sell-all. */
  private bagHtml(): string {
    const s = this.g.s;
    // each row: the name, then Equip and Sell; the CP change and the sell price are in the tooltip
    const bag = this.bagSorted().map(it => `<div class="item" data-tip="item:${it.uid}"><div class="grow">${this.itemHtml(it)}</div><div class="acts">
        <button data-a="equip" data-uid="${it.uid}">${t('equip')}</button>
        <button class="ghost" data-a="sell" data-uid="${it.uid}">${t('sell')}</button></div></div>`).join('') || `<p class="dim">${t('empty')}</p>`;
    const opts = RARITY.map((r, i) => [String(i), i === 0 ? '-' : tr(r.name)] as [string, string]);
    const sorts: [string, string][] = [['new', t('sortNew')], ['rarity', t('sortRarity')], ['slot', t('sortSlot')], ['cp', t('cp')]];
    return `<div class="baghead"><div class="row between"><b>${t('bag')} ${s.bag.length}/${BAG_SIZE}</b><button class="ghost wide" data-a="sellAll">${t('sellAll')}</button></div>
        <div class="row between"><span class="dim">${t('sort')} ${dropdown('bagSort', sorts, s.bagSort || 'new')}</span><span class="dim">${t('autoSell')} ${dropdown('autoSell', opts, String(s.autoSell))}</span></div></div>
      <div class="baglist keepscroll">${bag}</div>`;
  }
  /** The bag in the order the player chose to see it; ties stay in pickup order. */
  private bagSorted(): Item[] {
    const s = this.g.s, mode = s.bagSort || 'new';
    if (mode === 'new') return s.bag;
    const best = (a: Item, b: Item) => b.rarity - a.rarity || b.ilvl - a.ilvl || b.plus - a.plus;
    if (mode === 'rarity') return s.bag.slice().sort(best);
    if (mode === 'slot') return s.bag.slice().sort((a, b) => SLOTS.indexOf(SLOT_OF[a.kind]) - SLOTS.indexOf(SLOT_OF[b.kind]) || best(a, b));
    const gain = new Map(s.bag.map(it => [it, this.cpDelta(it, A.targetSlot(s, it))]));
    return s.bag.slice().sort((a, b) => gain.get(b)! - gain.get(a)!);
  }

  /** Tooltip shared by every [data-tip] element: hover on desktop, tap on touch screens. */
  private tipEl!: HTMLElement;
  private tipFor: HTMLElement | null = null;
  private tipByTap = false;
  private showTip: (el: HTMLElement) => void = () => {};
  private lastPointer = 'mouse';
  private installTips(): void {
    this.tipEl = document.createElement('div');
    this.tipEl.className = 'tip'; this.tipEl.hidden = true;
    document.body.appendChild(this.tipEl);
    const show = this.showTip = (el: HTMLElement) => {
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
  private petTip(uid: string): string {
    const p = this.g.s.pets.find(x => x.uid === Number(uid)), d = p && petOf(p.key);
    if (!p || !d) return '';
    const st = stageOf(p.lvl);
    return `<div class="tname">${tr(d.stages[st].name)} <small class="dim">Lv ${p.lvl}</small></div>
      <div class="tsec">${tr(d.ability)}</div>
      <p class="lore">${tr(d.lore)}</p>`;
  }
  private areaTip(key: string): string {
    const { s, d } = this.g;
    const i = AREAS.findIndex(a => a.key === key); if (i < 0) return '';
    const a = AREAS[i], cp = AREA_CP[i];
    const cls = d.cp >= cp ? 'up' : d.cp >= cp * 0.6 ? 'warn' : 'down';
    return `<div class="tname">${tr(a.name)} <small class="dim">Lv ${a.min}–${a.max}</small></div>
      <div class="tsec">${t('recArea')} <b class="${cls}">${num(cp)}</b> · ${a.dread ? `<span class="madtxt">${t('dread')} -${deathSanLoss(a.min, s.lvl, d.prim.will, d.sanDrain, s.pets.find(p => p.uid === s.activePet)?.bond || 0)}</span>` : `<span class="up">${t('safe')}</span>`}</div>
      <p class="lore">${tr(a.flavor)}</p>
      <div class="tnext">${this.g.s.area === a.key ? t('here') : t('clickGo')}</div>`;
  }
  private tipHtml(key: string): string {
    const [kind, id] = key.split(':');
    if (kind === 'item') { const it = this.g.itemOf(Number(id)); return it ? this.itemTip(it) : ''; }
    if (kind === 'area') return this.areaTip(id);
    if (kind === 'pet') return this.petTip(id);
    if (kind === 'mad') {
      const v = this.g.s.madRoll?.[id]; if (!v) return '';
      return `<div class="tname ${v > 0 ? 'up' : 'down'}">${v > 0 ? t('madBless') : t('madCurse')} ${v > 0 ? '+' : '−'}${Math.abs(v)}%</div><div class="tsec dim">${t('madNote')}</div>`;
    }
    if (kind !== 'skill') return '';
    const k = SKILLS.find(x => x.key === id); if (!k) return '';
    const r = this.g.s.skills[k.key] || 0, max = r >= MAX_RANK, off = isOff(this.g.s, k.key);
    return `<div class="tname">${tr(k.name)} ${r ? RANKS[r] : ''}${off ? ` <span class="dim">${t('skillOff')}</span>` : ''}</div>
      <div class="tsec">${r ? tr(k.desc(r)) : `<span class="dim">${t('notLearned')}</span>`}</div>
      ${max ? `<div class="tsec dim">${t('maxed')}</div>` : `<div class="tnext">${t('nextRank')} ${RANKS[r + 1]}</div><div class="tsec next">${tr(k.desc(r + 1))}</div>
      <div class="tcost">${t('ap')} ${rankCost(r)}</div>`}
      ${r && canToggle(k.key) ? `<div class="tnext">${off ? t('clickOn') : t('clickOff')}</div>` : ''}`;
  }

  private skillsHtml(): string {
    const s = this.g.s;
    const tabs = (['combat', 'magic', 'passive'] as SkillTab[]).map(k => `<button class="stab ${this.skillTab === k ? 'on' : ''}" data-a="stab" data-k="${k}">${t(k)}</button>`).join('');
    const rows = SKILLS.filter(k => k.tab === this.skillTab).map(k => {
      const r = s.skills[k.key] || 0, cost = rankCost(r), max = r >= MAX_RANK, can = !max && s.ap >= cost;
      const pick = r > 0 && canToggle(k.key), on = pick && !isOff(s, k.key);
      // one fixed-height row; the effect text lives in a hover/tap tooltip so ranking up never changes the layout
      // a learned skill is clicked on or off; the rank-up button inside keeps its own action
      return `<div class="skill ${can ? 'can' : ''} ${on ? 'on' : ''}" data-tip="skill:${k.key}" ${pick ? `data-a="sktoggle" data-k="${k.key}"` : ''}><div class="sico">${icon('sk-' + k.key)}</div>
        <div class="grow"><div class="sname">${tr(k.name)} <b>${r ? RANKS[r] : ''}</b></div></div>
        ${max ? `<span class="dim">${t('maxed')}</span>` : `<button class="up-btn" data-a="learn" data-k="${k.key}" ${can ? '' : 'disabled'} title="${cost} ${t('ap')}"><small>${cost}</small>${icon('arrow', 'gi sm pointup')}</button>`}</div>`;
    }).join('');
    return `<div class="stabs">${tabs}</div><p class="dim">${t('ap')} ${s.ap}</p>${rows}`;
  }

  /** The map as a descent: icon nodes winding down into the Abyss. Tap a node for details. */
  private mapHtml(): string {
    const { s } = this.g;
    const seen = s.visited || [s.area];
    // positions in % of the board: a winding path, top = surface, bottom = the Abyss
    const POS = WORLD_MAP_POSITIONS;
    const path = worldMapRoute(); // a curve through the landmarks
    const nodes = AREAS.map((a, i) => {
      // never been: grey · been, but not here: dark · here: lit
      const [x, y] = POS[i], here = s.area === a.key;
      const state = here ? 'here' : seen.includes(a.key) ? 'seen' : 'unseen';
      return `<button class="node ${state}" style="left:${x}%;top:${y}%" ${here ? '' : 'data-a="go"'} data-k="${a.key}" data-tip="area:${a.key}">
        <span class="nico">${icon('area-' + a.key)}</span></button>`; // the name is in the tooltip
    }).join('');
    // .mapwrap takes whatever height the column has left; the board inside keeps the illustration's 2:3 shape,
    // so the nodes stay on their landmarks. .mapshade darkens toward violet: the deeper, the heavier.
    return `<div class="mapwrap"><div class="mapboard"><img class="map-art" src="./sprites/abyss-world-map.png" width="1024" height="1536" alt="" draggable="false"><div class="mapshade" style="background:${mapShadeCss()}"></div><svg class="maproute" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg>${nodes}</div></div>${this.lootHtml()}`;
  }

  /** Blacksmith: the rules in three lines, then what is worn and what is carried. */
  private smithHtml(): string {
    const g = this.g, s = g.s;
    const row = (it: Item) => {
      if (it.plus >= SMITH_MAX) return `<div class="item" data-tip="item:${it.uid}"><div class="grow">${this.itemHtml(it)}</div><span class="dim">${t('maxed')}</span></div>`;
      const cost = smithCost(it.ilvl, it.plus), ch = A.smithChance(g, it);
      return `<div class="item" data-tip="item:${it.uid}"><div class="grow">${this.itemHtml(it)}</div><div class="acts">
        <span class="dim">${it.plus >= SMITH_BREAK_FROM ? icon('warn-hard', 'gi sm') : it.plus >= SMITH_DROP_FROM ? icon('warn-soft', 'gi sm') : ''}${pct(ch)}</span>
        <button data-a="smith" data-uid="${it.uid}" ${s.gold < cost ? 'disabled' : ''}>$${gold(cost)}</button></div></div>`;
    };
    // the warning mark sits in its own fixed-width column so both marks line up
    const rule = (k: string, v: string, mark = '') => `<div class="kv"><span class="lbl">${k}</span><span class="mk">${mark}</span><span>${v}</span></div>`;
    const worn = SLOTS.map(k => s.equip[k]).filter(Boolean) as Item[];
    const empty = `<p class="dim">${t('empty')}</p>`;
    return `<div class="rules">${rule('LV +1', t('smithGain'))}${rule(`LV 1–${SMITH_DROP_FROM}`, t('smithKeep'))}${rule(`LV ${SMITH_DROP_FROM}–${SMITH_BREAK_FROM - 1}`, t('smithDrop'), icon('warn-soft', 'gi sm'))}${rule(`LV ${SMITH_BREAK_FROM}+`, t('smithBreak'), icon('warn-hard', 'gi sm'))}</div>
      <h4>${t('smithWorn')}</h4>${worn.map(row).join('') || empty}
      <h4>${t('bag')}</h4>${s.bag.map(row).join('') || empty}`;
  }

  private petsHtml(): string {
    const s = this.g.s;
    // like the bag: only the pals you have picked up, each its own row; bring one along or part with it
    const owned = s.pets.map(p => {
      const d = petOf(p.key)!, st = stageOf(p.lvl), on = s.activePet === p.uid, next = STAGE_LV[st + 1];
      const acts = on ? `<span class="dim">${t('active')}</span>`
        : this.palArmed === p.uid ? `<button class="danger" data-a="palPartYes" data-uid="${p.uid}">${t('palPart')}</button><button data-a="disarm">${t('back')}</button>`
        : `<button data-a="pet" data-uid="${p.uid}">${t('call')}</button><button class="ghost" data-a="palPart" data-uid="${p.uid}">${t('palPart')}</button>`;
      // the pal's story lives in the icon's tooltip
      return `<div class="item ${on ? 'here' : ''}"><div class="dot art" data-tip="pet:${p.uid}"><img src="${petSrc(p)}" alt=""></div>
        <div class="grow"><div class="iname">${tr(d.stages[st].name)} <small class="dim">Lv ${p.lvl}${next ? ` → Lv ${next}` : ''}</small></div>
        <div class="istat">${this.palArmed === p.uid ? t('palPartAsk') : `${tr(d.ability)}<br><span class="hearts">${hearts(p.bond)}</span>`}</div></div>
        <div class="acts">${acts}</div></div>`;
    }).join('') || `<p class="dim">${t('palHint').replace(' {i}', '')}</p>`;
    return `<div class="row between baghead"><b>${t('navPets')} ${s.pets.length}/${PAL_SIZE}</b></div>${owned}`;
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
    try { this.rbFirst = !localStorage.getItem('souls.pactSeen'); localStorage.setItem('souls.pactSeen', '1'); } catch { this.rbFirst = false; }
    const back = () => { this.overlay = false; this.build(); this.lastHtml = {}; this.setView(this.view); };
    const draw = () => {
      // desktop: the picker on the left, the Abyss's offers beside it on the right, nothing below the fold.
      // phone: the offers stay folded behind a button next to the rebirth button, so they never sit below the picker unseen.
      const pactBtn = lang === 'zh' ? `${t('gift')}／${t('curse')}` : `${t('gift')} / ${t('curse')}`; // the full-width slash is Chinese punctuation
      root.innerHTML = `<div class="create rebirth">${banner(true)}
        <div class="rbgrid ${this.rbOpen ? 'open' : ''}"><div class="rbmain">
        <div class="rbtext"><p class="rblead">${t('rebirthLead')}</p>
        <div class="kv left"><span class="lbl">${t('inherit')}</span><span>${t('inheritList')}</span></div>
        <div class="kv left"><span class="lbl">${t('lose')}</span><span>${t('loseList')}</span></div></div>
        ${raceAgePicker(this.rbRace, this.rbAge, 'rbRace', 'rbAge')}</div>
        <aside class="rbside ${this.rbFirst ? 'first' : ''}">${this.offersHtml()}</aside></div>
        <div class="cfoot"><button class="link rbtoggle" data-a="rbToggle" aria-expanded="${this.rbOpen}">${pactBtn}</button><button class="link play" id="rb-go">${t('rebirthDo')}</button><button class="link" id="rb-back">${t('back')}</button></div></div>`;
      this.rbFirst = false; // a redraw after any click shows the panel at once
      root.querySelectorAll<HTMLElement>('[data-a="rbRace"]').forEach(b => b.onclick = () => { this.rbRace = b.dataset.k!; draw(); });
      root.querySelectorAll<HTMLElement>('[data-a="rbAge"]').forEach(b => b.onclick = () => { this.rbAge = Number(b.dataset.k); draw(); });
      root.querySelectorAll<HTMLElement>('[data-a="rbPact"]').forEach(b => b.onclick = () => { this.rbPact = Number(b.dataset.k); draw(); });
      root.querySelector<HTMLElement>('[data-a="rbToggle"]')!.onclick = () => { this.rbOpen = !this.rbOpen; draw(); };
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
        <span class="gift">${tr(gi.name)}</span><small>${fx(gi)}</small>
        <span class="curse">${tr(cu.name)}</span><small>${fx(cu)}</small></button>`;
    }).join('');
    return `<h3>${t('pact')}</h3><p class="dim">${t('offerHead')}</p><div class="pacts">${cards}
      <button class="pact refuse ${this.rbPact === -1 ? 'on' : ''}" data-a="rbPact" data-k="-1">${t('refuse')}</button></div>`;
  }

  /** an in-page yes / back pair in place of window.confirm */
  /** A private message to the author: an in-page dialog that posts to /api/feedback (the site's Worker). Nothing is shown publicly. */
  private reportDialog(): void {
    const g = this.g, s = g.s;
    const box = document.createElement('div'); box.className = 'reportwrap';
    box.innerHTML = `<div class="report box" role="dialog" aria-label="${t('report')}">
      <h3>${t('report')}</h3><p class="dim">${t('reportLead')}</p>
      <label class="f"><span>${t('reportMsg')}</span><textarea id="rp-msg" maxlength="2000" rows="5"></textarea></label>
      <label class="f"><span>${t('reportContact')}</span><input id="rp-contact" maxlength="120"></label>
      <input id="rp-hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px">
      <div class="row"><button class="wide" id="rp-send">${t('reportSend')}</button><button class="ghost" id="rp-close">${t('back')}</button><span class="dim" id="rp-status"></span></div></div>`;
    this.root.appendChild(box);
    const close = () => box.remove();
    box.addEventListener('click', e => { if (e.target === box) close(); });
    box.querySelector<HTMLElement>('#rp-close')!.onclick = close;
    (box.querySelector('#rp-msg') as HTMLTextAreaElement).focus();
    box.querySelector<HTMLButtonElement>('#rp-send')!.onclick = async () => {
      const msg = (box.querySelector('#rp-msg') as HTMLTextAreaElement).value.trim();
      const status = box.querySelector<HTMLElement>('#rp-status')!, btn = box.querySelector<HTMLButtonElement>('#rp-send')!;
      if (msg.length < 2) { status.textContent = t('reportMsg'); return; }
      btn.disabled = true; status.textContent = '…';
      const meta = { lvl: s.lvl, age: s.age, race: s.race, area: s.area, cp: Math.round(g.d.cp), rebirths: s.counters.rebirths, san: Math.round(s.san) };
      try {
        const r = await fetch(new URL('/api/feedback', location.origin.startsWith('http') ? location.origin : 'https://yore-tw.com').toString(), {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ game: 'souls-in-abyss', lang, msg, contact: (box.querySelector('#rp-contact') as HTMLInputElement).value.trim(), hp: (box.querySelector('#rp-hp') as HTMLInputElement).value, page: location.href.slice(0, 300), meta }),
        });
        if (r.status === 429) { status.textContent = t('reportRate'); btn.disabled = false; return; }
        if (!r.ok) throw new Error(String(r.status));
        status.textContent = t('reportSent'); setTimeout(close, 1200);
      } catch { status.textContent = t('reportFail'); btn.disabled = false; }
    };
  }

  private askHtml(q: keyof typeof UI, yes: string, yesLabel: keyof typeof UI): string {
    return `<p class="ask">${t(q)}<br><button class="danger${yesLabel === 'reset' ? ' wide' : ''}" data-a="${yes}">${t(yesLabel)}</button> <button data-a="disarm">${t('back')}</button></p>`;
  }

  private settingsHtml(): string {
    const ok = this.g.s.age >= REBIRTH_AGE;
    return `<div class="row"><b>${t('language')}</b><button data-a="lang" data-k="zh" ${lang === 'zh' ? 'disabled' : ''}>中文</button><button data-a="lang" data-k="en" ${lang === 'en' ? 'disabled' : ''}>English</button></div>
      ${this.armed === 'rebirthOpen' ? this.askHtml('rebirthConfirm', 'rebirthYes', 'navRebirth')
        : `<p><button class="danger" data-a="rebirthOpen" ${ok ? '' : 'disabled'}>${t('navRebirth')}</button>${ok ? '' : ` <span class="dim">${t('rebirthNeed')}</span>`}</p>`}
      ${this.armed === 'reset' ? this.askHtml('resetConfirm', 'resetYes', 'reset') : `<p><button class="ghost wide" data-a="reset">${t('reset')}</button></p>`}
      <p><button class="ghost wide" data-a="report">${t('report')}</button></p>
      <p class="dim">${t('credits')}</p><p class="dim">Original pixel artwork · Souls in Abyss</p>`;
  }
}

/** The pal's creature art in the dye it joined with. */
const petSrc = (p: PetState): string => { const d = petOf(p.key)!; return artSrc(creatureUrl(d.art, p.dye || CREATURE_DYES[d.art][0])); };

/** A pixel-styled dropdown: a button showing the choice, a menu of options; picking one fires `action` with data-k. */
const dropdown = (action: string, items: [string, string][], value: string) => {
  const cur = items.find(([v]) => v === value)?.[1] ?? items[0][1];
  // every label is stacked in the same cell, hidden, so the button is as wide as its longest choice whatever is picked
  const size = items.map(([, l]) => `<i aria-hidden="true">${l}</i>`).join('');
  return `<span class="dd"><button type="button" class="ddbtn" data-a="ddToggle"><span class="ddlab"><span>${cur}</span>${size}</span>${icon('arrow', 'gi sm ddarrow')}</button>
    <div class="ddmenu" hidden>${items.map(([v, l]) => `<button type="button" class="ddopt ${v === value ? 'on' : ''}" data-a="${action}" data-k="${v}">${l}</button>`).join('')}</div></span>`;
};

/** Age preview: the chosen race's character art, taller with each year. One figure; the arrows beside the number step the age. */
const figure = (h: number, race: string) => `<img class="pict art${heroFacesLeft(race) ? ' flip' : ''}" src="${artSrc(heroArtUrl(race))}" style="height:${h}px" alt="" draggable="false">`;
const tri = (left: boolean) => `<svg class="tri" viewBox="0 0 8 12" aria-hidden="true"><polygon points="${left ? '8,0 0,6 8,12' : '0,0 8,6 0,12'}"/></svg>`;

/** Race icons (left), age figures (right), and a stat table below. Shared by creation and rebirth. */
export function raceAgePicker(race: string, age: number, raceAction: string, ageAction: string): string {
  const r = raceOf(race), g = ageGrowth(r, age);
  const list = RACES.map(x => `<button class="rrow ${x.key === race ? 'on' : ''}" data-a="${raceAction}" data-k="${x.key}" title="${tr(x.name)}" aria-pressed="${x.key === race}">
      <span class="rico">${icon(x.key)}</span><span class="rname">${tr(x.name)}</span></button>`).join('');
  const lo = START_AGES[0], hi = START_AGES[START_AGES.length - 1];
  const arrow = (to: number, left: boolean) => `<button type="button" class="agearr" data-a="${ageAction}" data-k="${to}" ${to < lo || to > hi ? 'disabled' : ''} aria-label="${t('age')} ${to}">${tri(left)}</button>`;
  const figs = `<div class="agepick"><small class="agelbl">${t('age')}</small>
      <div class="agerow">${arrow(age - 1, true)}<span class="agev">${age}</span>${arrow(age + 1, false)}</div>
      <div class="fig on">${figure(80 + (age - 10) * 5, race)}</div></div>`;
  const head = PRIMARY.map(k => `<th>${icon(k, 'gi sm')}${tr(STAT[k])}</th>`).join('');
  const row = (o: Record<string, number>, plus: boolean) => PRIMARY.map(k => `<td class="${plus ? 'plus' : ''}">${plus ? '+' : ''}${o[k]}</td>`).join('');
  return `<div class="picker"><div class="rcol"><div class="rlist">${list}</div><p class="rdesc">${tr(r.desc)}</p></div><div class="rinfo">
      ${figs}
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
  let race = 'elf', age = 13, name: string = DEFAULT_NAME[lang]; // after One Hundred Years of Solitude
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
    root.querySelector<HTMLElement>('#c-go')!.onclick = () => { keep(); done((name.trim() || DEFAULT_NAME[lang]).slice(0, 12), race, age); };
  };
  const keep = () => { name = (root.querySelector('#c-name') as HTMLInputElement).value; };
  titleScreen();
}
