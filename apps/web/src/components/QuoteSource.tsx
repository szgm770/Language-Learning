"use client";

import { useState } from "react";
import { Word } from "./ui";

/**
 * Where a quoted text comes from (e.g. "בבלי, בבא מציעא ב ע״א"), and its vocalised form on request.
 * Used by reading courses whose texts are real quotations (Aramaic). Renders nothing when there is neither.
 */
export function QuoteSource({ source, vocalized, lang }: { source?: string; vocalized?: string; lang: string }) {
  const [show, setShow] = useState(false);
  if (!source && !vocalized) return null;
  return (
    <div className="flex flex-col gap-2 text-sm" data-quote-source>
      <div className="flex flex-wrap items-center gap-2 text-ink-soft">
        {source && <span className="rounded-full bg-sunken px-3 py-1">{source}</span>}
        {vocalized && (
          <button
            type="button"
            className="rounded-full px-3 py-1 font-semibold text-cobalt ring-1 ring-line"
            aria-pressed={show}
            onClick={() => setShow((v) => !v)}
          >
            {show ? "הסתרת ניקוד" : "הצגה עם ניקוד"}
          </button>
        )}
      </div>
      {show && vocalized && <Word text={vocalized} lang={lang} className="text-xl leading-loose" />}
    </div>
  );
}
