"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { speak, speechSupported } from "@/lib/speech";

/** A word or sentence in the language being learned: its own language and direction, set in the word face. */
export function Word({ text, lang, className = "" }: { text: string; lang: string; className?: string }) {
  const rtl = ["he", "yi", "ar"].includes(lang);
  return (
    <span lang={lang} dir={rtl ? "rtl" : "ltr"} className={`word ${className}`}>
      {text}
    </span>
  );
}

export function SpeakButton({
  text,
  lang,
  size = "md",
  label = "השמעה",
}: {
  text: string;
  lang: string;
  size?: "md" | "lg";
  label?: string;
}) {
  if (!speechSupported()) return null;
  const dim = size === "lg" ? "size-20" : "size-11";
  return (
    <button
      type="button"
      onClick={() => speak(text, lang)}
      onContextMenu={(e) => {
        e.preventDefault();
        speak(text, lang, true);
      }}
      aria-label={label}
      title={`${label} (לחיצה ימנית: לאט)`}
      className={`${dim} inline-flex shrink-0 items-center justify-center rounded-full bg-cobalt text-white transition active:scale-95`}
    >
      <svg viewBox="0 0 24 24" className={size === "lg" ? "size-9" : "size-5"} aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      className="h-3 w-full overflow-hidden rounded-full bg-line"
    >
      <div className="h-full rounded-full bg-mint transition-[width] duration-300" style={{ width: `${Math.max(4, value * 100)}%` }} />
    </div>
  );
}

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 pb-8 ${className}`}>{children}</main>;
}

export function BackLink({ href, label = "חזרה" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-1 text-ink-soft" aria-label={label}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        {/* Points right: "back" in a right-to-left interface. */}
        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      {label}
    </Link>
  );
}

export function Loading() {
  return (
    <Screen className="items-center justify-center">
      <p className="text-ink-soft" role="status">
        טוען…
      </p>
    </Screen>
  );
}

export function LoadError({ retry }: { retry?: () => void }) {
  return (
    <Screen className="items-center justify-center gap-4 text-center">
      <p className="text-lg">לא הצלחנו לטעון את התוכן.</p>
      <p className="text-ink-soft">בדקו את החיבור לאינטרנט. יחידות שכבר פתחתם זמינות גם בלי חיבור.</p>
      {retry && (
        <button className="btn-primary" onClick={retry}>
          לנסות שוב
        </button>
      )}
    </Screen>
  );
}
