"use client";

import { useEffect, useState } from "react";
import { Word } from "../ui";

/** A list of answer buttons; also answers to the number keys 1–6. */
export function Choices({
  options,
  lang,
  locked,
  onPick,
}: {
  options: string[];
  /** Language of options that are not Hebrew. */
  lang: string;
  locked: boolean;
  onPick: (index: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    if (locked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) {
        setPicked(n - 1);
        onPick(n - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, options.length, onPick]);

  return (
    <ul className="flex flex-col gap-3">
      {options.map((opt, i) => (
        <li key={`${i}-${opt}`}>
          <button
            type="button"
            className="choice"
            aria-pressed={picked === i}
            disabled={locked}
            onClick={() => {
              setPicked(i);
              onPick(i);
            }}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-line text-sm text-ink-soft">
              {i + 1}
            </span>
            {/[֐-׿]/.test(opt) ? <span>{opt}</span> : <Word text={opt} lang={lang} className="text-xl" />}
          </button>
        </li>
      ))}
    </ul>
  );
}
