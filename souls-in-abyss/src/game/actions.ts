import type { Game } from './engine';
import type { Item, Save, Slot } from './types';
import { BAG_SIZE, SMITH_CHANCE, SMITH_DROP_FROM, SMITH_MAX, smithCost } from '../data/items';
import { SMITH_BONUS } from '../data/races';
import { MAX_RANK, rankCost, skillOf } from '../data/skills';
import { AREAS } from '../data/areas';
import { REBIRTH_LINES } from '../data/fate';
import { chance, pick, rnd } from '../core/rng';
import { CURSES, GIFTS, PACT_OFFERS, giftOf, curseOf, type Pact } from '../data/pacts';
import { sellPrice, nameOf } from './loot';
import { LEGACY_RATE, REBIRTH_AGE, SAN_MAX, zeroStats } from './state';
import { PRIMARY } from './types';
import { lang, tr } from '../core/i18n';

/** Where an item would go: its own slot, or for accessories the empty one (else the first). */
export function targetSlot(s: Save, it: Item): Slot {
  if (it.kind !== 'acc') return it.kind as Slot;
  return !s.equip.acc1 ? 'acc1' : !s.equip.acc2 ? 'acc2' : 'acc1';
}

export function equip(g: Game, uid: number, slot?: Slot): void {
  const s = g.s, i = s.bag.findIndex(x => x.uid === uid);
  if (i < 0) return;
  const it = s.bag.splice(i, 1)[0];
  const to = slot || targetSlot(s, it);
  const old = s.equip[to];
  s.equip[to] = it;
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
    g.say({ zh: `鐵匠：「成了！」${name} +${it.plus}`, en: `Smith: "Done!" ${name} +${it.plus}` }, [], 'good');
    g.checkTitles(); g.refresh();
    return 'ok';
  }
  if (it.plus >= SMITH_DROP_FROM) {
    it.plus--; g.refresh();
    g.say({ zh: `鐵匠：「……抱歉。」${name} 掉回 +${it.plus}`, en: `Smith: "...Sorry." ${name} slips to +${it.plus}` }, [], 'bad');
    return 'drop';
  }
  g.say({ zh: `鐵匠：「再來一次。」強化失敗`, en: `Smith: "Again." Upgrade failed` }, [], 'bad');
  return 'fail';
}

export function learn(g: Game, key: string): void {
  const d = skillOf(key), s = g.s;
  if (!d) return;
  const lv = s.skills[key] || 0, cost = rankCost(lv);
  if (lv >= MAX_RANK || s.ap < cost) return;
  s.ap -= cost; s.skills[key] = lv + 1; g.refresh();
}

export function goArea(g: Game, key: string): void {
  if (!AREAS.some(a => a.key === key) || g.s.area === key) return;
  g.s.area = key; g.resetLoot(); g.newMonster();
}

export function setPet(g: Game, key: string | null): void {
  if (key && !g.s.pets.some(p => p.key === key)) return;
  g.s.activePet = key; g.refresh();
}

/** Roll the Abyss's offers once and keep them in the save, so reloading cannot reroll. */
export function pactOffers(g: Game): Pact[] {
  const s = g.s;
  if (!s.offers) {
    const gifts = GIFTS.slice(), out: Pact[] = [];
    for (let i = 0; i < PACT_OFFERS && gifts.length; i++) {
      const gift = gifts.splice(Math.floor(rnd() * gifts.length), 1)[0];
      const curses = CURSES.filter(c => c.stat !== gift.stat && !out.some(o => o[1] === c.key));
      out.push([gift.key, pick(curses).key]);
    }
    s.offers = out;
  }
  return s.offers;
}

/** pact: index into the offers, or -1 to refuse the Abyss. */
export function rebirth(g: Game, race: string, age: number, pact = -1): boolean {
  const s = g.s;
  if (s.age < REBIRTH_AGE) return false;
  for (const k of PRIMARY) s.legacy[k] += s.grown[k] * LEGACY_RATE;
  s.grown = zeroStats();
  s.lvl = 1; s.xp = 0; s.race = race; s.age = Math.max(10, Math.min(17, age)); s.ageT = 0;
  s.counters.rebirths++;
  const offers = s.offers || [];
  s.pact = pact >= 0 && offers[pact] ? offers[pact] : null;
  s.offers = null;
  s.san = SAN_MAX;
  s.area = 'meadow';
  g.refresh(); g.hp = g.d.hp; g.mp = g.d.mp; g.resetLoot(); g.newMonster();
  g.say({ zh: `${s.name} 的靈魂沉入深淵，又浮了上來。（第 ${s.counters.rebirths} 次）`, en: `${s.name}'s soul sinks into the Abyss and surfaces again. (#${s.counters.rebirths})` }, [], 'fate');
  if (s.pact) {
    const gi = giftOf(s.pact[0])!, cu = curseOf(s.pact[1])!;
    g.say({ zh: '深淵低語：{0}', en: 'The Abyss whispers: {0}' }, [{ text: gi.line[lang], cls: 'gift' }], 'fate');
    g.say({ zh: '你接受了 {0} 與 {1}。', en: 'You accept {0} and {1}.' }, [{ text: gi.name[lang], cls: 'gift' }, { text: cu.name[lang], cls: 'curse' }], 'fate');
  } else g.say({ zh: '你拒絕了深淵的交易。深淵似乎覺得很有趣。', en: 'You refuse the Abyss. It seems amused.' }, [], 'fate');
  if (chance(0.5)) g.say(pick(REBIRTH_LINES), [], 'fate');
  g.checkTitles();
  return true;
}
