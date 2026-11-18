// All sound is synthesised with WebAudio: no audio files. A plucked in-scale loop with a
// slow drum stands in for music.
import type { SfxEvent } from '../game/types';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let soundOn = true, musicOn = true;
let musicTimer = 0, nextBeat = 0, beat = 0;
let gemStreak = 0, gemLast = 0;
const last: Partial<Record<SfxEvent, number>> = {};

// D in-scale across two octaves: D Eb G A C
const SCALE = [293.66, 311.13, 392.0, 440.0, 523.25, 587.33, 622.25, 783.99, 880.0];

export function unlockAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

export function setSound(on: boolean): void { soundOn = on; }
export function setMusic(on: boolean): void { musicOn = on; if (!on) stopMusic(); }

function tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, slideTo?: number, out: AudioNode | null = master): void {
  if (!ctx || !out) return;
  const t0 = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(out);
  o.start(t0); o.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol: number, cutoff: number, when = 0, out: AudioNode | null = master): void {
  if (!ctx || !out) return;
  const t0 = ctx.currentTime + when;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(out);
  src.start(t0);
}

const GAP: Partial<Record<SfxEvent, number>> = { hit: 0.06, kill: 0.05, gem: 0.04, boom: 0.08, hurt: 0.15, coin: 0.05 };

export function sfx(e: SfxEvent): void {
  if (!ctx || !soundOn) return;
  const now = ctx.currentTime;
  if (now - (last[e] ?? -1) < (GAP[e] ?? 0)) return;
  last[e] = now;
  switch (e) {
    case 'hit': noise(0.04, 0.12, 2400); break;
    case 'kill': tone(320, 0.08, 'sine', 0.14, 0, 140); break;
    case 'gem':
      gemStreak = now - gemLast < 0.6 ? Math.min(gemStreak + 1, SCALE.length - 1) : 0; gemLast = now;
      tone(SCALE[gemStreak] * 2, 0.09, 'triangle', 0.12);
      break;
    case 'coin': tone(1318, 0.07, 'square', 0.06); tone(1760, 0.12, 'square', 0.06, 0.06); break;
    case 'level': [0, 2, 3, 5, 7].forEach((n, i) => tone(SCALE[n], 0.28, 'triangle', 0.2, i * 0.07)); break;
    case 'hurt': tone(150, 0.16, 'square', 0.16, 0, 70); noise(0.08, 0.2, 900); break;
    case 'boom': noise(0.26, 0.34, 700); tone(90, 0.2, 'sine', 0.3, 0, 40); break;
    case 'chest': [2, 3, 5, 7, 8].forEach((n, i) => tone(SCALE[n], 0.34, 'triangle', 0.2, i * 0.09)); break;
    case 'boss': [0, 0.28, 0.56].forEach((w) => { tone(82, 0.4, 'sine', 0.5, w, 44); noise(0.12, 0.3, 500, w); }); break;
    case 'heal': tone(392, 0.2, 'sine', 0.16, 0, 587); break;
    case 'evolve': [0, 3, 5, 7, 8, 7, 8].forEach((n, i) => tone(SCALE[n] * 2, 0.22, 'triangle', 0.14, i * 0.06)); break;
    case 'clear': [0, 2, 3, 5, 3, 5, 7].forEach((n, i) => tone(SCALE[n], 0.5, 'triangle', 0.22, i * 0.16)); break;
    case 'dead': [5, 4, 2, 1, 0].forEach((n, i) => tone(SCALE[n] / 2, 0.5, 'triangle', 0.22, i * 0.2)); break;
    case 'parade': [7, 8, 7, 5, 7, 8].forEach((n, i) => tone(SCALE[n], 0.16, 'sine', 0.16, i * 0.11)); break;
  }
}

// A sparse 16-step phrase; the note choice drifts with the bar number so it does not loop exactly.
const PHRASE = [0, -1, 3, -1, 2, -1, 5, 3, -1, 2, -1, 0, 1, -1, 3, -1];

function schedule(): void {
  if (!ctx || !musicGain) return;
  while (nextBeat < ctx.currentTime + 0.25) {
    const when = Math.max(0, nextBeat - ctx.currentTime);
    const step = beat % 16, bar = Math.floor(beat / 16);
    let n = PHRASE[(step + (bar % 4 === 3 ? 5 : 0)) % 16];
    if (n >= 0) {
      if (bar % 2 === 1 && step % 4 === 2) n = Math.min(SCALE.length - 1, n + 2);
      tone(SCALE[n], 0.9, 'triangle', 0.16, when, undefined, musicGain);
      tone(SCALE[n] * 2.005, 0.3, 'sine', 0.04, when, undefined, musicGain);
    }
    if (step % 8 === 0) tone(73.4, 0.5, 'sine', 0.4, when, 46, musicGain);
    if (step % 8 === 6) noise(0.05, 0.12, 1600, when, musicGain);
    nextBeat += 0.3;
    beat++;
  }
}

export function startMusic(): void {
  if (!ctx || !musicOn || musicTimer) return;
  nextBeat = ctx.currentTime + 0.1;
  musicTimer = window.setInterval(schedule, 100);
}

export function stopMusic(): void {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = 0; }
}
