/** Presentation clock follows engine events; it never pauses or advances combat. */
export class BattleMotion {
  travel = 0;
  killAge = Infinity;
  spawnAge = 1;
  deathAge = 0;
  reviveAge = 1;
  private wasDown = false;
  phase: 'fight' | 'advance' | 'death' | 'soul' | 'rebirth' = 'fight';
  kill(): void { this.killAge = 0; }
  spawn(): void { this.spawnAge = 0; }
  death(): void { this.deathAge = 0; this.killAge = Infinity; this.wasDown = true; }
  update(dt: number, downFor: number): void {
    dt = Math.max(0, Math.min(dt, .1));
    this.spawnAge += dt; this.reviveAge += dt;
    if (downFor > 0) {
      if (!this.wasDown) this.death();
      this.deathAge += dt;
      this.phase = this.deathAge < .7 ? 'death' : 'soul';
    } else if (this.wasDown) {
      this.wasDown = false; this.reviveAge = 0; this.deathAge = 0;
      this.phase = 'rebirth';
    } else if (this.reviveAge < .8) this.phase = 'rebirth';
    else {
      const previous = this.killAge;
      this.killAge += dt;
      const moving = Math.max(0, Math.min(.6, this.killAge) - Math.max(.12, Math.min(.6, previous)));
      this.travel += moving * 75;
      this.phase = this.killAge < .6 ? 'advance' : 'fight';
    }
  }
}
