import { loadPaperAtlas, loadTainanArt, paperMode } from './render/paperAtlas';
import './style.css';
import { setMusic, setSound, sfx, startMusic, stopMusic, unlockAudio } from './core/audio';
import { defaultLang, getLang, setLang, t } from './core/i18n';
import { initInput, readInput, resetInput, usedTouch } from './core/input';
import { type Save, clearedCount, freshSave, loadSave, writeSave } from './core/save';
import { HEROES, META, metaCost } from './data/passives';
import { STAGES } from './data/stages';
import { botDecide, botInput } from './game/bot';
import { STEP, choose, closeChest, createRun, reroll, step } from './game/run';
import type { HeroId } from './game/types';
import type { Run } from './game/world';
import { type View, render } from './render/scene';
import { hudBanner, hudHint, hudVisible, initHud, resetHud, updateHud } from './ui/hud';
import { type Actions, bossName, clearOverlay, initScreens, showChest, showCodex, showLevelUp, showPause, showResult, showShrine, showStages, showTitle } from './ui/screens';

type Screen = 'title' | 'stages' | 'shrine' | 'codex' | 'run';

const app = document.getElementById('app')!;
const canvas = document.createElement('canvas'); canvas.id = 'game';
const field = document.createElement('div'); field.id = 'field';
const hud = document.createElement('div'); hud.id = 'hud';
const overlay = document.createElement('div'); overlay.id = 'overlay';
app.append(canvas, field, hud, overlay);
const ctx = canvas.getContext('2d')!;

let save: Save = loadSave();
setLang(save.lang ?? defaultLang());
setSound(save.sound); setMusic(save.music);

const view: View = { w: 1, h: 1, zoom: 1, dpr: 1 };
let screen: Screen = 'title';
let run: Run | null = null;          // the run being played
let attract: Run = newAttract();     // a bot-played run behind the menus
let paused = false, ended = false;
let shownChoices: unknown = null, shownChest: unknown = null;
let acc = 0, last = performance.now();
let lastStage = 0;
let botPlays = false;
const params = new URLSearchParams(location.search);
const debug = import.meta.env.DEV || params.has('debug');

function newAttract(): Run {
  const open = Math.max(0, Math.min(STAGES.length - 1, clearedCount(save)));
  return createRun({ stage: Math.floor(Math.random() * (open + 1)), hero: 'miko', meta: { might: 5, hp: 5, armor: 3, regen: 4 }, seed: (Math.random() * 1e9) | 0, viewW: view.w / view.zoom, viewH: view.h / view.zoom });
}

function resize(): void {
  view.w = window.innerWidth; view.h = window.innerHeight;
  view.dpr = Math.min(window.devicePixelRatio || 1, 2);
  view.zoom = Math.max(0.95, Math.min(2.2, Math.sqrt((view.w * view.h) / 480000)));
  canvas.width = Math.round(view.w * view.dpr); canvas.height = Math.round(view.h * view.dpr);
  for (const r of [run, attract]) if (r) { r.viewW = view.w / view.zoom; r.viewH = view.h / view.zoom; }
}
window.addEventListener('resize', resize);
resize();

function persist(): void { writeSave(save); }

const actions: Actions = {
  toTitle() { leaveRun(); screen = 'title'; showTitle(save, actions); },
  toStages() { screen = 'stages'; showStages(save, actions, lastStage); },
  toShrine() { screen = 'shrine'; showShrine(save, actions); },
  toCodex() { screen = 'codex'; showCodex(save, actions); },
  startRun(stage, hero) { startRun(stage, hero); },
  buyMeta(id) {
    const def = META.find((m) => m.id === id);
    if (!def) return;
    const lv = save.meta[id] ?? 0, cost = metaCost(def, lv);
    if (lv >= def.max || save.coins < cost) return;
    save.coins -= cost; save.meta[id] = lv + 1; persist();
    sfx('coin');
    showShrine(save, actions);
  },
  pick(i) { if (run) { choose(run, i); syncOverlays(); } },
  reroll() { if (run && reroll(run)) { shownChoices = null; syncOverlays(); } },
  closeChest() { if (run) { closeChest(run); syncOverlays(); } },
  resume() { setPaused(false); },
  quit() { if (run && !run.over) { run.over = 'dead'; finish(); } },
  toggleSound() { save.sound = !save.sound; setSound(save.sound); persist(); refresh(); },
  toggleMusic() { save.music = !save.music; setMusic(save.music); if (save.music && screen === 'run') startMusic(); persist(); refresh(); },
  toggleLang() { setLang(getLang() === 'zh' ? 'en' : 'zh'); save.lang = getLang(); persist(); document.title = t('title'); refresh(); },
  resetSave() { save = { ...freshSave(), lang: save.lang, sound: save.sound, music: save.music }; persist(); refresh(); },
};

function refresh(): void {
  if (screen === 'title') showTitle(save, actions);
  else if (screen === 'run' && run && paused) showPause(run, save, actions);
}

function startRun(stage: number, hero: HeroId): void {
  unlockAudio();
  lastStage = stage;
  save.hero = hero; save.runs++; persist();
  run = createRun({ stage, hero, meta: save.meta, seed: (Date.now() ^ (Math.random() * 1e9)) | 0, viewW: view.w / view.zoom, viewH: view.h / view.zoom });
  screen = 'run'; paused = false; ended = false; shownChoices = shownChest = null; acc = 0;
  resetInput(); resetHud(); clearOverlay(); hudVisible(true);
  field.classList.add('on');
  hudHint(usedTouch || matchMedia('(pointer: coarse)').matches ? t('howTouch') : t('howMove'));
  window.setTimeout(() => hudHint(''), 7000);
  startMusic();
}

function leaveRun(): void {
  if (run && !ended) bank(run);
  run = null; paused = false;
  hudVisible(false); field.classList.remove('on');
  resetInput(); stopMusic();
  attract = newAttract();
}

// Moves what the run earned into the save. Coins are kept on a loss too.
function bank(r: Run): { newStage: number | null; newHero: HeroId | null } {
  ended = true;
  const before = clearedCount(save), i = r.stageIndex;
  save.coins += r.coins;
  for (const id of r.seen) if (!save.seen.includes(id)) save.seen.push(id);
  let newStage: number | null = null;
  if (r.over === 'clear') {
    if (!save.cleared[i] && i + 1 < STAGES.length) newStage = i + 1;
    save.cleared[i] = true;
  }
  if (r.bossDead) save.bossDown[i] = true;
  const best = save.best[i];
  if (!best || r.t > best.time) save.best[i] = { time: Math.min(r.t, 900), level: r.player.level, kills: r.kills };
  for (let k = 0; k < STAGES.length; k++) { save.cleared[k] = !!save.cleared[k]; save.bossDown[k] = !!save.bossDown[k]; save.best[k] = save.best[k] ?? null; }
  const after = clearedCount(save);
  const hero = HEROES.find((x) => x.unlockStage > before && x.unlockStage <= after);
  persist();
  return { newStage, newHero: hero ? hero.id : null };
}

function finish(): void {
  if (!run || ended) return;
  const coins = run.coins;
  const got = bank(run);
  stopMusic();
  resetInput();
  hudHint('');
  field.classList.remove('on');
  showResult({ run, coins, ...got }, actions);
}

function setPaused(on: boolean): void {
  if (!run || run.over || screen !== 'run') return;
  if (on && (run.choices || run.chest)) return;
  paused = on;
  resetInput();
  hudHint('');
  if (on) showPause(run, save, actions); else clearOverlay();
}

// Shows or hides the level-up / chest overlay to match the run's state.
function syncOverlays(): void {
  if (!run) return;
  if (run.over) { finish(); return; }
  if (run.chest) { if (shownChest !== run.chest) { shownChest = run.chest; showChest(run, actions); resetInput(); } return; }
  shownChest = null;
  if (run.choices) { if (shownChoices !== run.choices) { shownChoices = run.choices; showLevelUp(run, actions); resetInput(); } return; }
  if (shownChoices) { shownChoices = null; clearOverlay(); }
  else if (!paused && overlay.classList.contains('open')) clearOverlay();
}

function drain(r: Run, audible: boolean): void {
  for (const e of r.sfx) {
    if (audible) sfx(e);
    if (audible && e === 'boss') hudBanner(t('bossWarn', { s: bossName(r.stage.boss) }), 4);
    if (audible && e === 'parade') hudBanner(t('parade'), 3);
  }
  r.sfx.length = 0;
}

function frame(now: number): void {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (screen === 'run' && run) {
    if (!paused && !run.over) {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n < 6) {
        const [x, y] = botPlays ? botInput(run) : readInput();
        step(run, x, y);
        if (botPlays) botDecide(run);
        acc -= STEP; n++;
      }
      if (n === 6) acc = 0;
      drain(run, true);
      syncOverlays();
    }
    render(ctx, run, view, now / 1000);
    updateHud(run);
  } else {
    for (let i = 0; i < 2; i++) { const [x, y] = botInput(attract); step(attract, x, y); botDecide(attract); }
    drain(attract, false);
    if (attract.over) attract = newAttract();
    render(ctx, attract, view, now / 1000);
  }
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (e) => {
  if (screen !== 'run' || !run) return;
  if (e.code === 'Escape' || e.code === 'KeyP') { setPaused(!paused); e.preventDefault(); }
  else if (run.choices && /^Digit[1-4]$/.test(e.code)) actions.pick(Number(e.code.slice(5)) - 1);
  else if (run.chest && (e.code === 'Enter' || e.code === 'Space')) actions.closeChest();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });
window.addEventListener('pointerdown', unlockAudio, { once: false });

initScreens(overlay);
initHud(hud, () => setPaused(true));
initInput(field);
hudVisible(false);
document.title = t('title');
async function boot(): Promise<void> {
if (paperMode || params.has('atelier')) {
  try { await loadPaperAtlas(); } catch (error) { console.error('Paper artwork failed to load', error); }
  try { await loadTainanArt(); } catch (error) { console.error('Tainan artwork failed to load', error); }
}
if (params.has('atelier')) {
  field.style.display = 'none';
  await import('./render/atelier').then(m => m.atelier(canvas));
} else {
  showTitle(save, actions);
  requestAnimationFrame(frame);
}

}
void boot();

if (debug) {
  // test and tuning hooks: window.__ynm.fast(60) plays 60 seconds with the bot, synchronously
  (window as unknown as { __ynm: unknown }).__ynm = {
    get run() { return run; },
    get save() { return save; },
    get screen() { return screen; },
    bot(on: boolean) { botPlays = on; },
    fast(seconds: number) {
      if (!run) return;
      const until = run.t + seconds;
      while (!run.over && run.t < until) { const [x, y] = botInput(run); step(run, x, y); botDecide(run); run.sfx.length = 0; }
      shownChoices = shownChest = null;
      syncOverlays();
    },
    give(coins: number) { save.coins += coins; persist(); refresh(); },
    unlock() { for (let i = 0; i < STAGES.length; i++) save.cleared[i] = true; persist(); },
    async sheet() {
      const { contactSheet } = await import('./render/sheet');
      const cv = contactSheet();
      cv.id = 'sheet'; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99;width:1200px';
      document.body.append(cv);
    },
  };
}
