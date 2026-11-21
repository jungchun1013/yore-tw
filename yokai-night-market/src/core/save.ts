import type { HeroId, Lang } from '../game/types';

export interface Best { time: number; level: number; kills: number }
export interface Save {
  v: 1;
  coins: number;
  meta: Record<string, number>;
  cleared: boolean[];
  bossDown: boolean[];
  best: (Best | null)[];
  seen: string[];
  hero: HeroId;
  lang: Lang | null;
  sound: boolean;
  music: boolean;
  runs: number;
  pack: string[];   // snacks bought for the next run
  placed: { key: string; gx: number; gy: number; flip?: boolean; surface?: 'floor' | 'wall' }[];   // furniture on the street
  bond: Record<string, number>;   // times each character was treated at a stall
}

const KEY = 'yokai-night-market-paper.save.v1';

export function freshSave(): Save {
  return { v: 1, coins: 0, meta: {}, cleared: [], bossDown: [], best: [], seen: [], hero: 'miko', lang: null, sound: true, music: true, runs: 0, pack: [], placed: [], bond: {} };
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<Save>;
      if (data && data.v === 1) return { ...freshSave(), ...data };
    }
  } catch { /* storage blocked or corrupt: start fresh */ }
  return freshSave();
}

export function writeSave(s: Save): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: play without saving */ }
}

export function clearedCount(s: Save): number {
  let n = 0;
  for (const c of s.cleared) if (c) n++;
  return n;
}
