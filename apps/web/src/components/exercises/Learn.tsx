"use client";

import { useEffect } from "react";
import { speak } from "@/lib/speech";
import { Icon } from "../icons";
import { SpeakButton, Word } from "../ui";
import type { ExerciseProps } from "./types";

const POS: Record<string, string> = {
  noun: "שם עצם",
  verb: "פועל",
  adjective: "תואר",
  adverb: "תואר הפועל",
  pronoun: "כינוי",
  preposition: "מילת יחס",
  conjunction: "מילת חיבור",
  interjection: "מילת קריאה",
  number: "מספר",
  phrase: "ביטוי",
  determiner: "מילת יידוע",
};

/** Meet a new word: hear it, see how to say it and how it is used. */
export function Learn({ ex, ctx }: ExerciseProps<"learn">) {
  const lx = ctx.lexemes.get(ex.lexeme);
  useEffect(() => {
    if (!lx) return;
    const t = setTimeout(() => speak(lx.text, ctx.speechLang), 350);
    return () => clearTimeout(t);
  }, [lx, ctx.speechLang]);
  if (!lx) return null;
  return (
    <div className="flex flex-col gap-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-cobalt">
        <Icon name="star" className="size-5" filled />
        מילה חדשה
      </p>
      <div className="card flex flex-col items-center gap-3 px-5 py-8 text-center">
        <Word text={lx.text} lang={ctx.target} className="text-5xl text-cobalt" />
        {lx.pronunciation && <span className="text-lg text-ink-soft">{lx.pronunciation}</span>}
        <span className="text-2xl font-semibold">{lx.translation}</span>
        <span className="rounded-full bg-sunken px-3 py-1 text-xs text-ink-soft">{POS[lx.pos] ?? lx.pos}</span>
        <div className="mt-2 flex gap-3">
          <SpeakButton text={lx.text} lang={ctx.speechLang} label="השמעה" />
          <SpeakButton text={lx.text} lang={ctx.speechLang} label="השמעה איטית" slow />
        </div>
      </div>
      {lx.example && (
        <button
          type="button"
          onClick={() => speak(lx.example!.text, ctx.speechLang)}
          className="flex items-start gap-3 rounded-2xl bg-sunken p-4 text-start"
        >
          <Icon name="volume" className="mt-1 size-5 shrink-0 text-cobalt" />
          <span className="flex flex-col gap-1">
            <Word text={lx.example.text} lang={ctx.target} className="text-xl" />
            <span className="text-ink-soft">{lx.example.translation}</span>
          </span>
        </button>
      )}
    </div>
  );
}
