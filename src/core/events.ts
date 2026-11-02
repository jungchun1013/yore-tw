export interface AnalyticsEvent { name: string; t: number; props?: Record<string, unknown> }

type Listener = (e: AnalyticsEvent) => void;

/** Tiny analytics bus: buffers events in memory, exposes them for tests and platform adapters. */
export class Analytics {
  readonly events: AnalyticsEvent[] = [];
  private listeners: Listener[] = [];
  private readonly max = 500;

  track(name: string, props?: Record<string, unknown>): void {
    const e: AnalyticsEvent = { name, t: Date.now(), props };
    this.events.push(e);
    if (this.events.length > this.max) this.events.shift();
    for (const l of this.listeners) l(e);
  }

  on(l: Listener): () => void {
    this.listeners.push(l);
    return () => { this.listeners = this.listeners.filter((x) => x !== l); };
  }
}

export const analytics = new Analytics();
