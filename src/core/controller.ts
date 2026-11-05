import type { GameState, DiaryEntry } from './types';
import * as eco from './economy';
import { load, save, wipe, type Storage } from './save';
import type { PlatformAdapter } from './platform/adapter';
import { Analytics } from './events';
import { sfx } from './audio';
import { CAT_BY_ID } from '../content/cats';
import { SPECIES_BY_ID } from '../content/customers';

export const RUSH = eco.RUSH;

export type GameEvent =
  | { type: 'change' }
  | { type: 'click'; value: number; combo: number }
  | { type: 'buy'; gen: string; n: number }
  | { type: 'upgrade'; id: string }
  | { type: 'achievement'; id: string }
  | { type: 'prestige'; stars: number }
  | { type: 'boost'; until: number }
  | { type: 'reset' }
  | { type: 'customer'; value: number; species: string }
  | { type: 'pet'; value: number; gen: string }
  | { type: 'post'; gain: number; followers: number; caption: string; subject: string }
  | { type: 'bless'; mult: number; burst: number }
  | { type: 'warp'; mult: number; seconds: number }
  | { type: 'stardust'; fragments: number; starGained: boolean }
  | { type: 'diary'; entry: DiaryEntry }
  | { type: 'rainbow'; burst: number }
  | { type: 'furniture' }
  | { type: 'offline'; amount: number; seconds: number; capped: boolean };

export interface PendingOffline { amount: number; seconds: number; capped: boolean }

/** Owns the game state, the tick loop, persistence, and platform calls. Rendering layers subscribe to events. */
export class GameController {
  state: GameState;
  adInFlight = false;
  /** when each special cat's ability can be petted again (ms timestamps); set by the scene */
  private listeners: ((e: GameEvent) => void)[] = [];
  private timer: number | null = null;
  private lastSave = 0;
  private lastAchCheck = 0;
  private lastSessionPing = 0;
  private lastClickAt = 0;
  private combo = 0;
  private sessionStart = Date.now();

  constructor(private storage: Storage, readonly platform: PlatformAdapter, readonly analytics: Analytics) {
    this.state = load(storage);
    sfx.enabled = this.state.sound;
    platform.onAdStateChange((playing) => { sfx.muted = playing; });
  }

  now(): number { return Date.now(); }
  on(cb: (e: GameEvent) => void): () => void {
    this.listeners.push(cb);
    return () => { this.listeners = this.listeners.filter((l) => l !== cb); };
  }
  private emit(e: GameEvent): void { for (const l of this.listeners) l(e); }
  private changed(): void { this.emit({ type: 'change' }); }

  cps(): number { return eco.cps(this.state, this.now()); }
  clickValue(): number { return eco.clickValue(this.state, this.now()); }
  boostActive(): boolean { return this.now() < this.state.boostUntil; }
  boostLeftMs(): number { return Math.max(0, this.state.boostUntil - this.now()); }

  get pendingOffline(): PendingOffline | null { return this.state.pendingOffline; }

  /** Compute offline earnings since the last tick and add them to the uncollected pile (persisted). */
  computeOffline(): void {
    const away = (this.now() - this.state.lastTick) / 1000;
    if (away < eco.OFFLINE.graceSeconds) { // a tab switch, not an absence: the cats just kept baking
      if (away > 0) eco.earn(this.state, this.cps() * away);
      this.state.lastTick = this.now();
      return;
    }
    const r = eco.offlineEarnings(this.state, away);
    if (r.amount > 0) {
      const prev = this.state.pendingOffline;
      this.state.pendingOffline = prev
        ? { amount: prev.amount + r.amount, seconds: prev.seconds + r.seconds, capped: prev.capped || r.capped }
        : r;
    }
    this.state.lastTick = this.now();
    this.save();
  }

  claimOffline(doubled: boolean): void {
    const p = this.state.pendingOffline;
    if (!p) return;
    const amount = p.amount * (doubled ? 2 : 1);
    eco.earn(this.state, amount);
    this.state.pendingOffline = null;
    this.analytics.track('offline_claim', { seconds: Math.round(p.seconds), amount, doubled });
    this.emit({ type: 'offline', amount, seconds: p.seconds, capped: p.capped });
    this.changed();
    this.save();
  }

  start(): void {
    if (this.timer !== null) return;
    this.analytics.track('game_start', { prestige: this.state.prestigeCount, stars: this.state.stars, returning: this.state.allTimeEarned > 0 });
    this.resume();
  }

  /** Stop ticking while the tab is hidden; the gap is credited as offline time on resume. */
  pause(): void {
    if (this.timer !== null) { clearInterval(this.timer); this.timer = null; }
    this.platform.gameplayStop();
    this.save();
  }

  resume(): void {
    if (this.timer !== null) return;
    this.platform.gameplayStart();
    let last = this.now();
    this.timer = window.setInterval(() => {
      const now = this.now();
      const dt = Math.min(5, (now - last) / 1000); // tab throttling: cap one tick at 5s, the rest counts as offline
      last = now;
      eco.tick(this.state, dt, now);
      this.tickRainbow(dt, now);
      if (now - this.lastAchCheck > 1000) {
        this.lastAchCheck = now;
        for (const id of eco.checkAchievements(this.state, now)) {
          this.analytics.track('achievement', { id });
          sfx.achievement();
          this.emit({ type: 'achievement', id });
        }
      }
      if (now - this.lastSave > 10_000) this.save();
      if (now - this.lastSessionPing > 60_000) {
        this.lastSessionPing = now;
        this.analytics.track('session_ping', { sessionSec: Math.round((now - this.sessionStart) / 1000), cps: this.cps(), total: this.state.totalEarned });
      }
      this.changed();
    }, 100);
  }

  stop(): void { this.pause(); }

  save(): void {
    this.lastSave = this.now();
    this.state.lastTick = this.now();
    save(this.storage, this.state);
  }

  click(): number {
    const now = this.now();
    this.combo = now - this.lastClickAt < 600 ? this.combo + 1 : 0;
    this.lastClickAt = now;
    const v = eco.click(this.state, now);
    this.rainbowTap(now);
    sfx.click(this.combo);
    if (this.state.clicks % 25 === 1) this.analytics.track('click', { clicks: this.state.clicks, value: v });
    this.emit({ type: 'click', value: v, combo: this.combo });
    this.changed();
    return v;
  }

  buyGen(id: string, amount: number | 'max'): boolean {
    const def = CAT_BY_ID[id];
    if (!def) return false;
    const owned = this.state.gens[id] ?? 0;
    const n = amount === 'max' ? eco.maxAffordable(def, owned, this.state.macarons) : amount;
    if (n <= 0 || !eco.buyGen(this.state, id, n)) { sfx.error(); return false; }
    sfx.buy();
    this.analytics.track('buy_gen', { gen: id, n, owned: owned + n });
    this.emit({ type: 'buy', gen: id, n });
    this.changed();
    return true;
  }

  buyUpgrade(id: string): boolean {
    if (!eco.buyUpgrade(this.state, id)) { sfx.error(); return false; }
    sfx.upgrade();
    this.analytics.track('buy_upgrade', { id });
    this.emit({ type: 'upgrade', id });
    this.changed();
    return true;
  }

  buyStarUpgrade(id: string): boolean {
    if (!eco.buyStarUpgrade(this.state, id)) { sfx.error(); return false; }
    sfx.upgrade();
    this.analytics.track('buy_star_upgrade', { id });
    this.emit({ type: 'upgrade', id });
    this.changed();
    return true;
  }

  prestigeStars(): number { return eco.prestigeStars(this.state); }
  canPrestige(): boolean { return eco.canPrestige(this.state); }

  async prestige(): Promise<number> {
    const before = this.state.totalEarned;
    const gained = eco.prestige(this.state, this.now());
    if (gained <= 0) return 0;
    sfx.prestige();
    this.platform.happyTime();
    this.analytics.track('prestige', { stars: gained, total: this.state.stars, runEarned: before, count: this.state.prestigeCount });
    this.emit({ type: 'prestige', stars: gained });
    this.changed();
    this.save();
    // Natural break: interstitial allowed here (no-op in Basic Launch / mock).
    this.platform.gameplayStop();
    await this.platform.showMidgame();
    this.platform.gameplayStart();
    return gained;
  }

  rushAvailable(): boolean { return !this.adInFlight && this.now() >= this.state.rushReadyAt && !this.boostActive(); }
  rushCooldownLeftMs(): number { return Math.max(0, this.state.rushReadyAt - this.now()); }

  async startRush(): Promise<boolean> {
    if (!this.rushAvailable()) return false;
    this.analytics.track('rewarded_request', { kind: 'rush' });
    this.adInFlight = true;
    const r = await this.platform.showRewarded().finally(() => { this.adInFlight = false; });
    this.analytics.track('rewarded_result', { kind: 'rush', result: r });
    if (r !== 'done') return false;
    const now = this.now();
    this.state.boostUntil = now + RUSH.durationMs;
    this.state.boostMult = RUSH.mult;
    this.state.rushReadyAt = now + RUSH.cooldownMs;
    this.emit({ type: 'boost', until: this.state.boostUntil });
    this.changed();
    this.save();
    return true;
  }

  async doubleOfflineViaAd(): Promise<boolean> {
    if (this.adInFlight) return false;
    this.analytics.track('rewarded_request', { kind: 'offline' });
    this.adInFlight = true;
    const r = await this.platform.showRewarded().finally(() => { this.adInFlight = false; });
    this.analytics.track('rewarded_result', { kind: 'offline', result: r });
    return r === 'done';
  }

  buyFurniture(id: string): boolean {
    if (!eco.buyFurniture(this.state, id)) { sfx.error(); return false; }
    sfx.buy();
    this.analytics.track('buy_furniture', { id });
    // auto-place into the first empty slot
    const empty = this.state.furnitureSlots.indexOf(null);
    if (empty >= 0) eco.placeFurniture(this.state, id, empty);
    this.emit({ type: 'furniture' });
    this.changed();
    this.save();
    return true;
  }

  placeFurniture(id: string | null, slot: number): boolean {
    if (!eco.placeFurniture(this.state, id, slot)) return false;
    sfx.upgrade();
    this.emit({ type: 'furniture' });
    this.changed();
    this.save();
    return true;
  }

  /** A moment caught on camera (tap an interacting cat while an Influencer is on staff). */
  snapshot(kind: DiaryEntry['kind'], cats: string[], text: string, bg?: DiaryEntry['bg']): void {
    const gain = Math.round(eco.postGain(this.state) / 2);
    this.state.followers += gain;
    this.state.posts += 1;
    const entry: DiaryEntry = { t: this.now(), kind, cats, text, bg, snap: true };
    eco.addDiary(this.state, entry);
    sfx.upgrade();
    this.analytics.track('snapshot', { kind, gain });
    this.emit({ type: 'diary', entry });
    this.changed();
  }

  /** Easter egg: the rainbow cat. Cosmetic, plus a hidden achievement. */
  /** Rainbow energy bar: 1 = full. Drains over the base duration; pats refill it (diminishing with tap speed, capped at one extra duration). */
  rainbowEnergy = 0;
  private rainbowBonusLeft = 0;
  private rainbowTaps: number[] = [];
  rainbowActive(): boolean { return this.rainbowEnergy > 0; }
  private startRainbowEffect(now: number): void {
    const D = eco.ABILITY.rainbow.durationMs;
    this.rainbowEnergy = 1; this.rainbowBonusLeft = D; this.rainbowTaps = [];
    this.state.rainbowUntil = now + D;
  }
  private tickRainbow(dt: number, now: number): void {
    if (this.rainbowEnergy <= 0) return;
    const D = eco.ABILITY.rainbow.durationMs;
    this.rainbowEnergy = Math.max(0, this.rainbowEnergy - (dt * 1000) / D);
    this.state.rainbowUntil = this.rainbowEnergy > 0 ? now + this.rainbowEnergy * D : 0;
    if (this.rainbowEnergy <= 0) this.changed();
  }
  private rainbowTap(now: number): void {
    if (this.rainbowEnergy <= 0 || this.rainbowBonusLeft <= 0) return;
    const D = eco.ABILITY.rainbow.durationMs, R = eco.ABILITY.rainbow.tapsForDouble;
    this.rainbowTaps.push(now); this.rainbowTaps = this.rainbowTaps.filter((t) => now - t <= 1000);
    const rate = Math.max(1, this.rainbowTaps.length);
    // log curve: R taps/s refill as fast as the bar drains (→ 2× duration); faster tapping gains less per tap; capped by the bonus pool
    const gainMs = Math.min(this.rainbowBonusLeft, (1000 / R) * Math.log2(1 + R / rate));
    this.rainbowBonusLeft -= gainMs;
    this.rainbowEnergy = Math.min(1, this.rainbowEnergy + gainMs / D);
    this.state.rainbowUntil = now + this.rainbowEnergy * D;
  }

  rainbow(dash = false): number {
    if (!this.state.achievements.includes('rainbow')) { this.state.achievements.push('rainbow'); this.analytics.track('achievement', { id: 'rainbow' }); }
    const burst = dash ? this.cps() * eco.ABILITY.rainbow.burstSec : 0;
    if (burst > 0) eco.earn(this.state, burst);
    if (dash) this.startRainbowEffect(this.now());
    sfx.nyan();
    this.analytics.track('rainbow', { dash, burst });
    this.emit({ type: 'rainbow', burst });
    this.changed();
    return burst;
  }

  /** Write a line in the shop diary. */
  diary(kind: DiaryEntry['kind'], cats: string[], text: string, bg?: DiaryEntry['bg']): void {
    const entry: DiaryEntry = { t: this.now(), kind, cats, text, bg };
    eco.addDiary(this.state, entry);
    this.emit({ type: 'diary', entry });
    this.changed();
  }

  /** Cat Deity: a blessing of light. Everyone produces more for a minute, plus a burst of macarons. */
  bless(): { mult: number; burst: number } {
    const mult = eco.deityBlessMult(this.state);
    const burst = this.cps() * eco.ABILITY.deity.burstSec;
    this.state.blessedUntil = this.now() + eco.ABILITY.deity.durationMs;
    this.state.blessMult = mult;
    eco.earn(this.state, burst);
    sfx.prestige();
    this.analytics.track('bless', { mult, burst });
    this.emit({ type: 'bless', mult, burst });
    this.changed();
    return { mult, burst };
  }

  /** Time Cat: a time warp — the whole shop runs several times faster for half a minute. */
  timeWarp(): { mult: number; seconds: number } {
    const mult = eco.timeWarpMult(this.state);
    const seconds = eco.ABILITY.timecat.durationMs / 1000;
    this.state.warpUntil = this.now() + eco.ABILITY.timecat.durationMs;
    this.state.warpMult = mult;
    sfx.upgrade();
    this.analytics.track('warp', { mult, seconds });
    this.emit({ type: 'warp', mult, seconds });
    this.changed();
    return { mult, seconds };
  }

  /** Cosmic Cat: a caught shooting star gives stardust; ten fragments become a permanent star. */
  /** Cosmic Cat: a stardust rain — one stardust straight away (ten make a permanent star) plus a burst of production. */
  stardustRain(): { fragments: number; starGained: boolean; burst: number } {
    const burst = this.cps() * eco.ABILITY.cosmic.burstSec;
    eco.earn(this.state, burst);
    return { ...this.catchStar(), burst };
  }

  catchStar(): { fragments: number; starGained: boolean } {
    this.state.starFragments += 1;
    let starGained = false;
    if (this.state.starFragments >= eco.ABILITY.cosmic.fragmentsPerStar) { this.state.starFragments -= eco.ABILITY.cosmic.fragmentsPerStar; this.state.stars += 1; starGained = true; sfx.prestige(); }
    else sfx.achievement();
    this.analytics.track('stardust', { fragments: this.state.starFragments, starGained });
    this.emit({ type: 'stardust', fragments: this.state.starFragments, starGained });
    this.changed();
    return { fragments: this.state.starFragments, starGained };
  }

  /** The influencer cat posts a photo: followers go up, customers come more often. */
  postPhoto(subject: string, caption: string): number {
    const gain = eco.postGain(this.state);
    this.state.followers += gain;
    this.state.posts += 1;
    sfx.upgrade();
    this.analytics.track('post', { gain, followers: this.state.followers, subject });
    this.emit({ type: 'post', gain, followers: this.state.followers, caption, subject });
    this.changed();
    return gain;
  }

  /** A served customer posts its own photo and tags the shop: a few followers, and the post shows up in the feed. */
  customerPost(species: string, text: string): number {
    const gain = Math.max(1, Math.round(eco.postGain(this.state) / 3));
    this.state.followers += gain;
    this.state.posts += 1;
    const entry: DiaryEntry = { t: this.now(), kind: 'customer', cats: [species], text, bg: 'counter', by: species, snap: true };
    eco.addDiary(this.state, entry);
    sfx.upgrade();
    this.analytics.track('customer_post', { species, gain });
    this.emit({ type: 'diary', entry });
    this.changed();
    return gain;
  }

  /** A customer arrived at the counter: record the species for the codex. */
  recordCustomerVisit(species: string): void {
    this.state.customersSeen[species] = (this.state.customersSeen[species] ?? 0) + 1;
    this.analytics.track('customer_visit', { species });
    this.changed();
  }

  /** A walk-in customer was served: about a minute of production, capped at 20% of the bank, floored at 20 pats,
   *  scaled by the packing-station upgrades and the species' appetite. */
  serveCustomer(species = 'cat'): number {
    const cps = this.cps();
    const floor = this.clickValue() * 10;
    const mult = eco.customerMultiplier(this.state) * (SPECIES_BY_ID[species]?.orderMult ?? 1);
    const value = Math.max(floor, Math.min(cps * 15, this.state.macarons * 0.05 + floor)) * mult;
    eco.earn(this.state, value);
    this.state.customersServed[species] = (this.state.customersServed[species] ?? 0) + 1;
    sfx.achievement();
    this.analytics.track('customer_served', { value, cps, species });
    this.emit({ type: 'customer', value, species });
    this.changed();
    return value;
  }

  /** Petting a floor cat pays a small bonus (scene enforces the per-cat cooldown). */
  petBonus(gen: string, slot: number, reaction: string): number {
    const value = this.clickValue() * eco.PET.clickMultiple;
    eco.earn(this.state, value);
    this.state.loved[eco.lovedKey(gen, slot)] = this.now() + eco.PET.lovedMs;
    this.analytics.track('pet', { gen, reaction, value });
    this.emit({ type: 'pet', value, gen });
    this.changed();
    return value;
  }


  /** The scene reports who is slacking; production follows immediately. */
  setSlack(counts: GameState['slack']): void {
    const cur = this.state.slack;
    if (eco.SLACK_KINDS.every((k) => cur[k] === counts[k])) return;
    this.state.slack = { ...counts };
  }

  /** Mark an onboarding step as done (idempotent). */
  completeTutorial(step: string): void {
    if (this.state.tutorial.includes(step)) return;
    this.state.tutorial.push(step);
    this.save();
    this.changed();
  }

  toggleSound(): boolean {
    this.state.sound = !this.state.sound;
    sfx.enabled = this.state.sound;
    this.save();
    this.changed();
    return this.state.sound;
  }

  hardReset(): void {
    wipe(this.storage);
    this.state = eco.newState(this.now());
    this.analytics.track('hard_reset');
    this.emit({ type: 'reset' });
    this.changed();
    this.save();
  }
}
