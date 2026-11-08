"use client";

import { useEffect, useRef } from "react";

/** Free-text answer box in the right direction for its language. Enter checks the answer. */
export function TextAnswer({
  lang,
  locked,
  onText,
  placeholder,
  multiline = false,
}: {
  lang: string;
  locked: boolean;
  onText: (text: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const rtl = ["he", "yi", "ar", "arc"].includes(lang);
  const common = {
    ref,
    lang,
    dir: rtl ? "rtl" : "ltr",
    disabled: locked,
    placeholder,
    autoCapitalize: "off",
    autoCorrect: "off",
    autoComplete: "off",
    spellCheck: false,
    className: "field word text-xl",
    onChange: (e: { target: { value: string } }) => onText(e.target.value),
  } as const;
  // Spanish letters that a Hebrew-speaker's keyboard does not have: tap to insert at the cursor.
  const keys = lang === "es" ? ["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"] : [];
  const insert = (ch: string) => {
    const el = ref.current;
    if (!el || locked) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const value = el.value.slice(0, start) + ch + el.value.slice(end);
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.focus();
    el.setSelectionRange(start + ch.length, start + ch.length);
  };
  const field = multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />;
  if (keys.length === 0) return field;
  return (
    <div className="flex flex-col gap-3">
      {field}
      <div className="flex flex-wrap justify-center gap-2" dir="ltr" role="group" aria-label="אותיות מיוחדות">
        {keys.map((k) => (
          <button key={k} type="button" className="btn-quiet min-h-11 min-w-11 px-3 text-lg" onClick={() => insert(k)} disabled={locked}>
            {k}
          </button>
        ))}
      </div>
    </div>
  );
}
