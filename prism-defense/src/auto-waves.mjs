export class AutoWaves {
  constructor() { this.reset(); }
  reset() { this.enabled = false; this.remaining = 3; }
  toggle() { this.enabled = !this.enabled; this.remaining = 3; }
  update(game, dt) {
    if (game.state === 'won' || game.state === 'lost') { this.reset(); return; }
    if (!this.enabled || game.state !== 'planning') { this.remaining = 3; return; }
    this.remaining = Math.max(0, this.remaining - dt);
    if (!this.remaining) { game.startWave(); this.remaining = 3; }
  }
}
