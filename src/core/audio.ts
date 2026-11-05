/** Tiny WebAudio synth so the game ships without audio files. */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  enabled = true;
  muted = false;

  private ensure(): AudioContext | null {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.25;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'sine', when = 0, gain = 1): void {
    if (!this.enabled || this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  /** Synthesised meow: a sawtooth glide up then down through a sweeping low-pass. pitch 1 = adult cat, 1.4 = kitten. */
  meow(pitch = 1, dur = 0.45): void {
    if (!this.enabled || this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime;
    const f0 = 380 * pitch, fPeak = 720 * pitch, fEnd = 340 * pitch;
    const osc = ctx.createOscillator(); osc.type = 'sawtooth';
    const osc2 = ctx.createOscillator(); osc2.type = 'sine';
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.Q.value = 2.5;
    const g = ctx.createGain();
    for (const [o, mul] of [[osc, 1], [osc2, 2]] as const) {
      o.frequency.setValueAtTime(f0 * mul, t0);
      o.frequency.linearRampToValueAtTime(fPeak * mul, t0 + dur * 0.3);
      o.frequency.setValueAtTime(fPeak * mul, t0 + dur * 0.55);
      o.frequency.exponentialRampToValueAtTime(fEnd * mul, t0 + dur);
    }
    filt.frequency.setValueAtTime(900 * pitch, t0);
    filt.frequency.linearRampToValueAtTime(2200 * pitch, t0 + dur * 0.35);
    filt.frequency.exponentialRampToValueAtTime(700 * pitch, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.04);
    g.gain.setValueAtTime(0.5, t0 + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    osc.connect(filt); osc2.connect(g2).connect(filt); filt.connect(g).connect(this.master);
    osc.start(t0); osc2.start(t0); osc.stop(t0 + dur + 0.05); osc2.stop(t0 + dur + 0.05);
  }

  /** A soft hiss: band-passed noise burst. */
  hiss(): void {
    if (!this.enabled || this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const dur = 0.35;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 0.8;
    const g = ctx.createGain();
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  /** A crisp little crunch (喀): a very short band-passed noise tick, for a cat biting a macaron. */
  crunch(pitch = 1): void {
    if (!this.enabled || this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const dur = 0.06;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900 * pitch; bp.Q.value = 1.2;
    const g = ctx.createGain();
    const t0 = ctx.currentTime;
    g.gain.setValueAtTime(0.55, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp).connect(g).connect(this.master);
    src.start(t0); src.stop(t0 + dur + 0.01);
  }

  /** Soft "boing" (ㄉㄨㄞ): a sine that drops quickly in pitch with a little wobble, like poking jelly. */
  boing(pitch = 1): void {
    if (!this.enabled || this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime, dur = 0.22;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(620 * pitch, t0);
    o.frequency.exponentialRampToValueAtTime(190 * pitch, t0 + 0.13);
    o.frequency.linearRampToValueAtTime(240 * pitch, t0 + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.7, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  /** An original little 8-bit "nya nya nya" jingle (not the famous one): two bars of square-wave arpeggio, looped 4×. */
  nyan(): void {
    if (!this.enabled || this.muted) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const bpm = 168, beat = 60 / bpm / 2; // eighth notes
    const n = (semi: number) => 440 * Math.pow(2, (semi - 9) / 12); // semitone from C4=0
    const bar = [12, 16, 19, 16, 21, 19, 16, 14, 12, 16, 19, 23, 21, 19, 16, 19]; // C5 E5 G5 E5 A5 G5 E5 D5 ...
    const bass = [0, 0, 7, 7, 5, 5, 7, 7];
    const t0 = ctx.currentTime + 0.05;
    for (let rep = 0; rep < 4; rep++) {
      bar.forEach((semi, i) => {
        const t = t0 + (rep * bar.length + i) * beat;
        const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = n(semi + (rep % 2 ? 2 : 0));
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 0.9);
        o.connect(g).connect(this.master!); o.start(t); o.stop(t + beat);
      });
      bass.forEach((semi, i) => {
        const t = t0 + (rep * bar.length + i * 2) * beat;
        const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = n(semi - 12);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + beat * 1.8);
        o.connect(g).connect(this.master!); o.start(t); o.stop(t + beat * 2);
      });
    }
  }

  /** Sleepy little "mrrp". */
  mrrp(): void { this.tone(230, 0.12, 'triangle', 0, 0.5); this.tone(300, 0.14, 'triangle', 0.1, 0.5); this.tone(210, 0.18, 'triangle', 0.22, 0.4); }

  click(combo = 0): void { this.tone(520 + Math.min(combo, 12) * 30, 0.07, 'triangle', 0, 0.6); }
  buy(): void { this.tone(660, 0.08, 'sine'); this.tone(880, 0.12, 'sine', 0.07); }
  upgrade(): void { this.tone(523, 0.08); this.tone(659, 0.08, 'sine', 0.08); this.tone(784, 0.16, 'sine', 0.16); }
  achievement(): void { this.tone(784, 0.1, 'triangle'); this.tone(1047, 0.2, 'triangle', 0.1); }
  prestige(): void { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.25, 'sine', i * 0.09)); }
  error(): void { this.tone(180, 0.1, 'square', 0, 0.3); }
}

export const sfx = new Sfx();
