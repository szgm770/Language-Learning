"use client";

import { inLanguage } from "@/lib/languages";
import { SpeakButton, Word } from "../ui";
import { TextAnswer } from "./TextAnswer";
import type { ExerciseProps } from "./types";

export function Translate({ ex, ctx, locked, onChange }: ExerciseProps<"translate">) {
  const toTarget = ex.direction === "to_target";
  const answerLang = toTarget ? ctx.target : ctx.source;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">כתבו {inLanguage(answerLang)}</h2>
      <div className="flex items-center gap-3">
        {toTarget ? (
          <p className="text-2xl">{ex.prompt}</p>
        ) : (
          <>
            <SpeakButton text={ex.prompt} lang={ctx.speechLang} />
            <Word text={ex.prompt} lang={ctx.target} className="text-3xl" />
          </>
        )}
      </div>
      <TextAnswer
        lang={answerLang}
        locked={locked}
        multiline
        placeholder="התרגום שלכם"
        onText={(text) => onChange(text.trim() ? { type: "translate", text } : null)}
      />
    </div>
  );
}
