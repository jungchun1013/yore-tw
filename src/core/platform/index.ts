import type { PlatformAdapter } from './adapter';
import { MockPlatform } from './mock';
import { CrazyGamesPlatform } from './crazygames';
import { AdSensePlatform, adsenseClient } from './adsense';

export function detectPlatform(): PlatformAdapter {
  const q = new URLSearchParams(location.search).get('platform');
  const host = location.hostname;
  if (q === 'crazygames' || /crazygames\.com$/.test(host)) return new CrazyGamesPlatform();
  // own domain: AdSense H5 Games Ads when a publisher id is configured in index.html
  if (q === 'adsense' || (q !== 'mock' && adsenseClient())) return new AdSensePlatform();
  return new MockPlatform();
}
export type { PlatformAdapter };
