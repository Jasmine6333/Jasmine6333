/**
 * Synthesized Web Audio API sound effects for classroom interactive tools.
 * Zero external asset dependencies - 100% reliable offline & in any network condition.
 */

let audioCtx: AudioContext | null = null;
let isAudioMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isMuted(): boolean {
  return isAudioMuted;
}

export function setMuted(muted: boolean): void {
  isAudioMuted = muted;
}

export function toggleMute(): boolean {
  isAudioMuted = !isAudioMuted;
  return isAudioMuted;
}

/**
 * Click / Roulette tick sound during random draw spinning.
 * Pitch can vary slightly to create suspense.
 */
export function playTick(pitchMultiplier: number = 1.0): void {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Woodblock / Roulette click tone
    osc.type = 'triangle';
    const baseFreq = 520 * Math.max(0.6, Math.min(1.8, pitchMultiplier));
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Ignore audio context errors
  }
}

/**
 * Winning celebratory fanfare when a student is selected.
 * Arpeggiated C-E-G-C major chord with shimmering bell chime!
 */
export function playFanfare(): void {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Chords: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [
      { freq: 523.25, time: 0, duration: 0.18, vol: 0.22 },
      { freq: 659.25, time: 0.12, duration: 0.20, vol: 0.25 },
      { freq: 783.99, time: 0.24, duration: 0.25, vol: 0.28 },
      { freq: 1046.50, time: 0.38, duration: 0.85, vol: 0.32 },
      { freq: 1318.51, time: 0.46, duration: 0.95, vol: 0.18 }, // Harmonic E6
    ];

    notes.forEach(({ freq, time, duration, vol }) => {
      const noteTime = now + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(vol, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + duration + 0.05);
    });
  } catch {
    // Ignore audio errors
  }
}

/**
 * Shuffle sound for auto-grouping or roster scramble.
 */
export function playShuffle(): void {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const burstCount = 6;
    for (let i = 0; i < burstCount; i++) {
      const t = now + i * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 400, t);
      osc.frequency.linearRampToValueAtTime(200 + Math.random() * 200, t + 0.04);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    }
  } catch {
    // Ignore audio errors
  }
}

/**
 * Clean pop sound for UI interactions, button taps, and adding students.
 */
export function playPop(): void {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch {
    // Ignore
  }
}

/**
 * Reset / chime sound when resetting draw pool.
 */
export function playResetChime(): void {
  if (isAudioMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    [440, 554.37, 659.25].forEach((freq, i) => {
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    // Ignore
  }
}
