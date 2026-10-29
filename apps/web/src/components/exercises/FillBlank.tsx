"use client";

import { useState } from "react";
import { Word } from "../ui";
import { TextAnswer } from "./TextAnswer";
import type { ExerciseProps } from "./types";

export function FillBlank({ ex, ctx, locked, onChange }: ExerciseProps<"fill_blank">) {
  const [before, after] = ex.sentence.split("___") as [string, string];
  const [value, setValue] = useState("");
  const set = (v: string) => {
    setValue(v);
    onChange(v.trim() ? { type: "fill_blank", text: v } : null);
  };
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">השלימו את החסר</h2>
      <p dir="ltr" lang={ctx.target} className="word text-center text-3xl">
        {before}
        <span className="mx-1 inline-block min-w-20 border-b-2 border-cobalt text-cobalt">{value || " "}</span>
        {after}
      </p>
      {ex.translation && <p className="text-center text-ink-soft">{ex.translation}</p>}
      {ex.options ? (
        <div dir="ltr" className="flex flex-wrap justify-center gap-2">
          {ex.options.map((o) => (
            <button
              key={o}
              type="button"
              disabled={locked}
              aria-pressed={value === o}
              onClick={() => set(o)}
              className="choice w-auto px-5"
            >
              <Word text={o} lang={ctx.target} className="text-xl" />
            </button>
          ))}
        </div>
      ) : (
        <TextAnswer lang={ctx.target} locked={locked} onText={set} placeholder="המילה החסרה" />
      )}
    </div>
  );
}
