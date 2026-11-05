/**
 * Headless economy simulator. Plays the game with a greedy bot and reports
 * pacing milestones so balance changes can be checked without a browser.
 *
 *   npm run sim            # default profile
 *   npm run sim -- --cps 4 --minutes 120 --prestige
 */
import {
  newState, tick, click, buyGen, genCost, cps, clickValue, availableUpgrades, buyUpgrade,
  checkAchievements, prestigeStars, prestige, PRESTIGE, canPrestige, offlineEarnings, earn, abilityReady, abilityUsed, abilityPrime,
} from '../src/core/economy';
import { CATS } from '../src/content/cats';
import { UPGRADES } from '../src/content/upgrades';
import { ACHIEVEMENTS } from '../src/content/achievements';
import { PET, ABILITY, deityBlessMult, timeWarpMult, customerMultiplier, lovedKey, heatMultiplier } from '../src/core/economy';
import { fmt, fmtTime } from '../src/core/format';
import type { GameState } from '../src/core/types';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

interface Opts { clicksPerSec: number; minutes: number; activeMinutes: number; prestigeAt: number | null; quiet: boolean; costMult: number | null; prestigeBase: number | null; activePlay: boolean; idleSlack: number; stopAtClear: boolean; routine: boolean }

function parse(): Opts {
  const a = process.argv.slice(2);
  const get = (k: string, d: number) => { const i = a.indexOf(`--${k}`); return i >= 0 ? Number(a[i + 1]) : d; };
  return {
    clicksPerSec: get('cps', 3),
    minutes: get('minutes', 60),
    activeMinutes: get('active', 1e9),
    prestigeAt: a.includes('--prestige') ? get('prestige-stars', 10) : null,
    quiet: a.includes('--quiet'),
    costMult: a.includes('--costmult') ? get('costmult', 1.15) : null,
    prestigeBase: a.includes('--pbase') ? get('pbase', 1e8) : null,
    activePlay: a.includes('--active-play'),
    // Slacking (measured in the live scene, 3 min idle): no furniture ≈ ×0.95, four pieces of furniture ≈ ×0.88–0.89.
    // An attentive player taps slackers as the HUD blinks, so active phases run at ×1.
    idleSlack: get('slack', 0.9),
    stopAtClear: a.includes('--clear'),
    // --routine: a real day. Two 15-min sessions (morning, evening) and two 3-min check-ins 6 h apart; offline in between
    // (full offline rate for the first offlineHours, then the tail rate). Clock time counts, not play time.
    routine: a.includes('--routine'),
  };
}

/** Strategy modelled on how players actually buy: minimise (time to afford) + (payback time).
 *  Cheap items with decent ratios get bought early; expensive, efficient items when income supports them. */
type Purchase = { kind: 'gen' | 'up'; id: string; cost: number; score: number };

function bestPurchase(s: GameState, now: number): Purchase | null {
  const income = cps(s, now) + clickValue(s, now) * CLICK_RATE_FOR_PLANNING;
  let best: Purchase | null = null;
  const consider = (kind: 'gen' | 'up', id: string, cost: number, gain: number) => {
    if (gain <= 0) return;
    const wait = Math.max(0, cost - s.macarons) / income;
    const payback = cost / gain;
    const score = wait + payback;
    if (!best || score < best.score) best = { kind, id, cost, score };
  };
  for (const c of CATS) {
    if (c.secret) continue;
    const owned = s.gens[c.id] ?? 0;
    const probe = clone(s); probe.gens[c.id] = owned + 1;
    consider('gen', c.id, genCost(c, owned), cps(probe, now) - cps(s, now));
  }
  for (const u of availableUpgrades(s)) {
    const probe = clone(s); probe.upgrades.push(u.id);
    const gain = cps(probe, now) - cps(s, now) + (clickValue(probe, now) - clickValue(s, now)) * CLICK_RATE_FOR_PLANNING;
    consider('up', u.id, u.cost, gain);
  }
  // Impulse rule: players buy something affordable now if it pays back reasonably soon
  // rather than waiting for a marginally better deal.
  const chosen = best as Purchase | null;
  if (chosen && chosen.cost > s.macarons) {
    let quick: Purchase | null = null;
    for (const c of CATS) {
      if (c.secret) continue;
      const owned = s.gens[c.id] ?? 0;
      const cost = genCost(c, owned);
      if (cost > s.macarons) continue;
      const probe = clone(s); probe.gens[c.id] = owned + 1;
      const gain = cps(probe, now) - cps(s, now);
      const payback = cost / gain;
      if (payback <= chosen.score * 1.5 && (!quick || payback < quick.score)) quick = { kind: 'gen', id: c.id, cost, score: payback };
    }
    if (quick) return quick;
  }
  return best;
}

let CLICK_RATE_FOR_PLANNING = 3;

function run(o: Opts) {
  CLICK_RATE_FOR_PLANNING = o.clicksPerSec;
  if (o.costMult) for (const c of CATS) c.costMult = o.costMult;
  if (o.prestigeBase) PRESTIGE.base = o.prestigeBase;
  { const i = process.argv.indexOf('--pexp'); if (i >= 0) PRESTIGE.exp = Number(process.argv[i + 1]); }
  { const i = process.argv.indexOf('--pbonus'); if (i >= 0) PRESTIGE.bonusPerStar = Number(process.argv[i + 1]); }
  const pgainI = process.argv.indexOf('--pgain'); const pgain = pgainI >= 0 ? Number(process.argv[pgainI + 1]) : 0; // sane player: reset only when the new stars lift production by this fraction
  const dtI = process.argv.indexOf('--dt'); const dtArg = dtI >= 0 ? Number(process.argv[dtI + 1]) : 0.5;
  const s = newState(0);
  let now = 0;
  const dt = dtArg;
  const marks: Record<string, number> = {};
  const mark = (k: string) => { if (!(k in marks)) marks[k] = now / 1000; };
  const unlockedGens = new Set<string>();
  let prestiges = 0;
  let lastPrestigeSec = 0; // the 'active' window restarts after each prestige: even an idle player taps a fresh shop going
  const log: string[] = [];
  let lastLog = -1e9;

  const totalSec = o.minutes * 60;
  // routine: session windows within each day (start sec, length sec)
  const DAY = 86400;
  const SESSIONS: [number, number][] = [[0, 15 * 60], [6 * 3600, 3 * 60], [12 * 3600, 3 * 60], [16 * 3600, 15 * 60]];
  const inSession = (sec: number): boolean => { const d = sec % DAY; return SESSIONS.some(([a, l]) => d >= a && d < a + l); };
  const nextSessionStart = (sec: number): number => { const d = sec % DAY, day = sec - d; for (const [a] of SESSIONS) if (a > d) return day + a; return day + DAY + SESSIONS[0][0]; };
  let offlineTotal = 0;
  const dayLog: string[] = [];
  const secret = new Set(CATS.filter((c) => c.secret).map((c) => c.id));
  const macUpgrades = UPGRADES.filter((u) => u.currency === 'macarons' && !(u.requires?.gen && secret.has(u.requires.gen))).length; // the secret cat's ladder is out of reach for the bot
  const achTotal = ACHIEVEMENTS.filter((a) => a.id !== 'rainbow' && ![...secret].some((id) => a.id.startsWith(id + '_'))).length;
  let cleared = false;
  let winClick = 0, winPassive = 0, winUp = 0, winCat = 0, winHeat = 0;
  const shares: string[] = [];
  while (now / 1000 < totalSec) {
    const t = now / 1000;
    if (o.routine && !inSession(t)) { // leave: jump to the next session and credit the absence as offline earnings
      const back = nextSessionStart(t);
      const away = back - t;
      const r = offlineEarnings(s, away);
      earn(s, r.amount); offlineTotal += r.amount;
      now = back * 1000; s.lastTick = now;
      continue;
    }
    const active = o.routine ? true : t - lastPrestigeSec < o.activeMinutes * 60;
    if (active) {
      const clicksThisTick = o.clicksPerSec * dt;
      const whole = Math.floor(clicksThisTick) + (Math.random() < clicksThisTick % 1 ? 1 : 0);
      for (let i = 0; i < whole; i++) winClick += click(s, now);
    }
    s.slack.nap = active ? 0 : (1 - o.idleSlack) / 0.04; // idle cats doze off; a present player taps them awake
    { const g = tick(s, dt, now); const hm = heatMultiplier(s); winHeat += g * (1 - 1 / hm); winPassive += g / hm; }
    now += dt * 1000;
    if (o.activePlay && active) {
      // petting: an attentive player keeps every visible cat loved (up to the 18 shown on the floor)
      const total = CATS.reduce((a, c) => a + (s.gens[c.id] ?? 0), 0);
      const shown = Math.min(18, total);
      let k = 0;
      for (const c of CATS) for (let i = 0; i < (s.gens[c.id] ?? 0) && k < shown; i++, k++) s.loved[lovedKey(c.id, i)] = now + PET.lovedMs;
      // customers: one every ~50 s while active, tapped every time
      if (Math.floor(now / 90_000) !== Math.floor((now - dt * 1000) / 90_000)) {
        const c = cps(s, now); const floor = clickValue(s, now) * 10;
        const v = Math.max(floor, Math.min(c * 15, s.macarons * 0.05 + floor)) * customerMultiplier(s);
        s.macarons += v; s.totalEarned += v; s.allTimeEarned += v;
      }
      // special cats fired as soon as they are charged (first charge soon after hiring, then hours)
      for (const k of ['deity', 'timecat', 'cosmic', 'rainbow'] as const) if ((s.gens[k] ?? 0) > 0) abilityPrime(s, k, now);
      if ((s.gens.deity ?? 0) > 0 && abilityReady(s, 'deity', now)) {
        abilityUsed(s, 'deity', now);
        const burst = cps(s, now) * ABILITY.deity.burstSec; earn(s, burst);
        s.blessedUntil = now + ABILITY.deity.durationMs; s.blessMult = deityBlessMult(s);
      }
      if ((s.gens.timecat ?? 0) > 0 && abilityReady(s, 'timecat', now)) { abilityUsed(s, 'timecat', now); s.warpUntil = now + ABILITY.timecat.durationMs; s.warpMult = timeWarpMult(s); }
      if ((s.gens.cosmic ?? 0) > 0 && abilityReady(s, 'cosmic', now)) { abilityUsed(s, 'cosmic', now); earn(s, cps(s, now) * ABILITY.cosmic.burstSec); s.starFragments += 1; if (s.starFragments >= ABILITY.cosmic.fragmentsPerStar) { s.starFragments -= ABILITY.cosmic.fragmentsPerStar; s.stars += 1; } }
    }

    // purchases
    let guard = 0;
    while (guard++ < 20) {
      const p = bestPurchase(s, now);
      if (!p || s.macarons < p.cost) break;
      if (p.kind === 'gen') { buyGen(s, p.id, 1); winCat += p.cost; unlockedGens.add(p.id); mark(`first ${p.id}`); }
      else { buyUpgrade(s, p.id); winUp += p.cost; if (!('first upgrade' in marks)) mark('first upgrade'); }
    }
    checkAchievements(s, now);

    const c = cps(s, now);
    if (c > 0) mark('first automation (cps>0)');
    for (const th of [1, 10, 100, 1e3, 1e4, 1e5, 1e6]) if (c >= th) mark(`cps ≥ ${fmt(th)}`);
    for (const th of [1e3, 1e5, 1e6, 1e8, 1e9, 1e12]) if (s.totalEarned >= th) mark(`earned ≥ ${fmt(th)}`);
    if (prestigeStars(s) >= 1) mark('prestige available (1★)');
    for (const d of [1, 2, 3, 5, 7, 10, 14]) if (t >= d * DAY && !(`day ${d}` in marks)) { marks[`day ${d}`] = t; dayLog.push(`day ${d}: all-time ${fmt(s.allTimeEarned)}, cps ${fmt(cps(s, now))}, stars ${s.stars} (+${prestigeStars(s)} available), cats ${CATS.map((c) => s.gens[c.id] ?? 0).join('/')}`); }
    if (prestigeStars(s) >= 10) mark('10★ available');
    if (CATS.every((c) => c.secret || (s.gens[c.id] ?? 0) >= 1)) mark('every cat hired');
    if (CATS.every((c) => c.secret || (s.gens[c.id] ?? 0) >= 50)) mark('every cat ×50');
    if (CATS.every((c) => c.secret || (s.gens[c.id] ?? 0) >= 100)) mark('every cat ×100');
    if (s.upgrades.length >= macUpgrades) mark('every upgrade bought (tech tree done)');
    if (s.achievements.filter((a) => a !== 'rainbow').length >= achTotal) mark('every achievement (except rainbow)');
    if (!cleared && s.upgrades.length >= macUpgrades && s.achievements.filter((a) => a !== 'rainbow').length >= achTotal) { cleared = true; mark('CLEAR: all upgrades + all achievements'); if (o.stopAtClear) break; }

    const relGain = prestigeStars(s) * PRESTIGE.bonusPerStar / (1 + s.stars * PRESTIGE.bonusPerStar);
    if (o.prestigeAt !== null && prestigeStars(s) >= o.prestigeAt && relGain >= pgain && canPrestige(s)) {
      const g = prestige(s, now);
      prestiges++; lastPrestigeSec = t;
      log.push(`${fmtTime(t)}  PRESTIGE #${prestiges} +${g}★ (total ${s.stars}★)`);
    }

    if (t - lastLog >= 300) {
      const inc = winClick + winPassive + winHeat, spend = winUp + winCat;
      if (inc > 0) shares.push(`${fmtTime(t).padEnd(8)} income: pats ${Math.round(100 * winClick / inc)}% + heat ${Math.round(100 * winHeat / inc)}% / cats ${Math.round(100 * winPassive / inc)}%   spend: upgrades ${spend > 0 ? Math.round(100 * winUp / spend) : 0}% / cats ${spend > 0 ? Math.round(100 * winCat / spend) : 0}%`);
      winClick = winPassive = winUp = winCat = winHeat = 0;
      lastLog = t;
    }
    if (!o.quiet && lastLog === t) {
      const owned = CATS.map((c) => s.gens[c.id] ?? 0).join('/');
      log.push(`${fmtTime(t).padEnd(8)} bank ${fmt(s.macarons).padStart(8)}  cps ${fmt(c).padStart(8)}  click ${fmt(clickValue(s, now)).padStart(7)}  cats ${owned}  ups ${s.upgrades.length}  ★${prestigeStars(s)}`);
    }
  }

  console.log(`\n=== Meowcaron sim: ${o.clicksPerSec} clicks/s, ${o.minutes} min, active ${Math.min(o.activeMinutes, o.minutes)} min, prestige ${o.prestigeAt ?? 'never'}, active-play ${o.activePlay ? 'ON (pets+customers+abilities)' : 'off'} ===`);
  console.log(`PRESTIGE base=${fmt(PRESTIGE.base)} exp=${PRESTIGE.exp} bonus/star=${PRESTIGE.bonusPerStar}`);
  console.log('\n-- timeline --');
  for (const l of log) console.log(l);
  console.log('\n-- income / spend shares per 5 min --');
  for (const l of shares) console.log(l);
  if (dayLog.length) { console.log('\n-- days --'); for (const l of dayLog) console.log(l); console.log(`offline earnings in total: ${fmt(offlineTotal)}`); }
  console.log('\n-- milestones --');
  const order = Object.entries(marks).sort((a, b) => a[1] - b[1]);
  for (const [k, v] of order) console.log(`${fmtTime(v).padEnd(9)} ${k}`);
  console.log('\n-- end state --');
  console.log(`cps ${fmt(cps(s, now))}, bank ${fmt(s.macarons)}, total ${fmt(s.totalEarned)}, upgrades ${s.upgrades.length}, achievements ${s.achievements.length}, stars ${s.stars}, prestige available ${prestigeStars(s)}★`);

  // pacing checks
  const checks: [string, boolean][] = [
    ['first purchase < 30s', Math.min(...CATS.map((c) => marks[`first ${c.id}`] ?? Infinity)) < 30],
    ['first upgrade < 3 min', (marks['first upgrade'] ?? Infinity) < 180],
    ['first automation < 2 min', (marks['first automation (cps>0)'] ?? Infinity) < 120],
    ['cps ≥ 100 within 10 min', (marks['cps ≥ 100'] ?? Infinity) < 600],
    ['≥ 5 cat types within 16 min', CATS.filter((c) => (marks[`first ${c.id}`] ?? Infinity) < 960).length >= 5],
    ['prestige available 25–60 min', (marks['prestige available (1★)'] ?? Infinity) >= 1500 && (marks['prestige available (1★)'] ?? Infinity) <= 3600],
  ];
  console.log('\n-- pacing checks --');
  let fail = 0;
  for (const [name, ok] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); if (!ok) fail++; }
  return fail;
}

process.exitCode = run(parse()) > 0 ? 1 : 0;
