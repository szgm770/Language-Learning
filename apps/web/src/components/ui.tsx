"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { NO_VOICE, speak, speechSupported } from "@/lib/speech";
import { Icon } from "./icons";

const RTL = ["he", "yi", "ar", "arc"];

/** Text direction of a language: Hebrew-script and Arabic-script languages are right-to-left. */
export const dirOf = (lang: string): "rtl" | "ltr" => (RTL.includes(lang) ? "rtl" : "ltr");

/** A word or sentence in the language being learned: its own language and direction. */
export function Word({ text, lang, className = "" }: { text: string; lang: string; className?: string }) {
  return (
    <span lang={lang} dir={dirOf(lang)} className={`word ${className}`}>
      {text}
    </span>
  );
}

export function SpeakButton({
  text,
  lang,
  size = "md",
  label = "השמעה",
  pitch,
  slow = false,
}: {
  text: string;
  lang: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  pitch?: number;
  slow?: boolean;
}) {
  if (!speechSupported() || lang === NO_VOICE) return null;
  const dim = slow ? "h-12 gap-1.5 px-4" : { sm: "size-9", md: "size-12", lg: "size-20" }[size];
  const icon = { sm: "size-5", md: "size-6", lg: "size-9" }[size];
  return (
    <button
      type="button"
      onClick={() => speak(text, lang, { pitch, slow })}
      aria-label={label}
      className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full ${
        slow ? "bg-cobalt-soft text-cobalt" : "bg-cobalt text-white"
      } shadow-[0_3px_0_0_var(--color-cobalt-strong)] transition active:translate-y-[3px] active:shadow-none`}
    >
      <Icon name={slow ? "slow" : "volume"} className={icon} />
      {slow && <span className="text-sm font-semibold">לאט</span>}
    </button>
  );
}

export function ProgressBar({ value, label, tone = "mint" }: { value: number; label: string; tone?: "mint" | "saffron" | "cobalt" }) {
  const bg = { mint: "bg-mint", saffron: "bg-saffron", cobalt: "bg-cobalt" }[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="relative h-4 w-full overflow-hidden rounded-full bg-sunken"
    >
      <div className={`relative h-full overflow-hidden rounded-full ${bg} transition-[width] duration-500 ease-out`} style={{ width: `${Math.max(3, value * 100)}%` }}>
        <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/35" />
      </div>
    </div>
  );
}

/** Ring progress (0..1) with content in the middle. */
export function Ring({ value, size = 56, stroke = 6, tone = "var(--color-mint)", children }: { value: number; size?: number; stroke?: number; tone?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-sunken)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={len}
          strokeDashoffset={len * (1 - Math.min(1, Math.max(0, value)))}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">{children}</span>
    </span>
  );
}

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-8 ${className}`}>{children}</main>;
}

export function BackLink({ href, label = "חזרה" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-ink-soft">
      <Icon name="back" className="size-5" />
      {label}
    </Link>
  );
}

const GREETINGS = [
  { t: "Hello", lang: "en" },
  { t: "Hola", lang: "es" },
  { t: "שלום", lang: "he" },
];

export function Loading() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % GREETINGS.length), 1400);
    return () => clearInterval(id);
  }, []);
  const g = GREETINGS[i] ?? GREETINGS[0]!;
  return (
    <Screen className="items-center justify-center">
      <div role="status" aria-label="טוען" className="flex flex-col items-center gap-4">
        <div className="relative rounded-3xl rounded-bl-md bg-cobalt-soft px-8 py-5 shadow-sm" dir="ltr">
          <span key={i} lang={g.lang} className="lingo-greet block min-w-20 text-center text-2xl font-bold text-cobalt-strong">
            {g.t}
          </span>
        </div>
        <div className="flex gap-2" dir="ltr" aria-hidden>
          <span className="lingo-dot size-2.5 rounded-full bg-cobalt" />
          <span className="lingo-dot size-2.5 rounded-full bg-cobalt [animation-delay:150ms]" />
          <span className="lingo-dot size-2.5 rounded-full bg-cobalt [animation-delay:300ms]" />
        </div>
      </div>
    </Screen>
  );
}

export function LoadError({ retry }: { retry?: () => void }) {
  return (
    <Screen className="items-center justify-center gap-4 text-center">
      <p className="text-lg font-semibold">לא הצלחנו לטעון את התוכן.</p>
      <p className="text-ink-soft">בדקו את החיבור לאינטרנט. יחידות שכבר פתחתם זמינות גם בלי חיבור.</p>
      {retry && (
        <button className="btn-primary" onClick={retry}>
          לנסות שוב
        </button>
      )}
    </Screen>
  );
}
