import { PRIMARY, type Item, type L, type Save } from './types';
import { derive, xpNeed, type Derived } from './stats';
import { difficulty, spawn, type Monster } from './monsters';
import { AREAS, areaOf } from '../data/areas';
import { LEVEL_SHARE, ageGrowth, raceOf } from '../data/races';
import { SKILLS, type SkillDef, activeRank } from '../data/skills';
import { PETS, BOND_MAX, BOND_SEC, petOf, petXpNeed, stageOf } from '../data/pets';
import { TITLES } from '../data/titles';
import { FATE_CHANCE, FATE_LINES } from '../data/fate';
import { BAG_SIZE, DROP_CHANCE, RARITY } from '../data/items';
import { chance, pick, range, rnd } from '../core/rng';
import { makeItem, nameOf, rollRarity, sellPrice } from './loot';
import { REBIRTH_AGE, YEAR_SEC } from './state';
import { tr } from '../core/i18n';
import { COLLAPSE, COLLAPSE_SEC, GLITCH, HALLUCINATIONS, LOSS_MAX, LOSS_MIN, SAN_REGEN, SAN_WAKE, WAKE, deathSanLoss, madInterval, madness, rollMad, sanTier } from '../data/sanity';
import { SAN_MAX } from './state';

/** A log line is a list of parts; styled parts carry a CSS class or a colour. */
export type Part = string | { text: string; cls?: string; color?: string };
export type GameEvent =
  | { t: 'log'; parts: Part[]; cls?: string }
  | { t: 'hit'; from: 'hero' | 'mon' | 'pet'; dmg: number; crit?: boolean; skill?: string; blocked?: boolean; target?: 'pet' }
  | { t: 'spawn' } | { t: 'kill' } | { t: 'death' } | { t: 'level' } | { t: 'heal'; amt: number }
  | { t: 'collapse' } | { t: 'wake' };

/** Running tally shown as "Loot in current map"; resets when you move. */
export interface MapLoot { sec: number; kills: number; deaths: number; gold: number; xp: number; items: number[] }

const KILL_PAUSE = 0.6, RESPAWN = 5, PET_INTERVAL = 2.2;
/** Pals: a quarter of the monster's blows land on the pal; a downed pal rests this long; with full MP it goes all out, spending this share. */
const PET_TARGET = 0.25, PET_REST = 20, PET_SKILL_COST = 0.3;
const ATTACKS = SKILLS.filter(s => s.act?.on === 'attack');
const DEFENDS = SKILLS.filter(s => s.act?.on === 'defend');

export class Game {
  s: Save;
  d!: Derived;
  hp = 0; mp = 0;
  petHp = 0; petMp = 0;
  mon!: Monster;
  monColor = '#555';
  loot: MapLoot = { sec: 0, kills: 0, deaths: 0, gold: 0, xp: 0, items: RARITY.map(() => 0) };
  quiet = false;
  private heroT = 0; private monT = 0; private petT = 0;
  private pause = 0; private down = 0;
  private petDown = 0; private petKey: string | null = null;
  private madT = 0;
  /** True while the screen is black after SAN hit 0. */
  collapsing = false;
  private listeners: ((e: GameEvent) => void)[] = [];

  constructor(s: Save) {
    this.s = s;
    this.refresh();
    this.hp = this.d.hp; this.mp = this.d.mp;
    this.newMonster();
  }

  on(f: (e: GameEvent) => void): void { this.listeners.push(f); }
  private emit(e: GameEvent): void { if (!this.quiet) for (const f of this.listeners) f(e); }

  /** Log a line. tpl may contain {0} {1} ... filled with styled parts. */
  say(tpl: L | string, args: Part[] = [], cls?: string): void {
    if (this.quiet) return;
    const text = typeof tpl === 'string' ? tpl : tr(tpl);
    const parts: Part[] = [];
    text.split(/(\{\d\})/).forEach(seg => {
      const m = /^\{(\d)\}$/.exec(seg);
      if (m) parts.push(args[Number(m[1])]); else if (seg) parts.push(seg);
    });
    this.emit({ t: 'log', parts, cls });
  }
  private monPart(): Part {
    // when mad, names sometimes come out wrong
    const name = sanTier(this.s.san) === 2 && chance(0.3) ? tr(pick(GLITCH)) : tr(this.mon.def.name);
    return { text: name, color: this.monColor };
  }
  private n(x: number, cls = 'num'): Part { return { text: String(Math.max(0, Math.round(x))), cls }; }

  /** Recompute derived stats; call after anything that changes gear, skills, level, pet or titles. */
  refresh(): void {
    const prev = this.d;
    this.d = derive(this.s);
    if (prev && this.hp > 0) this.hp = Math.min(this.d.hp, this.hp * (this.d.hp / prev.hp));
    if (prev) this.mp = Math.min(this.d.mp, this.mp);
  }

  newMonster(): void {
    this.mon = spawn(areaOf(this.s.area));
    this.monColor = difficulty(this.mon.cp, this.d.cp).color;
    this.monT = this.mon.interval * 0.8; this.heroT = 0;
    this.emit({ t: 'spawn' });
    this.say({ zh: '遭遇 {0}！', en: 'You meet {0}!' }, [this.monPart()]);
  }

  resetLoot(): void { this.loot = { sec: 0, kills: 0, deaths: 0, gold: 0, xp: 0, items: RARITY.map(() => 0) }; }

  get downFor(): number { return this.down; }
  get petDownFor(): number { return this.petDown; }
  /** The pal's own pools: a share of yours, growing with its stage and bond. */
  get petMaxHp(): number { const st = this.s.pets.find(p => p.key === this.s.activePet); return st ? this.d.hp * [0.45, 0.6, 0.8][stageOf(st.lvl)] * (1 + st.bond * 0.02) : 0; }
  get petMaxMp(): number { return this.s.activePet ? this.d.mp * 0.6 : 0; }
  private petPart(): Part {
    const st = this.s.pets.find(p => p.key === this.s.activePet)!;
    return { text: tr(petOf(st.key)!.stages[stageOf(st.lvl)].name), cls: 'pet' };
  }

  tick(dt: number): void {
    const s = this.s;
    s.counters.playSec += dt; this.loot.sec += dt;
    this.ageTick(dt);
    this.petBondTick(dt);
    this.mp = Math.min(this.d.mp, this.mp + this.d.mp * 0.01 * dt);
    if (s.activePet !== this.petKey) { this.petKey = s.activePet; this.petHp = this.petMaxHp; this.petMp = this.petMaxMp; this.petDown = 0; }
    if (s.activePet) {
      this.petMp = Math.min(this.petMaxMp, this.petMp + this.petMaxMp * 0.01 * dt);
      if (this.petDown > 0) {
        this.petDown -= dt;
        if (this.petDown <= 0) { this.petHp = this.petMaxHp; this.say({ zh: '{0} 回到你身邊', en: '{0} returns to your side' }, [this.petPart()], 'pet'); }
      }
    }
    if (areaOf(s.area).dread === 0 && s.san < SAN_MAX) this.setSan(s.san + SAN_REGEN * dt);
    this.madTick(dt);
    if (this.down > 0) {
      this.down -= dt;
      if (this.down <= 0) {
        if (this.collapsing) this.wake();
        this.hp = this.d.hp; this.mp = this.d.mp; this.petHp = this.petMaxHp; this.petDown = 0;
        this.say({ zh: '深淵賜予你重生', en: 'The Abyss grants you rebirth' }, [], 'fate');
        this.newMonster();
      }
      return;
    }
    if (this.pause > 0) { this.pause -= dt; if (this.pause <= 0) this.newMonster(); return; }

    this.heroT += dt;
    while (this.heroT >= this.d.interval && this.mon.hp > 0) { this.heroT -= this.d.interval; this.heroAttack(); }
    if (this.mon.hp <= 0) return;

    if (s.activePet && this.petDown <= 0) {
      this.petT += dt;
      while (this.petT >= PET_INTERVAL && this.mon.hp > 0) { this.petT -= PET_INTERVAL; this.petAttack(); }
      if (this.mon.hp <= 0) return;
    }

    this.monT += dt;
    while (this.monT >= this.mon.interval && this.hp > 0 && this.mon.hp > 0) { this.monT -= this.mon.interval; this.monAttack(); }
  }

  /** A physical roll: min..max, pulled toward max by balance. */
  private roll(): number {
    const d = this.d;
    const r = Math.max(0, Math.min(1, d.bal + (rnd() + rnd() - 1) * 0.45));
    return d.atkMin + (d.atkMax - d.atkMin) * r;
  }
  private vsArmor(x: number): number { return Math.max(1, x - this.mon.armor) * (1 - this.mon.prt); }
  private rank(sk: SkillDef): number { return activeRank(this.s, sk.key); }

  private heroAttack(): void {
    for (const sk of ATTACKS) {
      const r = this.rank(sk), a = sk.act!;
      if (!r || !chance(a.chance(r))) continue;
      const cost = a.mp ? a.mp(r) : 0;
      if (cost > this.mp) continue;
      this.mp -= cost;
      const crit = chance(this.d.crit);
      let dmg = a.mp ? this.d.magic * a.power(r) : this.roll() * a.power(r);
      if (a.effect !== 'pierce') dmg = this.vsArmor(dmg);
      if (crit) dmg *= this.d.critDmg;
      dmg *= range(0.95, 1.05);
      if (a.effect === 'slow') this.monT -= this.mon.interval * 0.5;
      this.say({ zh: '你使用 {0}，對 {1} 造成 {2} 傷害', en: 'You use {0}, cause {1} {2} damage.' }, [{ text: tr(sk.name), cls: 'skname' }, this.monPart(), this.n(dmg, crit ? 'num crit' : 'num')]);
      this.damageMon(dmg, 'hero', crit, sk.key);
      return;
    }
    const crit = chance(this.d.crit);
    let dmg = this.vsArmor(this.roll());
    if (crit) dmg *= this.d.critDmg;
    this.say({ zh: '你對 {0} 造成 {1} 傷害', en: 'You cause {1} damage to {0}' }, [this.monPart(), this.n(dmg, crit ? 'num crit' : 'num')]);
    this.damageMon(dmg, 'hero', crit);
  }

  private petAttack(): void {
    const st = this.s.pets.find(p => p.key === this.s.activePet);
    if (!st) return;
    const d = petOf(st.key)!, stage = stageOf(st.lvl);
    const avg = this.d.atkMin + (this.d.atkMax - this.d.atkMin) * this.d.bal;
    let dmg = this.vsArmor(avg * (0.12 + st.lvl * 0.006) * [1, 1.5, 2.2][stage] * this.d.petPower * range(0.9, 1.1));
    if (this.d.petHeal > 0 && this.hp < this.d.hp) {
      const amt = Math.min(this.d.hp - this.hp, this.d.hp * this.d.petHeal);
      this.hp += amt; this.emit({ t: 'heal', amt });
    }
    // with a full MP bar the pal puts everything into one blow, then charges back up (~30s)
    const cost = this.petMaxMp * PET_SKILL_COST, allOut = cost > 0 && this.petMp >= this.petMaxMp - 1e-6;
    if (allOut) { this.petMp -= cost; dmg *= 2; }
    const name: Part = { text: tr(d.stages[stage].name), cls: 'pet' };
    if (allOut) this.say({ zh: '{0} 使出全力一擊，對 {1} 造成 {2} 傷害', en: '{0} goes all out, {2} damage to {1}' }, [name, this.monPart(), this.n(dmg)]);
    else this.say({ zh: '{0} 對 {1} 造成 {2} 傷害', en: '{0} causes {2} damage to {1}' }, [name, this.monPart(), this.n(dmg)]);
    this.damageMon(dmg, 'pet', false);
  }

  private damageMon(dmg: number, from: 'hero' | 'pet', crit: boolean, skill?: string): void {
    this.mon.hp -= dmg;
    this.emit({ t: 'hit', from, dmg, crit, skill });
    if (this.mon.hp <= 0) this.onKill();
  }

  /** The monster turns on the pal: it shares your defences but not your guard, and rests when it falls. */
  private hitPet(): void {
    const raw = this.mon.atk * range(0.85, 1.15);
    const dmg = Math.max(1, raw - this.d.def) * (1 - this.d.prt) * this.d.dmgTaken;
    this.petHp -= dmg;
    this.emit({ t: 'hit', from: 'mon', dmg, target: 'pet' });
    this.say({ zh: '{0} 對 {1} 造成 {2} 傷害', en: '{0} causes {2} damage to {1}' }, [this.monPart(), this.petPart(), this.n(dmg)]);
    if (this.petHp <= 0) {
      this.petHp = 0; this.petDown = PET_REST;
      this.say({ zh: '{0} 倒下了，先休息一下', en: '{0} is down and needs a rest' }, [this.petPart()], 'bad');
    }
  }

  private monAttack(): void {
    if (this.s.activePet && this.petDown <= 0 && chance(PET_TARGET)) { this.hitPet(); return; }
    let mult = 1;
    for (const sk of DEFENDS) {
      const r = this.rank(sk), a = sk.act!;
      if (!r || !chance(a.chance(r))) continue;
      if (a.effect === 'counter') {
        const dmg = this.vsArmor(this.roll() * a.power(r));
        this.say({ zh: '你使用 {0}，對 {1} 造成 {2} 傷害', en: 'You use {0}, cause {1} {2} damage.' }, [{ text: tr(sk.name), cls: 'skname' }, this.monPart(), this.n(dmg)]);
        this.emit({ t: 'hit', from: 'mon', dmg: 0, blocked: true });
        this.damageMon(dmg, 'hero', false, sk.key);
        return;
      }
      mult = a.power(r);
      this.say({ zh: '你使用 {0}', en: 'You use {0}' }, [{ text: tr(sk.name), cls: 'skname' }]);
      break;
    }
    const raw = this.mon.atk * range(0.85, 1.15);
    const dmg = Math.max(1, raw - this.d.def) * (1 - this.d.prt) * (1 - this.d.guard) * this.d.dmgTaken * mult;
    this.hp -= dmg;
    this.emit({ t: 'hit', from: 'mon', dmg, blocked: mult < 1 });
    this.say({ zh: '{0} 對你造成 {1} 傷害', en: '{0} cause {1} damage to You' }, [this.monPart(), this.n(dmg, 'num big')]);
    if (this.hp <= 0) {
      this.hp = 0; this.down = RESPAWN; this.s.counters.deaths++; this.loot.deaths++;
      this.say({ zh: '你倒下了！', en: 'You die!' }, [], 'bad'); // the Abyss answers once the revive animation is over
      this.emit({ t: 'death' });
      this.deathSan();
      this.checkTitles();
    }
  }

  private onKill(): void {
    const s = this.s, m = this.mon, c = s.counters;
    c.kills++; this.loot.kills++;
    const idx = AREAS.findIndex(a => a.key === s.area);
    if (idx > c.deepest) c.deepest = idx;
    const diff = s.lvl - m.lvl;
    const xp = m.xp * this.d.xp * (diff > 5 ? Math.max(0.05, 1 - (diff - 5) * 0.12) : 1);
    const gold = m.gold * this.d.gold * range(0.8, 1.2);
    s.gold += gold;
    this.loot.gold += gold; this.loot.xp += xp;
    this.emit({ t: 'kill' });
    // one line per kill: EXP, gold and any drop together
    const drop = chance(DROP_CHANCE * this.d.drop) ? this.dropItem(m.lvl) : null;
    const goldPart: Part = { text: '$' + Math.floor(gold), cls: 'gold' };
    if (!drop) this.say({ zh: '獲得 {0} EXP、{1}', en: 'You get {0} EXP, {1}' }, [this.n(xp, 'xp'), goldPart]);
    else if (drop.sold === undefined) this.say({ zh: '獲得 {0} EXP、{1}、{2}', en: 'You get {0} EXP, {1}, {2}' }, [this.n(xp, 'xp'), goldPart, drop.label]);
    else this.say({ zh: '獲得 {0} EXP、{1}、{2}（自動賣出 {3}）', en: 'You get {0} EXP, {1}, {2} (sold for {3})' }, [this.n(xp, 'xp'), goldPart, drop.label, { text: '$' + drop.sold, cls: 'gold' }]);
    this.gainXp(xp);
    this.hp = Math.min(this.d.hp, this.hp + this.d.hp * this.d.heal);
    this.mp = Math.min(this.d.mp, this.mp + this.d.mp * this.d.heal);

    this.petKill(m.lvl);
    this.tryBefriend();
    if (chance(FATE_CHANCE)) { c.fateLines++; this.say(pick(FATE_LINES), [], 'fate'); }
    if (c.kills % 25 === 0) this.checkTitles();
    this.pause = KILL_PAUSE;
    if (sanTier(s.san) === 2 && chance(0.05)) this.say(pick(HALLUCINATIONS), [], 'mad');
  }

  /** SAN lost on dying in an area above your level (nothing on safe ground). WILL and a bonded pal soften it. */
  sanLossHere(): number {
    const s = this.s, a = areaOf(s.area);
    if (!a.dread) return 0;
    const pet = s.pets.find(p => p.key === s.activePet);
    return deathSanLoss(a.min, s.lvl, this.d.prim.will, this.d.sanDrain, pet ? pet.bond : 0);
  }
  private deathSan(): void {
    const loss = this.sanLossHere();
    if (!loss) return;
    this.setSan(this.s.san - loss);
    this.say({ zh: 'SAN -{0}', en: 'SAN -{0}' }, [{ text: String(loss), cls: 'num' }], 'mad');
    if (this.s.san <= 0) {
      // the mind breaks: the screen goes black, and you wake on the surface with less than you had
      this.collapsing = true; this.down = COLLAPSE_SEC;
      this.s.counters.collapses = (this.s.counters.collapses || 0) + 1;
      this.say(COLLAPSE, [], 'mad');
      this.emit({ t: 'collapse' });
    }
  }

  /** While mad, the Abyss re-rolls its blessings and curses every 5 s (edge of madness) down to every 1 s (SAN 0). */
  private madTick(dt: number): void {
    const s = this.s, m = madness(s.san);
    if (m <= 0) {
      if (s.madRoll) { s.madRoll = undefined; this.madT = 0; this.refresh(); }
      return;
    }
    this.madT -= dt;
    if (this.madT > 0 && s.madRoll) return;
    this.madT = madInterval(m);
    s.madRoll = rollMad(m);
    this.refresh();
  }

  /** After the blackout: 30–50% of the gold, the bag and this life's EXP are gone (each rolled), and you wake on the first layer. */
  private wake(): void {
    const s = this.s;
    this.collapsing = false;
    const pg = range(LOSS_MIN, LOSS_MAX), pb = range(LOSS_MIN, LOSS_MAX), px = range(LOSS_MIN, LOSS_MAX);
    const goldLost = Math.floor(s.gold * pg);
    s.gold -= goldLost;
    const drop = Math.round(s.bag.length * pb);
    for (let i = 0; i < drop; i++) s.bag.splice(Math.floor(rnd() * s.bag.length), 1);
    // EXP: the whole life's worth, so the level falls back to wherever the rest of it reaches
    const lv0 = s.lvl;
    let total = s.xp;
    for (let l = 1; l < s.lvl; l++) total += xpNeed(l);
    const xpLost = Math.floor(total * px);
    let left = total - xpLost, lvl = 1;
    while (left >= xpNeed(lvl)) { left -= xpNeed(lvl); lvl++; }
    s.peakLvl = Math.max(s.peakLvl || 0, lv0);
    if (lvl < lv0) {
      // the growth those levels gave goes with them; it comes back on the way up, the AP do not
      const g = ageGrowth(raceOf(s.race), s.age);
      for (const k of PRIMARY) s.grown[k] = Math.max(0, s.grown[k] - g[k] * LEVEL_SHARE * (lv0 - lvl));
    }
    s.lvl = lvl; s.xp = left;
    const home = AREAS[0].key;
    s.area = home;
    if (s.visited && !s.visited.includes(home)) s.visited.push(home);
    s.san = SAN_WAKE; s.madRoll = undefined; this.madT = 0;
    this.resetLoot(); this.refresh();
    this.say(WAKE, [], 'fate');
    this.say({ zh: '失去 {0}、{1} 件物品、{2} EXP（Lv.{3} → Lv.{4}）', en: 'Lost {0}, {1} items, {2} EXP (Lv.{3} → Lv.{4})' },
      [{ text: '$' + goldLost, cls: 'gold' }, String(drop), { text: String(xpLost), cls: 'xp' }, String(lv0), String(lvl)], 'bad');
    this.emit({ t: 'wake' });
  }

  setSan(v: number): void {
    const before = sanTier(this.s.san);
    this.s.san = Math.max(0, Math.min(SAN_MAX, v));
    const after = sanTier(this.s.san);
    if (after !== before) {
      this.refresh();
      if (after > before) this.say(after === 2 ? { zh: '你開始聽見不該聽見的聲音。（瘋狂）', en: 'You begin to hear what you should not. (Mad)' } : { zh: '你的手在發抖。（動搖）', en: 'Your hands are shaking. (Shaken)' }, [], 'mad');
      else if (after === 0) this.say({ zh: '腦袋清楚多了。（清醒）', en: 'Your head clears. (Lucid)' }, [], 'good');
    }
  }

  private gainXp(x: number): void {
    const s = this.s;
    s.xp += x;
    let up = false;
    while (s.xp >= xpNeed(s.lvl)) {
      s.xp -= xpNeed(s.lvl); s.lvl++; up = true;
      const g = ageGrowth(raceOf(s.race), s.age);
      for (const k of PRIMARY) s.grown[k] += g[k] * LEVEL_SHARE;
      this.say({ zh: '升級！到達 Lv.{0}！', en: 'Level Up! You reach Lv.{0}!' }, [{ text: String(s.lvl), cls: 'good' }], 'good');
      if (s.lvl > (s.peakLvl || 0)) {
        s.peakLvl = s.lvl; s.ap++;
        this.say({ zh: '獲得 {0} 技能點！', en: 'You get {0} AP!' }, [{ text: '1', cls: 'ap' }], 'ap');
      }
    }
    if (up) { this.refresh(); this.hp = this.d.hp; this.mp = this.d.mp; this.emit({ t: 'level' }); }
  }

  private ageTick(dt: number): void {
    const s = this.s;
    s.ageT += dt;
    while (s.ageT >= YEAR_SEC) {
      s.ageT -= YEAR_SEC; s.age++;
      const g = ageGrowth(raceOf(s.race), s.age);
      for (const k of PRIMARY) s.grown[k] += g[k];
      s.ap += 5;
      this.refresh();
      this.say({ zh: '你 {0} 歲了！', en: 'You are {0} now!' }, [{ text: String(s.age), cls: 'good' }], 'good');
      this.say({ zh: '獲得 {0} 技能點！', en: 'You get {0} AP!' }, [{ text: '5', cls: 'ap' }], 'ap');
      if (s.age === REBIRTH_AGE) this.say({ zh: '深淵在呼喚你的靈魂。（可以轉生了）', en: 'The Abyss calls your soul. (Rebirth is open)' }, [], 'fate');
    }
  }

  private lastPetTap = 0;
  /** Tapping the pal: it answers with a quip; once a minute the tap also deepens the bond a little. */
  petTap(): boolean {
    const st = this.s.pets.find(p => p.key === this.s.activePet);
    if (!st) return false;
    const d = petOf(st.key)!;
    this.say(pick(d.quips), [], 'pet');
    const now = Date.now();
    if (now - this.lastPetTap > 60_000 && st.bond < BOND_MAX) { st.bondT += 30; this.lastPetTap = now; }
    return true;
  }

  private petBondTick(dt: number): void {
    const st = this.s.pets.find(p => p.key === this.s.activePet);
    if (!st || st.bond >= BOND_MAX) return;
    st.bondT += dt;
    if (st.bondT >= BOND_SEC) {
      st.bondT -= BOND_SEC; st.bond++; this.refresh();
      const d = petOf(st.key)!;
      this.say({ zh: '和 {0} 的羈絆加深了（{1}）。', en: 'Your bond with {0} deepens ({1}).' }, [{ text: tr(d.stages[stageOf(st.lvl)].name), cls: 'pet' }, String(st.bond)], 'pet');
    }
  }

  private petKill(mlvl: number): void {
    const st = this.s.pets.find(p => p.key === this.s.activePet);
    if (!st) return;
    const d = petOf(st.key)!;
    st.xp += mlvl >= st.lvl - 5 ? 1 : 0.3;
    while (st.xp >= petXpNeed(st.lvl)) {
      st.xp -= petXpNeed(st.lvl);
      const before = stageOf(st.lvl);
      st.lvl++;
      const after = stageOf(st.lvl);
      if (after > before) this.say({ zh: '{0} 進化成 {1}！', en: '{0} grew into {1}!' }, [{ text: tr(d.stages[before].name), cls: 'pet' }, { text: tr(d.stages[after].name), cls: 'pet' }], 'pet');
      this.refresh();
    }
    if (chance(0.02)) this.say(pick(d.quips), [], 'pet');
  }

  private tryBefriend(): void {
    const s = this.s;
    // the first pal is a sure thing so everyone meets the system early
    if (s.pets.length === 0 && s.counters.kills >= 25) { this.befriend(PETS[0].key); return; }
    for (const d of PETS) {
      if (d.home !== s.area || s.pets.some(p => p.key === d.key)) continue;
      if (d.needRebirths && s.counters.rebirths < d.needRebirths) continue;
      if (chance(d.chance * this.d.drop)) { this.befriend(d.key); return; }
    }
  }

  befriend(key: string): void {
    const s = this.s, d = petOf(key);
    if (!d || s.pets.some(p => p.key === key)) return;
    s.pets.push({ key, lvl: 1, xp: 0, bond: 0, bondT: 0 });
    if (!s.activePet) s.activePet = key;
    this.refresh();
    this.say({ zh: '{0} 想跟著你走！', en: '{0} wants to come with you!' }, [{ text: tr(d.stages[0].name), cls: 'pet' }], 'pet');
    this.checkTitles();
  }

  /** Rolls a drop and stores or auto-sells it; the kill line reports it. */
  private dropItem(lvl: number): { label: Part; sold?: number } {
    const s = this.s;
    const it = makeItem(s, lvl, rollRarity(this.d.drop));
    this.loot.items[it.rarity]++;
    const label: Part = { text: `${tr(RARITY[it.rarity].name)} ${tr(nameOf(it))}`, color: RARITY[it.rarity].color };
    if (it.rarity < s.autoSell || s.bag.length >= BAG_SIZE) {
      const g = sellPrice(it); s.gold += g;
      return { label, sold: g };
    }
    s.bag.push(it);
    return { label };
  }

  checkTitles(): void {
    let got = false;
    for (const t of TITLES) {
      if (this.s.titles.includes(t.key) || !t.test(this.s.counters, this.s)) continue;
      this.s.titles.push(t.key); got = true;
      this.say({ zh: '獲得稱號「{0}」', en: 'Title earned: {0}' }, [{ text: tr(t.name), cls: 'title' }], 'title');
    }
    if (got) this.refresh();
  }

  /** Fast-forward for offline time. Runs the real combat loop in coarse steps without events. */
  fastForward(sec: number): { kills: number; gold: number; xpLv: number; items: number } {
    const s = this.s, k0 = s.counters.kills, g0 = s.gold, l0 = s.lvl, b0 = s.bag.length;
    this.quiet = true;
    const step = 0.25;
    for (let t = 0; t < sec; t += step) this.tick(step);
    this.quiet = false;
    return { kills: s.counters.kills - k0, gold: s.gold - g0, xpLv: s.lvl - l0, items: s.bag.length - b0 };
  }

  itemOf(uid: number): Item | undefined {
    return this.s.bag.find(i => i.uid === uid) || Object.values(this.s.equip).find(i => i && i.uid === uid);
  }
}
