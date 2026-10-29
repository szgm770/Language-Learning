"use client";

import { useEffect, useMemo } from "react";
import { speak } from "@/lib/speech";
import { SpeakButton } from "../ui";
import { Choices } from "./Choices";
import type { ExerciseProps } from "./types";

export function ListeningChoice({ ex, ctx, locked, onChange }: ExerciseProps<"listening_choice">) {
  useEffect(() => {
    const t = setTimeout(() => speak(ex.audioText, ctx.speechLang), 300);
    return () => clearTimeout(t);
  }, [ex.audioText, ctx.speechLang]);
  const onPick = useMemo(() => (choice: number) => onChange({ type: "listening_choice", choice }), [onChange]);
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-medium">{ex.question}</h2>
      <div className="flex justify-center py-2">
        <SpeakButton text={ex.audioText} lang={ctx.speechLang} size="lg" label="השמעה שוב" />
      </div>
      <Choices options={ex.options} lang={ctx.target} locked={locked} onPick={onPick} />
    </div>
  );
}
