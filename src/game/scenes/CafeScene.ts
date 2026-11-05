import Phaser from 'phaser';
import { GameController, type GameEvent } from '../../core/controller';
import { CATS } from '../../content/cats';
import { PALETTE, UI } from '../../content/palette';
import { STATIONS } from '../../content/upgrades';
import { SPECIES, pickSpecies } from '../../content/customers';
import { FURNITURE_ITEMS, FURNITURE_BY_ID } from '../../content/furniture';
import { JOURNAL_BY_ID, type PetReaction } from '../../content/journal';
import { equipmentTier, PET, isLovedCat, customerGapMultiplier, hasInfluencer, warpMultiplier, ABILITY, abilityReady, abilityUsed, abilityPrime, OFFLINE, RUSH } from '../../core/economy';
import { DIARY_TEXT, SPOT_TEXT, CUSTOMER_POSTS, pick } from '../../content/diarytext';
import { SPECIES_BY_ID } from '../../content/customers';
import type { DiaryKind, DiaryBg } from '../../core/types';
import { CAPTIONS, SUBJECT_NAMES } from '../../content/captions';
import { CAPTIONS_ZH, SUBJECT_ZH, DIARY_ZH, SPECIES_ZH, SPOT_TEXT_ZH, CUSTOMER_POSTS_ZH } from '../../content/zh';
import { t as tr, lang, nameOf, heroName } from '../../i18n';

const FONT = 'Nunito, "Avenir Next", "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", system-ui, sans-serif';
import { CAT_BY_ID } from '../../content/cats';
import { catCanvas, animalCanvas, macaronCanvas, starCanvas, propCanvas, beltCanvas, bubbleCanvas, emoteCanvas, whiskCanvas, glowCanvas, furnitureCanvas, toyCanvas, packCanvas, doughCanvas, sackCanvas, ropeCanvas, seatCanvas, overrideCanvas, propRows, PROP_ANCHOR, PROP_NAMES, EMOTE_NAMES } from '../sprites/pixel';
import { fmt } from '../../core/format';
import { sfx } from '../../core/audio';

const HERO = { color: 'cream', accessory: 'none' };
const MAX_BELT_MACARONS = 40;
const CUSTOMER = { firstAfterSec: 30, minGapSec: 60, maxGapSec: 120, browseSec: 8 };

type Mode = 'idle' | 'walk' | 'work' | 'lie' | 'react' | 'social' | 'nap' | 'rest' | 'climb' | 'play' | 'eat';
interface Roamer {
  sprite: Phaser.GameObjects.Image; gen: string; slot: number; phase: number;
  mode: Mode; next: Mode; tx: number; ty: number; timer: number; speed: number; petReadyAt: number;
  heart: Phaser.GameObjects.Image | null;
  /** squished flat (manager cat): stays flat while shuffling away */
  flat: boolean;
  /** after being snapped out of slacking the cat stays on task until this time (ms) */
  alertUntil: number;
  /** colour of the macaron being chewed (null: chewing air) */
  eating?: string | null;
  /** seconds accumulator for periodic emotes while napping */
  napAcc: number;
  /** remaining waypoints before the final target */
  route: Pt[];
  /** facility this cat has claimed (one cat per facility) */
  spot: string | null;
  /** one-shot callback when the current walk ends (used for jobs like re-wrapping the display) */
  onArrive?: () => void;
}
interface Social { a: Roamer; b: Roamer; kind: 'cuddle' | 'fight'; started: boolean; until: number }
interface Chat { cat: Roamer; customer: Customer; started: boolean; until: number; acc: number; bubble?: Phaser.GameObjects.Image; turn?: number }
interface BeltMacaron { sprite: Phaser.GameObjects.Image; seg: number; t: number; color: string; flying?: boolean; wrapped?: boolean }
interface Customer {
  species: string;
  sprite: Phaser.GameObjects.Image; bubble: Phaser.GameObjects.Image;
  glow?: Phaser.GameObjects.Image; hint?: Phaser.GameObjects.Text; visited?: boolean; fan?: boolean;
  mode: 'enter' | 'queue' | 'browse' | 'leave'; tx: number; ty: number; timer: number; served: boolean;
}
interface Pt { x: number; y: number }

/**
 * The bakery as a small factory room. Machines are spread across the floor and linked by an
 * L-shaped conveyor: mixer → piping → oven along the back, then down to the packing box.
 * Hired cats roam the floor (and can be petted); customers come in through the door to the
 * display cabinets. Depth is sorted by y so everything overlaps naturally.
 */
export class CafeScene extends Phaser.Scene {
  private hero!: Phaser.GameObjects.Image;
  private heroScale = 6;
  private heroY = 0;
  private bgImage: Phaser.GameObjects.Image | null = null;
  private belts: Phaser.GameObjects.TileSprite[] = [];
  private beltFrames: Phaser.GameObjects.Graphics[] = [];
  private beltOverlay!: Phaser.GameObjects.TileSprite;
  private overlayFromY = 0; // outline per run, drawn so the two corners and both ends close
  private beltH = 0; private backY = 0; private boxY = 0;
  private propScale = 3; private machineScale = 4;
  private props: Phaser.GameObjects.Image[] = [];
  private whisk!: Phaser.GameObjects.Image;
  private glow2!: Phaser.GameObjects.Image;
  /** the sack at the end of the line */
  private sack!: Phaser.GameObjects.Image;
  private seats: Phaser.GameObjects.Image[] = [];
  /** pixel-style rainbow energy bar, left of the owner */
  private energyBar!: Phaser.GameObjects.Graphics;
  private barIcons: Phaser.GameObjects.Image[] = [];
  /** stanchion rope between the counter spot and the waiting line */
  private rope!: Phaser.GameObjects.Image;
  /** furniture placed in the four floor slots (rebuilt from state) */
  private lounge: { key: string; slot: number; img: Phaser.GameObjects.Image; dark?: Phaser.GameObjects.Rectangle; ball?: Phaser.GameObjects.Image; front?: Phaser.GameObjects.Image; use: 'nap' | 'rest' | 'play'; inside: boolean }[] = [];
  private pendingFurniture = true;
  private slotPos: Pt[] = [];
  private glow!: Phaser.GameObjects.Image;
  private warmth!: Phaser.GameObjects.Image;
  private whiskBoostUntil = 0;
  private smokeAcc = 0;
  private stations: Pt[] = [];
  private path: Pt[] = [];
  private roamers: Roamer[] = [];
  private beltMacarons: BeltMacaron[] = [];
  private spawnAcc = 0;
  private shelfLayer!: Phaser.GameObjects.Container;
  private lastShelfCount = -1;
  private shelfAcc = 0;
  private boostOverlay!: Phaser.GameObjects.Rectangle;
  private unsub: (() => void) | null = null;
  private blinkAt = 0;
  private heroBlinking = false;
  private macaronKeys: string[] = [];
  private floatPool: Phaser.GameObjects.Text[] = [];
  private pendingRoamerRebuild = true;
  private dozeAll = false;
  private pendingPropRefresh = true;
  private customers: Customer[] = [];
  private nextCustomerAt = CUSTOMER.firstAfterSec;
  private rushLeft = 0;
  private nextSocialAt = 30;
  /** special abilities are triggered by petting; this is when each becomes ready (session seconds) */
  private readyOutlines: Map<Roamer, Phaser.GameObjects.Image> = new Map();
  private shootingStar: Phaser.GameObjects.Image | null = null;
  private rainbowUntil = 0;
  private rainbowReadyAt = 0;
  private rainbowTaps: number[] = [];
  private trailAcc = 0;
  private social: Social | null = null;
  private chat: Chat | null = null;
  private sessionSec = 0;

  constructor(private ctrl: GameController) { super('cafe'); }

  create(): void {
    this.buildTextures();
    this.shelfLayer = this.add.container(0, 0).setDepth(1);
    for (let i = 0; i < 3; i++) { this.belts.push(this.add.tileSprite(0, 0, 10, 10, 'belt').setOrigin(0, 0.5)); this.beltFrames.push(this.add.graphics()); }
    this.beltOverlay = this.add.tileSprite(0, 0, 10, 10, 'belt').setOrigin(0, 0.5); this.beltFrames.push(this.add.graphics()); // the stretch below the packaging machine, drawn over it
    for (const name of STATIONS) this.props.push(this.add.image(0, 0, `prop_${name}_t0`).setOrigin(0.5, 1));
    this.sack = this.add.image(0, 0, 'sack').setOrigin(0.5, 1); // stands on the floor under the belt's end
    this.rope = this.add.image(0, 0, 'rope').setOrigin(0.5, 1);
    this.rope2 = this.add.image(0, 0, 'rope').setOrigin(0.5, 1); // a second span: the queue is long
    this.seats = [this.add.image(0, 0, 'seat').setOrigin(0.5, 1), this.add.image(0, 0, 'seat').setOrigin(0.5, 1)];
    this.energyBar = this.add.graphics().setDepth(9401);
    this.whisk = this.add.image(0, 0, 'whisk');
    this.glow = this.add.image(0, 0, 'glow').setAlpha(0);
    this.glow2 = this.add.image(0, 0, 'glow').setAlpha(0).setVisible(false); // the deck oven's upper window
    this.warmth = this.add.image(0, 0, 'warmth').setAlpha(0).setDepth(1); // warm pool of light on the floor in front of the oven: why cats nap there

    this.boostOverlay = this.add.rectangle(0, 0, 10, 10, 0xbfe8d4, 0).setOrigin(0).setDepth(9000);

    this.hero = this.add.image(0, 0, 'hero_open').setInteractive({ useHandCursor: true });
    this.hero.on('pointerdown', () => this.onHeroTap());

    this.input.on('pointerdown', (p: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      if (targets.length === 0 && Math.hypot(p.x - this.hero.x, p.y - this.hero.y) < this.hero.displayWidth * 0.75) this.onHeroTap();
    });

    this.scale.on('resize', () => this.layout());
    this.layout();
    this.primeAbilities();
    this.unsub = this.ctrl.on((e) => this.onEvent(e));
    this.events.once('shutdown', () => this.unsub?.());
    if (window.__mc) window.__mc.debug = {
      spawnCustomer: () => this.spawnCustomer(),
      customer: () => { const c = this.customers.find((x) => x.mode === 'browse') ?? this.customers[0]; return c ? { x: c.sprite.x, y: c.sprite.y - 8 * this.roamerScale(), mode: c.mode, species: c.species } : null; },
      roamer: () => { const r = this.roamers.find((x) => x.mode === 'idle' || x.mode === 'walk'); return r ? { x: r.sprite.x, y: r.sprite.y - 8 * this.roamerScale(), gen: r.gen } : null; },
      bless: () => this.doBless(),
      timeSkip: () => this.doTimeWarp(),
      shootStar: () => { this.spawnShootingStar(); return this.shootingStar ? { x: this.shootingStar.x, y: this.shootingStar.y } : null; },
      star: () => (this.shootingStar ? { x: this.shootingStar.x, y: this.shootingStar.y } : null),
      social: (kind: string) => this.startSocial(kind as 'cuddle' | 'fight' | 'nap' | 'rest'),
      climber: () => { const r = this.roamers.find((x) => x.spot === 'cattree'); return r ? { y: r.sprite.y, mode: r.mode } : null; },
      furniture: () => this.lounge.map((it) => it.key),
      play: () => { const r = this.freeRoamers()[0]; return r ? this.sendToPlay(r) : false; },
      eat: () => { const r = this.freeRoamers()[0]; if (!r) return false; this.sendToEat(r); return r.next === 'eat'; },
      hits: (x: number, y: number) => { const ptr = this.input.activePointer; ptr.x = x; ptr.y = y; const objs = this.input.hitTestPointer(ptr) as Phaser.GameObjects.Image[]; return objs.map((o) => ({ key: o.texture?.key, depth: o.depth, x: Math.round(o.x), y: Math.round(o.y), flip: o.flipX, angle: Math.round(o.angle), ox: o.originX, oy: o.originY })); },
      scene: () => this as unknown,
      eater: () => { const r = this.roamers.find((x) => x.mode === 'eat'); return r ? { x: r.sprite.x, y: r.sprite.y - 4 * this.roamerScale(), gen: r.gen } : null; },
      rainbow: () => this.nyanDash(),
      windower: () => { const r = this.roamers.find((x) => x.spot === 'window'); return r ? { x: Math.round(r.sprite.x), y: Math.round(r.sprite.y), tx: Math.round(r.tx), ty: Math.round(r.ty), mode: r.mode, next: r.next, route: r.route.length, counterY: Math.round(this.counters[0].y), topX: Math.round(this.counters[0].x) } : null; },
      napper: () => { const r = this.roamers.find((x) => x.mode === 'nap'); return r ? { x: r.sprite.x, y: r.sprite.y - 4 * this.roamerScale(), gen: r.gen } : null; },
    };
  }

  private buildTextures(): void {
    const add = (key: string, c: HTMLCanvasElement) => { if (!this.textures.exists(key)) this.textures.addCanvas(key, c); };
    add('hero_open', overrideCanvas('hero:open') ?? catCanvas(HERO.color, HERO.accessory, 'open'));
    add('hero_blink', overrideCanvas('hero:blink') ?? catCanvas(HERO.color, HERO.accessory, 'blink'));
    add('hero_happy', overrideCanvas('hero:happy') ?? catCanvas(HERO.color, HERO.accessory, 'happy'));
    add('hero_laugh', catCanvas(HERO.color, HERO.accessory, 'laugh'));
    for (const c of CATS) {
      add(`cat_${c.id}_open`, overrideCanvas(`cat:${c.id}:open`) ?? catCanvas(c.coat, c.accessory, 'open'));
      add(`cat_${c.id}_blink`, overrideCanvas(`cat:${c.id}:blink`) ?? catCanvas(c.coat, c.accessory, 'blink'));
      add(`cat_${c.id}_happy`, overrideCanvas(`cat:${c.id}:happy`) ?? catCanvas(c.coat, c.accessory, 'happy'));
      add(`cat_${c.id}_back`, overrideCanvas(`cat:${c.id}:back`) ?? catCanvas(c.coat, c.accessory, 'back'));
      add(`cat_${c.id}_sleep`, overrideCanvas(`cat:${c.id}:sleep`) ?? catCanvas(c.coat, c.accessory, 'sleep'));
      add(`cat_${c.id}_fight`, overrideCanvas(`cat:${c.id}:fight`) ?? catCanvas(c.coat, c.accessory, 'fight'));
      add(`cat_${c.id}_sad`, overrideCanvas(`cat:${c.id}:sad`) ?? catCanvas(c.coat, c.accessory, 'sad'));
      add(`cat_${c.id}_chew`, overrideCanvas(`cat:${c.id}:chew`) ?? catCanvas(c.coat, c.accessory, 'chew'));
    }
    for (const k of Object.keys(PALETTE)) add(`mac_${k}`, macaronCanvas(k));
    this.macaronKeys = ['pink', 'mint', 'lemon', 'sky', 'lavender', 'peach', 'rose', 'pistachio'].map((k) => `mac_${k}`);
    add('star', starCanvas());
    add('belt', beltCanvas());
    for (const name of PROP_NAMES) for (let t = 0; t <= 3; t++) add(`prop_${name}_t${t}`, propCanvas(name, t));
    add('sack', sackCanvas()); add('rope', ropeCanvas()); add('seat', seatCanvas());
    for (const k of ['pink', 'mint', 'lemon', 'sky', 'lavender', 'peach', 'rose', 'pistachio']) { add(`ball_${k}`, doughCanvas(k)); for (let t = 1; t <= 3; t++) add(`gift_t${t}_${k}`, packCanvas(t, k)); }
    for (const sp of SPECIES) for (const coat of sp.coats) { add(`cust_${sp.id}_${coat}`, animalCanvas(sp, coat)); add(`cust_${sp.id}_${coat}_happy`, animalCanvas(sp, coat, 'happy')); add(`cust_${sp.id}_${coat}_fan`, animalCanvas(sp, coat, 'open', true)); add(`cust_${sp.id}_${coat}_fan_happy`, animalCanvas(sp, coat, 'happy', true)); }
    add('bubble', bubbleCanvas());
    add('bubble_note', bubbleCanvas('note'));
    add('bubble_shades', bubbleCanvas('shades'));
    add('bubble_heart', bubbleCanvas('heart'));
    add('bubble_money', bubbleCanvas('money'));
    { const c = document.createElement('canvas'); c.width = 8; c.height = 8; const x = c.getContext('2d')!; const rows = ['..#...#.', '.#...#..', '.#...#..', '..#...#.', '...#...#', '..#...#.', '.#...#..', '.#...#..']; rows.forEach((r, y) => [...r].forEach((ch, xx) => { if (ch === '#') { x.fillStyle = '#FFFFFF'; x.fillRect(xx, y, 1, 1); } })); add('steam', c); }
    { const c = document.createElement('canvas'); c.width = 8; c.height = 6; const x = c.getContext('2d')!; ['#ff5f6d', '#ffb347', '#fff36b', '#7ee787', '#6fb3ff', '#c38cff'].forEach((col, i) => { x.fillStyle = col; x.fillRect(0, i, 8, 1); }); add('icon_rainbow', c); }
    for (const e of EMOTE_NAMES) add(`emote_${e}`, emoteCanvas(e));
    add('emote_heart_red', emoteCanvas('heart', '#E8453C'));
    add('whisk', whiskCanvas());
    add('glow', glowCanvas());
    { const c = document.createElement('canvas'); c.width = 96; c.height = 48; const ctx = c.getContext('2d')!; const g = ctx.createRadialGradient(48, 48, 2, 48, 48, 46); /* in the squashed space below: an ellipse of light on the floor */ g.addColorStop(0, 'rgba(255,170,80,0.55)'); g.addColorStop(0.5, 'rgba(255,150,70,0.22)'); g.addColorStop(1, 'rgba(255,140,60,0)'); ctx.save(); ctx.scale(1, 0.5); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(48, 48, 46, 0, Math.PI * 2); ctx.fill(); ctx.restore(); add('warmth', c); }
    for (const f of FURNITURE_ITEMS) add(`furn_${f.sprite}`, furnitureCanvas(f.sprite));
    add('furn_hangball_ball', furnitureCanvas('hangball_ball'));
    { // the basket's front wall as its own layer, so a cat inside sits between the back and the front rim
      const full = furnitureCanvas('basket'); const split = Math.round(full.height * 0.55);
      const front = document.createElement('canvas'); front.width = full.width; front.height = full.height;
      front.getContext('2d')!.drawImage(full, 0, split, full.width, full.height - split, 0, split, full.width, full.height - split);
      add('furn_basket_front', front);
    }
    add('toy_yarn', toyCanvas('yarn'));
  }

  private narrow(): boolean { return this.scale.width < 700; }
  /** One pixel size for the whole scene: every sprite is drawn at this scale so pixels match. */
  private roamerScale(): number { return Math.max(2, Math.round(this.propScale * 0.8)); }

  // ---- layout -------------------------------------------------------------------------------

  /** Counter rectangles (top face) in stage coordinates. */
  private counters: { x: number; y: number; w: number; h: number }[] = [];
  /** stainless cells of the counter under each machine: the belt is interrupted there, the machine stands on steel */
  private cellGfx: Phaser.GameObjects.Graphics[] = [];
  private rope2!: Phaser.GameObjects.Image;
  private display = { x: 0, y: 0, w: 0, h: 0 };
  /** packaging tier currently shown on the display counter (lags the bought tier until a cat has re-wrapped the stock) */
  private shelfTier = 0;
  private rewrapping = false;
  private wallH = 0;
  private counterFront = 0;

  private layout(): void {
    const w = this.scale.width, h = this.scale.height;
    const unit = Math.min(w, h);
    const narrow = this.narrow();
    this.propScale = Phaser.Math.Clamp(Math.round(unit / 180), 2, 4);
    this.machineScale = this.propScale;
    this.beltH = 8 * this.propScale;
    this.wallH = Math.round(h * 0.10);
    const depth = 13 * this.propScale;          // counter top-face depth
    this.counterFront = 4 * this.propScale;     // visible front face (3/4 view)

    // hero: the owner, drawn at double pixel size, sitting in the bottom-left corner (no frame)
    this.heroScale = this.propScale * 1.6; // the owner, a little smaller than before
    void narrow;
    this.cam = { x: 4 + 4 * this.heroScale, y: 0, w: 22 * this.heroScale + 8, h: 16 * this.heroScale + 8 }; // room on the left for the energy bar
    this.cam.y = h - this.cam.h - 4;
    const heroFeet = h - 6;
    this.heroY = heroFeet - 12 * this.heroScale;
    this.hero.setScale(this.heroScale).setPosition(this.cam.x + this.cam.w / 2, this.heroY).setDepth(9400);
    if (this.camGfx) { this.camGfx.destroy(); this.camGfx = null; }

    if (window.__mc) window.__mc.hero = () => ({ x: this.hero.x, y: this.hero.y });
    this.tweens.killTweensOf(this.hero);
    this.tweens.add({ targets: this.hero, y: this.heroY + 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // customer display counter along the front (bottom edge), right of the cam; customers order from the street side
    const dx = this.cam.x + this.cam.w + w * 0.02;
    // the display counter gives up its right end so a full empty bay sits between it and the front counter (the sack's spot)
    const sackGap = 28 * this.propScale;
    const rightCx = Math.min(w * 0.82 + 22 * this.roamerScale(), w - 13 * this.propScale - 2 * this.propScale); // room for the packaging table (26 px wide) beside the right-hand run
    const displayEndOrig = dx + Math.max(80, Math.min(w * 0.40, w * 0.62 - dx));
    this.display = { x: dx, y: h * (narrow ? 0.78 : 0.80), w: Math.max(60, displayEndOrig - sackGap - dx), h: depth };

    // U-shaped work counter: along the top, down the right side, then back along the front to the display counter
    // the work counter sits two cat-heights higher than before and one cat-width further right: more floor to roam
    const catH = 16 * this.roamerScale(), catW = 22 * this.roamerScale();
    const topY = Math.max(this.wallH + 6 * this.propScale, this.wallH + h * (narrow ? 0.34 : 0.27) - 2 * catH);
    const frontY = this.display.y;
    const topX0 = w * 0.22 + 2 * catW - 16 * this.propScale; // the counter (and the mixer at its start) begins one cell further left
    const topCounter = { x: topX0, y: topY, w: rightCx + depth / 2 - topX0, h: depth };
    const rightCounter = { x: rightCx - depth / 2, y: topY + depth, w: depth, h: frontY - (topY + depth) };
    const frontX0 = this.display.x + this.display.w + sackGap; // the front counter stays where it was; the bay is carved from the display counter
    const sackCx = frontX0 - 11 * this.propScale; // the sack stands in its bay, clear of the counter so the belt's end cap shows
    const sackX = frontX0; // the belt stops at the counter's end; gifts drop off it into the sack
    const frontCounter = { x: frontX0, y: frontY, w: rightCx + depth / 2 - frontX0, h: depth };
    this.counters = [topCounter, rightCounter, frontCounter];
    this.drawDisplayCounter();

    this.backY = topY + depth / 2;
    const frontCy = frontY + depth / 2;
    this.boxY = frontCy;
    // The line: energy balls from pats and working cats gather in the mixer, which sends a ball onto the belt;
    // past the piping station, through the oven (→ macaron), round the corner, down the right side, through the
    // packaging machine at the bottom-right corner (→ gift in the macaron's colour) and into the sack at the end.
    // mixer, piping and oven spread evenly from the counter's left end to just before the corner
    const mx0 = topX0 + 12 * this.propScale, mx1 = rightCx - 30 * this.propScale;
    const ovenX = mx1 - 16 * this.propScale; // one cell left of the corner
    this.stations = [
      { x: mx0, y: this.backY },                 // mixer: the belt starts here
      { x: (mx0 + mx1) / 2, y: -1000 },          // tray station: upgrades only, not on the floor (nothing to transform yet)
      { x: ovenX, y: this.backY },               // oven: balls become macarons
      { x: rightCx, y: frontCy - 2 * catH },     // packaging machine (the "box" upgrade line): on the right-hand belt, two cats above the corner
    ];
    this.path = [this.stations[0], this.stations[2], { x: rightCx, y: this.backY }, { x: rightCx, y: frontCy }, { x: sackX, y: frontCy }];
    const [back, down, front] = this.belts;
    const hb = this.beltH / 2; // the runs overlap by half a belt width at the two corners: no notches
    back.setPosition(this.stations[0].x, this.backY).setRotation(0)
      .setSize(rightCx + hb - this.stations[0].x, this.beltH).setTileScale(this.propScale).setDepth(topCounter.y + topCounter.h + this.counterFront + 1);
    down.setPosition(rightCx, this.backY - hb).setRotation(Math.PI / 2)
      .setSize(frontCy - this.backY + 2 * hb, this.beltH).setTileScale(this.propScale).setDepth(rightCounter.y + rightCounter.h + this.counterFront + 1);
    front.setPosition(rightCx + hb, frontCy).setRotation(Math.PI)
      .setSize(rightCx + hb - sackX, this.beltH).setTileScale(this.propScale).setDepth(frontCounter.y + frontCounter.h + this.counterFront + 1);
    // below the packaging machine the belt runs in front of it: that stretch is a second tile sprite above the machine
    this.overlayFromY = this.stations[3].y + depth / 2;
    this.beltOverlay.setPosition(rightCx, this.overlayFromY).setRotation(Math.PI / 2)
      .setSize(frontCy - hb - this.overlayFromY, this.beltH).setTileScale(this.propScale).setDepth(down.depth + 3);
    this.drawBeltFrames(this.stations[0].x, sackX, rightCx, this.backY, frontCy, hb);
    // machines keep their places on the line, but each stands on a stainless cell of the counter: the belt is interrupted there
    const sc = this.machineScale;
    const topBase = topCounter.y + topCounter.h - 2;
    const cellW = 26 * sc;
    const lip = 2 * this.propScale; // a steel table standing on the floor, a touch deeper than the conveyor rack on both sides
    this.drawSteelCells([
      { x: this.stations[0].x - cellW / 2, y: topCounter.y - lip, w: cellW, h: depth + 2 * lip, front: this.counterFront, depth: back.depth + 0.7 },
      { x: this.stations[2].x - cellW / 2, y: topCounter.y - lip, w: cellW, h: depth + 2 * lip, front: this.counterFront, depth: back.depth + 0.7 },
      { x: rightCx - cellW / 2, y: this.stations[3].y + depth / 2 + lip + 2 - (depth + 2 * lip), w: cellW, h: depth + 2 * lip, front: this.counterFront, depth: down.depth + 0.7 }, // the same table as the two above, across the right-hand run
    ]);
    this.props.forEach((p, i) => {
      const st = this.stations[i];
      // above the belt and the steel cell (belt depth = counter bottom + front + 1) so items slide through the machine
      if (i === 1) { p.setVisible(false); return; } // the tray station stays off the floor for now
      if (i === 3) p.setOrigin(0.5, 1).setScale(sc).setPosition(st.x, st.y + depth / 2).setDepth(down.depth + 2); // across the right-hand run: items go in under it, the belt below it runs in front
      else p.setOrigin(0.5, 1).setScale(sc).setPosition(st.x, topBase).setDepth(topBase + 2 + this.counterFront + 4);
    });
    // the sack stands on the floor in its own bay, mouth up toward the belt end hanging above it
    const sackFeet = frontCounter.y + frontCounter.h + this.counterFront + 2;
    this.sack.setScale(sc).setPosition(sackCx, sackFeet).setDepth(sackFeet + 1);
    this.seats.forEach((im, i) => { const p = this.counterSeat(i); im.setScale(this.propScale).setPosition(p.x, p.y + 2).setDepth(p.y - 1); });
    // stanchion rope on the street side, at the display counter's right end: counter spot on the left, queue on the right
    const ropeY = Math.min(h - 2, this.display.y + this.display.h + this.counterFront + 16 * this.roamerScale() + 4);
    this.rope.setScale(sc).setPosition(this.display.x + this.display.w + 12 * sc, ropeY + 3).setDepth(ropeY + 3); // in front of the customers standing at the same line
    this.rope2.setScale(sc).setPosition(this.rope.x + 18 * sc, ropeY + 3).setDepth(ropeY + 3); // shares the middle stanchion
    this.placeMovingParts();
    this.warmth.setOrigin(0.5, 0.3).setPosition(this.stations[2].x, topCounter.y + topCounter.h + this.counterFront).setScale(this.propScale * 0.9, this.propScale * 0.8); // radiates from the oven down onto the floor // a pool about two cats wide, right in front of the oven

    // four furniture slots down the left side
    const fs = this.propScale;
    // all four on the left, zig-zagging down the wall so nothing overlaps
    const base = topY + depth + this.counterFront;
    // all four furniture spots run down the left wall, staggered, below the counter line
    const slotMaxY = this.cam.y - 2 * fs; // never down into the owner's corner (phones: the floor is short)
    this.slotPos = [ // spread out down the left wall
      { x: w * 0.08, y: Math.min(base + 68 * fs, slotMaxY) },
      { x: w * 0.17, y: base + 8 * fs },
      { x: w * 0.07, y: Math.min(base + 28 * fs, slotMaxY - 40 * fs) },
      { x: w * 0.17, y: Math.min(base + 48 * fs, slotMaxY - 20 * fs) },
    ];
    this.pendingFurniture = true;

    this.boostOverlay.setSize(w, h);
    this.bakeBackground(w, h);
    this.roamers.forEach((r) => { r.sprite.destroy(); r.heart?.destroy(); });
    this.roamers = [];
    this.pendingRoamerRebuild = true;
    this.pendingPropRefresh = true;
    this.lastShelfCount = -1;
    this.refreshShelf();
    for (const m of this.beltMacarons) m.sprite.destroy();
    this.beltMacarons = [];
    for (const c of this.customers) { c.sprite.destroy(); c.bubble.destroy(); c.glow?.destroy(); c.hint?.destroy(); }
    this.customers = [];
  }

  /** The static room (wall strip, floor tiles, counters with front faces, door) rendered once into a texture. */
  private bakeBackground(w: number, h: number): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    // floor everywhere
    g.fillStyle(Phaser.Display.Color.HexStringToColor(UI.floor).color).fillRect(0, 0, w, h);
    g.fillStyle(0xf0d6c6, 1);
    const tile = 36;
    for (let y = this.wallH; y < h; y += tile) for (let x = (Math.floor((y - this.wallH) / tile) % 2) * tile; x < w; x += tile * 2) g.fillRect(x, y, tile, tile);
    // back wall strip with the door (top-left) and a window
    g.fillStyle(Phaser.Display.Color.HexStringToColor(UI.wall).color).fillRect(0, 0, w, this.wallH);
    g.fillStyle(0xf6dfd0, 1);
    for (let y = 8; y < this.wallH - 6; y += 14) for (let x = ((y / 14) % 2) * 7 + 6; x < w; x += 14) g.fillRect(x, y, 2, 2);
    g.fillStyle(0xe8c9b3, 1).fillRect(0, this.wallH - 4, w, 6);
    const winW = Math.min(w * 0.26, 260), winX = w / 2 - winW / 2; // centred so the HUD cards don't hide it
    g.fillStyle(0x6e5247, 1).fillRect(winX - 3, 6, winW + 6, this.wallH * 0.7);
    g.fillStyle(0xc4def5, 1).fillRect(winX, 9, winW, this.wallH * 0.7 - 6);
    g.fillStyle(0xffffff, 0.5).fillRect(winX + 6, 12, winW * 0.3, this.wallH * 0.25);
    // the U-shaped work counter as one seamless piece: every outline first, then every top face, then the front faces
    const [top, right, front] = this.counters;
    if (top && right && front) {
      const cf = this.counterFront;
      for (const c of [top, right, front]) g.fillStyle(0x5a4038, 1).fillRect(c.x - 2, c.y - 2, c.w + 4, c.h + (c === right ? 0 : cf) + 4);
      for (const c of [top, right, front]) g.fillStyle(0xf7e8dc, 1).fillRect(c.x, c.y, c.w, c.h);
      g.fillStyle(0xdcbda3, 1).fillRect(top.x, top.y + top.h, right.x - top.x, cf);      // front face of the back run stops at the inner corner
      g.fillStyle(0xdcbda3, 1).fillRect(front.x, front.y + front.h, front.w, cf);        // front face of the front run, full width
      g.fillStyle(0xffffff, 0.35).fillRect(top.x + 4, top.y + 3, top.w - 8, 3);          // one highlight along the back edge
      g.fillStyle(0xffffff, 0.35).fillRect(front.x + 4, front.y + 3, right.x - front.x - 8, 3); // and along the front run, up to the corner
    }

    // street-side mat in front of the display counter
    g.fillStyle(0xf9cbd6, 0.6).fillRect(this.display.x + this.display.w * 0.15, this.display.y + this.display.h + this.counterFront + 4, this.display.w * 0.7, 6);

    const key = 'bg_room';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, Math.ceil(w), Math.ceil(h));
    g.destroy();
    if (this.bgImage) this.bgImage.destroy();
    this.bgImage = this.add.image(0, 0, key).setOrigin(0).setDepth(0);
  }

  /** Bounding box of a sprite's doorway: transparent pixels that have opaque pixels on both sides in their row. */
  private doorway(key: string): { x0: number; y0: number; x1: number; y1: number; w: number; h: number } {
    const src = this.textures.get(key).getSourceImage() as HTMLCanvasElement;
    const w = src.width, h = src.height;
    const data = src.getContext('2d')!.getImageData(0, 0, w, h).data;
    const opaque = (x: number, y: number) => data[(y * w + x) * 4 + 3] > 0;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (opaque(x, y)) continue;
      let left = false, right = false;
      for (let i = x - 1; i >= 0; i--) if (opaque(i, y)) { left = true; break; }
      for (let i = x + 1; i < w; i++) if (opaque(i, y)) { right = true; break; }
      if (left && right && y > h / 2) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
    if (x1 < 0) return { x0: Math.round(w / 2) - 5, y0: h - 13, x1: Math.round(w / 2) + 4, y1: h - 1, w, h };
    return { x0, y0, x1, y1, w, h };
  }

  /** Steel cells under the machines, drawn over the belt (and its frame) but under the items and the machines. */
  private drawSteelCells(cells: { x: number; y: number; w: number; h: number; front: number; depth: number }[]): void {
    while (this.cellGfx.length < cells.length) this.cellGfx.push(this.add.graphics());
    this.cellGfx.forEach((g, i) => {
      const c = cells[i]; g.clear(); if (!c) return;
      g.setDepth(c.depth);
      g.fillStyle(0x5a4038, 1).fillRect(c.x - 2, c.y - 2, c.w + 4, c.h + c.front + 4);
      g.fillStyle(0xd6dbe0, 1).fillRect(c.x, c.y, c.w, c.h);
      if (c.front) g.fillStyle(0x9aa3ab, 1).fillRect(c.x, c.y + c.h, c.w, c.front);
      g.fillStyle(0xffffff, 0.5).fillRect(c.x + 3, c.y + 2, c.w - 6, 2);
    });
  }

  /** Outline for the three belt runs. Each corner square belongs to the run drawn on top of it (down at the
   *  top-right, front at the bottom-right), so the frame there is drawn with that run and the lines meet cleanly. */
  private drawBeltFrames(x0: number, xEnd: number, cx: number, yBack: number, yFront: number, hb: number): void {
    const t = this.propScale, col = 0x5a4038;
    const [back, down, front, over] = this.beltFrames;
    const hline = (g: Phaser.GameObjects.Graphics, xa: number, xb: number, y: number) => g.fillRect(Math.min(xa, xb), y, Math.abs(xb - xa), t);
    const vline = (g: Phaser.GameObjects.Graphics, x: number, ya: number, yb: number) => g.fillRect(x, Math.min(ya, yb), t, Math.abs(yb - ya));
    back.clear().fillStyle(col, 1).setDepth(this.belts[0].depth + 0.5);
    hline(back, x0, cx - hb, yBack - hb); hline(back, x0, cx - hb, yBack + hb - t); vline(back, x0, yBack - hb, yBack + hb); // top, bottom, start cap
    down.clear().fillStyle(col, 1).setDepth(this.belts[1].depth + 0.5);
    hline(down, cx - hb, cx + hb, yBack - hb); vline(down, cx + hb - t, yBack - hb, yFront - hb); vline(down, cx - hb, yBack + hb - t, yFront - hb); // corner top, outer, inner
    over.clear().fillStyle(col, 1).setDepth(this.beltOverlay.depth + 0.5); // the overlay's own edges, above the machine
    vline(over, cx + hb - t, this.overlayFromY, yFront - hb); vline(over, cx - hb, this.overlayFromY, yFront - hb);
    front.clear().fillStyle(col, 1).setDepth(this.belts[2].depth + 0.5);
    vline(front, cx + hb - t, yFront - hb, yFront + hb); hline(front, xEnd, cx + hb, yFront + hb - t); hline(front, xEnd, cx - hb + t, yFront - hb); vline(front, xEnd, yFront - hb, yFront + hb); // outer corner, bottom, top, end cap
  }

  /** The display counter is a live object (depth = its front edge) so sprites sort against it naturally. */
  private drawDisplayCounter(): void {
    const c = this.display;
    if (!this.counterGfx) this.counterGfx = this.add.graphics();
    const g = this.counterGfx;
    g.clear();
    g.fillStyle(0x5a4038, 1).fillRect(c.x - 2, c.y - 2, c.w + 4, c.h + this.counterFront + 4);
    g.fillStyle(0xf7e8dc, 1).fillRect(c.x, c.y, c.w, c.h);
    g.fillStyle(0xc4def5, 0.22).fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    g.fillStyle(0xdcbda3, 1).fillRect(c.x, c.y + c.h, c.w, this.counterFront);
    g.fillStyle(0xffffff, 0.35).fillRect(c.x + 4, c.y + 3, c.w - 8, 3);
    g.setDepth(c.y + c.h + this.counterFront);
  }

  /** Macaron stock sits on the display counter top, right of the owner. */
  private shelfSlots(): Pt[] {
    const slots: Pt[] = [];
    const cols = 4, rows = 1;
    const d = this.display;
    const x0 = d.x + d.w * 0.3, span = d.w * 0.66;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      slots.push({ x: x0 + ((c + 0.5) * span) / cols, y: d.y + d.h * 0.5 + r });
    }
    return slots;
  }

  private refreshShelf(): void {
    const total = this.ctrl.state.totalEarned;
    const slots = this.shelfSlots();
    const count = Math.min(slots.length, Math.floor(Math.log10(total + 1) * 1.6));
    if (count === this.lastShelfCount) return;
    this.lastShelfCount = count;
    this.shelfLayer.removeAll(true);
    const scale = Math.max(2, Math.round(this.propScale * 0.7));
    const tier = this.shelfTier; // bare macarons → ribbon boxes → gift boxes → shiny boxes
    // a tidy row: items side by side with a gap, centred on the counter, never overlapping
    const itemW = (tier > 0 ? 17 : 9) * scale, gap = 2 * scale;
    const fit = Math.max(1, Math.min(count, Math.floor((this.display.w - 4 * scale + gap) / (itemW + gap))));
    const rowW = fit * itemW + (fit - 1) * gap;
    const x0 = this.display.x + (this.display.w - rowW) / 2 + itemW / 2, y = slots[0].y;
    for (let i = 0; i < fit; i++) {
      const key = tier > 0 ? `gift_t${tier}_${this.macaronKeys[i % this.macaronKeys.length].slice(4)}` : this.macaronKeys[i % this.macaronKeys.length];
      this.shelfLayer.add(this.add.image(x0 + i * (itemW + gap), y - (tier > 0 ? 2 : 0), key).setScale(scale));
    }
    this.shelfLayer.setDepth(this.display.y + this.display.h + this.counterFront + 1);
  }

  /** A machine's anchor (whisk, nozzle, window, lid) in scene pixels for its current tier. */
  private anchor(i: number): Pt {
    const st = STATIONS[i], p = this.props[i];
    const a = PROP_ANCHOR[st][equipmentTier(this.ctrl.state, st)] ?? { x: 11, y: 12 };
    return { x: p.x + (a.x - 11) * p.scaleX, y: p.y - (24 - a.y) * p.scaleY };
  }
  /** Top edge of a machine (templates are bottom-aligned, so short machines are shorter). */
  private machineTop(i: number): number { const p = this.props[i]; return p.y - propRows(STATIONS[i], equipmentTier(this.ctrl.state, STATIONS[i])) * p.scaleY; }

  /** The whisk spins inside the mixer bowl and the oven window carries a flickering glow; both follow the tier's anchors. */
  private placeMovingParts(): void {
    const mixer = this.props[0], oven = this.props[2];
    const wa = this.anchor(0), ga = this.anchor(2);
    this.whisk.setVisible(!!PROP_ANCHOR.mixer[equipmentTier(this.ctrl.state, 'mixer')]); // the sifter and the spatula have no whisk
    this.whisk.setScale(this.propScale).setPosition(wa.x, wa.y).setDepth(mixer.depth + 1);
    this.glow.setScale(this.machineScale * 2).setPosition(ga.x, ga.y).setDepth(oven.depth + 1);
    const deck = equipmentTier(this.ctrl.state, 'oven') === 3; // two decks, two fires
    this.glow2.setVisible(deck).setScale(this.machineScale * 2).setPosition(oven.x + (10.5 - 11) * oven.scaleX, oven.y - (24 - 9.5) * oven.scaleY).setDepth(oven.depth + 1);
  }

  private refreshProps(): void {
    this.pendingPropRefresh = false;
    STATIONS.forEach((st, i) => {
      const key = `prop_${st}_t${equipmentTier(this.ctrl.state, st)}`;
      const p = this.props[i];
      if (p.texture.key !== key) {
        p.setTexture(key);
        const s = p.scaleX;
        this.tweens.add({ targets: p, scaleX: s * 1.25, scaleY: s * 1.25, duration: 160, yoyo: true, ease: 'Quad.out' });
        for (let k = 0; k < 6; k++) { const sp = this.add.image(p.x + (Math.random() - 0.5) * p.displayWidth, p.y - Math.random() * p.displayHeight, 'star').setScale(this.propScale * (0.6 + Math.random() * 0.6)).setDepth(p.depth + 3); this.tweens.add({ targets: sp, y: sp.y - 20, alpha: 0, duration: 600 + Math.random() * 300, delay: k * 60, onComplete: () => sp.destroy() }); }
      }
    });
    this.placeMovingParts();
    const boxTier = equipmentTier(this.ctrl.state, 'box');
    if (boxTier < this.shelfTier || (boxTier > this.shelfTier && !this.rewrapping)) { this.shelfTier = boxTier; this.lastShelfCount = -1; this.refreshShelf(); } // a cat handles upgrades; resets are instant
  }


  /** (Re)create the furniture sprites from the four slots in state. */
  private rebuildFurniture(): void {
    this.pendingFurniture = false;
    for (const it of this.lounge) { it.img.destroy(); it.dark?.destroy(); it.ball?.destroy(); it.front?.destroy(); }
    this.lounge = [];
    const fs = this.propScale;
    this.ctrl.state.furnitureSlots.forEach((id, slot) => {
      if (!id) return;
      const def = FURNITURE_BY_ID[id]; const p = this.slotPos[slot];
      if (!def || !p) return;
      const fd = 5 + p.y / 10000; // furniture lies on the floor: every walking cat passes in front of it; only cats using it sort inside/behind
      const img = this.add.image(p.x, p.y, `furn_${def.sprite}`).setOrigin(0.5, 1).setScale(fs).setDepth(fd);
      let dark: Phaser.GameObjects.Rectangle | undefined;
      if (def.inside) {
        const d = this.doorway(`furn_${def.sprite}`); // the dark inside, exactly the sprite's doorway hole; the sleeping cat sits between it and the house
        dark = this.add.rectangle(p.x + (d.x0 - d.w / 2) * fs, p.y - (d.h - d.y1 - 1) * fs, (d.x1 - d.x0 + 1) * fs, (d.y1 - d.y0 + 1) * fs, 0x3a2a22).setOrigin(0, 1).setDepth(fd - 2);
      }
      let ball: Phaser.GameObjects.Image | undefined;
      if (def.id === 'hangball') ball = this.add.image(p.x + 2 * fs, p.y - 25 * fs, 'furn_hangball_ball').setOrigin(0.5, 0).setScale(fs).setDepth(fd + 0.5); // hangs from the arm's hook and swings about it
      let front: Phaser.GameObjects.Image | undefined;
      if (def.id === 'basket') front = this.add.image(p.x, p.y, 'furn_basket_front').setOrigin(0.5, 1).setScale(fs).setDepth(fd + 1.5); // over the cat (at fd + 1); the full basket stays behind it
      this.lounge.push({ key: def.id, slot, img, dark, ball, front, use: def.use, inside: def.inside });
    });
    // cats heading to / using a piece that is gone: back to the floor
    for (const r of this.roamers) if (r.spot && r.spot !== 'oven' && r.spot !== 'window' && !r.spot.startsWith('counter') && !this.lounge.some((it) => it.key === r.spot)) { r.spot = null; r.sprite.setAngle(0); r.mode = 'idle'; r.timer = 0.5; }
  }

  /** Rotate a cat around its body centre (origin moves from the feet to the middle of the body, position compensated). */
  private lieDown(sp: Phaser.GameObjects.Image, angle: number, duration: number, ease = 'Back.out'): void {
    const h = sp.displayHeight;
    if (sp.originY === 1) { sp.setOrigin(0.5, 0.67); sp.y -= h * 0.33; }
    this.tweens.add({ targets: sp, angle, duration, ease });
  }
  private getUp(sp: Phaser.GameObjects.Image, duration = 240): void {
    this.tweens.add({ targets: sp, angle: 0, duration, ease: 'Back.out', onComplete: () => { if (sp.active && sp.originY !== 1) { sp.y += sp.displayHeight * 0.33; sp.setOrigin(0.5, 1); } } });
  }

  // ---- roaming cats -------------------------------------------------------------------------

  /** The walkable rectangle (feet positions): below the top counter, right of the display counter & hero, left of the right counter. */
  private floorRect(): { x0: number; x1: number; y0: number; y1: number } {
    const s = this.roamerScale(), catW = 22 * s, catH = 16 * s;
    const top = this.counters[0], right = this.counters[1];
    const x0 = catW * 0.5 + 4;
    const x1 = right.x - catW * 0.5;
    const y0 = top.y + top.h + this.counterFront + catH * 1.05;
    const y1 = this.display.y - 6;
    return { x0, x1, y0, y1 };
  }

  private randomFloorPoint(): Pt {
    const f = this.floorRect();
    const s = this.roamerScale();
    for (let i = 0; i < 12; i++) {
      const x = Phaser.Math.Between(f.x0, f.x1), y = Phaser.Math.Between(f.y0, f.y1);
      if (x < this.cam.x + this.cam.w + 11 * s && y > this.cam.y - 4) continue; // keep the cam corner clear
      if (x > this.display.x - 11 * s && x < this.display.x + this.display.w + 11 * s && y > this.display.y - 4) continue; // and the counter
      return { x, y };
    }
    return { x: (f.x0 + f.x1) / 2, y: (f.y0 + f.y1) / 2 };
  }

  private stationSpot(): Pt {
    // with a packaging upgrade, the display counter is a work spot too: someone wraps boxes there
    if (equipmentTier(this.ctrl.state, 'box') > 0 && Math.random() < 0.3) return this.wrapSpot();
    const i = Phaser.Math.Between(0, 2);
    const s = this.roamerScale();
    const f = this.floorRect();
    if (i < 2) return { x: this.stations[i === 0 ? 0 : 2].x + (Math.random() < 0.5 ? -1 : 1) * 10 * s, y: f.y0 }; // by the mixer or the oven
    return { x: f.x1 - 2 * s, y: Phaser.Math.Between(f.y0, Math.max(f.y0, this.boxY - 20 * s)) };
  }

  /** Rainbow energy: a vertical pixel bar left of the owner, bottom aligned with the owner's feet; drains top-down. */
  /** Every running effect as a pixel bar, no words: the rainbow bar stands left of the owner; blessing (gold),
   *  time warp (sky) and catnip rush (green) lie above the owner's head and drain as they run out. */
  private drawEnergyBar(): void {
    const g = this.energyBar; g.clear();
    const u = this.heroScale; // one "pixel" of the owner
    const now = this.ctrl.now(), s = this.ctrl.state;
    const e = this.ctrl.rainbowEnergy;
    const icons: { key: string; x: number; y: number; scale: number }[] = [];
    if (e > 0) {
      const w = 3 * u, h = 14 * u, x = 4, bottom = this.heroY + 12 * u; // the owner's feet
      icons.push({ key: 'icon_rainbow', x: x + w / 2, y: bottom - h - 2 * u, scale: u * 0.45 });
      g.fillStyle(0x5a4038, 1).fillRect(x, bottom - h, w, h);              // outline
      g.fillStyle(0xfff7f0, 1).fillRect(x + u, bottom - h + u, w - 2 * u, h - 2 * u); // empty inside
      const bands = [0xff5f6d, 0xffb347, 0xfff36b, 0x7ee787, 0x6fb3ff, 0xc38cff];
      const inner = h - 2 * u, filled = Math.round((inner * e) / u) * u;  // snapped to pixels
      for (let i = 0; i < filled / u; i++) {
        const row = bottom - u - (i + 1) * u;
        g.fillStyle(bands[Math.floor((i / (inner / u)) * bands.length) % bands.length], 1).fillRect(x + u, row, w - 2 * u, u);
      }
    }
    const timed: { left: number; total: number; colour: number; icon: string }[] = [
      { left: s.blessedUntil - now, total: ABILITY.deity.durationMs, colour: 0xffd84d, icon: 'emote_sparkle' },
      { left: s.warpUntil - now, total: ABILITY.timecat.durationMs, colour: 0x6fb3ff, icon: 'emote_hourglass' },
      { left: s.boostUntil - now, total: RUSH.durationMs, colour: 0x7ee787, icon: 'emote_leaf' },
    ].filter((b) => b.left > 0);
    const bw = 16 * u, bh = 3 * u, x0 = this.cam.x + 4 + 4 * u; // room for the icon on the left
    let y = this.heroY - 10 * u; // just above the owner's ears, stacking upward
    for (const b of timed) {
      const top = y - bh;
      g.fillStyle(0x5a4038, 1).fillRect(x0, top, bw, bh);
      g.fillStyle(0xfff7f0, 1).fillRect(x0 + u, top + u, bw - 2 * u, bh - 2 * u);
      const inner = bw - 2 * u, filled = Math.round((inner * Math.min(1, b.left / b.total)) / u) * u;
      if (filled > 0) g.fillStyle(b.colour, 1).fillRect(x0 + u, top + u, filled, bh - 2 * u);
      icons.push({ key: b.icon, x: x0 - 2 * u, y: top + bh / 2, scale: u * 0.4 });
      y = top - u;
    }
    while (this.barIcons.length < icons.length) this.barIcons.push(this.add.image(0, 0, 'emote_sparkle').setDepth(9402));
    this.barIcons.forEach((im, i) => { const ic = icons[i]; im.setVisible(!!ic); if (ic) im.setTexture(ic.key).setPosition(ic.x, ic.y).setScale(ic.scale); });
  }

  /** Who is slacking right now: napping, cuddling, fighting or staring out of the window. Production follows. */
  private reportSlack(): void {
    const counts = { nap: 0, love: 0, fight: 0, window: 0, play: 0, eat: 0 };
    for (const r of this.roamers) {
      if (r.mode === 'nap') counts.nap++;
      else if (r.mode === 'rest' && (r.spot === 'window' || r.spot === 'fishbowl')) counts.window++;
      else if (r.mode === 'play') counts.play++;
      else if (r.mode === 'eat') counts.eat++;
    }
    if (this.social?.started) { if (this.social.kind === 'cuddle') counts.love = 2; else counts.fight = 2; }
    this.ctrl.setSlack(counts);
  }

  /** Go and play with a toy (scratching post, hanging ball) if one is free. */
  private sendToPlay(r: Roamer): boolean {
    const s = this.roamerScale();
    const toys = this.lounge.filter((it) => it.use === 'play' && !this.spotTaken(it.key, r));
    if (!toys.length) return false;
    const it = Phaser.Utils.Array.GetRandom(toys);
    const side = it.key === 'scratcher' ? (it.img.x < this.scale.width * 0.5 ? 1 : -1) : 0;
    const tx = it.key === 'hangball' && it.ball ? it.ball.x : it.img.x + side * 10 * s;
    this.setLoungeTarget(r, { x: tx, y: it.img.y + 2 }, 'play');
    r.spot = it.key;
    return true;
  }
  private startPlay(r: Roamer): void {
    const it = this.lounge.find((x) => x.key === r.spot);
    if (!it) { r.mode = 'idle'; r.timer = 0.5; r.spot = null; return; }
    r.timer = Phaser.Math.FloatBetween(6, 10); r.napAcc = 0.3;
    const sp = r.sprite, s = this.roamerScale();
    if (it.key === 'scratcher') {
      // Neko Atsume pose: up on the hind legs, body stretched tall, leaning into the post with both paws
      const d = it.img.x < sp.x ? -1 : 1;
      sp.setFlipX(d > 0); // face the post (sprites face left by default)
      this.tweens.add({ targets: sp, scaleY: s * 1.35, scaleX: s * 0.9, angle: d * 16, x: sp.x + d * 2 * s, duration: 260, ease: 'Quad.out' });
    } else if (it.key === 'hangball') {
      sp.setFlipX(false);
      this.lieDown(sp, 180, 320, 'Quad.out'); // flops onto its back, paws up, right under the ball
    } else sp.setFlipX(it.img.x > sp.x); // face the toy
    this.writeDiary('play', [r.gen], undefined, it.key);
  }
  /** Sneak off to the right-hand belt, where fresh macarons roll past at cat height. */
  private sendToEat(r: Roamer): void {
    const s = this.roamerScale(), catH = 16 * s, hb = this.beltH / 2;
    const cx = this.path[2].x; // the down run
    const y0 = this.backY + hb + catH * 2.3, y1 = this.stations[3].y - catH * 0.3; // a row below the corner, above the packaging machine: still macarons, not gifts
    if (y1 <= y0) return;
    this.setTarget(r, { x: cx - hb - 9 * s, y: Phaser.Math.FloatBetween(y0, y1) }, 'eat');
    r.spot = 'belt';
  }
  private startEat(r: Roamer): void {
    r.timer = Phaser.Math.FloatBetween(8, 14); r.napAcc = 0.6;
    r.sprite.setFlipX(true); // face the belt on its right
    this.writeDiary('eat', [r.gen]);
  }
  /** One bite: the nearest macaron on the belt vanishes, the cat chomps, crumbs drop to the floor and stay a while. */
  private eatOnce(r: Roamer, bite = 0): void {
    const sp = r.sprite, s = this.roamerScale();
    if (bite === 0) { // the first bite of the burst takes a macaron off the belt (if one is passing); the next two chew it
      const near = this.beltMacarons.filter((m) => m.seg === 2 && !m.wrapped && !m.flying && Math.abs(m.sprite.y - (sp.y - 6 * s)) < 12 * s);
      const m = near[0];
      r.eating = m ? PALETTE[m.color]?.fill ?? '#F9CBD6' : null;
      if (m) { this.beltMacarons.splice(this.beltMacarons.indexOf(m), 1); this.tweens.add({ targets: m.sprite, x: sp.x + 8 * s, y: sp.y - 8 * s, scale: 0, duration: 140, ease: 'Quad.in', onComplete: () => m.sprite.destroy() }); }
    }
    this.tweens.add({ targets: sp, scaleY: s * 0.88, scaleX: s * 1.08, duration: 45, yoyo: true, ease: 'Quad.out' });
    sp.setTexture(`cat_${r.gen}_${bite % 2 === 0 ? 'chew' : 'open'}`); // the mouth works: shut, open, shut
    this.time.delayedCall(60, () => { if (r.mode === 'eat' && sp.active) sp.setTexture(`cat_${r.gen}_${bite % 2 === 0 ? 'open' : 'chew'}`); });
    const colour = r.eating;
    if (!colour) return;
    sfx.crunch(1 + bite * 0.12);
    const base = Phaser.Display.Color.HexStringToColor(colour).color;
    for (let k = 0; k < 3; k++) { // crumbs: fall from the mouth and lie on the floor by the cat's paws before fading
      const c = this.add.rectangle(sp.x + (5 + Math.random() * 4) * s, sp.y - 7 * s, s, s, k % 2 ? base : 0xf2e2c6).setDepth(sp.depth - 0.5);
      this.tweens.add({ targets: c, x: c.x + (Math.random() - 0.3) * 10 * s, y: sp.y + Math.random() * 3 * s, duration: 220 + Math.random() * 120, ease: 'Quad.in', onComplete: () => {
        c.setDepth(2); // on the floor, under everything that walks past
        this.tweens.add({ targets: c, alpha: 0, delay: 18_000 + Math.random() * 8000, duration: 2000, onComplete: () => c.destroy() });
      } });
    }
  }

  /** One scratch (post) or one swat (hanging ball). */
  private playOnce(r: Roamer): void {
    const it = this.lounge.find((x) => x.key === r.spot);
    const sp = r.sprite, s = this.roamerScale();
    if (!it || !sp.active) return;
    if (it.key === 'scratcher') {
      // a rake down the rope: the stretched cat drags a little, claw marks appear where the paws are
      const d = it.img.x < sp.x ? -1 : 1;
      this.tweens.add({ targets: sp, y: sp.y + 3 * s, scaleY: sp.scaleY * 0.94, duration: 90, yoyo: true, ease: 'Quad.out' });
      const mark = this.add.image(it.img.x + d * 1 * this.propScale, it.img.y - (16 + Math.random() * 6) * this.propScale, 'emote_scratch').setScale(this.propScale * 0.6).setFlipX(d < 0).setDepth(it.img.depth + 1).setAlpha(0.9);
      this.tweens.add({ targets: mark, alpha: 0, duration: 700, delay: 200, onComplete: () => mark.destroy() });
      sfx.boing(2.6);
    } else if (it.key === 'hangball' && it.ball) {
      // lying on its back, a paw bats the ball: the ball swings away and back
      this.tweens.add({ targets: sp, angle: 180 + (Math.random() < 0.5 ? -8 : 8), duration: 100, yoyo: true, ease: 'Quad.out' });
      const d = Math.random() < 0.5 ? -1 : 1;
      this.tweens.killTweensOf(it.ball);
      this.tweens.add({ targets: it.ball, angle: d * 32, duration: 220, ease: 'Quad.out', onComplete: () => this.tweens.add({ targets: it.ball, angle: 0, duration: 900, ease: 'Elastic.out', easeParams: [1.1, 0.5] }) });
      const spark = this.add.image(it.ball.x + d * 4 * this.propScale, it.ball.y + 10 * this.propScale, 'star').setScale(this.propScale * 0.5).setDepth(it.img.depth + 2);
      this.tweens.add({ targets: spark, y: spark.y - 12, alpha: 0, duration: 350, onComplete: () => spark.destroy() });
      sfx.boing(3.0);
    }
  }

  /** The two little seats behind the display counter (left and right of the middle). */
  private counterSeat(i: number): Pt { return { x: this.display.x + this.display.w * (i === 0 ? 0.3 : 0.7), y: this.display.y - 4 }; }

  /** Behind the display counter, where a cat stands to wrap boxes. */
  private wrapSpot(): Pt { return { x: this.display.x + this.display.w * (0.45 + Math.random() * 0.4), y: this.display.y - 5 }; }
  private atWrapSpot(r: Roamer): boolean { return Math.abs(r.sprite.y - (this.display.y - 5)) < 3 && r.sprite.x > this.display.x + this.display.w * 0.3 && r.sprite.x < this.display.x + this.display.w * 1.05; }

  /** A cat ties a box: a little gift pops up over its paws and hops onto the counter. */
  private wrapOnce(r: Roamer, slot?: number): void {
    const tier = equipmentTier(this.ctrl.state, 'box');
    if (tier < 1 || !r.sprite.active) return;
    const s = this.roamerScale();
    const key = `gift_t${tier}_${Phaser.Utils.Array.GetRandom(this.macaronKeys).slice(4)}`;
    const g = this.add.image(r.sprite.x, r.sprite.y - 12 * s, key).setScale(0.1).setDepth(r.sprite.depth + 1);
    const slots = this.shelfSlots();
    const to = slot !== undefined ? slots[slot] : Phaser.Utils.Array.GetRandom(slots);
    const keep = slot !== undefined; // re-wrapping: the new box stays on the counter until the stock is redrawn
    this.tweens.add({ targets: g, scale: Math.max(2, Math.round(this.propScale * 0.7)), y: g.y - 6 * s, duration: 260, ease: 'Back.out', onComplete: () => {
      this.tweens.add({ targets: g, x: to.x, y: to.y - 2, duration: 320, ease: 'Quad.in', onComplete: () => { g.setDepth(this.shelfLayer.depth + 1); this.tweens.add({ targets: g, alpha: 0, duration: 250, delay: keep ? 3200 : 400, onComplete: () => g.destroy() }); } });
    } });
    r.sprite.setTexture(`cat_${r.gen}_happy`);
    this.time.delayedCall(700, () => { if (r.sprite.active && r.mode === 'work') r.sprite.setTexture(`cat_${r.gen}_open`); });
  }

  /** New packaging bought: a cat walks to the display counter and re-wraps the stock, box by box. */
  private rewrapDisplay(): void {
    const r = this.freeRoamers()[0];
    const finish = () => { this.rewrapping = false; this.shelfTier = equipmentTier(this.ctrl.state, 'box'); this.lastShelfCount = -1; this.refreshShelf(); };
    if (!r) { finish(); return; }
    this.rewrapping = true;
    this.setTarget(r, this.wrapSpot(), 'work');
    r.timer = 12;
    r.onArrive = () => {
      r.sprite.setFlipX(false);
      const slots = this.shelfSlots();
      slots.forEach((_, i) => this.time.delayedCall(300 + i * 650, () => { if (r.sprite.active && r.mode === 'work') { this.wrapOnce(r, i); sfx.buy(); } }));
      this.time.delayedCall(300 + slots.length * 650 + 400, finish);
    };
    this.time.delayedCall(15000, () => { if (this.rewrapping) finish(); }); // safety: never leave the display stale
  }

  /** Walk to a lounge spot (above the counter) via the gap on the left so cats never cross the counter. */
  private setLoungeTarget(r: Roamer, p: Pt, next: Mode): void {
    const top = this.counters[0];
    if (p.y > top.y + top.h) { this.setTarget(r, p, next); return; } // not actually above the counter
    const gapX = Math.max(14 * this.roamerScale(), top.x - 12 * this.roamerScale());
    const below = top.y + top.h + this.counterFront + 14 * this.roamerScale();
    if (r.sprite.y <= top.y) { this.setTarget(r, p, next); return; }
    this.setTarget(r, { x: gapX, y: Math.max(r.sprite.y, below) }, next);
    r.route = [{ x: gapX, y: p.y }, p];
  }

  /** Leave the lounge: back through the gap before heading onto the floor. */
  private leaveLounge(r: Roamer, p: Pt, next: Mode): void {
    const top = this.counters[0];
    if (r.sprite.y >= top.y) { this.setTarget(r, p, next); return; }
    const gapX = Math.max(14 * this.roamerScale(), top.x - 12 * this.roamerScale());
    const below = top.y + top.h + this.counterFront + 14 * this.roamerScale();
    this.setTarget(r, { x: gapX, y: r.sprite.y }, next);
    r.route = [{ x: gapX, y: below }, p];
  }

  private setTarget(r: Roamer, p: Pt, next: Mode): void {
    r.route = [];
    if (next !== 'nap' && next !== 'rest' && next !== 'climb' && next !== 'play') r.spot = null;
    r.tx = p.x; r.ty = p.y; r.mode = 'walk'; r.next = next;
    r.timer = next === 'work' ? Phaser.Math.FloatBetween(3, 7) : Phaser.Math.FloatBetween(1, 4);
    r.sprite.setFlipX(p.x > r.sprite.x); // sprites face left by default: flip when heading right
  }

  private rebuildRoamers(): void {
    this.pendingRoamerRebuild = false;
    const want: { gen: string; slot: number }[] = [];
    const counts = CATS.map((c) => this.ctrl.state.gens[c.id] ?? 0);
    const maxShown = this.narrow() ? 10 : 18;
    for (let round = 0; want.length < maxShown; round++) {
      let added = false;
      CATS.forEach((c, i) => { if (counts[i] > round && want.length < maxShown) { want.push({ gen: c.id, slot: round }); added = true; } });
      if (!added) break;
    }
    this.roamers = this.roamers.filter((r) => {
      const keep = want.some((x) => x.gen === r.gen && x.slot === r.slot);
      if (!keep) { r.sprite.destroy(); r.heart?.destroy(); }
      return keep;
    });
    const s = this.roamerScale();
    for (const wc of want) {
      if (this.roamers.some((r) => r.gen === wc.gen && r.slot === wc.slot)) continue;
      const p = this.randomFloorPoint();
      const sprite = this.add.image(p.x, p.y, `cat_${wc.gen}_open`).setOrigin(0.5, 1).setScale(s).setAlpha(0).setDepth(p.y)
        .setInteractive({ useHandCursor: true });
      const r: Roamer = { sprite, gen: wc.gen, slot: wc.slot, phase: Math.random() * Math.PI * 2, mode: 'idle', next: 'idle', tx: p.x, ty: p.y, timer: Phaser.Math.FloatBetween(0.2, 2), speed: (18 + Math.random() * 14) * s / 2, petReadyAt: 0, heart: null, flat: false, napAcc: 0, route: [], spot: null, alertUntil: 0 };
      sprite.setData('roamer', r);
      // the topmost cat gets the tap; when cats overlap under the finger a slacking one wins over whoever is walking across it
      // (per-sprite, not the scene-level pointerdown: that one is skipped whenever a HUD element sits over the canvas)
      sprite.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        const under = (this.input.hitTestPointer(ptr) as Phaser.GameObjects.GameObject[]).map((o) => o.getData('roamer') as Roamer | undefined).filter((x): x is Roamer => !!x);
        this.petCat(under.find((x) => this.isSlacking(x)) ?? r);
      });
      this.roamers.push(r);
      this.tweens.add({ targets: sprite, alpha: 1, duration: 300 });
    }
    if (this.dozeAll) { this.dozeAll = false; this.dozeEveryone(); }
  }

  /** After a long absence every floor cat is found asleep where it stands (full slack until tapped); they wake on their own over a few minutes. */
  private dozeEveryone(): void {
    for (const r of this.roamers) if (r.mode === 'idle' || r.mode === 'walk') this.dozeOne(r, Phaser.Math.FloatBetween(90, 240));
  }
  /** Fall asleep right here, right now (no walking to a spot); wakes on its own after `seconds` unless tapped. */
  private dozeOne(r: Roamer, seconds: number): void {
    const sp = r.sprite;
    r.mode = 'nap'; r.next = 'idle'; r.spot = null; r.timer = seconds; r.napAcc = Math.random();
    this.tweens.killTweensOf(sp);
    this.lieDown(sp, sp.flipX ? -90 : 90, 360);
    sp.setTexture(`cat_${r.gen}_sleep`);
  }

  /** Petting: each cat type has its own reaction (see journal). Cosmetic only. */
  private isSlacking(r: Roamer): boolean { return r.mode === 'nap' || r.mode === 'rest' || r.mode === 'play' || r.mode === 'eat' || (r.mode === 'social' && !!this.social?.started); }

  private petCat(r: Roamer): void {
    if (r.mode === 'react' || r.mode === 'lie' || r.mode === 'climb') return;
    // a moment worth posting: tap a cat mid-interaction while an Influencer is on staff
    const moment: DiaryKind | null = r.mode === 'social' && this.social ? this.social.kind : (this.chat && this.chat.cat === r && this.chat.started) ? 'chat' : r.mode === 'nap' ? 'nap' : r.mode === 'rest' ? 'rest' : r.mode === 'play' ? 'play' : r.mode === 'eat' ? 'eat' : null;
    const slacking = this.isSlacking(r);
    if (moment && hasInfluencer(this.ctrl.state) && Math.random() < 0.5) {
      const cats = moment === 'chat' && this.chat ? [r.gen, this.chat.customer.species] : moment === 'cuddle' || moment === 'fight' ? [this.social!.a.gen, this.social!.b.gen] : [r.gen];
      const spot = (moment === 'nap' || moment === 'rest' || moment === 'play') && r.spot ? (r.spot.startsWith('counter') ? 'counter' : r.spot) : null;
      const pool = spot ? (lang() === 'zh' ? SPOT_TEXT_ZH : SPOT_TEXT)[spot] : null;
      const text = pick(pool ?? (lang() === 'zh' ? DIARY_ZH : DIARY_TEXT)[moment]).replace(/\{a\}/g, this.catName(cats[0])).replace(/\{b\}/g, this.catName(cats[1] ?? cats[0]));
      this.ctrl.snapshot(moment, cats, text, spot ? (spot as DiaryBg) : this.pickBg(moment));
      this.banner(tr('bannerSnap'), '#7A5AA8');
      this.cameras.main.flash(120, 255, 255, 255);
      if (!slacking) return; // a chat with a customer goes on; a slacker is still snapped out of it below
    }

    if (r.mode === 'nap') { r.sprite.setAngle(0).clearTint(); if (r.sprite.originY !== 1) { r.sprite.y += r.sprite.displayHeight * 0.33; r.sprite.setOrigin(0.5, 1); } r.sprite.setTexture(`cat_${r.gen}_open`); r.mode = 'idle'; r.spot = null; }
    if (r.mode === 'social' && this.social) { const o = this.social.a === r ? this.social.b : this.social.a; if (o.mode === 'social') { o.mode = 'idle'; o.timer = 1; } this.social = null; }
    if (r.sprite.texture.key.endsWith('_back')) r.sprite.setTexture(`cat_${r.gen}_open`);
    if (r.mode === 'eat') { r.mode = 'idle'; r.spot = null; r.timer = 0.5; this.tweens.killTweensOf(r.sprite); r.sprite.setScale(this.roamerScale()).setTexture(`cat_${r.gen}_open`); }
    if (r.mode === 'rest' || r.mode === 'play') { r.mode = 'idle'; r.spot = null; this.tweens.killTweensOf(r.sprite); if (r.sprite.originY !== 1) this.getUp(r.sprite, 200); else r.sprite.setAngle(0).setScale(this.roamerScale()); }
    if (slacking) { // the first tap only ends the slacking: a startled hop and a "?"; the next tap is the pat
      const sp0 = r.sprite, s0 = this.roamerScale();
      r.timer = Phaser.Math.FloatBetween(1.5, 3); r.alertUntil = this.time.now + 60_000; // snapped out of it: stays on task for a minute
      this.tweens.add({ targets: sp0, y: sp0.y - 6 * s0, duration: 110, yoyo: true, ease: 'Quad.out' });
      sp0.setTexture(`cat_${r.gen}_sad`); // 😞 for a moment, then back to normal when its timer runs out
      this.time.delayedCall(1400, () => { if (sp0.active && sp0.texture.key.endsWith('_sad')) sp0.setTexture(`cat_${r.gen}_open`); });
      const q = this.add.image(sp0.x + 7 * s0, sp0.y - 18 * s0, Math.random() < 0.5 ? 'emote_question' : 'emote_exclaim').setScale(s0 * 0.9).setDepth(8000);
      this.tweens.add({ targets: q, y: q.y - 16, alpha: 0, duration: 700, delay: 200, onComplete: () => q.destroy() });
      sfx.boing(1.4);
      this.ctrl.wake(r.gen, moment ?? r.mode);
      return;
    }
    const reaction: PetReaction = JOURNAL_BY_ID[r.gen]?.pet ?? 'happy';
    const sp = r.sprite;
    const s = this.roamerScale();
    this.tweens.killTweensOf(sp);
    sp.setScale(s);
    const emote = (key: string, n: number, spread: number) => {
      for (let i = 0; i < n; i++) {
        const e = this.add.image(sp.x + (Math.random() - 0.5) * spread, sp.y - 16 * s, `emote_${key}`).setScale(s).setDepth(8000).setAlpha(0.95);
        this.tweens.add({ targets: e, y: e.y - 40 - Math.random() * 30, alpha: 0, duration: 900 + Math.random() * 300, delay: i * 120, ease: 'Quad.out', onComplete: () => e.destroy() });
      }
    };
    const fired = this.triggerAbility(r);
    // small bonus, once per cat per cooldown
    if (!fired && this.time.now >= r.petReadyAt) {
      r.petReadyAt = this.time.now + PET.cooldownMs;
      const value = this.ctrl.petBonus(r.gen, r.slot, reaction);
      const t = this.add.text(sp.x, sp.y - 18 * s, '+' + fmt(value), { fontFamily: FONT, fontSize: '20px', fontStyle: '900', color: '#5A4038', stroke: '#FFFFFF', strokeThickness: 4 }).setOrigin(0.5).setDepth(8001);
      this.tweens.add({ targets: t, y: t.y - 70, alpha: 0, duration: 900, ease: 'Quad.out', onComplete: () => t.destroy() });
    } else {
      this.ctrl.analytics.track('pet', { gen: r.gen, reaction, value: 0 });
    }
    // every reaction is a happy one: > < face, a meow, hearts — they just show it differently
    sp.setTexture(`cat_${r.gen}_happy`);
    const faceBack = (ms: number) => this.time.delayedCall(ms, () => { if (sp.active && sp.texture.key.endsWith('_happy')) sp.setTexture(`cat_${r.gen}_open`); });
    if (reaction === 'happy' || reaction === 'sparkle') {
      sfx.achievement();
      // hops in place
      r.mode = 'react'; r.timer = 1.2;
      emote(reaction === 'sparkle' ? 'sparkle' : 'heart', 3, 30);
      faceBack(1200);
      this.tweens.add({ targets: sp, y: sp.y - 14 * (s / 3), duration: 140, yoyo: true, repeat: 2, ease: 'Quad.out', onComplete: () => { if (r.mode === 'react') r.mode = 'idle'; } });
    } else if (reaction === 'flat') {
      // squashes to ~70% and boings back up three times, in place
      r.mode = 'react'; r.timer = 1.3;
      emote('heart', 2, 14);
      faceBack(1300);
      const bounce = (n: number) => {
        if (!sp.active || n === 0) { if (sp.active) sp.setScale(s, s); return; }
        sfx.boing(1.3 + (3 - n) * 0.15);
        this.tweens.add({ targets: sp, scaleY: s * 0.72, scaleX: s * 1.14, duration: 110, ease: 'Quad.out', yoyo: true, onComplete: () => bounce(n - 1) });
      };
      bounce(3);
    } else if (reaction === 'purr') {
      // squeezes eyes shut and wiggles
      r.mode = 'react'; r.timer = 1.4;
      sfx.upgrade();
      emote('heart', 2, 16);
      faceBack(1400);
      this.tweens.add({ targets: sp, angle: 6, duration: 90, yoyo: true, repeat: 7, onComplete: () => { sp.setAngle(0); if (r.mode === 'react') r.mode = 'idle'; } });
    } else {
      // flops over, dozes off (zzz), wiggles, gets up
      r.mode = 'lie'; r.timer = 2.0;
      sfx.buy();
      emote('zzz', 2, 12);
      emote('heart', 1, 0);
      faceBack(1700);
      this.lieDown(sp, sp.flipX ? -90 : 90, 360, 'Sine.in'); // keels over
    }
  }

  private updateRoamers(dt: number, time: number): void {
    const s = this.roamerScale();
    for (const r of this.roamers) {
      const sp = r.sprite;
      if (r.mode === 'walk') {
        const dx = r.tx - sp.x, dy = r.ty - sp.y;
        const d = Math.hypot(dx, dy);
        const step = r.speed * dt * (warpMultiplier(this.ctrl.state, this.ctrl.now()) > 1 ? 2 : 1);
        if (d <= step) {
          sp.setPosition(r.tx, r.ty);
          if (r.route.length) { const n = r.route.shift()!; r.tx = n.x; r.ty = n.y; sp.setFlipX(n.x > sp.x); continue; }
          r.mode = r.next;
          if (r.onArrive) { const f = r.onArrive; r.onArrive = undefined; f(); }
          if (r.next === 'nap') { r.timer = Phaser.Math.FloatBetween(16, 30); r.napAcc = 1; this.onEnterFurniture(r); const inHouse = !!r.spot && this.lounge.some((it) => it.inside && it.key === r.spot); if (r.spot === 'basket' || inHouse) sp.setFlipX(true); else this.lieDown(sp, sp.flipX ? -90 : 90, 360); /* basket & house: curled upright, facing right */ sp.setTexture(`cat_${r.gen}_sleep`); if (r.spot === 'oven') sp.setTint(0xffd9bf); /* toasty: a faint warm glow on a cat asleep by the oven */ this.writeDiary('nap', [r.gen], undefined, r.spot ?? 'oven'); }
          if (r.next === 'rest') { r.timer = Phaser.Math.FloatBetween(12, 20); r.napAcc = 1.5; sp.setFlipX(false); if (r.spot === 'window' || r.spot === 'fishbowl') sp.setTexture(`cat_${r.gen}_back`); this.writeDiary('rest', [r.gen], undefined, r.spot?.startsWith('counter') ? 'counter' : r.spot ?? 'counter'); }
          if (r.next === 'climb') this.climbTree(r, true);
          if (r.next === 'play') this.startPlay(r);
          if (r.next === 'eat') this.startEat(r);
          if (r.flat) { r.flat = false; sfx.boing(1.7); this.tweens.add({ targets: sp, scaleX: s, scaleY: s, duration: 420, ease: 'Elastic.out', easeParams: [1.2, 0.4] }); }
        } else {
          sp.setPosition(sp.x + (dx / d) * step, sp.y + (dy / d) * step);
          if (warpMultiplier(this.ctrl.state, this.ctrl.now()) > 1 && Math.floor(time / 160) !== Math.floor((time - dt * 1000) / 160)) { // ))) behind a hurrying cat
            const back = sp.flipX ? -1 : 1; // behind the cat: left when it faces right
            const e = this.add.image(sp.x + back * 12 * s, sp.y - 7 * s, 'emote_speed').setScale(s * 0.7).setFlipX(sp.flipX).setAlpha(0.8).setDepth(sp.depth - 1); // head, tail, ))) — the arcs bulge away from the cat
            this.tweens.add({ targets: e, x: e.x + back * 8, alpha: 0, duration: 260, onComplete: () => e.destroy() });
          }
          if (r.next === 'social') { r.napAcc += dt; if (r.napAcc > 0.7) { r.napAcc = 0; const e = this.add.image(sp.x + 6 * s, sp.y - 18 * s, 'emote_note').setScale(s * 0.8).setDepth(8000); this.tweens.add({ targets: e, y: e.y - 22, alpha: 0, duration: 700, onComplete: () => e.destroy() }); } }
          if (r.flat) { const j = Math.sin(time / 55 + r.phase); sp.setScale(s * (1.18 - j * 0.1), s * (0.68 + j * 0.1)); } // jelly wobble: width and height out of phase
          else sp.setScale(s, s * (1 + Math.abs(Math.sin(time / 90 + r.phase)) * 0.06));
        }
      } else if (r.mode === 'lie') {
        r.timer -= dt;
        if (r.timer <= 0) { r.mode = 'idle'; r.timer = 0.5; this.getUp(sp, 240); }
      } else if (r.mode === 'react') {
        r.timer -= dt;
        if (r.timer <= 0 && !r.flat) r.mode = 'idle';
      } else if (r.mode === 'social') {
        sp.setScale(s, s * (1 + Math.sin(time / 200 + r.phase) * 0.04));
      } else if (r.mode === 'nap') {
        r.timer -= dt; r.napAcc += dt;
        if (r.spot === 'oven' && Math.random() < dt * 1.5) { // toasty by the oven: little wisps of warm air rise off the sleeper
          const w = this.add.image(sp.x + (Math.random() - 0.5) * 14 * s, sp.y - 2 * s, 'steam').setScale(s * 0.6).setAlpha(0.6).setDepth(sp.depth + 1);
          this.tweens.add({ targets: w, y: w.y - 16 * s, x: w.x + (Math.random() - 0.5) * 6 * s, alpha: 0, scale: s * 0.5, duration: 1300, ease: 'Quad.out', onComplete: () => w.destroy() });
        }
        if (r.napAcc > 1.6) { r.napAcc = 0; const e = this.add.image(sp.x + 6 * s, sp.y - 10 * s, 'emote_zzz').setScale(s * 0.8).setDepth(8000); this.tweens.add({ targets: e, y: e.y - 24, alpha: 0, duration: 1200, onComplete: () => e.destroy() }); }
        if (r.timer <= 0) { r.mode = 'idle'; r.timer = 1; r.spot = null; sp.clearTint(); sp.setTexture(`cat_${r.gen}_open`); this.getUp(sp); }
      } else if (r.mode === 'play') {
        r.timer -= dt; r.napAcc += dt;
        if (r.napAcc > (r.spot === 'hangball' ? 0.7 : 0.45)) { r.napAcc = 0; this.playOnce(r); }
        if (r.timer <= 0) { r.mode = 'idle'; r.timer = 0.5; r.spot = null; this.tweens.killTweensOf(sp); if (r.spot === null && sp.originY !== 1) this.getUp(sp, 240); else this.tweens.add({ targets: sp, scaleX: s, scaleY: s, angle: 0, duration: 200, ease: 'Quad.out' }); }
      } else if (r.mode === 'eat') {
        r.timer -= dt; r.napAcc += dt;
        if (r.napAcc > 1.0) { r.napAcc = 0; for (let k = 0; k < 2; k++) this.time.delayedCall(k * 200, () => { if (r.mode === 'eat' && r.sprite.active) this.eatOnce(r, k); }); } // 喀、喀, then a 0.6 s pause
        if (r.timer <= 0) { r.mode = 'idle'; r.timer = 0.5; r.spot = null; sp.setTexture(`cat_${r.gen}_open`); }
      } else if (r.mode === 'climb') {
        // driven by tweens (see climbTree)
      } else if (r.mode === 'rest') {
        r.timer -= dt;
        sp.setScale(s, s * (1 + Math.sin(time / 500 + r.phase) * 0.025));
        if (r.spot === 'window' || r.spot === 'fishbowl') { r.napAcc += dt; if (r.napAcc > 2.4) { r.napAcc = 0; const e = this.add.image(sp.x + 7 * s, sp.y - 18 * s, 'emote_dream').setScale(s * 0.8).setDepth(8000); this.tweens.add({ targets: e, y: e.y - 18, alpha: 0, duration: 1400, onComplete: () => e.destroy() }); } }
        if (r.spot === 'cattree') { // happy on top of the tree: a note now and then, with a little head-bob
          r.napAcc += dt;
          if (r.napAcc > 1.6) { r.napAcc = 0; const e = this.add.image(sp.x + (Math.random() < 0.5 ? -7 : 7) * s, sp.y - 17 * s, 'emote_note').setScale(s * 0.8).setDepth(sp.depth + 1); this.tweens.add({ targets: e, y: e.y - 20, x: e.x + (Math.random() - 0.5) * 10, alpha: 0, duration: 1100, ease: 'Quad.out', onComplete: () => e.destroy() }); this.tweens.add({ targets: sp, y: sp.y - 2 * s, duration: 120, yoyo: true, ease: 'Quad.out' }); }
        }
        if (r.timer <= 0) { if (sp.texture.key.endsWith('_back')) sp.setTexture(`cat_${r.gen}_open`); if (r.spot === 'cattree' && this.lounge.some((it) => it.key === 'cattree')) this.climbTree(r, false); else { r.mode = 'idle'; r.timer = 0.5; r.spot = null; } }
      } else {
        r.timer -= dt;
        sp.setScale(s, s * (1 + Math.sin(time / (r.mode === 'work' ? 160 : 400) + r.phase) * 0.03));
        if (r.mode === 'work' && this.atWrapSpot(r)) { r.napAcc += dt; if (r.napAcc > 2.2) { r.napAcc = 0; this.wrapOnce(r); } }
        if (r.timer <= 0) {
          const roll = Math.random();
          const inLoungeNow = r.sprite.y < this.counters[0].y || time < r.alertUntil; // a freshly woken cat does not slack off again straight away
          if (roll < 0.28) this.leaveLounge(r, this.stationSpot(), 'work');
          else if (roll < 0.40 && !inLoungeNow) this.sendToNap(r);
          else if (roll < 0.50 && !inLoungeNow) this.sendToRest(r);
          else if (roll < 0.58 && !inLoungeNow && !this.sendToPlay(r)) this.leaveLounge(r, this.randomFloorPoint(), 'idle');
          else if (roll < 0.66 && !inLoungeNow && this.beltMacarons.some((m) => m.seg === 2 && !m.wrapped && !m.flying)) this.sendToEat(r); // something tasty is going past on the right-hand belt
          else if (roll >= 0.58) this.leaveLounge(r, this.randomFloorPoint(), 'idle');
        }
      }
      const spotItem = (r.mode === 'nap' || r.mode === 'rest' || r.mode === 'climb' || r.mode === 'play') && r.spot ? this.lounge.find((it) => it.key === r.spot) : undefined;
      const feetY = sp.originY === 1 ? sp.y : sp.y + sp.displayHeight * 0.33;
      sp.setDepth(r.mode === 'eat' ? this.belts[1].depth + 2.5 : spotItem ? (spotItem.inside ? spotItem.img.depth - 1 : spotItem.img.depth + 1) : feetY); // a cat eating off the belt stands in front of it
      // loved cats carry a little heart while their boost lasts
      const loved = isLovedCat(this.ctrl.state, r.gen, r.slot, this.ctrl.now());
      if (loved && !r.heart) r.heart = this.add.image(sp.x, sp.y, 'emote_heart').setScale(s * 0.9).setDepth(sp.y + 1);
      if (!loved && r.heart) { r.heart.destroy(); r.heart = null; }
      if (r.heart) r.heart.setPosition(sp.x + 7 * s, sp.y - 17 * s + Math.sin(time / 250 + r.phase) * 2).setDepth(sp.y + 1).setAlpha(0.9);
      if (r.mode !== 'react' && r.mode !== 'nap' && r.mode !== 'rest' && Math.random() < 0.0015) { sp.setTexture(`cat_${r.gen}_blink`); this.time.delayedCall(120, () => { if (sp.active && r.mode !== 'react') sp.setTexture(`cat_${r.gen}_open`); }); }
    }
  }

  // ---- machine animations ---------------------------------------------------------------------

  /** A batch reached station i (0 mixer, 1 piping, 2 oven, 3 packing): play that machine's little action. */
  private animateStation(i: number): void {
    const p = this.props[i];
    if (!p || this.tweens.isTweening(p)) return;
    const sx = p.scaleX, sy = p.scaleY;
    if (i === 0) { // mixer: the whisk spins up for a moment; the sifter sheds a little flour
      this.whiskBoostUntil = this.time.now + 1200;
      if (equipmentTier(this.ctrl.state, 'mixer') === 1) for (let k = 0; k < 5; k++) { const n = this.add.rectangle(p.x + (Math.random() - 0.5) * 10 * p.scaleX, p.y - 18 * p.scaleY, p.scaleX, p.scaleY, 0xf2e2c6).setDepth(p.depth + 1); this.tweens.add({ targets: n, y: n.y + 7 * p.scaleY, alpha: 0, duration: 500 + Math.random() * 300, delay: k * 90, ease: 'Quad.in', onComplete: () => n.destroy() }); }
    } else if (i === 1) { // tray station: the tray dips as a ball lands on it
      this.tweens.add({ targets: p, scaleY: sy * 0.94, scaleX: sx * 1.03, duration: 110, yoyo: true, ease: 'Quad.out', onComplete: () => p.setScale(sx, sy) });
    } else if (i === 2) { // oven: a bright flare as the batch goes in, plus a bigger puff of smoke
      this.glow.setAlpha(1);
      this.smoke(1.3);
    } else { // gift machine: a squeeze as a tray goes through
      this.tweens.add({ targets: p, scaleY: sy * 0.9, scaleX: sx * 1.04, duration: 80, yoyo: true, onComplete: () => p.setScale(sx, sy) });
    }
  }

  private smoke(size: number): void {
    const oven = this.props[2];
    const puff = this.add.image(oven.x + (Math.random() - 0.5) * oven.displayWidth * 0.4, this.machineTop(2) + 2, 'steam')
      .setScale(this.propScale * 0.8 * size).setAlpha(0.7).setDepth(oven.depth + 2); // steam off the hot oven
    this.tweens.add({ targets: puff, y: puff.y - 30 * size, x: puff.x + (Math.random() - 0.5) * 12, alpha: 0, scale: this.propScale * 0.7 * size, duration: 1100, ease: 'Quad.out', onComplete: () => puff.destroy() });
  }

  // ---- belt ---------------------------------------------------------------------------------

  private spawnBeltMacaron(fromHero = false): void {
    if (this.beltMacarons.length >= MAX_BELT_MACARONS) return;
    const color = Phaser.Utils.Array.GetRandom(this.macaronKeys).slice(4);
    const scale = this.propScale;
    const start = this.path[0];
    const m = this.add.image(start.x, start.y, `ball_${color}`).setScale(scale * 0.2).setAlpha(0).setDepth(this.belts[0].depth + 1);
    const item: BeltMacaron = { sprite: m, seg: 0, t: 0, color, flying: true };
    this.beltMacarons.push(item);
    const sendOut = () => { // the mixer sends the ball onto the belt
      if (!m.active) return;
      this.animateStation(0);
      m.setAlpha(1);
      this.tweens.add({ targets: m, scale, duration: 160, ease: 'Back.out', onComplete: () => { item.flying = false; } });
    };
    // macaron energy: a ball in the macaron's colour flies into the mixer from the owner (a pat) or from a working cat
    const worker = fromHero ? null : Phaser.Utils.Array.GetRandom(this.roamers.filter((r) => r.mode !== 'lie' && r.mode !== 'climb' && r.sprite.active)) as Roamer | undefined;
    const from = fromHero ? { x: this.hero.x + this.hero.displayWidth * 0.3, y: this.hero.y - this.hero.displayHeight * 0.3 } : worker ? { x: worker.sprite.x, y: worker.sprite.y - 10 * this.roamerScale() } : null;
    if (from) {
      const ball = this.add.image(from.x, from.y, `ball_${color}`).setScale(scale * 0.8).setDepth(5000);
      const mixer = this.anchor(0);
      this.tweens.add({ targets: ball, x: mixer.x, y: mixer.y, scale, duration: fromHero ? 380 : 520, ease: 'Quad.in', onComplete: () => { ball.destroy(); sendOut(); } });
    } else sendOut();
    void this.props[1];
  }

  /** A fixed machine wobbles as something passes through / lands in it. */
  private bounce(img: Phaser.GameObjects.Image): void {
    if (this.tweens.isTweening(img)) return;
    const sx = img.scaleX, sy = img.scaleY;
    this.tweens.add({ targets: img, scaleY: sy * 0.9, scaleX: sx * 1.06, duration: 90, yoyo: true, onComplete: () => img.setScale(sx, sy) });
  }

  /** Swap a belt item's look with a little pop (macaron → tray → gift). */
  private transformItem(m: BeltMacaron, key: string): void {
    const sp = m.sprite;
    if (!sp.active || !this.textures.exists(key)) return;
    sp.setTexture(key);
    const s = this.propScale;
    this.tweens.add({ targets: sp, scaleX: s * 1.35, scaleY: s * 0.8, duration: 90, yoyo: true, ease: 'Quad.out', onComplete: () => sp.setScale(s) });
    if (key.startsWith('mac_')) { const f = this.add.image(sp.x, sp.y, 'star').setScale(s * 0.8).setAlpha(0.9).setDepth(sp.depth + 1); this.tweens.add({ targets: f, scale: s * 2, alpha: 0, duration: 260, onComplete: () => f.destroy() }); }
  }

  private updateBelt(dt: number): void {
    const cps = this.ctrl.cps();
    const flow = cps <= 0 ? 0 : 0.5; // passive energy: one ball every 2 s, from a random cat on the floor
    const scroll = cps <= 0 ? 0 : Math.min(1.8, 0.3 + Math.log10(1 + cps) * 0.5);
    const warp = warpMultiplier(this.ctrl.state, this.ctrl.now()) > 1 ? 2 : 1; // Time Cat: the line runs at double speed too
    for (const b of this.belts) b.tilePositionX -= (scroll > 0 ? 24 + scroll * 6 : 0) * warp * dt / this.propScale; // chevrons travel with the items (+x along each run)
    this.beltOverlay.tilePositionX = this.belts[1].tilePositionX + (this.overlayFromY - (this.backY - this.beltH / 2)) / this.propScale; // continuous with the run above
    this.spawnAcc += flow * dt;
    while (this.spawnAcc >= 1) { this.spawnAcc -= 1; this.spawnBeltMacaron(false); }
    const speed = ((this.scale.width * 0.6) / 7) * warp; // px per second
    const scale = this.propScale;
    for (let i = this.beltMacarons.length - 1; i >= 0; i--) {
      const m = this.beltMacarons[i];
      if (!m.sprite.active) { this.beltMacarons.splice(i, 1); continue; }
      if (m.flying) continue;
      let remaining = speed * dt;
      while (remaining > 0 && m.seg < this.path.length - 1) {
        const a = this.path[m.seg], b = this.path[m.seg + 1];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        const left = (1 - m.t) * len;
        if (remaining < left) { m.t += remaining / len; remaining = 0; }
        else { remaining -= left; m.seg++; m.t = 0; if (m.seg === 1) { this.animateStation(2); this.transformItem(m, `mac_${m.color}`); } }
      }
      if (m.seg >= this.path.length - 1) {
        this.beltMacarons.splice(i, 1);
        // end of the line: the gift hops into the big sack
        // off the end of the belt and down into the sack's mouth
        const mouth = { x: this.sack.x + 3 * this.sack.scaleX, y: this.sack.y - 14 * this.sack.scaleY };
        m.sprite.setDepth(this.sack.depth + 1);
        this.tweens.add({ targets: m.sprite, x: mouth.x, y: mouth.y, scale: this.propScale * 0.6, duration: 240, ease: 'Quad.in', onComplete: () => {
          m.sprite.setDepth(this.sack.depth - 1); // slips behind the rim
          this.tweens.add({ targets: m.sprite, y: mouth.y + 5 * this.sack.scaleY, alpha: 0, duration: 150, ease: 'Quad.in', onComplete: () => m.sprite.destroy() });
          this.bounce(this.sack);
        } });
        continue;
      }
      const a = this.path[m.seg], b = this.path[m.seg + 1];
      const x = a.x + (b.x - a.x) * m.t, y = a.y + (b.y - a.y) * m.t;
      m.sprite.setPosition(x, y);
      const hb = this.beltH / 2, cx = this.path[2].x; // corner squares belong to the run drawn on top: down at the top-right, front at the bottom-right
      const run = m.seg <= 1 ? (x >= cx - hb ? 1 : 0) : m.seg === 2 ? (y >= this.path[3].y - hb ? 2 : 1) : 2;
      m.sprite.setDepth(run === 1 && y >= this.overlayFromY ? this.beltOverlay.depth + 1 : this.belts[run].depth + 1); // out of the machine: on the overlay stretch
      if (m.seg === 2 && !m.wrapped && y >= this.stations[3].y) { m.wrapped = true; this.animateStation(3); this.transformItem(m, `gift_t${Math.max(1, equipmentTier(this.ctrl.state, 'box'))}_${m.color}`); } // through the packaging machine
      void scale;
    }
  }

  // ---- customers ----------------------------------------------------------------------------

  private static readonly QUEUE_MAX = 5;

  /** Queue spots along the street side of the counter, front of the line on the right. */
  /** The queue runs left → right: the first customer stands at the left end of the display counter, the next ones
   *  line up to the right with one animal's width between neighbours (tighter only if the screen is too narrow). */
  /** The one being served stands in front of the counter's middle (tappable); everyone else waits side by side
   *  to the right, beyond the stanchion rope. */
  private queueSpot(i: number): Pt {
    const s = this.roamerScale();
    const y = Math.min(this.scale.height - 2, this.display.y + this.display.h + this.counterFront + 16 * s + 4);
    if (i === 0) return { x: this.display.x + this.display.w * 0.5, y };
    const lineX0 = this.display.x + this.display.w + 42 * this.propScale + 11 * s; // past both rope spans
    return { x: Math.min(this.scale.width - 11 * s, lineX0 + (i - 1) * 22 * s), y };
  }

  private spawnCustomer(): void {
    const waiting = this.customers.filter((c) => c.mode !== 'leave');
    if (waiting.length >= CafeScene.QUEUE_MAX) return;
    const s = this.roamerScale();
    const species = pickSpecies();
    const coat = Phaser.Utils.Array.GetRandom(species.coats);
    const spot = this.queueSpot(waiting.length);
    const startX = this.scale.width + 16 * s;
    const fan = this.rushLeft > 0; // brought in by a Meowstagram post
    const key = fan && this.textures.exists(`cust_${species.id}_${coat}_fan`) ? `cust_${species.id}_${coat}_fan` : `cust_${species.id}_${coat}`;
    const sprite = this.add.image(startX, spot.y, key).setOrigin(0.5, 1).setScale(s).setDepth(spot.y).setAlpha(0).setFlipX(false).setInteractive({ useHandCursor: true }); // walks in from the right, facing left
    const bubble = this.add.image(startX, spot.y - 18 * s, fan ? 'bubble_shades' : 'bubble').setOrigin(0.5, 1).setScale(s).setDepth(spot.y + 1).setVisible(false).setInteractive({ useHandCursor: true });
    const c: Customer = { species: species.id, sprite, bubble, mode: 'enter', tx: spot.x, ty: spot.y, timer: 0, served: false, fan };
    const onTap = () => this.serveCustomer(c);
    sprite.on('pointerdown', onTap); bubble.on('pointerdown', onTap);
    this.tweens.add({ targets: sprite, alpha: 1, duration: 250 });
    this.customers.push(c);
  }

  private serveCustomer(c: Customer): void {
    if (c.mode !== 'browse' || c.served) return;
    c.served = true;
    c.glow?.destroy(); c.hint?.destroy(); c.glow = undefined; c.hint = undefined;
    const value = this.ctrl.serveCustomer(c.species);
    if ((SPECIES_BY_ID[c.species]?.weight ?? 99) < 10) this.writeDiary('customer', [c.species]);
    // once the shop has a Meowstagram, happy customers post their own photo and tag it (fans always do)
    if ((hasInfluencer(this.ctrl.state) || this.ctrl.state.followers > 0) && (c.fan || Math.random() < 0.3)) {
      this.ctrl.customerPost(c.species, pick(lang() === 'zh' ? CUSTOMER_POSTS_ZH : CUSTOMER_POSTS).replace('{shop}', '@meowcaron.official'));
      this.banner(tr('bannerTagged'), '#7A5AA8');
    }
    c.bubble.setTexture('bubble_money').setVisible(true); // paying
    this.time.delayedCall(900, () => { if (c.bubble.active) c.bubble.setVisible(false); });
    const happyKey = `${c.sprite.texture.key}_happy`;
    if (this.textures.exists(happyKey)) c.sprite.setTexture(happyKey);
    const px = c.sprite.x, py = c.sprite.y - 10 * this.roamerScale();
    for (let i = 0; i < 10; i++) {
      const m = this.add.image(px, py, Phaser.Utils.Array.GetRandom(this.macaronKeys)).setScale(this.propScale).setDepth(8000);
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      this.tweens.add({ targets: m, x: px + Math.cos(ang) * 90, y: py + Math.sin(ang) * 90 + 60, alpha: 0, duration: 650, ease: 'Quad.out', onComplete: () => m.destroy() });
    }
    const t = this.add.text(px, py - 20, '+' + fmt(value), { fontFamily: FONT, fontSize: '26px', fontStyle: '900', color: '#7A3A4A', stroke: '#FFFFFF', strokeThickness: 5 }).setOrigin(0.5).setDepth(8001);
    this.tweens.add({ targets: t, y: py - 110, alpha: 0, duration: 1100, ease: 'Quad.out', onComplete: () => t.destroy() });
    this.tweens.add({ targets: c.sprite, y: c.sprite.y - 12, duration: 120, yoyo: true, repeat: 1 });
    c.mode = 'leave';
  }

  private updateCustomer(dt: number, time: number): void {
    this.sessionSec += dt;
    if (this.sessionSec >= this.nextCustomerAt && this.ctrl.cps() > 0) {
      this.spawnCustomer();
      const gap = this.rushLeft > 0 ? Phaser.Math.Between(2, 4) : Phaser.Math.Between(CUSTOMER.minGapSec, CUSTOMER.maxGapSec) * customerGapMultiplier(this.ctrl.state);
      if (this.rushLeft > 0) this.rushLeft--;
      this.nextCustomerAt = this.sessionSec + gap;
    }
    const s = this.roamerScale();
    const speed = 60 * s;
    // queue order: everyone not leaving, in arrival order
    const line = this.customers.filter((c) => c.mode !== 'leave');
    line.forEach((c, i) => { const spot = this.queueSpot(i); c.tx = spot.x; c.ty = spot.y; });
    for (let idx = this.customers.length - 1; idx >= 0; idx--) {
      const c = this.customers[idx];
      const sp = c.sprite;
      if (c.mode === 'leave') {
        const gx = this.scale.width + 16 * s, dx = gx - sp.x, step = speed * dt;
        if (dx <= step) { sp.destroy(); c.bubble.destroy(); c.glow?.destroy(); c.hint?.destroy(); this.customers.splice(idx, 1); continue; }
        sp.x += step; sp.setFlipX(true); sp.setScale(s, s * (1 + Math.abs(Math.sin(time / 90)) * 0.06)); // leaving to the right
        sp.setDepth(sp.y); continue;
      }
      const dx = c.tx - sp.x, dy = c.ty - sp.y, d = Math.hypot(dx, dy), step = speed * dt;
      const front = line[0] === c;
      if (d > step) {
        sp.setPosition(sp.x + (dx / d) * step, sp.y + (dy / d) * step);
        sp.setFlipX(dx > 0);
        sp.setScale(s, s * (1 + Math.abs(Math.sin(time / 90)) * 0.06));
        if (c.mode === 'browse') { c.mode = 'queue'; c.bubble.setVisible(false); }
      } else {
        sp.setPosition(c.tx, c.ty);
        if (front && c.mode !== 'browse') {
          c.mode = 'browse'; c.timer = CUSTOMER.browseSec; c.bubble.setVisible(true);
          if (!c.served && !c.visited) {
            c.visited = true;
            this.ctrl.recordCustomerVisit(c.species);
            if (Math.random() < 0.5) this.startChat(c);
          }
        } else if (!front) { c.mode = 'queue'; sp.setScale(s, s * (1 + Math.sin(time / 400 + idx) * 0.03)); }
      }
      if (c.mode === 'browse') {
        c.timer -= dt;
        sp.setScale(s, s * (1 + Math.sin(time / 300) * 0.03));
        if (c.timer <= 0) { c.mode = 'leave'; c.bubble.setVisible(false); c.glow?.destroy(); c.hint?.destroy(); c.glow = undefined; c.hint = undefined; }
      }
      sp.setDepth(sp.y);
      c.bubble.setPosition(sp.x, sp.y - 17 * s + Math.sin(time / 200) * 2).setDepth(sp.y + 1);
    }
  }

  // ---- walk-in easter eggs: the fish plush gets hugged, the tent has a secret, the house snores --

  private onEnterFurniture(r: Roamer): void {
    const sp = r.sprite, s = this.roamerScale();
    const item = this.lounge.find((it) => it.key === r.spot);
    const inHouse = item?.key === 'cathouse';
    if (item?.key === 'fish') {
      // bunny-kicks the fish plush: the fish wriggles, hearts pop
      this.time.delayedCall(1200, () => {
        if (!sp.active || r.mode !== 'nap') return;
        this.tweens.add({ targets: item.img, angle: 6, duration: 90, yoyo: true, repeat: 7, onComplete: () => item.img.setAngle(0) });
        this.tweens.add({ targets: sp, angle: `+=${sp.flipX ? -12 : 12}`, duration: 90, yoyo: true, repeat: 7 });
        for (let i = 0; i < 3; i++) {
          const e = this.add.image(sp.x + (Math.random() - 0.5) * 20, sp.y - 14 * s, 'emote_heart_red').setScale(s * 0.9).setDepth(9000);
          this.tweens.add({ targets: e, y: e.y - 30, alpha: 0, duration: 900, delay: i * 300, onComplete: () => e.destroy() });
        }
        this.writeDiary('boxwalk', [r.gen]);
      });
    } else if (item?.key === 'tent' || item?.key === 'tent2') {
      // a little lamp comes on; sometimes the cat finds a ball of yarn in there
      const lamp = this.add.image(item.img.x + 0.5 * s, item.img.y - 5 * s, 'glow').setScale(s * 0.8).setAlpha(0.7).setDepth(item.img.depth - 1);
      this.tweens.add({ targets: lamp, alpha: 0.4, duration: 600, yoyo: true, repeat: 10, onComplete: () => lamp.destroy() });
      if (Math.random() < 0.3) this.time.delayedCall(3000, () => {
        if (!sp.active || r.mode !== 'nap') return;
        const value = this.ctrl.petBonus(r.gen, r.slot, 'treasure') * 4;
        const yarn = this.add.image(item.img.x, item.img.y - 10 * s, 'toy_yarn').setScale(s).setDepth(9000);
        this.tweens.add({ targets: yarn, y: yarn.y - 30, duration: 500, ease: 'Back.out' });
        this.tweens.add({ targets: yarn, alpha: 0, duration: 400, delay: 1400, onComplete: () => yarn.destroy() });
        const t = this.add.text(item.img.x, item.img.y - 16 * s, `🧶 +${fmt(value)}`, { fontFamily: FONT, fontSize: '20px', fontStyle: '900', color: '#7A3A4A', stroke: '#FFFFFF', strokeThickness: 4 }).setOrigin(0.5).setDepth(9001);
        this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, duration: 1300, onComplete: () => t.destroy() });
        this.writeDiary('treasure', [r.gen]);
        r.timer = Math.min(r.timer, 1.5);
      });
    } else if (inHouse && item) {
      // the whole house breathes while someone sleeps inside
      this.tweens.add({ targets: item.img, scaleX: item.img.scaleX * 1.03, scaleY: item.img.scaleY * 0.98, duration: 900, yoyo: true, repeat: 5, ease: 'Sine.inOut' });
    }
  }

  /** New shop / wipe: drop every running effect so nothing from the old shop lingers. */
  private resetTransient(): void {
    this.rainbowUntil = 0; this.rainbowTaps = [];
    this.hero.clearTint();
    this.social = null; this.chat = null;
    this.hourglasses.forEach((g) => g.destroy()); this.hourglasses = [];
    if (this.shootingStar) { this.shootingStar.destroy(); this.shootingStar = null; }
    this.rushLeft = 0;
    this.primeAbilities();
  }

  /** Every special cat the player owns gets its first charge soon after hiring; later charges take hours. */
  private primeAbilities(): void { for (const k of Object.keys(ABILITY)) if ((this.ctrl.state.gens[k] ?? 0) > 0) abilityPrime(this.ctrl.state, k, this.ctrl.now()); }

  private blessIcons: Phaser.GameObjects.Image[] = [];
  private updateBlessIcons(s: number): void {
    const active = this.ctrl.now() < this.ctrl.state.blessedUntil;
    const cats = active ? this.roamers : []; // shop-wide: everyone is blessed
    while (this.blessIcons.length < cats.length) this.blessIcons.push(this.add.image(0, 0, 'emote_sparkle').setScale(s).setDepth(8000));
    while (this.blessIcons.length > cats.length) this.blessIcons.pop()!.destroy();
    cats.forEach((r, i) => this.blessIcons[i].setPosition(r.sprite.x - 12 * s, r.sprite.y - 14 * s + Math.sin(this.time.now / 220 + i) * 2).setDepth(r.sprite.depth + 1).setAngle(Math.sin(this.time.now / 300 + i) * 15));
  }

  // ---- rainbow cat (easter egg) ----------------------------------------------------------------

  private startRainbow(): void {
    const now = this.time.now;
    this.rainbowUntil = now + 8000;
    this.rainbowReadyAt = now + 60_000;
    this.rainbowTaps = [];
    this.ctrl.rainbow();
    this.cameras.main.flash(300, 255, 255, 255);
    this.writeDiary('rainbow', ['shopcat']);
  }

  /** Rainbow Cat ability: zooms across the shop (right to left) leaving a rainbow; everyone goes RGB for 8 s. */
  private nyanDash(): void {
    const burst = this.ctrl.rainbow(true); // starts the ×2 effect with a full energy bar
    this.banner(tr('bannerNyan'), '#C9668A');
    const w = this.scale.width, h = this.scale.height;
    const s = this.roamerScale() + 1;
    const y = this.wallH + h * 0.18;
    const flyer = this.add.image(w + 40, y, 'cat_rainbow_happy').setScale(s).setFlipX(false).setDepth(9350); // tail trails behind as it flies left
    // continuous rainbow ribbon (six bands) that stays until the dash is over, plus twinkling pixel stars
    const segs: Phaser.GameObjects.Rectangle[] = [];
    const trail = this.time.addEvent({ delay: 40, loop: true, callback: () => {
      if (!flyer.active) return;
      [0xff5f6d, 0xffb347, 0xfff36b, 0x7ee787, 0x6fb3ff, 0xc38cff].forEach((c, i) => {
        segs.push(this.add.rectangle(flyer.x + 9 * s, flyer.y - 9 * (s / 3) - 7 + i * 3, 10, 3, c, 0.95).setOrigin(0, 0.5).setDepth(9340));
      });
      if (Math.random() < 0.5) {
        const st = this.add.image(Phaser.Math.Between(0, w), Phaser.Math.Between(this.wallH, h * 0.6), 'star').setScale(1 + Math.random() * 1.5).setAlpha(0.9).setDepth(9330);
        this.tweens.add({ targets: st, alpha: 0, duration: 600, yoyo: true, onComplete: () => st.destroy() });
      }
    } });
    this.tweens.add({ targets: flyer, x: -60, duration: 3200, ease: 'Linear', onComplete: () => {
      trail.remove(); flyer.destroy();
      segs.forEach((g, i) => this.tweens.add({ targets: g, alpha: 0, duration: 500, delay: (i % 6) * 40, onComplete: () => g.destroy() }));
    } });
    this.tweens.add({ targets: flyer, y: y + 14, duration: 260, yoyo: true, repeat: 6, ease: 'Sine.inOut' });
    const t = this.add.text(w / 2, y + 60, `🌈 +${fmt(burst)}`, { fontFamily: FONT, fontSize: '24px', fontStyle: '900', color: '#7A3A4A', stroke: '#FFFFFF', strokeThickness: 5 }).setOrigin(0.5).setDepth(9351);
    this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 1500, delay: 600, onComplete: () => t.destroy() });
    this.writeDiary('rainbow', ['rainbow']);
  }

  private updateRainbow(time: number, dt: number): void {
    const active = time < this.rainbowUntil || this.ctrl.rainbowActive();
    // the Rainbow Cat itself never stops cycling (lightly, over its pink coat)
    for (const r of this.roamers) if (r.gen === 'rainbow' && !active) {
      const c = Phaser.Display.Color.HSVToRGB((time / 1200 + r.phase) % 1, 0.3, 1) as Phaser.Types.Display.ColorObject;
      r.sprite.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    }
    if (!active) {
      if (this.hero.isTinted) { this.hero.clearTint(); for (const r of this.roamers) if (r.gen !== 'rainbow') r.sprite.clearTint(); }
      return;
    }
    const hue = (time / 400) % 1;
    const color = Phaser.Display.Color.HSVToRGB(hue, 0.55, 1) as Phaser.Types.Display.ColorObject;
    this.hero.setTint(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
    this.roamers.forEach((r, i) => {
      const c = Phaser.Display.Color.HSVToRGB((hue + i * 0.08) % 1, 0.5, 1) as Phaser.Types.Display.ColorObject;
      r.sprite.setTint(Phaser.Display.Color.GetColor(c.r, c.g, c.b));
    });
    // rainbow trail streaming out behind the owner
    this.trailAcc += dt;
    if (this.trailAcc > 0.06) {
      this.trailAcc = 0;
      const colors = [0xff5f6d, 0xffb347, 0xfff36b, 0x7ee787, 0x6fb3ff, 0xc38cff];
      const x0 = this.hero.x + this.hero.displayWidth * 0.45, y0 = this.hero.y;
      colors.forEach((c, i) => {
        const seg = this.add.rectangle(x0, y0 + i * 6, 14, 6, c, 0.9).setOrigin(0, 0.5).setDepth(9380);
        this.tweens.add({ targets: seg, x: x0 + 160 + Math.random() * 60, y: seg.y - 20 - Math.random() * 30, alpha: 0, duration: 900, ease: 'Quad.out', onComplete: () => seg.destroy() });
      });
    }
  }

  // ---- diary ---------------------------------------------------------------------------------

  private catName(id: string): string {
    if (id === 'shopcat') return heroName(this.ctrl.state.heroName);
    if (CAT_BY_ID[id]) return nameOf(CAT_BY_ID[id]);
    const sp = SPECIES_BY_ID[id];
    return sp ? (lang() === 'zh' && SPECIES_ZH[id] ? SPECIES_ZH[id].name : sp.name) : id;
  }

  private writeDiary(kind: DiaryKind, cats: string[], n?: number | string, spot?: string | null): void {
    const pool = spot ? (lang() === 'zh' ? SPOT_TEXT_ZH : SPOT_TEXT)[spot] : undefined;
    const text = pick(pool ?? (lang() === 'zh' ? DIARY_ZH : DIARY_TEXT)[kind])
      .replace(/\{a\}/g, kind === 'post' ? String(n ?? '') : this.catName(cats[0] ?? 'shopcat'))
      .replace(/\{b\}/g, this.catName(cats[1] ?? cats[0] ?? 'shopcat'))
      .replace(/\{n\}/g, String(n ?? ''));
    this.ctrl.diary(kind, cats, text, spot ? (spot as DiaryBg) : this.pickBg(kind));
  }

  /** Where the photo for a diary moment is taken: not only inside the shop. */
  private pickBg(kind: DiaryKind): DiaryBg {
    const any: DiaryBg[] = ['kitchen', 'counter', 'front', 'park', 'roof', 'alley'];
    switch (kind) {
      case 'nap': return pick<DiaryBg>(['oven', 'alley', 'park', 'roof']);
      case 'rest': return pick<DiaryBg>(['counter', 'front']);
      case 'cuddle': return pick<DiaryBg>(['kitchen', 'park', 'roof', 'front', 'alley']);
      case 'fight': return pick<DiaryBg>(['kitchen', 'alley', 'park']);
      case 'bless': return 'kitchen';
      case 'timeskip': return 'kitchen';
      case 'star': return pick<DiaryBg>(['roof', 'night']);
      case 'post': return pick(any);
      case 'customer': return pick<DiaryBg>(['counter', 'front']);
      case 'prestige': return 'front';
      case 'rainbow': return 'night';
      case 'chat': return 'counter';
      case 'boxwalk': return 'kitchen';
      case 'treasure': return 'kitchen';
      default: return pick(any);
    }
  }

  // ---- special abilities (pet a charged special cat) -----------------------------------------

  private isReady(gen: string): boolean { return abilityReady(this.ctrl.state, gen, this.ctrl.now()); }

  /** Petting a special cat whose ability is charged fires it. */
  private triggerAbility(r: Roamer): boolean {
    const gen = r.gen;
    if (!this.isReady(gen)) return false;
    if (gen === 'cosmic' && this.shootingStar) return false;
    if (gen === 'rainbow' && (this.time.now < this.rainbowUntil || this.ctrl.rainbowActive())) return false;
    abilityUsed(this.ctrl.state, gen, this.ctrl.now());
    if (gen === 'deity') this.doBless();
    else if (gen === 'timecat') this.doTimeWarp();
    else if (gen === 'cosmic') this.spawnShootingStar();
    else if (gen === 'rainbow') this.nyanDash();
    else if (gen === 'influencer') this.postNow();
    return true;
  }

  /** Goose-yellow glowing outline on special cats whose ability is ready to be petted. */
  private updateAbilities(): void {
    for (const r of this.roamers) {
      const ready = this.isReady(r.gen) && !(r.gen === 'cosmic' && this.shootingStar) && !(r.gen === 'rainbow' && (this.time.now < this.rainbowUntil || this.ctrl.rainbowActive()));
      let o = this.readyOutlines.get(r);
      if (ready && !o) { o = this.add.image(0, 0, r.sprite.texture.key).setOrigin(0.5, 1).setTintFill(0xffe066); this.readyOutlines.set(r, o); }
      if (!ready && o) { o.destroy(); this.readyOutlines.delete(r); o = undefined; }
      if (o) {
        const pulse = 1.14 + Math.sin(this.time.now / 180) * 0.04;
        // mirror the cat exactly, including a lying-down cat's shifted origin, so the glow never slips off it
        o.setTexture(r.sprite.texture.key).setOrigin(r.sprite.originX, r.sprite.originY).setPosition(r.sprite.x, r.sprite.y + (r.sprite.originY === 1 ? 1 : 0)).setFlipX(r.sprite.flipX).setAngle(r.sprite.angle)
          .setScale(r.sprite.scaleX * pulse, r.sprite.scaleY * pulse).setDepth(r.sprite.depth - 0.5).setAlpha(0.85 + Math.sin(this.time.now / 180) * 0.15);
      }
    }
    for (const [r, o] of this.readyOutlines) if (!r.sprite.active) { o.destroy(); this.readyOutlines.delete(r); }
  }

  /** Big banner in the middle of the stage so it is obvious where a buff came from. */
  private banner(text: string, color: string): void {
    const w = this.scale.width, h = this.scale.height;
    const t = this.add.text(w / 2, h * 0.38, text, { fontFamily: FONT, fontSize: '30px', fontStyle: '900', color, stroke: '#FFFFFF', strokeThickness: 7 }).setOrigin(0.5).setDepth(9600).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, ease: 'Back.out' });
    this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 900, delay: 1300, ease: 'Quad.in', onComplete: () => t.destroy() });
  }

  /** Cat Deity: a blessing of light for the whole shop. */
  private doBless(): void {
    const { mult } = this.ctrl.bless();
    this.banner(tr('bannerBless', { m: mult.toFixed(2) }), '#9A6B00');
    this.cameras.main.flash(600, 255, 236, 170);
    this.starShower();
    const s = this.roamerScale();
    for (const r of this.roamers) {
      const e = this.add.image(r.sprite.x, r.sprite.y - 18 * s, 'emote_sparkle').setScale(s).setDepth(8000);
      this.tweens.add({ targets: e, y: e.y - 40, alpha: 0, duration: 1200, delay: Math.random() * 400, onComplete: () => e.destroy() });
      if (r.mode === 'idle' || r.mode === 'walk' || r.mode === 'work') { r.sprite.setTexture(`cat_${r.gen}_happy`); this.time.delayedCall(1500, () => { if (r.sprite.active && r.mode !== 'react') r.sprite.setTexture(`cat_${r.gen}_open`); }); }
    }
    this.writeDiary('bless', ['deity'], mult.toFixed(2));
  }

  private warpRippleAcc = 0;
  private hourglasses: Phaser.GameObjects.Image[] = [];

  /** Time Cat: a time warp — the whole shop runs faster for a while. */
  private doTimeWarp(): void {
    const { mult, seconds } = this.ctrl.timeWarp();
    this.banner(tr('bannerWarp', { m: mult, s: seconds }), '#3A5A8E');
    this.cameras.main.flash(400, 196, 222, 245);
    const w = this.scale.width, h = this.scale.height;
    const t = this.add.text(w / 2, h * 0.45, tr('warpFloat', { m: mult, s: seconds }), { fontFamily: FONT, fontSize: '26px', fontStyle: '900', color: '#3A4A6E', stroke: '#FFFFFF', strokeThickness: 6 }).setOrigin(0.5).setDepth(8600);
    this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, duration: 1600, ease: 'Quad.out', onComplete: () => t.destroy() });
    for (const r of this.roamers) if (r.gen === 'timecat') this.tweens.add({ targets: r.sprite, angle: 360, duration: 500, onComplete: () => r.sprite.setAngle(0) });
    this.writeDiary('timeskip', ['timecat'], mult);
  }

  /** While warped: blue clock ripples, hourglasses over the time cats, everyone moves faster. */
  private updateWarp(dt: number, time: number): void {
    const warped = warpMultiplier(this.ctrl.state, this.ctrl.now()) > 1;
    const s = this.roamerScale();
    this.updateBlessIcons(s);
    if (!warped) {
      if (this.hourglasses.length) { this.hourglasses.forEach((g) => g.destroy()); this.hourglasses = []; }
      return;
    }
    const timecats = this.roamers.filter((r) => r.gen === 'timecat');
    while (this.hourglasses.length < timecats.length) this.hourglasses.push(this.add.image(0, 0, 'emote_hourglass').setScale(s).setDepth(8000));
    while (this.hourglasses.length > timecats.length) this.hourglasses.pop()!.destroy();
    timecats.forEach((r, i) => this.hourglasses[i].setPosition(r.sprite.x - 7 * s, r.sprite.y - 19 * s + Math.sin(time / 220 + i) * 2).setDepth(r.sprite.y + 1).setAngle(Math.sin(time / 300) * 12));
    this.warpRippleAcc += dt;
    if (this.warpRippleAcc > 0.7) {
      this.warpRippleAcc = 0;
      const src = timecats[0]?.sprite ?? this.hero;
      const ring = this.add.circle(src.x, src.y - 8 * s, 10).setStrokeStyle(3, 0x6fa8dc, 0.8).setDepth(8500);
      this.tweens.add({ targets: ring, radius: 160, alpha: 0, duration: 900, ease: 'Quad.out', onUpdate: () => ring.setRadius(ring.radius), onComplete: () => ring.destroy() });
    }
  }

  /** Cosmic Cat: a shooting star crosses the sky; tap it for stardust. */
  /** Cosmic Cat: stardust rains over the whole shop; one stardust is banked at once (no catching), plus a burst. */
  private spawnShootingStar(): void {
    if (this.shootingStar) return;
    this.banner(tr('bannerStar'), '#6A4A9E');
    const w = this.scale.width, h = this.scale.height;
    const marker = this.add.image(-100, -100, 'star').setVisible(false); // marks "rain in progress" for the glow / cooldown checks
    this.shootingStar = marker;
    const s = this.propScale;
    for (let i = 0; i < 34; i++) {
      const x = Math.random() * w, y1 = this.wallH + 20 + Math.random() * (h - this.wallH - 40);
      const star = this.add.image(x, -10 - Math.random() * 60, 'star').setScale(s * (0.5 + Math.random() * 0.7)).setDepth(9300).setAlpha(0.95);
      this.tweens.add({ targets: star, y: y1, angle: 360 * (Math.random() > 0.5 ? 1 : -1), duration: 900 + Math.random() * 900, delay: i * 55, ease: 'Quad.in', onComplete: () => {
        for (let k = 0; k < 3; k++) { const m = this.add.image(star.x, star.y, 'star').setScale(s * 0.3).setDepth(9300); this.tweens.add({ targets: m, x: star.x + (Math.random() - 0.5) * 30, y: star.y - 10 - Math.random() * 16, alpha: 0, duration: 400, onComplete: () => m.destroy() }); }
        this.tweens.add({ targets: star, alpha: 0, scale: 0.2, duration: 220, onComplete: () => star.destroy() });
      } });
    }
    this.time.delayedCall(900, () => {
      const { fragments, starGained, burst } = this.ctrl.stardustRain();
      const cat = this.roamers.find((r) => r.gen === 'cosmic');
      const px = cat ? cat.sprite.x : w / 2, py = cat ? cat.sprite.y - 24 * this.roamerScale() : h * 0.4;
      const t = this.add.text(px, py, (starGained ? '+1 ★' : `✦ ${fragments}/10`) + `  +${fmt(burst)}`, { fontFamily: FONT, fontSize: '24px', fontStyle: '900', color: '#7A5A1A', stroke: '#FFFFFF', strokeThickness: 5 }).setOrigin(0.5).setDepth(9301);
      this.tweens.add({ targets: t, y: py - 70, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
      if (cat) { cat.sprite.setTexture('cat_cosmic_happy'); this.time.delayedCall(1500, () => { if (cat.sprite.active && cat.mode !== 'react') cat.sprite.setTexture('cat_cosmic_open'); }); }
      this.writeDiary('star', ['cosmic'], fragments);
    });
    this.time.delayedCall(3200, () => { marker.destroy(); this.shootingStar = null; });
  }

  // ---- cat-to-cat moments (cuddle, play-fight) and solo breaks (nap, rest) -------------------

  private freeRoamers(): Roamer[] { return this.roamers.filter((r) => r.mode === 'idle' || r.mode === 'walk' || r.mode === 'work'); }

  /** Start a social moment; returns false if no cats were free. */
  private startSocial(kind: 'cuddle' | 'fight' | 'nap' | 'rest'): boolean {
    const free = Phaser.Utils.Array.Shuffle(this.freeRoamers());
    const s = this.roamerScale();
    if (kind === 'nap') { const r = free[0]; if (!r) return false; this.sendToNap(r); return true; }
    if (kind === 'rest') { const r = free[0]; if (!r) return false; this.sendToRest(r); return true; }
    if (free.length < 2 || this.social) return false;
    const [a, b] = free;
    const p = this.randomFloorPoint();
    this.setTarget(a, { x: p.x - 9 * s, y: p.y }, 'social');
    this.setTarget(b, { x: p.x + 9 * s, y: p.y }, 'social');
    this.social = { a, b, kind, started: false, until: 0 };
    return true;
  }

  /** One cat per facility: a spot is taken while a cat is heading there, sleeping or resting on it. */
  private spotTaken(key: string, except: Roamer): boolean {
    return this.roamers.some((o) => o !== except && o.spot === key && (o.mode === 'nap' || o.mode === 'rest' || o.mode === 'climb' || o.mode === 'play' || (o.mode === 'walk' && (o.next === 'nap' || o.next === 'rest' || o.next === 'climb' || o.next === 'play'))));
  }

  /** Pick a free sleeping spot: the cat house, tent / fish plush / cushion, or beside the warm oven. */
  private sendToNap(r: Roamer): void {
    const s = this.roamerScale();
    const f = this.floorRect();
    const options: { key: string; weight: number; go: () => void }[] = [
      ...this.lounge.filter((x) => x.use === 'nap').map((it) => ({ key: it.key, weight: it.key === 'cathouse' ? 3 : 2, go: () => this.setLoungeTarget(r, { x: it.img.x + (it.key.startsWith('tent') ? 3 * s : it.key === 'cathouse' ? -2 * this.propScale : 0), y: it.inside ? it.img.y - (it.key === 'cathouse' ? 2 : 1) * s : it.key.startsWith('tent') ? it.img.y - 2 * s : it.key === 'basket' ? it.img.y - 3 * s : it.img.y - it.img.displayHeight / 2 + 8 * s }, 'nap') })), // tents: on the mat in the doorway; basket: inside it
      { key: 'oven', weight: 1, go: () => this.setTarget(r, { x: Phaser.Math.Clamp(this.stations[2].x - 16 * s + (Math.random() - 0.5) * 20, f.x0, f.x1), y: f.y0 + 4 }, 'nap') },
    ].filter((o) => !this.spotTaken(o.key, r));
    if (!options.length) { this.leaveLounge(r, this.randomFloorPoint(), 'idle'); return; } // everything is taken: wander instead
    const total = options.reduce((a, o) => a + o.weight, 0);
    let pick = Math.random() * total;
    const chosen = options.find((o) => (pick -= o.weight) <= 0) ?? options[0];
    chosen.go(); r.spot = chosen.key;
  }

  /** Pick a resting spot: beside the fish plush (one cat), or at the counter (room for several). */
  private sendToRest(r: Roamer): void {
    const s = this.roamerScale();
    const tree = this.lounge.find((x) => x.key === 'cattree');
    // the cat tree is climbed: walk to its foot first, then hop up platform by platform
    const bowl = this.lounge.find((x) => x.key === 'fishbowl');
    const roll = Math.random();
    if (bowl && roll < 0.25 && !this.spotTaken('fishbowl', r)) { this.setLoungeTarget(r, { x: bowl.img.x, y: bowl.img.y + 6 * s }, 'rest'); r.spot = 'fishbowl'; } // sits in front of the bowl, back to us, staring
    else if (tree && roll < 0.4 && !this.spotTaken('cattree', r)) { this.setLoungeTarget(r, { x: tree.img.x + 4 * s, y: tree.img.y + 1 }, 'climb'); r.spot = 'cattree'; }
    else if (roll < 0.7 && !this.spotTaken('window', r)) { this.setLoungeTarget(r, { x: this.scale.width / 2 + (Math.random() - 0.5) * 40, y: this.wallH + 13 * s }, 'rest'); r.spot = 'window'; } // walks round the counter to the back wall and stares out of the window: slacking
    else { // two seats at the counter, never more than two cats
      const seat = ['counter1', 'counter2'].find((k) => !this.spotTaken(k, r));
      if (!seat) { this.leaveLounge(r, this.randomFloorPoint(), 'idle'); return; }
      this.setTarget(r, this.counterSeat(seat === 'counter1' ? 0 : 1), 'rest'); r.spot = seat;
    }
  }

  /** Climb the cat tree from its foot to the top platform (up) or back down (down): four hops, paws alternating. */
  private climbTree(r: Roamer, up: boolean): void {
    const sp = r.sprite, s = this.roamerScale();
    const tree = this.lounge.find((it) => it.key === 'cattree');
    if (!tree) { r.mode = 'idle'; r.timer = 0.5; r.spot = null; return; }
    r.mode = 'climb';
    const foot = { x: tree.img.x + 4 * s, y: tree.img.y + 1 };
    const top = { x: tree.img.x, y: tree.img.y - tree.img.displayHeight + 3 * s };
    const from = up ? foot : top, to = up ? top : foot;
    const hops = 4;
    sp.setPosition(from.x, from.y);
    const hop = (i: number) => {
      if (!sp.active || r.mode !== 'climb') return;
      if (i >= hops) {
        sp.setPosition(to.x, to.y).setScale(s, s).setFlipX(false);
        if (!up) sp.setTexture(`cat_${r.gen}_open`);
        if (up) { r.mode = 'rest'; r.timer = Phaser.Math.FloatBetween(12, 20); r.napAcc = 1.2; sp.setTexture(`cat_${r.gen}_happy`); this.writeDiary('rest', [r.gen]); }
        else { r.mode = 'idle'; r.timer = 0.4; r.spot = null; }
        return;
      }
      const k = (i + 1) / hops;
      sp.setFlipX(i % 2 === 0); // paws reach up on alternating sides
      this.tweens.add({ targets: sp, x: from.x + (to.x - from.x) * k + (i % 2 ? -1.5 : 1.5) * s, y: from.y + (to.y - from.y) * k, duration: up ? 260 : 200, ease: up ? 'Quad.out' : 'Quad.in', onComplete: () => hop(i + 1) });
      this.tweens.add({ targets: sp, scaleY: s * (up ? 1.12 : 0.9), scaleX: s * (up ? 0.92 : 1.08), duration: up ? 130 : 100, yoyo: true, ease: 'Quad.out' }); // stretch on the way up, squat on the way down
    };
    hop(0);
  }

  private updateSocial(time: number): void {
    if (this.sessionSec >= this.nextSocialAt && this.roamers.length >= 1) {
      this.nextSocialAt = this.sessionSec + Phaser.Math.Between(40, 90);
      const roll = Math.random();
      this.startSocial(roll < 0.6 ? 'cuddle' : 'fight');
    }
    const so = this.social;
    if (!so) return;
    const ok = (r: Roamer) => r.sprite.active && (r.mode === 'walk' || r.mode === 'social');
    if (!ok(so.a) || !ok(so.b)) { // someone got petted or left: call it off
      for (const r of [so.a, so.b]) if (r.sprite.active && r.mode === 'social') { r.mode = 'idle'; r.timer = 1; }
      this.social = null; return;
    }
    if (!so.started && so.a.mode === 'social' && so.b.mode === 'social') {
      so.started = true;
      so.until = this.sessionSec + (so.kind === 'cuddle' ? 9 : 6);
      const s = this.roamerScale();
      so.a.sprite.setFlipX(so.b.sprite.x > so.a.sprite.x); so.b.sprite.setFlipX(so.a.sprite.x > so.b.sprite.x); // face each other
      for (const r of [so.a, so.b]) r.sprite.setTexture(`cat_${r.gen}_${so.kind === 'fight' ? 'fight' : 'happy'}`); // >^< when squabbling
      if (so.kind === 'cuddle') {
        this.tweens.add({ targets: so.a.sprite, x: so.a.sprite.x + 3 * s, duration: 400, ease: 'Quad.out' });
        this.tweens.add({ targets: so.b.sprite, x: so.b.sprite.x - 3 * s, duration: 400, ease: 'Quad.out' });
        for (let i = 0; i < 8; i++) { // one heart at a time, right between them
          const e = this.add.image((so.a.sprite.x + so.b.sprite.x) / 2, so.a.sprite.y - 18 * s, 'emote_heart_red').setScale(s * 0.9).setDepth(8000);
          this.tweens.add({ targets: e, y: e.y - 36, alpha: 0, duration: 1000, delay: i * 1100, onComplete: () => e.destroy() });
        }
      } else {
        // a squabble: they take turns pouncing; the other one gets knocked back a little, sparks fly, anger marks pop
        const dir = so.b.sprite.x > so.a.sprite.x ? 1 : -1;
        const mid = (so.a.sprite.x + so.b.sprite.x) / 2;
        for (let i = 0; i < 8; i++) {
          const att = i % 2 === 0 ? so.a : so.b, def = i % 2 === 0 ? so.b : so.a, d = i % 2 === 0 ? dir : -dir;
          this.time.delayedCall(200 + i * 650, () => {
            if (!att.sprite.active || !def.sprite.active || att.mode !== 'social' || def.mode !== 'social') return;
            const ax = att.sprite.x, ay = att.sprite.y;
            const scratch = i % 4 < 2; // two scratches, then two swats
            if (scratch) this.tweens.add({ targets: att.sprite, angle: d * 18, scaleY: s * 1.1, duration: 100, ease: 'Quad.out', yoyo: true, onComplete: () => { att.sprite.setAngle(0).setScale(s, s); } }); // rear up and rake
            else this.tweens.add({ targets: att.sprite, x: ax + d * 4 * s, y: ay - 6 * s, duration: 110, ease: 'Quad.out', yoyo: true, onComplete: () => att.sprite.setPosition(ax, ay) }); // hop and swat
            this.time.delayedCall(100, () => {
              if (!def.sprite.active) return;
              this.tweens.add({ targets: def.sprite, angle: d * 14, x: def.sprite.x + d * 2 * s, duration: 90, yoyo: true, ease: 'Quad.out', onComplete: () => def.sprite.setAngle(0) });
              if (scratch) { const m = this.add.image(def.sprite.x - d * 4 * s, ay - 11 * s, 'emote_scratch').setScale(s * 0.7).setDepth(8000); this.tweens.add({ targets: m, alpha: 0, y: m.y - 6, duration: 450, delay: 120, onComplete: () => m.destroy() }); }
              else for (let k = 0; k < 3; k++) { const sp = this.add.image(mid + (Math.random() - 0.5) * 10 * s, ay - 10 * s, 'star').setScale(s * 0.6).setDepth(8000); this.tweens.add({ targets: sp, x: sp.x + (Math.random() - 0.5) * 30, y: sp.y - 10 - Math.random() * 20, alpha: 0, duration: 400, onComplete: () => sp.destroy() }); }
              sfx.boing(scratch ? 2.6 : 2.2);
            });
            const mark = this.add.image(att.sprite.x - d * 6 * s, ay - 20 * s, 'emote_anger').setScale(s * 0.9).setDepth(8001);
            this.tweens.add({ targets: mark, y: mark.y - 10, alpha: 0, duration: 600, delay: 150, onComplete: () => mark.destroy() });
          });
        }
      }
      this.writeDiary(so.kind, [so.a.gen, so.b.gen]);
    }
    if (so.started && this.sessionSec >= so.until) {
      for (const r of [so.a, so.b]) { r.mode = 'idle'; r.timer = Phaser.Math.FloatBetween(0.5, 2); if (r.sprite.active) r.sprite.setTexture(`cat_${r.gen}_open`); }
      this.social = null;
    }
    void time;
  }

  // ---- chatting with customers ------------------------------------------------------------------

  private startChat(c: Customer): boolean {
    if (this.chat) return false;
    const free = this.freeRoamers().filter((r) => r.mode !== 'walk' || r.next === 'idle');
    const cat = free[Math.floor(Math.random() * free.length)];
    if (!cat) return false;
    const s = this.roamerScale();
    this.setTarget(cat, { x: Phaser.Math.Clamp(c.sprite.x, this.display.x + 11 * s, this.display.x + this.display.w - 11 * s), y: this.display.y - 4 }, 'social');
    cat.speed *= 1.4;
    this.chat = { cat, customer: c, started: false, until: 0, acc: 0 };
    return true;
  }

  private updateChat(dt: number): void {
    const ch = this.chat;
    if (!ch) return;
    const alive = ch.cat.sprite.active && ch.customer.sprite.active && ch.customer.mode === 'browse' && (ch.cat.mode === 'walk' || ch.cat.mode === 'social');
    if (!alive) { ch.bubble?.destroy(); if (ch.cat.sprite.active && ch.cat.mode === 'social') { ch.cat.mode = 'idle'; ch.cat.timer = 1; } this.chat = null; return; }
    if (!ch.started && ch.cat.mode === 'social') {
      ch.started = true;
      ch.until = this.sessionSec + 10;
      ch.customer.timer += 10; // stays to chat
      ch.cat.sprite.setFlipX(false);
      ch.cat.sprite.setTexture(`cat_${ch.cat.gen}_happy`);
      const happy = `${ch.customer.sprite.texture.key}_happy`;
      if (this.textures.exists(happy)) ch.customer.sprite.setTexture(happy);
      ch.customer.bubble.setVisible(false);
      this.writeDiary('chat', [ch.cat.gen, ch.customer.species]);
    }
    if (ch.started) {
      ch.acc += dt;
      if (ch.acc > 1.6) {
        ch.acc = 0;
        const s = this.roamerScale();
        ch.turn = ((ch.turn ?? 0) + 1) % 4;
        const catTurn = ch.turn % 2 === 0;
        const who = catTurn ? ch.cat.sprite : ch.customer.sprite;
        ch.bubble?.destroy();
        // the same kind of speech bubble the customer uses, taking turns
        ch.bubble = this.add.image(who.x, who.y - 17 * s, ch.turn === 3 ? 'bubble_heart' : 'bubble_note').setOrigin(0.5, 1).setScale(s).setDepth(9000);
      }
      if (this.sessionSec >= ch.until) {
        ch.bubble?.destroy();
        ch.cat.mode = 'idle'; ch.cat.timer = 1; ch.cat.speed /= 1.4;
        if (ch.cat.sprite.active) ch.cat.sprite.setTexture(`cat_${ch.cat.gen}_open`);
        ch.customer.bubble.setVisible(true);
        this.chat = null;
      }
    }
  }

  // ---- Meowstagram ----------------------------------------------------------------------------

  private updatePosts(): void { /* posting is manual now: pet a charged Influencer Cat */ }

  private postNow(): void {
    if (!hasInfluencer(this.ctrl.state)) return;
    // photograph a random floor cat, or a machine / the owner
    const pool: string[] = [...this.roamers.map((r) => r.gen), 'mixer', 'oven', 'shopcat'];
    const subject = Phaser.Utils.Array.GetRandom(pool);
    const zh = lang() === 'zh';
    const name = (zh ? SUBJECT_ZH : SUBJECT_NAMES)[subject] ?? (CAT_BY_ID[subject] ? tr('ourCat', { name: zh ? nameOf(CAT_BY_ID[subject]) : CAT_BY_ID[subject].name.toLowerCase() }) : subject);
    const caption = Phaser.Utils.Array.GetRandom(zh ? CAPTIONS_ZH : CAPTIONS).replace('{subject}', name);
    this.ctrl.postPhoto(subject, caption);
    this.banner(tr('bannerPost'), '#7A5AA8');
    this.writeDiary('post', [CAT_BY_ID[subject] ? subject : 'influencer'], caption);
    this.rushLeft = Phaser.Math.Between(2, 4); // the post brings a small crowd of fans, close together
    this.nextCustomerAt = Math.min(this.nextCustomerAt, this.sessionSec + 2);
    // the influencer cat strikes a pose
    const inf = this.roamers.find((r) => r.gen === 'influencer');
    if (inf) { inf.sprite.setTexture('cat_influencer_happy'); this.time.delayedCall(1500, () => { if (inf.sprite.active) inf.sprite.setTexture('cat_influencer_open'); }); this.cameras.main.flash(120, 255, 255, 255); }
  }

  // ---- events & effects ----------------------------------------------------------------------

  private onEvent(e: GameEvent): void {
    if (e.type === 'click') { this.burst(e.value, e.combo); this.spawnBeltMacaron(true); }
    if (e.type === 'buy' || e.type === 'prestige' || e.type === 'offline' || e.type === 'reset') this.pendingRoamerRebuild = true;
    if (e.type === 'buy') abilityPrime(this.ctrl.state, e.gen, this.ctrl.now());
    if (e.type === 'buy' && e.gen === 'kitten' && !this.ctrl.state.tutorial.includes('wake')) { // onboarding: the new kitten soon dozes off, to be tapped awake
      this.time.delayedCall(2000, () => { const r = this.roamers.find((x) => x.gen === 'kitten' && (x.mode === 'idle' || x.mode === 'walk')); if (r && !this.ctrl.state.tutorial.includes('wake')) this.dozeOne(r, 120); });
    }
    if (e.type === 'offline' && e.seconds >= OFFLINE.dozeAfterSeconds) this.dozeAll = true; // back after a long while: the whole floor is asleep, tap them awake
    if (e.type === 'upgrade' || e.type === 'prestige' || e.type === 'reset') this.pendingPropRefresh = true;
    if (e.type === 'upgrade' && e.id.startsWith('equip_box_')) this.rewrapDisplay();
    if (e.type === 'buy') this.cheer(e.gen);
    if (e.type === 'prestige') { this.starShower(); this.writeDiary('prestige', ['shopcat'], e.stars); this.resetTransient(); }
    if (e.type === 'reset') this.resetTransient();
    if (e.type === 'boost') this.cameras.main.flash(300, 191, 232, 212);
    if (e.type === 'furniture' || e.type === 'prestige' || e.type === 'reset') this.pendingFurniture = true;
  }

  private heroHappyUntil = 0;
  private heroFace: 'happy' | 'laugh' = 'happy';
  private tapsSinceMeow = 0;
  private counterGfx: Phaser.GameObjects.Graphics | null = null;
  private camGfx: Phaser.GameObjects.Graphics | null = null;
  private cam = { x: 0, y: 0, w: 0, h: 0 };

  private onHeroTap(): void {
    this.ctrl.click();
    // easter egg: 12 pats within 2.5 s → rainbow cat
    const now = this.time.now;
    this.rainbowTaps = this.rainbowTaps.filter((t) => now - t < 3000); this.rainbowTaps.push(now);
    if (this.rainbowTaps.length >= 24 && now >= this.rainbowReadyAt && now >= this.rainbowUntil) this.startRainbow();
    this.tapsSinceMeow++;
    // expression follows the streak: .w. normally, >w< when pats come quickly, > ∀ < on a long streak
    const recent = this.rainbowTaps.length;
    if (recent >= 10) { this.heroFace = 'laugh'; this.heroHappyUntil = this.time.now + 700; }
    else if (recent >= 4) { this.heroFace = 'happy'; this.heroHappyUntil = this.time.now + 600; }
    this.tapsSinceMeow = 0;
    this.tweens.killTweensOf(this.hero);
    this.hero.setScale(this.heroScale).setY(this.heroY);
    this.tweens.add({ targets: this.hero, scaleX: this.heroScale * 1.1, scaleY: this.heroScale * 0.9, duration: 60, yoyo: true, ease: 'Quad.out', onComplete: () => {
      this.tweens.add({ targets: this.hero, y: this.heroY + 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    } });
  }

  private burst(value: number, combo: number): void {
    const n = Math.min(8, 2 + Math.floor(combo / 2));
    const px = this.input.activePointer.x || this.hero.x, py = this.input.activePointer.y || this.hero.y;
    for (let i = 0; i < n; i++) {
      const m = this.add.image(px, py, Phaser.Utils.Array.GetRandom(this.macaronKeys)).setScale(this.propScale).setDepth(8000);
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const dist = 50 + Math.random() * 80;
      this.tweens.add({ targets: m, x: px + Math.cos(ang) * dist, y: py + Math.sin(ang) * dist + 50, alpha: 0, angle: (Math.random() - 0.5) * 240, scale: this.propScale * 0.5, duration: 500 + Math.random() * 250, ease: 'Quad.out', onComplete: () => m.destroy() });
    }
    const t = this.floatPool.pop() ?? this.add.text(0, 0, '', { fontFamily: FONT, fontSize: '24px', fontStyle: '900', color: '#5A4038', stroke: '#FFFFFF', strokeThickness: 5 }).setOrigin(0.5).setDepth(8001);
    t.setText('+' + fmt(value)).setPosition(px + (Math.random() - 0.5) * 30, py - 30).setAlpha(1).setScale(combo > 6 ? 1.25 : 1).setVisible(true);
    this.tweens.add({ targets: t, y: py - 110, alpha: 0, duration: 800, ease: 'Quad.out', onComplete: () => { t.setVisible(false); this.floatPool.push(t); } });
  }

  private cheer(gen: string): void {
    for (const r of this.roamers) if (r.gen === gen && r.mode !== 'lie' && r.mode !== 'react') this.tweens.add({ targets: r.sprite, y: r.sprite.y - 10, duration: 120, yoyo: true, ease: 'Quad.out' });
  }

  private starShower(): void {
    const w = this.scale.width, h = this.scale.height;
    for (let i = 0; i < 28; i++) {
      const s = this.add.image(Math.random() * w, -20 - Math.random() * h * 0.5, 'star').setScale(3 + Math.random() * 2).setDepth(8500);
      this.tweens.add({ targets: s, y: h + 30, angle: 360 * (Math.random() > 0.5 ? 1 : -1), duration: 1400 + Math.random() * 800, delay: Math.random() * 400, ease: 'Quad.in', onComplete: () => s.destroy() });
    }
    this.cameras.main.flash(500, 244, 220, 154);
  }

  update(time: number, delta: number): void {
    const dt = Math.min(0.1, delta / 1000);
    if (this.pendingFurniture) this.rebuildFurniture();
    if (this.pendingRoamerRebuild) this.rebuildRoamers();
    if (this.pendingPropRefresh) this.refreshProps();
    this.shelfAcc += dt;
    if (this.shelfAcc > 1) { this.shelfAcc = 0; this.refreshShelf(); }
    this.updateBelt(dt);
    this.drawEnergyBar();
    this.reportSlack();
    // mixer whisk: spins while the bakery produces, faster right after a new batch
    const producing = this.ctrl.cps() > 0;
    const rpm = time < this.whiskBoostUntil ? 300 : producing ? 80 : 0;
    this.whisk.angle += rpm * dt;
    // oven: the window glows and flickers like a real fire; smoke rises from the top
    if (producing) {
      const target = 0.45 + Math.random() * 0.35;
      this.glow.setAlpha(Phaser.Math.Linear(this.glow.alpha, target, 0.25));
      this.warmth.setAlpha(Phaser.Math.Linear(this.warmth.alpha, 1.1 + target * 0.3, 0.08));
      this.glow2.setAlpha(Phaser.Math.Linear(this.glow2.alpha, 0.45 + Math.random() * 0.35, 0.25));
      this.smokeAcc += dt;
      if (this.smokeAcc > 0.9) { this.smokeAcc = 0; this.smoke(1); }
    } else { this.glow.setAlpha(Phaser.Math.Linear(this.glow.alpha, 0, 0.1)); this.glow2.setAlpha(Phaser.Math.Linear(this.glow2.alpha, 0, 0.1)); this.warmth.setAlpha(Phaser.Math.Linear(this.warmth.alpha, 0, 0.05)); }
    this.updateRoamers(dt, time);
    this.updateCustomer(dt, time);
    this.updateChat(dt);
    this.updatePosts();
    this.updateAbilities();
    this.updateSocial(time);
    this.updateRainbow(time, dt);
    this.updateWarp(dt, time);
    if (time < this.heroHappyUntil) {
      const key = this.heroFace === 'laugh' ? 'hero_laugh' : 'hero_happy';
      if (this.hero.texture.key !== key) this.hero.setTexture(key);
    } else if (time > this.blinkAt) {
      if (!this.heroBlinking) { this.hero.setTexture('hero_blink'); this.heroBlinking = true; this.blinkAt = time + 120; }
      else { this.hero.setTexture('hero_open'); this.heroBlinking = false; this.blinkAt = time + 1800 + Math.random() * 3000; }
    } else if (this.hero.texture.key === 'hero_happy' || this.hero.texture.key === 'hero_laugh') this.hero.setTexture('hero_open');
    this.boostOverlay.setAlpha(this.ctrl.boostActive() ? 0.12 + Math.sin(time / 250) * 0.05 : 0);
  }
}
