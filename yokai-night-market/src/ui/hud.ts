// In-run HUD. DOM is only touched when a shown value changes.
import { clock, t } from '../core/i18n';
import { RUN_SECONDS } from '../data/stages';
import type { Run } from '../game/world';
import { h, icon } from './screens';

let root: HTMLElement;
let xpFill: HTMLElement, lvEl: HTMLElement, timeEl: HTMLElement, killEl: HTMLElement, coinEl: HTMLElement;
let slots: HTMLElement, bossBox: HTMLElement, bossFill: HTMLElement, bossLabel: HTMLElement, banner: HTMLElement, hint: HTMLElement;
let hpFill: HTMLElement;
const shown: Record<string, string> = {};
let bannerUntil = 0;

function set(key: string, value: string, apply: (v: string) => void): void {
  if (shown[key] !== value) { shown[key] = value; apply(value); }
}

export function initHud(el: HTMLElement, onPause: () => void): void {
  root = el;
  xpFill = h('i', '');
  lvEl = h('span', 'hud-lv');
  timeEl = h('div', 'hud-time');
  killEl = h('span', '');
  coinEl = h('span', '');
  slots = h('div', 'hud-slots');
  bossFill = h('i', '');
  bossLabel = h('div', 'boss-label');
  bossBox = h('div', 'hud-boss', bossLabel, h('div', 'boss-bar', bossFill));
  banner = h('div', 'hud-banner');
  hint = h('div', 'hud-hint');
  hpFill = h('i', '');
  const pause = h('button', 'hud-pause', h('i', ''), h('i', '')) as HTMLButtonElement;
  pause.type = 'button'; pause.dataset.id = 'pause'; pause.setAttribute('aria-label', 'pause');
  pause.addEventListener('click', onPause);
  pause.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.append(
    h('div', 'hud-xp', xpFill, lvEl),
    h('div', 'hud-row',
      h('div', 'hud-left', h('div', 'hud-hp', hpFill), slots),
      h('div', 'hud-mid', timeEl, bossBox),
      h('div', 'hud-right', h('div', 'hud-count', icon('i_skull', 'ic sm'), killEl), h('div', 'hud-count', icon('i_coin', 'ic sm'), coinEl), pause),
    ),
    banner, hint,
  );
}

export function hudVisible(on: boolean): void { root.style.display = on ? '' : 'none'; }

export function hudBanner(text: string, seconds = 3): void {
  banner.textContent = text;
  banner.classList.add('on');
  bannerUntil = performance.now() + seconds * 1000;
}

export function hudHint(text: string): void {
  hint.textContent = text;
  hint.classList.toggle('on', !!text);
}

export function updateHud(run: Run): void {
  const p = run.player;
  set('xp', (Math.min(1, p.xp / p.xpNext) * 100).toFixed(1), (v) => { xpFill.style.width = `${v}%`; });
  set('lv', String(p.level), (v) => { lvEl.textContent = t('lv', { n: v }); });
  set('hp', (Math.max(0, p.hp / p.maxHp) * 100).toFixed(0), (v) => { hpFill.style.width = `${v}%`; });
  set('time', clock(Math.min(run.t, RUN_SECONDS)), (v) => { timeEl.textContent = v; });
  set('kills', String(run.kills), (v) => { killEl.textContent = v; });
  set('coins', String(run.coins), (v) => { coinEl.textContent = v; });
  const key = run.weapons.map((w) => `${w.id}${w.level}${w.evolved ? 'e' : ''}`).join(',') + '|' + run.passives.map((q) => `${q.id}${q.level}`).join(',');
  set('slots', key, () => {
    const a = h('div', 'slot-row'), b = h('div', 'slot-row');
    for (const w of run.weapons) a.append(h('div', `slot${w.evolved ? ' evo' : ''}`, icon(`i_${w.id}`, 'ic'), h('span', '', String(w.level))));
    for (const q of run.passives) b.append(h('div', 'slot', icon(`i_${q.id}`, 'ic'), h('span', '', String(q.level))));
    slots.replaceChildren(a, b);
  });
  const boss = run.boss;
  set('boss', boss ? '1' : '0', (v) => { bossBox.classList.toggle('on', v === '1'); if (boss) bossLabel.textContent = boss.def.name[document.documentElement.lang === 'en' ? 'en' : 'zh']; });
  if (boss) set('bossHp', (Math.max(0, boss.hp / boss.maxHp) * 100).toFixed(1), (v) => { bossFill.style.width = `${v}%`; });
  if (bannerUntil && performance.now() > bannerUntil) { bannerUntil = 0; banner.classList.remove('on'); }
}

export function resetHud(): void {
  for (const k of Object.keys(shown)) delete shown[k];
  banner.classList.remove('on'); bannerUntil = 0;
  bossBox.classList.remove('on');
}
