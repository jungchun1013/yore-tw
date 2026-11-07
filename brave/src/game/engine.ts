import { PRIMARY, type Item, type L, type Save } from './types';
import { derive, xpNeed, type Derived } from './stats';
import { spawn, type Monster } from './monsters';
import { AREAS, areaOf } from '../data/areas';
import { ageFactor, raceOf } from '../data/races';
import { SKILLS } from '../data/skills';
import { PETS, BOND_MAX, BOND_SEC, petOf, petXpNeed, stageOf } from '../data/pets';
import { TITLES } from '../data/titles';
import { FATE_CHANCE, FATE_LINES } from '../data/fate';
import { BAG_SIZE, DROP_CHANCE, RARITY } from '../data/items';
import { chance, pick, range } from '../core/rng';
import { makeItem, nameOf, rollRarity, sellPrice } from './loot';
import { REBIRTH_AGE, YEAR_SEC } from './state';
import { tr } from '../core/i18n';

export type GameEvent =
  | { t: 'log'; text: string; cls?: string }
  | { t: 'hit'; from: 'hero' | 'mon' | 'pet'; dmg: number; crit?: boolean; miss?: boolean; skill?: string }
  | { t: 'spawn' } | { t: 'kill' } | { t: 'death' } | { t: 'level' } | { t: 'heal'; amt: number };

const KILL_PAUSE = 0.6, RESPAWN = 5, PET_INTERVAL = 2.2;

export class Game {
  s: Save;
  d!: Derived;
  hp = 0;
  mon!: Monster;
  quiet = false;
  private heroT = 0; private monT = 0; private petT = 0;
  private pause = 0; private down = 0;
  private listeners: ((e: GameEvent) => void)[] = [];

  constructor(s: Save) {
    this.s = s;
    this.refresh();
    this.hp = this.d.hp;
    this.newMonster();
  }

  on(f: (e: GameEvent) => void): void { this.listeners.push(f); }
  private emit(e: GameEvent): void { if (!this.quiet) for (const f of this.listeners) f(e); }
  log(x: L | string, cls?: string): void { if (!this.quiet) this.emit({ t: 'log', text: typeof x === 'string' ? x : tr(x), cls }); }

  /** Recompute derived stats; call after anything that changes gear, skills, level, pet or titles. */
  refresh(): void {
    const prevMax = this.d ? this.d.hp : 0;
    this.d = derive(this.s);
    if (prevMax && this.hp > 0) this.hp = Math.min(this.d.hp, this.hp * (this.d.hp / prevMax));
  }

  newMonster(): void {
    this.mon = spawn(areaOf(this.s.area));
    this.monT = this.mon.interval * 0.8; this.heroT = 0;
    this.emit({ t: 'spawn' });
  }

  get downFor(): number { return this.down; }

  tick(dt: number): void {
    const s = this.s;
    s.counters.playSec += dt;
    this.ageTick(dt);
    this.petBondTick(dt);
    if (this.down > 0) {
      this.down -= dt;
      if (this.down <= 0) { this.hp = this.d.hp; this.newMonster(); }
      return;
    }
    if (this.pause > 0) { this.pause -= dt; if (this.pause <= 0) this.newMonster(); return; }

    this.heroT += dt;
    while (this.heroT >= this.d.interval && this.mon.hp > 0) { this.heroT -= this.d.interval; this.heroAttack(); }
    if (this.mon.hp <= 0) return;

    if (s.activePet) {
      this.petT += dt;
      while (this.petT >= PET_INTERVAL && this.mon.hp > 0) { this.petT -= PET_INTERVAL; this.petAttack(); }
      if (this.mon.hp <= 0) return;
    }

    this.monT += dt;
    while (this.monT >= this.mon.interval && this.hp > 0) { this.monT -= this.mon.interval; this.monAttack(); }
  }

  private hitChance(): number {
    return Math.max(0.35, Math.min(0.99, 0.86 + (this.d.acc - this.mon.lvl * 1.6) * 0.004 - this.mon.eva));
  }
  private armorCut(): number { return 1 - this.mon.armor / (this.mon.armor + 150); }

  private heroAttack(): void {
    if (!chance(this.hitChance())) { this.emit({ t: 'hit', from: 'hero', dmg: 0, miss: true }); return; }
    let mult = 1, skill: string | undefined, magic = false;
    for (const sk of SKILLS) {
      const lv = this.s.skills[sk.key] || 0;
      if (sk.proc && lv && chance(sk.proc.chance(lv))) { mult = sk.proc.mult(lv); skill = sk.key; magic = sk.proc.scale === 'magic'; break; }
    }
    const crit = chance(this.d.crit);
    let dmg = (magic ? this.d.magic : this.d.atk * this.armorCut()) * mult * range(0.9, 1.1);
    if (crit) dmg *= this.d.critDmg;
    this.damageMon(dmg, 'hero', crit, skill);
  }

  private petAttack(): void {
    const st = this.s.pets.find(p => p.key === this.s.activePet);
    if (!st) return;
    const stage = stageOf(st.lvl);
    const dmg = this.d.atk * (0.12 + st.lvl * 0.006) * [1, 1.5, 2.2][stage] * this.d.petPower * range(0.9, 1.1) * this.armorCut();
    if (this.d.petHeal > 0 && this.hp < this.d.hp) {
      const amt = Math.min(this.d.hp - this.hp, this.d.hp * this.d.petHeal);
      this.hp += amt; this.emit({ t: 'heal', amt });
    }
    this.damageMon(dmg, 'pet', false);
  }

  private damageMon(dmg: number, from: 'hero' | 'pet', crit: boolean, skill?: string): void {
    this.mon.hp -= dmg;
    this.emit({ t: 'hit', from, dmg, crit, skill });
    if (this.mon.hp <= 0) this.onKill();
  }

  private monAttack(): void {
    if (chance(this.d.eva)) { this.emit({ t: 'hit', from: 'mon', dmg: 0, miss: true }); return; }
    const def = this.d.def;
    const dmg = this.mon.atk * range(0.85, 1.15) * (1 - def / (def + 30 + this.mon.lvl * 5)) * (1 - this.d.guard);
    this.hp -= dmg;
    this.emit({ t: 'hit', from: 'mon', dmg });
    if (this.hp <= 0) {
      this.hp = 0; this.down = RESPAWN; this.s.counters.deaths++;
      this.log({ zh: `${this.s.name} 倒下了……${RESPAWN} 秒後重新站起來。`, en: `${this.s.name} falls... back up in ${RESPAWN}s.` }, 'bad');
      this.emit({ t: 'death' });
      this.checkTitles();
    }
  }

  private onKill(): void {
    const s = this.s, m = this.mon, c = s.counters;
    c.kills++;
    const idx = AREAS.findIndex(a => a.key === s.area);
    if (idx > c.deepest) c.deepest = idx;
    const diff = s.lvl - m.lvl;
    const xpScale = diff > 5 ? Math.max(0.05, 1 - (diff - 5) * 0.12) : 1;
    const xp = m.xp * this.d.xp * xpScale;
    const gold = m.gold * this.d.gold * range(0.8, 1.2);
    s.gold += gold;
    this.emit({ t: 'kill' });
    this.log({ zh: `擊倒 ${tr(m.def.name)} Lv${m.lvl}  +${Math.floor(xp)} 經驗 +${Math.floor(gold)} 金`, en: `Felled ${tr(m.def.name)} Lv${m.lvl}  +${Math.floor(xp)} XP +${Math.floor(gold)} g` }, 'dim');
    this.gainXp(xp);
    this.hp = Math.min(this.d.hp, this.hp + this.d.hp * this.d.heal);

    if (chance(DROP_CHANCE * this.d.drop)) this.dropItem(m.lvl);
    this.petKill(m.lvl);
    this.tryBefriend();
    if (chance(FATE_CHANCE)) { c.fateLines++; this.log(pick(FATE_LINES), 'fate'); }
    if (c.kills % 25 === 0) this.checkTitles();
    this.pause = KILL_PAUSE;
  }

  private gainXp(x: number): void {
    const s = this.s;
    s.xp += x;
    let up = false;
    while (s.xp >= xpNeed(s.lvl)) {
      s.xp -= xpNeed(s.lvl); s.lvl++; up = true;
      if (s.lvl % 5 === 0) s.ap++;
      const r = raceOf(s.race);
      for (const k of PRIMARY) s.grown[k] += r.growth[k] * ageFactor(s.age, k);
    }
    if (up) {
      this.refresh(); this.hp = this.d.hp;
      this.log({ zh: `升級！Lv ${s.lvl}`, en: `Level up! Lv ${s.lvl}` }, 'good');
      this.emit({ t: 'level' });
    }
  }

  private ageTick(dt: number): void {
    const s = this.s;
    s.ageT += dt;
    while (s.ageT >= YEAR_SEC) {
      s.ageT -= YEAR_SEC; s.age++;
      const r = raceOf(s.race);
      for (const k of PRIMARY) s.grown[k] += r.birthday[k];
      const ap = s.age >= 18 ? 3 : 2;
      s.ap += ap;
      this.refresh();
      this.log({ zh: `${s.name} ${s.age} 歲了。AP +${ap}`, en: `${s.name} turns ${s.age}. AP +${ap}` }, 'good');
      if (s.age === REBIRTH_AGE) this.log({ zh: '轉生之門開啟了。', en: 'The gate of rebirth opens.' }, 'fate');
    }
  }

  private petBondTick(dt: number): void {
    const st = this.s.pets.find(p => p.key === this.s.activePet);
    if (!st || st.bond >= BOND_MAX) return;
    st.bondT += dt;
    if (st.bondT >= BOND_SEC) {
      st.bondT -= BOND_SEC; st.bond++; this.refresh();
      const d = petOf(st.key)!;
      this.log({ zh: `和 ${tr(d.stages[stageOf(st.lvl)].name)} 的羈絆加深了（${st.bond}）。`, en: `Your bond with ${tr(d.stages[stageOf(st.lvl)].name)} deepens (${st.bond}).` }, 'pet');
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
      if (after > before) this.log({ zh: `${tr(d.stages[before].name)} 進化成 ${tr(d.stages[after].name)}！`, en: `${tr(d.stages[before].name)} grew into ${tr(d.stages[after].name)}!` }, 'pet');
      this.refresh();
    }
    if (chance(0.02)) this.log(pick(d.quips), 'pet');
  }

  private tryBefriend(): void {
    const s = this.s;
    // the first pal is a sure thing so everyone meets the system early
    if (s.pets.length === 0 && s.counters.kills >= 25) {
      this.befriend(PETS[0].key);
      return;
    }
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
    this.log({ zh: `${tr(d.stages[0].name)} 想跟著你走！`, en: `${tr(d.stages[0].name)} wants to come with you!` }, 'pet');
    this.checkTitles();
  }

  private dropItem(lvl: number): void {
    const s = this.s;
    const it = makeItem(s, lvl, rollRarity(this.d.drop));
    const label = `${tr(RARITY[it.rarity].name)} ${tr(nameOf(it))}`;
    if (it.rarity < s.autoSell || s.bag.length >= BAG_SIZE) {
      const g = sellPrice(it); s.gold += g;
      this.log({ zh: `撿到 ${label}，自動賣出 +${g} 金`, en: `Found ${label}, auto-sold +${g} g` }, 'dim');
      return;
    }
    s.bag.push(it);
    this.log({ zh: `撿到 ${label}`, en: `Found ${label}` }, 'r' + it.rarity);
  }

  checkTitles(): void {
    let got = false;
    for (const t of TITLES) {
      if (this.s.titles.includes(t.key) || !t.test(this.s.counters, this.s)) continue;
      this.s.titles.push(t.key); got = true;
      this.log({ zh: `獲得稱號「${t.name.zh}」`, en: `Title earned: ${t.name.en}` }, 'title');
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
