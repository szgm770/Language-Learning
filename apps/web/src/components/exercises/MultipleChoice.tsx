"use client";

import { useMemo } from "react";
import { Choices } from "./Choices";
import type { ExerciseProps } from "./types";

export function MultipleChoice({ ex, ctx, locked, onChange }: ExerciseProps<"multiple_choice">) {
  const onPick = useMemo(() => (choice: number) => onChange({ type: "multiple_choice", choice }), [onChange]);
  return (
    <div className="flex flex-col gap-6">
      {ex.passage && (
        <article className="card flex max-h-72 flex-col gap-3 overflow-y-auto p-5" dir="ltr" lang={ctx.target} tabIndex={0} aria-label="הטקסט">
          {ex.passage.trim().split(/\n\s*\n/).map((p, i) => (
            <p key={i} className="text-start leading-relaxed">{p}</p>
          ))}
        </article>
      )}
      <h2 className="text-2xl font-bold">{ex.prompt}</h2>
      <Choices options={ex.options} lang={ctx.target} locked={locked} onPick={onPick} />
    </div>
  );
}
