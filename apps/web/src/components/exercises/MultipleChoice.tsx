"use client";

import { useMemo } from "react";
import { Choices } from "./Choices";
import type { ExerciseProps } from "./types";

export function MultipleChoice({ ex, ctx, locked, onChange }: ExerciseProps<"multiple_choice">) {
  const onPick = useMemo(() => (choice: number) => onChange({ type: "multiple_choice", choice }), [onChange]);
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-medium">{ex.prompt}</h2>
      <Choices options={ex.options} lang={ctx.target} locked={locked} onPick={onPick} />
    </div>
  );
}
