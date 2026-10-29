"use client";

/** Text-to-speech through the browser (free; voice quality depends on the device). */
export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const base = lang.split("-")[0]!;
  return (
    voices.find((v) => v.lang === lang && v.localService) ??
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(base))
  );
}

export interface SpeakOptions {
  slow?: boolean;
  /** Voice pitch, to tell characters apart (0.5–2). */
  pitch?: number;
}

function utterance(text: string, lang: string, opts: SpeakOptions) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = opts.slow ? 0.6 : 0.95;
  u.pitch = opts.pitch ?? 1;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  return u;
}

export function speak(text: string, lang: string, opts: SpeakOptions | boolean = {}): void {
  if (!speechSupported()) return;
  const o = typeof opts === "boolean" ? { slow: opts } : opts;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance(text, lang, o));
}

/** Plays lines one after another; `onLine` reports which line is being spoken (-1 when done). */
export function speakSequence(
  lines: { text: string; pitch?: number }[],
  lang: string,
  onLine: (index: number) => void,
): () => void {
  if (!speechSupported()) return () => undefined;
  const synth = window.speechSynthesis;
  synth.cancel();
  let stopped = false;
  lines.forEach((l, i) => {
    const u = utterance(l.text, lang, { pitch: l.pitch });
    u.onstart = () => !stopped && onLine(i);
    if (i === lines.length - 1) u.onend = () => !stopped && onLine(-1);
    synth.speak(u);
  });
  return () => {
    stopped = true;
    synth.cancel();
    onLine(-1);
  };
}
