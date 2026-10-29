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
  const rtl = ["he", "yi", "ar"].includes(lang);
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
  return multiline ? <textarea rows={3} {...common} /> : <input type="text" {...common} />;
}
