import type { PlatformAdapter } from './adapter';
import { MockPlatform } from './mock';
import { CrazyGamesPlatform } from './crazygames';
import { AdSensePlatform, adsenseClient } from './adsense';

export function detectPlatform(): PlatformAdapter {
  const q = new URLSearchParams(location.search).get('platform');
  const host = location.hostname;
  // CrazyGames: their domains, their SDK already on the page, or the game framed by their site (review and QA previews)
  const framedByCg = (() => { try { return /crazygames\.com/.test(document.referrer) || (window.top !== window.self && /crazygames\.com/.test(document.location.ancestorOrigins?.[0] ?? '')); } catch { return false; } })();
  if (q === 'crazygames' || /crazygames\.com$/.test(host) || !!window.CrazyGames || framedByCg) return new CrazyGamesPlatform();
  // own domain: AdSense H5 Games Ads when a publisher id is configured in index.html
  if (q === 'adsense' || (q !== 'mock' && adsenseClient())) return new AdSensePlatform();
  return new MockPlatform();
}
export type { PlatformAdapter };
