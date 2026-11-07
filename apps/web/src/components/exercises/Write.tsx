"use client";

import { checkWriting } from "@lingo/engine";
import { useMemo, useState } from "react";
import { Icon } from "../icons";
import type { ExerciseProps } from "./types";

/** Free writing with a live checklist: the learner sees what is still missing before checking. */
export function Write({ ex, ctx, locked, onChange }: ExerciseProps<"write">) {
  const [text, setText] = useState("");
  const r = useMemo(() => checkWriting(text, ex), [text, ex]);
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">כתיבה חופשית</h2>
      <p className="text-lg">{ex.prompt}</p>
      <textarea
        rows={7}
        lang={ctx.target}
        dir="ltr"
        disabled={locked}
        className="field word text-lg"
        placeholder="Write here…"
        autoCapitalize="sentences"
        autoComplete="off"
        spellCheck
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.trim() ? { type: "write", text: e.target.value } : null);
        }}
      />
      <p className={`text-sm font-semibold tabular-nums ${r.enough ? "text-mint-strong" : "text-ink-soft"}`}>
        {r.words} / {ex.minWords} מילים
      </p>
      <ul className="flex flex-col gap-1.5" aria-label="רשימת בדיקה">
        {r.results.map((c) => (
          <li key={c.label} className={`flex items-center gap-2 text-sm ${c.ok ? "text-mint-strong" : "text-ink-soft"}`}>
            <Icon name={c.ok ? "check" : "close"} className="size-4 shrink-0" />
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
