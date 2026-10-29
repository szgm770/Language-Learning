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

export function speak(text: string, lang: string, slow = false): void {
  if (!speechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = slow ? 0.6 : 0.95;
  const voice = pickVoice(lang);
  if (voice) u.voice = voice;
  synth.speak(u);
}
