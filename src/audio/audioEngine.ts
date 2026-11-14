import type { AmbientMix } from './ambientMix';

export type Sfx =
  'place' | 'road' | 'demolish' | 'upgrade' | 'decline' | 'error' | 'chapter' | 'click';

/** Shortest gap between two plays of the same sound, seconds (a road drag places dozens). */
const MIN_GAP: Record<Sfx, number> = {
  place: 0.06,
  road: 0.05,
  demolish: 0.08,
  upgrade: 0.25,
  decline: 0.4,
  error: 0.2,
  chapter: 1,
  click: 0.04,
};

interface Bed {
  gain: GainNode;
  level: number;
}

/**
 * All game audio, synthesised with WebAudio (no sound files to download). The context starts on
 * the first user gesture, as browsers require; until then every call is a no-op.
 */
export class AudioEngine {
  private ctx: AudioContext | undefined;
  private master: GainNode | undefined;
  private noise: AudioBuffer | undefined;
  private beds = new Map<keyof AmbientMix, Bed>();
  private last = new Map<Sfx, number>();
  private mix: AmbientMix = { wind: 0, birds: 0, crickets: 0, water: 0, town: 0 };
  private chirpClock = 0;
  private volumeValue: number;
  private mutedValue: boolean;

  constructor(opts: { volume: number; muted: boolean }) {
    this.volumeValue = opts.volume;
    this.mutedValue = opts.muted;
  }

  /** Starts audio on the first gesture anywhere in the page. */
  attach(target: Window): void {
    const start = (): void => {
      target.removeEventListener('pointerdown', start, true);
      target.removeEventListener('keydown', start, true);
      this.start();
    };
    target.addEventListener('pointerdown', start, true);
    target.addEventListener('keydown', start, true);
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  get started(): boolean {
    return this.ctx !== undefined;
  }

  get volume(): number {
    return this.volumeValue;
  }

  set volume(v: number) {
    this.volumeValue = Math.min(1, Math.max(0, v));
    this.applyMaster();
  }

  get muted(): boolean {
    return this.mutedValue;
  }

  set muted(m: boolean) {
    this.mutedValue = m;
    this.applyMaster();
  }

  start(): void {
    if (this.ctx) return;
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = (this.ctx = new Ctx());
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    this.applyMaster();
    // Two seconds of white noise, looped by every noise bed.
    const n = (this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate));
    const data = n.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.bed('wind', 'lowpass', 380, 0.7, 0.16, 0.07);
    this.bed('water', 'bandpass', 950, 0.6, 0.12, 0.23);
    this.bed('town', 'bandpass', 320, 1.2, 0.09, 0.11);
    this.setAmbient(this.mix);
  }

  private applyMaster(): void {
    if (!this.ctx || !this.master) return;
    const v = this.mutedValue ? 0 : this.volumeValue * 0.8;
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  /** A looped, filtered noise bed whose loudness breathes slowly (an LFO on its gain). */
  private bed(
    name: keyof AmbientMix,
    type: BiquadFilterType,
    freq: number,
    q: number,
    level: number,
    lfoHz: number,
  ): void {
    const ctx = this.ctx as AudioContext;
    const src = ctx.createBufferSource();
    src.buffer = this.noise as AudioBuffer;
    src.loop = true;
    src.loopStart = Math.random();
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const breath = ctx.createGain();
    breath.gain.value = 0.75;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = lfoHz;
    const depth = ctx.createGain();
    depth.gain.value = 0.25;
    lfo.connect(depth).connect(breath.gain);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src
      .connect(f)
      .connect(breath)
      .connect(gain)
      .connect(this.master as GainNode);
    src.start();
    lfo.start();
    this.beds.set(name, { gain, level });
  }

  /** Sets the ambient mix; beds glide to it over about a second. */
  setAmbient(mix: AmbientMix): void {
    this.mix = mix;
    if (!this.ctx) return;
    for (const [name, bed] of this.beds) {
      bed.gain.gain.setTargetAtTime(mix[name] * bed.level, this.ctx.currentTime, 0.6);
    }
  }

  /** Birds and crickets are short synthesised calls scattered in time; call every frame. */
  update(dt: number): void {
    if (!this.ctx || this.mutedValue || this.ctx.state !== 'running') return;
    this.chirpClock += dt;
    if (this.chirpClock < 0.25) return;
    this.chirpClock = 0;
    if (Math.random() < this.mix.birds * 0.35) this.bird();
    if (Math.random() < this.mix.crickets * 0.6) this.cricket();
  }

  private env(at: number, peak: number, attack: number, decay: number): GainNode {
    const ctx = this.ctx as AudioContext;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    g.connect(this.master as GainNode);
    return g;
  }

  private tone(
    type: OscillatorType,
    from: number,
    to: number,
    at: number,
    peak: number,
    attack: number,
    decay: number,
  ): void {
    const ctx = this.ctx as AudioContext;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, at);
    if (to !== from) o.frequency.exponentialRampToValueAtTime(to, at + attack + decay);
    o.connect(this.env(at, peak, attack, decay));
    o.start(at);
    o.stop(at + attack + decay + 0.05);
  }

  private noiseHit(at: number, freq: number, toFreq: number, peak: number, decay: number): void {
    const ctx = this.ctx as AudioContext;
    const src = ctx.createBufferSource();
    src.buffer = this.noise as AudioBuffer;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freq, at);
    f.frequency.exponentialRampToValueAtTime(toFreq, at + decay);
    src.connect(f).connect(this.env(at, peak, 0.005, decay));
    src.start(at, Math.random());
    src.stop(at + decay + 0.05);
  }

  private bird(): void {
    const at = (this.ctx as AudioContext).currentTime;
    const base = 2200 + Math.random() * 1600;
    const notes = 1 + Math.floor(Math.random() * 3);
    const peak = 0.03 * this.mix.birds + 0.01;
    for (let i = 0; i < notes; i++) {
      const t0 = at + i * (0.09 + Math.random() * 0.05);
      this.tone('sine', base * (1 + Math.random() * 0.2), base * 1.45, t0, peak, 0.01, 0.07);
    }
  }

  private cricket(): void {
    const at = (this.ctx as AudioContext).currentTime;
    const f = 4000 + Math.random() * 900;
    const peak = 0.012 * this.mix.crickets + 0.004;
    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
      this.tone('triangle', f, f, at + i * 0.045, peak, 0.004, 0.025);
    }
  }

  /** Plays a sound effect (rate-limited per sound). */
  play(sfx: Sfx): void {
    const ctx = this.ctx;
    if (!ctx || this.mutedValue) return;
    const now = ctx.currentTime;
    if (now - (this.last.get(sfx) ?? -1) < MIN_GAP[sfx]) return;
    this.last.set(sfx, now);
    const j = 0.93 + Math.random() * 0.14; // small pitch variation keeps repeats natural
    switch (sfx) {
      case 'place':
        this.tone('sine', 520 * j, 170 * j, now, 0.35, 0.004, 0.12);
        this.noiseHit(now, 3000, 600, 0.12, 0.05);
        break;
      case 'road':
        this.noiseHit(now, 1400 * j, 300, 0.12, 0.06);
        break;
      case 'click':
        this.tone('sine', 900 * j, 700, now, 0.08, 0.002, 0.04);
        break;
      case 'demolish':
        this.noiseHit(now, 1600, 120, 0.4, 0.32);
        this.tone('sine', 140, 60, now, 0.25, 0.005, 0.25);
        break;
      case 'upgrade':
        this.tone('triangle', 660 * j, 660 * j, now, 0.14, 0.01, 0.35);
        this.tone('triangle', 990 * j, 990 * j, now + 0.09, 0.12, 0.01, 0.45);
        break;
      case 'decline':
        this.tone('sine', 330, 160, now, 0.16, 0.01, 0.45);
        break;
      case 'error':
        this.tone('square', 150, 140, now, 0.06, 0.005, 0.09);
        this.tone('square', 150, 140, now + 0.12, 0.06, 0.005, 0.09);
        break;
      case 'chapter':
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tone('triangle', f, f, now + i * 0.11, 0.13, 0.01, 0.6),
        );
        break;
    }
  }
}
