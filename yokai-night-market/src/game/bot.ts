// A plain steering bot used by the balance sim and the browser tests. It plays like a
// cautious newcomer: backs away from what is close, drifts toward pickups, takes upgrades at random.
import { choose, closeChest } from './run';
import type { Run } from './world';

export function botInput(run: Run): [number, number] {
  const p = run.player;
  let fx = 0, fy = 0, near = 1e9, nx = 0, ny = 0;
  for (const e of run.enemies) {
    if (e.dmg <= 0) continue;
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    const reach = (e.boss ? 230 : e.def.ai === 'charge' ? 130 : 95) + e.r;
    if (d < reach) { const w = ((reach - d) / reach) ** 2 * (e.boss ? 5 : 1); fx += (dx / d) * w; fy += (dy / d) * w; }
    if (d < near) { near = d; nx = -dx / d; ny = -dy / d; }
  }
  for (const b of run.bullets) {
    const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || 1;
    if (d < 80) { const w = ((80 - d) / 80) ** 2 * 2; fx += (dx / d) * w; fy += (dy / d) * w; }
  }
  let gx = 0, gy = 0, best = 1e9;
  for (const k of run.pickups) {
    const dx = k.x - p.x, dy = k.y - p.y, d = Math.hypot(dx, dy);
    const score = d / (k.kind === 'chest' ? 6 : k.kind === 'gem' ? Math.min(3, 1 + k.v * 0.1) : 2.5);
    if (d < 460 && score < best) { best = score; gx = dx / (d || 1); gy = dy / (d || 1); }
  }
  if (p.hp < p.maxHp * 0.6) for (const e of run.enemies) {
    if (e.def.ai !== 'still') continue;
    const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy);
    if (d < 320 && d / 3 < best) { best = d / 3; gx = dx / (d || 1); gy = dy / (d || 1); }
  }
  // nothing to pick up: walk toward the nearest yokai so the weapons have something to hit
  if (best === 1e9 && near < 1e9 && near > 130) { gx = nx; gy = ny; }
  let x = fx * 3 + gx, y = fy * 3 + gy;
  if (Math.hypot(x, y) < 0.05) { x = Math.cos(run.t * 0.4); y = Math.sin(run.t * 0.4); }
  const len = Math.hypot(x, y) || 1;
  return [x / len, y / len];
}

export function botDecide(run: Run): void {
  if (run.chest) closeChest(run);
  let guard = 0;
  while (run.choices && guard++ < 50) choose(run, Math.floor(run.rng() * run.choices.length));
}
