// Headless balance check: a simple bot plays every stage several times.
// npm run sim -w yokai-night-market [-- <meta level 0..1> <runs>]
import { HEROES, META } from '../src/data/passives';
import { STAGES } from '../src/data/stages';
import { botDecide, botInput } from '../src/game/bot';
import { createRun, step } from '../src/game/run';

const metaFrac = Number(process.argv[2] ?? 0);
const runs = Number(process.argv[3] ?? 4);
const only = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
const heroOnly = process.argv[5] ?? null;
const meta: Record<string, number> = {};
for (const m of META) meta[m.id] = m.id === 'revive' ? (metaFrac >= 1 ? 1 : 0) : Math.round(m.max * metaFrac);

const fmt = (s: number): string => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
console.log(`meta ${metaFrac}, ${runs} runs per hero`);
for (let si = 0; si < STAGES.length; si++) {
  if (only && !only.includes(si + 1)) continue;
  for (const hero of HEROES) {
    if (heroOnly && hero.id !== heroOnly) continue;
    const times: string[] = [];
    let clears = 0, boss = 0, time = 0, level = 0, kills = 0, coins = 0, peak = 0, ms = 0;
    const dealt: Record<string, number> = {};
    for (let i = 0; i < runs; i++) {
      const run = createRun({ stage: si, hero: hero.id, meta, seed: 1000 + si * 97 + i * 13 });
      const t0 = Date.now();
      while (!run.over) {
        const [x, y] = botInput(run);
        step(run, x, y);
        botDecide(run);
        run.sfx.length = 0;
        if (run.enemies.length > peak) peak = run.enemies.length;
      }
      ms += Date.now() - t0;
      if (run.over === 'clear') clears++;
      times.push(run.over === 'clear' ? 'ok' : fmt(run.t));
      if (run.bossDead) boss++;
      time += run.t; level += run.player.level; kills += run.kills; coins += run.coins;
      for (const [k, v] of Object.entries(run.dealt)) dealt[k] = (dealt[k] ?? 0) + (v ?? 0);
    }
    const top = Object.entries(dealt).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} ${Math.round(v / runs / 1000)}k`).join(', ');
    console.log(`${String(si + 1)} ${STAGES[si].id.padEnd(7)} ${hero.id.padEnd(6)} clear ${clears}/${runs} boss ${boss}/${runs} avg ${fmt(time / runs)} lv ${(level / runs).toFixed(0)} kills ${(kills / runs).toFixed(0)} coins ${(coins / runs).toFixed(0)} peak ${peak} ${(ms / runs / 1000).toFixed(1)}s | ${top} | ${times.join(' ')}`);
  }
}
