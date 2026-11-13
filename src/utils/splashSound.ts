// Web Audio API Synthesizer for AspireMint 3D Splash Animations
// Zero external dependencies, 0 KB file download weight, runs at 0ms latency.

class SplashSoundEngine {
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Pre-unlock on first user interaction if blocked by browser policy
  public unlock() {
    const ctx = this.getContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    }
  }

  /**
   * OPTION 1: The Minted 3D Vault Coin Sound
   * Deep metallic whoosh + Crisp dual-tone gold coin lock & chime
   */
  public playVaultCoinSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Sub-bass / metallic whoosh swell
      const oscLow = ctx.createOscillator();
      const gainLow = ctx.createGain();
      oscLow.type = "sine";
      oscLow.frequency.setValueAtTime(90, now);
      oscLow.frequency.exponentialRampToValueAtTime(260, now + 0.45);

      gainLow.gain.setValueAtTime(0.01, now);
      gainLow.gain.linearRampToValueAtTime(0.18, now + 0.35);
      gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      oscLow.connect(gainLow);
      gainLow.connect(ctx.destination);
      oscLow.start(now);
      oscLow.stop(now + 0.6);

      // 2. High-precision Coin Lock Chime (Harmonic C6 & E6)
      const lockTime = now + 0.45;
      const frequencies = [1046.5, 1318.5, 2093.0]; // C6, E6, C7
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, lockTime);

        const initialVol = idx === 0 ? 0.22 : 0.12;
        gain.gain.setValueAtTime(initialVol, lockTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, lockTime + 1.2 - idx * 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(lockTime);
        osc.stop(lockTime + 1.3);
      });
    } catch (e) {
      console.warn("Splash audio autoplay notice:", e);
    }
  }

  /**
   * OPTION 2: Frosted Glass Prism Synthesizer
   * Apple-style ethereal polyphonic chord with spatial bandpass sweep
   */
  public playGlassPrismSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const chord = [440.0, 554.37, 659.25, 880.0]; // A4, C#5, E5, A5 (Dreamy Major 7th feel)

      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(2200, now + 0.8);
        filter.Q.value = 3.0;

        const startTime = now + i * 0.08;
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.7);
      });
    } catch (e) {
      console.warn("Splash audio autoplay notice:", e);
    }
  }

  /**
   * OPTION 3: Particle Vortex Ignition
   * Swirling frequency vortex into a resonant acoustic Solfeggio bell (528 Hz)
   */
  public playParticleVortexSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Vortex swirl
      const oscVortex = ctx.createOscillator();
      const gainVortex = ctx.createGain();
      oscVortex.type = "sawtooth";
      oscVortex.frequency.setValueAtTime(140, now);
      oscVortex.frequency.exponentialRampToValueAtTime(750, now + 0.7);

      const filterVortex = ctx.createBiquadFilter();
      filterVortex.type = "lowpass";
      filterVortex.frequency.setValueAtTime(300, now);
      filterVortex.frequency.exponentialRampToValueAtTime(1400, now + 0.7);

      gainVortex.gain.setValueAtTime(0.01, now);
      gainVortex.gain.linearRampToValueAtTime(0.14, now + 0.5);
      gainVortex.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      oscVortex.connect(filterVortex);
      filterVortex.connect(gainVortex);
      gainVortex.connect(ctx.destination);
      oscVortex.start(now);
      oscVortex.stop(now + 0.8);

      // 2. Center Ignition Bell (528 Hz & 1056 Hz harmonic)
      const blastTime = now + 0.65;
      [528, 1056, 1584].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, blastTime);

        gain.gain.setValueAtTime(idx === 0 ? 0.25 : 0.08, blastTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, blastTime + 1.5 - idx * 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(blastTime);
        osc.stop(blastTime + 1.6);
      });
    } catch (e) {
      console.warn("Splash audio autoplay notice:", e);
    }
  }

  /**
   * OPTION 4: Holographic VIP Card Ding
   * Card air-flick whoosh + Executive luxury payment confirmation double chime
   */
  public playHolographicCardSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // 1. Snappy card flick whoosh
      const oscWhoosh = ctx.createOscillator();
      const gainWhoosh = ctx.createGain();
      oscWhoosh.type = "triangle";
      oscWhoosh.frequency.setValueAtTime(350, now);
      oscWhoosh.frequency.exponentialRampToValueAtTime(120, now + 0.25);

      gainWhoosh.gain.setValueAtTime(0.12, now);
      gainWhoosh.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      oscWhoosh.connect(gainWhoosh);
      gainWhoosh.connect(ctx.destination);
      oscWhoosh.start(now);
      oscWhoosh.stop(now + 0.32);

      // 2. Executive Two-Tone Ding (880 Hz -> 1320 Hz)
      const ding1Time = now + 0.45;
      const ding2Time = now + 0.60;

      // Ding 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, ding1Time); // A5
      gain1.gain.setValueAtTime(0.18, ding1Time);
      gain1.gain.exponentialRampToValueAtTime(0.0001, ding1Time + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ding1Time);
      osc1.stop(ding1Time + 0.55);

      // Ding 2 (High pitch resolution)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, ding2Time); // E6
      gain2.gain.setValueAtTime(0.24, ding2Time);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ding2Time + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ding2Time);
      osc2.stop(ding2Time + 0.95);
    } catch (e) {
      console.warn("Splash audio autoplay notice:", e);
    }
  }

  public playSoundForOption(option: "option1" | "option2" | "option3" | "option4") {
    switch (option) {
      case "option1":
        this.playVaultCoinSound();
        break;
      case "option2":
        this.playGlassPrismSound();
        break;
      case "option3":
        this.playParticleVortexSound();
        break;
      case "option4":
        this.playHolographicCardSound();
        break;
    }
  }
}

export const splashSoundEngine = new SplashSoundEngine();
