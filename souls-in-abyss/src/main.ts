import './style.css';
import { installFontSnapping } from './ui/pixelfont';
import { Game } from './game/engine';
import { OFFLINE_CAP, loadSave, newSave, writeSave } from './game/state';
import { App, creation } from './ui/app';
import { lang, t } from './core/i18n';
import { num } from './core/fmt';
import { preloadArt } from './ui/sprites';

installFontSnapping();
const root = document.getElementById('app')!;
document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';
document.title = lang === 'zh' ? '輪迴無止盡 Souls in Abyss' : 'Souls in Abyss';

function start(save: ReturnType<typeof newSave>, fresh: boolean): void {
  const g = new Game(save);
  const app = new App(g, root);
  (window as any).__game = g; // handy for tests and the console
  preloadArt('bg.' + save.area);

  if (!fresh) {
    const away = Math.min(OFFLINE_CAP, (Date.now() - save.lastSeen) / 1000);
    if (away > 60) {
      const r = g.fastForward(away);
      app.addLog(lang === 'zh'
        ? `${t('offline')}（${Math.round(away / 60)} 分）：擊倒 ${num(r.kills)}、+${num(r.gold)} 金、升 ${r.xpLv} 級`
        : `${t('offline')} (${Math.round(away / 60)} min): ${num(r.kills)} kills, +${num(r.gold)} g, +${r.xpLv} levels`, 'fate');
    }
  }
  app.addLog(lang === 'zh' ? '冒險繼續。' : 'The adventure goes on.', 'dim');

  let last = performance.now(), acc = 0, panelT = 0;
  const STEP = 0.05;
  const loop = (now: number) => {
    const dt = Math.min(1, (now - last) / 1000); last = now;
    acc += dt;
    while (acc >= STEP) { g.tick(STEP); acc -= STEP; }
    app.frame(dt);
    panelT += dt;
    if (panelT > 0.4) { panelT = 0; app.render(); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // background tabs throttle rAF; catch up with coarse steps so idle time still counts
  setInterval(() => {
    const gap = (performance.now() - last) / 1000;
    if (gap > 2) { g.fastForward(Math.min(gap, OFFLINE_CAP)); last = performance.now(); }
  }, 2000);

  const persist = () => { if (!(window as any).__noSave) writeSave(g.s); };
  setInterval(persist, 10000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
  window.addEventListener('pagehide', persist);
}

const existing = loadSave();
if (existing) start(existing, false);
else creation(root, (name, race, age) => { root.innerHTML = ''; const s = newSave(name, race, age); writeSave(s); start(s, true); });
