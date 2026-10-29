"use client";

/**
 * Small sound effects made with the Web Audio API: no files to download, work offline.
 * Respect the learner's "sound" setting (checked by the caller through `setSoundEnabled`).
 */
let ctx: AudioContext | undefined;
let enabled = true;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function audio(): AudioContext | undefined {
  if (!enabled || typeof window === "undefined") return undefined;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return undefined;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.18) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  /** Two rising notes. */
  correct() {
    tone(784, 0, 0.14, "triangle");
    tone(1175, 0.09, 0.22, "triangle");
  },
  /** A soft low thud, not a buzzer. */
  wrong() {
    tone(220, 0, 0.18, "sine", 0.22);
    tone(196, 0.1, 0.24, "sine", 0.18);
  },
  tap() {
    tone(660, 0, 0.05, "sine", 0.08);
  },
  /** Short fanfare for a finished lesson. */
  complete() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, "triangle", 0.16));
    tone(1319, 0.48, 0.5, "triangle", 0.12);
  },
};
