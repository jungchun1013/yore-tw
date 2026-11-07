import type { PlatformAdapter, RewardedResult } from './adapter';

/** Development adapter: rewarded ads show a 1.5s placeholder overlay, everything else is a no-op. */
export class MockPlatform implements PlatformAdapter {
  readonly name = 'mock';
  private adCb: ((p: boolean) => void) | null = null;
  async init(): Promise<void> { /* nothing */ }
  gameplayStart(): void { /* nothing */ }
  gameplayStop(): void { /* nothing */ }
  happyTime(): void { /* nothing */ }
  onAdStateChange(cb: (p: boolean) => void): void { this.adCb = cb; }
  storage() { return null; }
  showRewarded(): Promise<RewardedResult> {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'mock-ad';
      el.innerHTML = '<div>Rewarded ad placeholder<br><small>(replaced by the platform SDK in production)</small></div>';
      document.body.appendChild(el);
      this.adCb?.(true);
      setTimeout(() => { el.remove(); this.adCb?.(false); resolve('done'); }, 1500);
    });
  }
  async showMidgame(): Promise<void> { /* no interstitials in dev */ }
  async showBanner(container: HTMLElement): Promise<boolean> {
    // the placeholder only appears in development / localhost; on a public domain without ads the slot stays hidden
    const dev = import.meta.env.DEV || /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || new URLSearchParams(location.search).get('platform') === 'mock';
    if (!dev) return false;
    container.innerHTML = '<div class="ad-placeholder">Ad space · 320×50 / responsive<br><small>filled by the platform SDK after Full Launch</small></div>';
    return true;
  }
}
