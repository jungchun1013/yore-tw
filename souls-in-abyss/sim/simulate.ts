// Headless playthrough with a simple "sensible player" policy. Prints a pacing table.
// Usage: npm run sim [hours] [startAge]
import { Game } from '../src/game/engine';
import { newSave } from '../src/game/state';
import { derive } from '../src/game/stats';
import { AREAS } from '../src/data/areas';
import { AREA_CP } from '../src/game/monsters';
import { MAX_RANK } from '../src/data/skills';
import * as A from '../src/game/actions';
import { mulberry32, setRandom } from '../src/core/rng';
import { SLOTS } from '../src/game/types';

setRandom(mulberry32(7));
const hours = Number(process.argv[2] || 10), startAge = Number(process.argv[3] || 14);
const g = new Game(newSave('Sim', process.argv[4] || 'human', startAge));
const s = g.s;
let resting = false;
const PRIORITY = ['mastery', 'smash', 'tough', 'mediumArms', 'firebolt', 'defense', 'meditation', 'insight', 'counter', 'fortune'];

function policy(): void {
  // gear: try every bag item, keep it when CP goes up
  for (const it of s.bag.slice()) {
    const slot = A.targetSlot(s, it);
    const old = s.equip[slot];
    const before = derive(s).cp;
    s.equip[slot] = it;
    const after = derive(s).cp;
    s.equip[slot] = old;
    if (after > before || !old) A.equip(g, it.uid);
  }
  A.sellAll(g);
  // smith: cheapest upgrade first, stop at +7
  for (;;) {
    const its = SLOTS.map(k => s.equip[k]).filter(i => i && i.plus < 7) as any[];
    if (!its.length) break;
    its.sort((a, b) => a.plus - b.plus);
    if (A.upgrade(g, its[0].uid) === 'none') break;
  }
  // skills
  for (let n = 0; n < 50; n++) {
    const k = PRIORITY.filter(k => MAX_RANK > (s.skills[k] || 0)).sort((a, b) => (s.skills[a] || 0) - (s.skills[b] || 0))[0];
    const before = s.ap; A.learn(g, k); if (s.ap === before) break;
  }
  // area: deepest one whose suggested CP we meet
  let best = 0;
  AREAS.forEach((_a, i) => { if (AREA_CP[i] <= g.d.cp * 1.0) best = i; });
  // sanity: retreat to safe ground when low, go back once recovered
  if (s.san < 15) resting = true;
  if (s.san > 85) resting = false;
  if (resting) best = AREAS.findIndex((a, i) => a.dread === 0 && (i === best || AREAS[i + 1]?.dread !== 0));
  A.goArea(g, AREAS[best].key);
  if (s.pets.length && !s.activePet) A.setPet(g, s.pets[0].key);
  if (s.age >= 20) { A.pactOffers(g); A.rebirth(g, s.race, 17, 0); }
}

console.log('area CP:', AREAS.map((a, i) => `${a.key}=${AREA_CP[i]}`).join(' '));
console.log('min  age  lvl  area        cp     kills  deaths  gold     rb pets  ap  san');
const dt = 0.25;
let lastKills = 0, lastDeaths = 0;
for (let t = 0, nextPol = 0, nextRep = 0; t <= hours * 3600; t += dt) {
  g.tick(dt);
  if (t >= nextPol) { policy(); nextPol += 5; }
  if (t >= nextRep) {
    const row = [
      String(Math.round(t / 60)).padStart(4), String(s.age).padStart(4), String(s.lvl).padStart(4), s.area.padEnd(11),
      String(g.d.cp).padStart(6), String(s.counters.kills - lastKills).padStart(6), String(s.counters.deaths - lastDeaths).padStart(6),
      String(Math.floor(s.gold)).padStart(8), String(s.counters.rebirths).padStart(3), String(s.pets.length).padStart(4), String(s.ap).padStart(4), String(Math.floor(s.san)).padStart(4),
    ];
    console.log(row.join(' '));
    lastKills = s.counters.kills; lastDeaths = s.counters.deaths;
    nextRep += t < 3600 ? 300 : 1800;
  }
}
console.log('collapses:', s.counters.collapses || 0, ' pact:', s.pact);
console.log('titles:', s.titles.join(','), ' skills:', JSON.stringify(s.skills));
console.log('gear:', SLOTS.map(k => s.equip[k] ? `${k}:i${s.equip[k]!.ilvl}+${s.equip[k]!.plus}r${s.equip[k]!.rarity}` : k + ':-').join(' '));
