import { GameController } from './core/controller';
import { analytics } from './core/events';
import { localStorageAdapter } from './core/save';
import { detectPlatform } from './core/platform';
import { startPhaser } from './game/main';
import { initPanel, showOfflineModal } from './ui/panel';
import { initTooltip } from './ui/dom';
import { initTutorial } from './ui/tutorial';
import * as sprites from './game/sprites/pixel';
import { applyStatic } from './i18n';
import { UPGRADES, STAR_UPGRADES } from './content/upgrades';
import { CATS } from './content/cats';
import { ACHIEVEMENTS } from './content/achievements';
import { FURNITURE_ITEMS } from './content/furniture';
import * as i18n from './i18n';
import { fmt } from './core/format';

declare global { interface Window { __mc?: { ctrl: GameController; analytics: typeof analytics; sprites: typeof sprites; content: { UPGRADES: typeof UPGRADES; STAR_UPGRADES: typeof STAR_UPGRADES; CATS: typeof CATS; ACHIEVEMENTS: typeof ACHIEVEMENTS; FURNITURE_ITEMS: typeof FURNITURE_ITEMS; fmt: typeof fmt }; i18n: typeof i18n; hero?: () => { x: number; y: number }; debug?: { spawnCustomer(): void; customer(): { x: number; y: number; mode: string; species: string } | null; roamer(): { x: number; y: number; gen: string } | null; bless(): void; timeSkip(): void; shootStar(): { x: number; y: number } | null; star(): { x: number; y: number } | null; social(kind: string): boolean; furniture(): string[]; climber(): { y: number; mode: string } | null; napper(): { x: number; y: number; gen: string } | null; play(): boolean; eat(): boolean; scene(): unknown; hits(x: number, y: number): Record<string, unknown>[]; eater(): { x: number; y: number; gen: string } | null; windower(): Record<string, unknown> | null; rainbow(): void } } } }

async function boot(): Promise<void> {
  const platform = detectPlatform();
  try { await platform.init(); } catch (e) { console.warn('platform init failed, continuing', e); }
  const storage = platform.storage() ?? localStorageAdapter;
  const ctrl = new GameController(storage, platform, analytics);
  window.__mc = { ctrl, analytics, sprites, content: { UPGRADES, STAR_UPGRADES, CATS, ACHIEVEMENTS, FURNITURE_ITEMS, fmt }, i18n };
  if (import.meta.env.DEV) analytics.on((e) => console.debug('[analytics]', e.name, e.props ?? ''));

  ctrl.computeOffline();
  applyStatic();
  initTooltip();
  initPanel(ctrl);
  startPhaser(ctrl);
  initTutorial(ctrl);
  if (ctrl.pendingOffline) showOfflineModal(ctrl);
  ctrl.start();

  // Banner slot at the bottom of the panel: a placeholder in dev, a real responsive banner through the platform SDK.
  const banner = document.getElementById('ad-banner');
  if (banner) platform.showBanner(banner).then((ok) => { banner.hidden = !ok; analytics.track('banner', { shown: ok }); });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { ctrl.pause(); return; }
    // The loop is paused while hidden; credit the gap as offline time, then resume.
    ctrl.computeOffline();
    if (ctrl.pendingOffline) showOfflineModal(ctrl);
    ctrl.resume();
  });
  window.addEventListener('pagehide', () => ctrl.save());
  window.addEventListener('beforeunload', () => ctrl.save());
}

void boot();
