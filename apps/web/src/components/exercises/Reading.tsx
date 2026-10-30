"use client";

import { useState } from "react";
import { speak } from "@/lib/speech";
import { Icon } from "../icons";
import { Word } from "../ui";
import type { ExerciseProps } from "./types";

const paragraphs = (t: string) => t.trim().split(/\n\s*\n/);

/** A short real-life text to read; tap a paragraph to hear it, translation on demand. */
export function Reading({ ex, ctx }: ExerciseProps<"reading">) {
  const [translate, setTranslate] = useState(false);
  const en = paragraphs(ex.text);
  const he = paragraphs(ex.translation);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-cobalt">
          <Icon name="words" className="size-5" />
          קריאה: {ex.kind}
        </p>
        <button type="button" className="btn-quiet min-h-10 px-4 text-sm" aria-pressed={translate} onClick={() => setTranslate((t) => !t)}>
          {translate ? "להסתיר תרגום" : "להציג תרגום"}
        </button>
      </div>
      <article className="card flex flex-col gap-4 p-6" data-reading>
        <Word text={ex.title} lang={ctx.target} className="block text-2xl font-bold" />
        {en.map((p, i) => (
          <div key={i} className="flex flex-col gap-1">
            <button type="button" onClick={() => speak(p, ctx.speechLang)} className="rounded-xl text-start transition hover:bg-sunken" aria-label={`השמעת פסקה ${i + 1}`}>
              <Word text={p} lang={ctx.target} className="block text-lg leading-relaxed font-normal" />
            </button>
            {translate && he[i] && <p className="text-ink-soft">{he[i]}</p>}
          </div>
        ))}
      </article>
      <p className="text-sm text-ink-soft">אפשר להקיש על פסקה כדי לשמוע אותה. השאלות מגיעות אחרי הקריאה.</p>
    </div>
  );
}
