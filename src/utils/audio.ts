/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Web Audio API procedural sound synthesizer for 1940s Film Noir atmosphere.
 * Operates without external audio files, works completely offline.
 */

class NoirAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    // Check localStorage for mute preference
    if (typeof window !== 'undefined') {
      this.muted = localStorage.getItem('noir_audio_muted') === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('noir_audio_muted', this.muted ? 'true' : 'false');
    }
    return this.muted;
  }

  /** Subtle mechanical typewriter clack */
  public playTypewriterKey(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 + Math.random() * 80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  /** Typewriter carriage bell */
  public playTypewriterBell(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1864, ctx.currentTime); // A#6
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.65);
  }

  /** Solid thud when sticking a pin into corkboard */
  public playPinThud(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  /** Taut pluck sound when connecting a red yarn string */
  public playYarnPluck(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  /** Paper rustle / file open */
  public playPaperRustle(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Filtered noise
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    noise.stop(ctx.currentTime + 0.11);
  }

  /** Resonant courtroom gavel strike for guilty conviction */
  public playGavelStrike(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    // Deep wooden impact
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(130, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(260, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.45);
    osc2.stop(ctx.currentTime + 0.45);
  }

  /** Discovery chime when finding key evidence */
  public playDiscoveryChime(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [587.33, 739.99, 880]; // D5, F#5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.4);
    });
  }

  /** Subtle wet-cobblestone footsteps for short neighborhood walks */
  public playFootsteps(steps = 4): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    for (let i = 0; i < steps; i++) {
      const t = now + i * 0.21 + (i % 2 === 1 ? 0.015 : 0);

      // Soft leather heel tap (low filtered thud)
      const osc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(115 + (i % 2) * 14, t);
      osc.frequency.exponentialRampToValueAtTime(46, t + 0.065);
      thudGain.gain.setValueAtTime(0.055 * (1 - i * 0.12), t);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
      osc.connect(thudGain);
      thudGain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.085);

      // Faint damp pavement grit scuff
      const bufferSize = Math.floor(ctx.sampleRate * 0.045);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let s = 0; s < bufferSize; s++) {
        data[s] = (Math.random() * 2 - 1) * (1 - s / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750 + (i % 2) * 140, t);
      filter.Q.setValueAtTime(1.8, t);

      const scuffGain = ctx.createGain();
      scuffGain.gain.setValueAtTime(0.03 * (1 - i * 0.12), t);
      scuffGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      noise.connect(filter);
      filter.connect(scuffGain);
      scuffGain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + 0.05);
    }
  }

  /** Subtle 1940s yellow cab door shut, engine purr & soft double horn */
  public playTaxiTransit(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Gentle muted car door thump
    const doorOsc = ctx.createOscillator();
    const doorGain = ctx.createGain();
    doorOsc.type = 'triangle';
    doorOsc.frequency.setValueAtTime(110, now);
    doorOsc.frequency.exponentialRampToValueAtTime(38, now + 0.09);
    doorGain.gain.setValueAtTime(0.07, now);
    doorGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    doorOsc.connect(doorGain);
    doorGain.connect(ctx.destination);
    doorOsc.start(now);
    doorOsc.stop(now + 0.11);

    // Subtle warm engine pull-away hum
    const engOsc = ctx.createOscillator();
    const engFilter = ctx.createBiquadFilter();
    const engGain = ctx.createGain();
    engOsc.type = 'sawtooth';
    engOsc.frequency.setValueAtTime(58, now + 0.08);
    engOsc.frequency.linearRampToValueAtTime(92, now + 0.65);
    engFilter.type = 'lowpass';
    engFilter.frequency.setValueAtTime(220, now + 0.08);

    engGain.gain.setValueAtTime(0.001, now + 0.08);
    engGain.gain.linearRampToValueAtTime(0.04, now + 0.22);
    engGain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);

    engOsc.connect(engFilter);
    engFilter.connect(engGain);
    engGain.connect(ctx.destination);
    engOsc.start(now + 0.08);
    engOsc.stop(now + 0.8);

    // Soft distant vintage taxi double-beep
    [0.24, 0.39].forEach((offset, idx) => {
      const t = now + offset;
      const dur = idx === 0 ? 0.08 : 0.13;
      const hornFilter = ctx.createBiquadFilter();
      hornFilter.type = 'lowpass';
      hornFilter.frequency.setValueAtTime(780, t);

      const hornGain = ctx.createGain();
      hornGain.gain.setValueAtTime(0.001, t);
      hornGain.gain.linearRampToValueAtTime(0.025, t + 0.015);
      hornGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      [311.13, 392.0].forEach((freq) => {
        const hOsc = ctx.createOscillator();
        hOsc.type = 'sawtooth';
        hOsc.frequency.setValueAtTime(freq, t);
        hOsc.connect(hornFilter);
        hOsc.start(t);
        hOsc.stop(t + dur + 0.02);
      });

      hornFilter.connect(hornGain);
      hornGain.connect(ctx.destination);
    });
  }

  /** Subtle vintage streetcar tram double-bell and soft track clack */
  public playTramTransit(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Two gentle brass streetcar bell strikes
    [0, 0.16].forEach((offset) => {
      const t = now + offset;
      [932.33, 1396.91].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(idx === 0 ? 0.04 : 0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.38);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    });

    // Subtle track rail-joint clacks
    [0.32, 0.45, 0.64, 0.77].forEach((offset, idx) => {
      const t = now + offset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(145, t);
      osc.frequency.exponentialRampToValueAtTime(52, t + 0.045);
      gain.gain.setValueAtTime(0.045 * (1 - idx * 0.16), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.055);
    });
  }

  /** Subtle distance-appropriate transit sound when traveling between city locations */
  public playTravelSound(travelMinutes = 10): void {
    if (travelMinutes <= 12) {
      this.playFootsteps(4);
    } else if (travelMinutes < 20) {
      this.playTaxiTransit();
    } else {
      this.playTramTransit();
    }
  }
}

export const noirAudio = new NoirAudioEngine();
