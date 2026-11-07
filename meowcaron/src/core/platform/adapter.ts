export type RewardedResult = 'done' | 'unavailable' | 'error';

export interface PlatformAdapter {
  readonly name: string;
  init(): Promise<void>;
  gameplayStart(): void;
  gameplayStop(): void;
  /** Signal a celebratory moment (CrazyGames "happytime"). */
  happyTime(): void;
  /** Show a rewarded ad; resolves when the reward should be granted or not. */
  showRewarded(): Promise<RewardedResult>;
  /** Show an interstitial at a natural break. Never blocks progression. */
  showMidgame(): Promise<void>;
  /** Hooks so the game can mute audio while an ad plays. */
  onAdStateChange(cb: (playing: boolean) => void): void;
  /** Request a banner ad into the given container; resolves false when no ad will be shown. */
  showBanner(container: HTMLElement): Promise<boolean>;
  /** Platform persistent storage if available, else null to use localStorage. */
  storage(): { get(k: string): string | null; set(k: string, v: string): void; remove(k: string): void } | null;
}
