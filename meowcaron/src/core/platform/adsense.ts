import type { PlatformAdapter, RewardedResult } from './adapter';

/**
 * Own-domain adapter: Google AdSense "H5 Games Ads" (Ad Placement API) for rewarded / interstitial breaks,
 * plus a regular responsive display unit for the banner slot.
 * Configured through <meta> tags in index.html so the same build works with or without an approved account:
 *   <meta name="mc-adsense-client" content="ca-pub-XXXXXXXXXXXXXXXX">
 *   <meta name="mc-adsense-banner-slot" content="1234567890">   (optional: the display ad unit for the banner)
 * Without a client id the game runs ad-free (rewards are granted after a short placeholder, see MockPlatform).
 */
type AdBreak = (opts: Record<string, unknown>) => void;
declare global { interface Window { adsbygoogle?: unknown[] & { loaded?: boolean }; adBreak?: AdBreak; adConfig?: (o: Record<string, unknown>) => void } }

export function adsenseClient(): string { return document.querySelector<HTMLMetaElement>('meta[name="mc-adsense-client"]')?.content.trim() ?? ''; }

export class AdSensePlatform implements PlatformAdapter {
  readonly name = 'adsense';
  private adCb: ((p: boolean) => void) | null = null;
  private ready = false;

  async init(): Promise<void> {
    const client = adsenseClient();
    if (!client) return;
    await new Promise<void>((resolve) => {
      const s = document.createElement('script');
      s.async = true; s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
      s.dataset.adFrequencyHint = '120s';
      s.onload = () => resolve(); s.onerror = () => resolve();
      document.head.appendChild(s);
    });
    window.adsbygoogle = window.adsbygoogle || [];
    // the Ad Placement API exposes adBreak / adConfig once the script runs
    window.adBreak = window.adBreak || ((o: Record<string, unknown>) => { (window.adsbygoogle as unknown[]).push(o); });
    window.adConfig = window.adConfig || ((o: Record<string, unknown>) => { (window.adsbygoogle as unknown[]).push(o); });
    window.adConfig({ preloadAdBreaks: 'on', sound: 'on', onReady: () => { this.ready = true; } });
    this.ready = true;
  }
  gameplayStart(): void { /* no-op */ }
  gameplayStop(): void { /* no-op */ }
  happyTime(): void { /* no-op */ }
  onAdStateChange(cb: (p: boolean) => void): void { this.adCb = cb; }
  storage() { return null; }

  showRewarded(): Promise<RewardedResult> {
    if (!this.ready || !window.adBreak) return Promise.resolve('unavailable');
    return new Promise((resolve) => {
      let viewed = false, shown = false;
      window.adBreak!({
        type: 'reward', name: 'catnip_rush',
        beforeReward: (showAdFn: () => void) => { shown = true; this.adCb?.(true); showAdFn(); },
        adViewed: () => { viewed = true; },
        adDismissed: () => { viewed = false; },
        adBreakDone: (info: { breakStatus?: string }) => { this.adCb?.(false); resolve(viewed ? 'done' : shown || info?.breakStatus === 'viewed' ? 'error' : 'unavailable'); },
      });
    });
  }
  showMidgame(): Promise<void> {
    if (!this.ready || !window.adBreak) return Promise.resolve();
    return new Promise((resolve) => {
      window.adBreak!({ type: 'next', name: 'new_shop', beforeAd: () => this.adCb?.(true), afterAd: () => this.adCb?.(false), adBreakDone: () => { this.adCb?.(false); resolve(); } });
    });
  }
  async showBanner(container: HTMLElement): Promise<boolean> {
    const client = adsenseClient();
    const slot = document.querySelector<HTMLMetaElement>('meta[name="mc-adsense-banner-slot"]')?.content.trim();
    if (!client || !slot) return false;
    container.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${client}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); return true; } catch { return false; }
  }
}
