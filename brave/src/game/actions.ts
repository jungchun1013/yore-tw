import type { Game } from './engine';
import type { Item, Slot } from './types';
import { BAG_SIZE, SMITH_CHANCE, SMITH_DROP_FROM, SMITH_MAX, smithCost } from '../data/items';
import { SMITH_BONUS } from '../data/races';
import { skillOf } from '../data/skills';
import { AREAS } from '../data/areas';
import { REBIRTH_LINES } from '../data/fate';
import { chance, pick } from '../core/rng';
import { sellPrice, nameOf } from './loot';
import { LEGACY_RATE, REBIRTH_AGE, zeroStats } from './state';
import { PRIMARY } from './types';
import { tr } from '../core/i18n';

export function equip(g: Game, uid: number): void {
  const s = g.s, i = s.bag.findIndex(x => x.uid === uid);
  if (i < 0) return;
  const it = s.bag.splice(i, 1)[0];
  const old = s.equip[it.slot];
  s.equip[it.slot] = it;
  if (old) s.bag.splice(i, 0, old);
  g.refresh();
}

export function unequip(g: Game, slot: Slot): void {
  const s = g.s, it = s.equip[slot];
  if (!it || s.bag.length >= BAG_SIZE) return;
  delete s.equip[slot]; s.bag.push(it); g.refresh();
}

export function sell(g: Game, uid: number): void {
  const s = g.s, i = s.bag.findIndex(x => x.uid === uid);
  if (i < 0) return;
  s.gold += sellPrice(s.bag[i]); s.bag.splice(i, 1);
}
export function sellAll(g: Game): void { for (const it of g.s.bag.slice()) sell(g, it.uid); }

export function smithChance(g: Game, it: Item): number {
  return Math.min(1, (SMITH_CHANCE[it.plus] ?? 0) + (SMITH_BONUS[g.s.race] || 0));
}

/** Blacksmith: pay gold, roll. Failing at +5 or higher drops the item one level. */
export function upgrade(g: Game, uid: number): 'ok' | 'fail' | 'drop' | 'none' {
  const s = g.s, it = g.itemOf(uid);
  if (!it || it.plus >= SMITH_MAX) return 'none';
  const cost = smithCost(it.ilvl, it.plus);
  if (s.gold < cost) return 'none';
  s.gold -= cost;
  const name = tr(nameOf(it));
  if (chance(smithChance(g, it))) {
    it.plus++;
    if (it.plus > s.counters.bestPlus) s.counters.bestPlus = it.plus;
    g.log({ zh: `鐵匠：「成了！」${name} +${it.plus}`, en: `Smith: "Done!" ${name} +${it.plus}` }, 'good');
    g.checkTitles(); g.refresh();
    return 'ok';
  }
  if (it.plus >= SMITH_DROP_FROM) {
    it.plus--; g.refresh();
    g.log({ zh: `鐵匠：「……抱歉。」${name} 掉回 +${it.plus}`, en: `Smith: "...Sorry." ${name} slips to +${it.plus}` }, 'bad');
    return 'drop';
  }
  g.log({ zh: `鐵匠：「再來一次。」強化失敗`, en: `Smith: "Again." Upgrade failed` }, 'bad');
  return 'fail';
}

export function learn(g: Game, key: string): void {
  const d = skillOf(key), s = g.s;
  if (!d) return;
  const lv = s.skills[key] || 0, cost = d.cost(lv);
  if (lv >= d.max || s.ap < cost) return;
  s.ap -= cost; s.skills[key] = lv + 1; g.refresh();
}

export function goArea(g: Game, key: string): void {
  if (!AREAS.some(a => a.key === key) || g.s.area === key) return;
  g.s.area = key; g.newMonster();
}

export function setPet(g: Game, key: string | null): void {
  if (key && !g.s.pets.some(p => p.key === key)) return;
  g.s.activePet = key; g.refresh();
}

export function rebirth(g: Game, race: string, age: number): boolean {
  const s = g.s;
  if (s.age < REBIRTH_AGE) return false;
  for (const k of PRIMARY) s.legacy[k] += s.grown[k] * LEGACY_RATE;
  s.grown = zeroStats();
  s.lvl = 1; s.xp = 0; s.race = race; s.age = Math.max(10, Math.min(17, age)); s.ageT = 0;
  s.counters.rebirths++;
  s.area = 'meadow';
  g.refresh(); g.hp = g.d.hp; g.newMonster();
  g.log({ zh: `${s.name} 轉生了。（第 ${s.counters.rebirths} 次）`, en: `${s.name} is reborn. (#${s.counters.rebirths})` }, 'fate');
  if (chance(0.5)) g.log(pick(REBIRTH_LINES), 'fate');
  g.checkTitles();
  return true;
}
