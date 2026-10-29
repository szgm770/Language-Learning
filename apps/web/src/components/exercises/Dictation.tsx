"use client";

import { useEffect } from "react";
import { speak } from "@/lib/speech";
import { TextAnswer } from "./TextAnswer";
import type { ExerciseProps } from "./types";

export function Dictation({ ex, ctx, locked, onChange }: ExerciseProps<"dictation">) {
  useEffect(() => {
    const t = setTimeout(() => speak(ex.text, ctx.speechLang), 300);
    return () => clearTimeout(t);
  }, [ex.text, ctx.speechLang]);
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">כתבו מה ששמעתם</h2>
      <div className="flex justify-center gap-3">
        <button type="button" className="btn-primary min-h-16 px-8 text-lg" onClick={() => speak(ex.text, ctx.speechLang)}>
          השמעה
        </button>
        <button type="button" className="btn-quiet min-h-16" onClick={() => speak(ex.text, ctx.speechLang, true)}>
          לאט
        </button>
      </div>
      <TextAnswer
        lang={ctx.target}
        locked={locked}
        placeholder="מה ששמעתם"
        onText={(text) => onChange(text.trim() ? { type: "dictation", text } : null)}
      />
    </div>
  );
}
