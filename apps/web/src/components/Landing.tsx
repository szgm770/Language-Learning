"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { speak } from "@/lib/speech";
import { Brand } from "./Brand";
import { Word } from "./ui";

/** Greetings shown in the hero, in the languages we teach now and next. */
const GREETINGS = [
  { text: "Hello", lang: "en", voice: "en-US" },
  { text: "¡Hola!", lang: "es", voice: "es-ES" },
  { text: "Bonjour", lang: "fr", voice: "fr-FR" },
  { text: "Hallo", lang: "de", voice: "de-DE" },
  { text: "Привет", lang: "ru", voice: "ru-RU" },
  { text: "Ciao", lang: "it", voice: "it-IT" },
];

function Greeting() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % GREETINGS.length), 2200);
    return () => clearInterval(t);
  }, []);
  const g = GREETINGS[i]!;
  return (
    <button
      type="button"
      onClick={() => speak(g.text, g.voice)}
      className="group flex flex-col items-center gap-1 py-6"
      aria-label={`${g.text}, השמעה`}
    >
      <span className="grid place-items-center overflow-hidden">
        <Word key={g.text} text={g.text} lang={g.lang} className="greeting-in text-7xl text-cobalt sm:text-8xl" />
      </span>
      <span className="text-lg text-ink-soft">שלום</span>
    </button>
  );
}

const DEMO = {
  prompt: "בוקר טוב",
  options: ["Good night", "Good morning", "Goodbye"],
  correct: 1,
};

/** A real exercise, right on the page: the fastest way to show what learning here feels like. */
function TryIt() {
  const [picked, setPicked] = useState<number | null>(null);
  const right = picked === DEMO.correct;
  return (
    <section aria-labelledby="try" className="flex flex-col gap-4 rounded-3xl bg-surface p-5 shadow-[0_1px_0_var(--color-line)] ring-1 ring-line">
      <h2 id="try" className="text-sm font-medium text-cobalt">
        נסו עכשיו
      </h2>
      <p className="text-2xl font-semibold">איך אומרים &quot;{DEMO.prompt}&quot; באנגלית?</p>
      <div className="flex flex-col gap-2">
        {DEMO.options.map((o, i) => {
          const state = picked === null ? "" : i === DEMO.correct ? "border-mint bg-mint-soft" : i === picked ? "border-rose bg-rose-soft" : "opacity-50";
          return (
            <button
              key={o}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(i);
                speak(o, "en-US");
              }}
              className={`choice min-h-13 ${state}`}
            >
              <Word text={o} lang="en" className="text-xl" />
            </button>
          );
        })}
      </div>
      <p role="status" className="min-h-6 font-medium">
        {picked !== null && (right ? "נכון! ככה נראה כל תרגיל." : "כמעט. Good morning = בוקר טוב.")}
      </p>
      {picked !== null && (
        <Link href="/start/" className="btn-primary w-full">
          להמשיך לשיעור הראשון
        </Link>
      )}
    </section>
  );
}

const POINTS = [
  {
    title: "שיעור ביום, חמש דקות",
    text: "תרגילים קצרים: שמיעה, הרכבת משפטים, תרגום והגייה. מתאים לתור בסופר.",
    icon: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  },
  {
    title: "חזרה שזוכרת בשבילכם",
    text: "כל מילה חוזרת לתרגול בדיוק כשהיא מתחילה להישכח, ולא לפני.",
    icon: "M4 4v6h6M20 20v-6h-6M5.6 15a7 7 0 0 0 12.2 2.4M18.4 9A7 7 0 0 0 6.2 6.6",
  },
  {
    title: "בלי הרשמה, בלי פרסומות",
    text: "נכנסים ולומדים. ההתקדמות נשמרת אצלכם בדפדפן, ושום מידע לא יוצא ממנו.",
    icon: "M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z",
  },
  {
    title: "עובד גם בלי אינטרנט",
    text: "אחרי הכניסה הראשונה אפשר ללמוד גם בטיסה או ברכבת.",
    icon: "M3 9a13 13 0 0 1 18 0M6.5 12.5a8 8 0 0 1 11 0M10 16a3 3 0 0 1 4 0M12 19.5h.01",
  },
];

const LANGS = [
  { word: "Hello", lang: "en", name: "אנגלית", ready: true },
  { word: "¡Hola!", lang: "es", name: "ספרדית", ready: true },
  { word: "Bonjour", lang: "fr", name: "צרפתית", ready: false },
  { word: "Hallo", lang: "de", name: "גרמנית", ready: false },
  { word: "Привет", lang: "ru", name: "רוסית", ready: false },
  { word: "Ciao", lang: "it", name: "איטלקית", ready: false },
];

export function Landing() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-10">
      <header className="flex items-center justify-between py-3">
        <Brand />
        <Link href="/start/" className="min-h-11 px-2 py-2.5 font-medium text-cobalt">
          להתחיל
        </Link>
      </header>

      <section className="flex flex-col items-center pt-6 pb-10 text-center">
        <Greeting />
        <h1 className="text-4xl leading-tight font-bold text-balance sm:text-5xl">שפה חדשה, בעברית פשוטה.</h1>
        <p className="mt-4 max-w-md text-lg text-ink-soft text-pretty">
          אנגלית וספרדית לדוברי עברית. הסברים בעברית אמיתית, שיעורים קצרים וחזרה חכמה.
        </p>
        <Link href="/start/" className="btn-primary mt-8 min-h-14 w-full max-w-sm text-lg">
          להתחיל ללמוד בחינם
        </Link>
        <p className="mt-3 text-sm text-ink-soft">בלי הרשמה. מתחילים תוך עשר שניות.</p>
      </section>

      <TryIt />

      <section aria-label="למה כאן" className="mt-12 flex flex-col gap-7">
        {POINTS.map((p) => (
          <div key={p.title} className="flex gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-cobalt-soft text-cobalt">
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
                <path d={p.icon} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <h2 className="text-lg font-semibold">{p.title}</h2>
              <p className="text-ink-soft">{p.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section aria-labelledby="langs" className="mt-14">
        <h2 id="langs" className="text-2xl font-bold">
          מה לומדים
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LANGS.map((l) => (
            <li
              key={l.lang}
              className={`flex flex-col gap-1 rounded-2xl p-4 ${l.ready ? "bg-surface ring-1 ring-line" : "border border-dashed border-line"}`}
            >
              <Word text={l.word} lang={l.lang} className={`text-3xl ${l.ready ? "text-cobalt" : "text-ink-soft"}`} />
              <span className="font-medium">{l.name}</span>
              <span className="text-sm text-ink-soft">{l.ready ? "זמין עכשיו, רמה A1" : "בקרוב"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 flex flex-col items-center gap-4 rounded-3xl bg-cobalt px-6 py-10 text-center text-white">
        <p className="text-2xl font-bold">המילה הראשונה במרחק לחיצה.</p>
        <Link href="/start/" className="btn min-h-14 w-full max-w-sm bg-white text-lg text-[#1b2140]">
          להתחיל ללמוד
        </Link>
      </section>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-soft">
        <span>לינגו, לימוד שפות לדוברי עברית</span>
        <a href="https://github.com/szgm770/Language-Learning" className="min-h-11 py-3 underline underline-offset-4">
          קוד פתוח ב־GitHub
        </a>
      </footer>
    </div>
  );
}
