let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak: number = 0.08,
  delaySec: number = 0
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

export function playSnapSound(muted: boolean): void {
  if (muted) return;
  playTone(587.33, 0.09, 'triangle', 0.07);
}

export function playSuccessSound(muted: boolean): void {
  if (muted) return;
  playTone(523.25, 0.11, 'sine', 0.08, 0);
  playTone(659.25, 0.14, 'sine', 0.08, 0.06);
}

export function playLineClearSound(muted: boolean): void {
  if (muted) return;
  playTone(523.25, 0.1, 'triangle', 0.08, 0);
  playTone(659.25, 0.1, 'triangle', 0.08, 0.07);
  playTone(783.99, 0.18, 'triangle', 0.09, 0.14);
}

export function playErrorSound(muted: boolean): void {
  if (muted) return;
  playTone(210, 0.14, 'sawtooth', 0.055, 0);
  playTone(155, 0.18, 'sawtooth', 0.05, 0.08);
}

export function playStageUpSound(muted: boolean): void {
  if (muted) return;
  playTone(440, 0.1, 'sine', 0.08, 0);
  playTone(554.37, 0.1, 'sine', 0.08, 0.08);
  playTone(659.25, 0.12, 'sine', 0.08, 0.16);
  playTone(880, 0.24, 'sine', 0.09, 0.24);
}

export function playGameOverSound(muted: boolean): void {
  if (muted) return;
  playTone(329.63, 0.16, 'triangle', 0.07, 0);
  playTone(261.63, 0.18, 'triangle', 0.07, 0.14);
  playTone(196.0, 0.3, 'triangle', 0.07, 0.28);
}

export function playSplashSound(muted: boolean): void {
  if (muted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(540, now);
  osc.frequency.exponentialRampToValueAtTime(160, now + 0.14);
  osc.frequency.exponentialRampToValueAtTime(310, now + 0.22);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.085, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.26);
}

export function playAnimeHitSound(muted: boolean): void {
  if (muted) return;
  playTone(523.25, 0.08, 'square', 0.04, 0);
  playTone(659.25, 0.08, 'square', 0.045, 0.055);
  playTone(783.99, 0.09, 'square', 0.045, 0.11);
  playTone(1046.5, 0.2, 'triangle', 0.08, 0.165);
}
