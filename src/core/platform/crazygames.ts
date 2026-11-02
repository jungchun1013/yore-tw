import type { PlatformAdapter, RewardedResult } from './adapter';

/* Minimal typing of the parts of the CrazyGames SDK v3 we use. */
interface CGSDK {
  init(): Promise<void>;
  game: { gameplayStart(): void; gameplayStop(): void; happytime(): void };
  ad: { requestAd(type: 'rewarded' | 'midgame', cb: { adFinished?: () => void; adError?: (e: unknown) => void; adStarted?: () => void }): void };
  data: { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void };
  banner: { requestResponsiveBanner(id: string): Promise<void>; clearAllBanners(): void };
}
declare global { interface Window { CrazyGames?: { SDK: CGSDK } } }

const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

export class CrazyGamesPlatform implements PlatformAdapter {
  readonly name = 'crazygames';
  private sdk: CGSDK | null = null;
  private adCb: ((p: boolean) => void) | null = null;

  async init(): Promise<void> {
    if (!window.CrazyGames) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = SDK_URL; s.onload = () => resolve(); s.onerror = () => reject(new Error('sdk load failed'));
        document.head.appendChild(s);
      });
    }
    this.sdk = window.CrazyGames?.SDK ?? null;
    await this.sdk?.init();
  }
  gameplayStart(): void { this.sdk?.game.gameplayStart(); }
  gameplayStop(): void { this.sdk?.game.gameplayStop(); }
  happyTime(): void { this.sdk?.game.happytime(); }
  onAdStateChange(cb: (p: boolean) => void): void { this.adCb = cb; }
  storage() {
    const d = this.sdk?.data;
    if (!d) return null;
    return { get: (k: string) => d.getItem(k), set: (k: string, v: string) => d.setItem(k, v), remove: (k: string) => d.removeItem(k) };
  }
  showRewarded(): Promise<RewardedResult> {
    const sdk = this.sdk;
    if (!sdk) return Promise.resolve('unavailable');
    return new Promise((resolve) => {
      sdk.ad.requestAd('rewarded', {
        adStarted: () => this.adCb?.(true),
        adFinished: () => { this.adCb?.(false); resolve('done'); },
        adError: () => { this.adCb?.(false); resolve('error'); },
      });
    });
  }
  async showBanner(container: HTMLElement): Promise<boolean> {
    const sdk = this.sdk;
    if (!sdk?.banner) return false;
    try { await sdk.banner.requestResponsiveBanner(container.id); return true; } catch { return false; }
  }
  showMidgame(): Promise<void> {
    const sdk = this.sdk;
    if (!sdk) return Promise.resolve();
    return new Promise((resolve) => {
      sdk.ad.requestAd('midgame', {
        adStarted: () => this.adCb?.(true),
        adFinished: () => { this.adCb?.(false); resolve(); },
        adError: () => { this.adCb?.(false); resolve(); },
      });
    });
  }
}
