"use client";

import type { GrammarPoint } from "@lingo/content-schema";
import { Fragment, type ReactNode } from "react";
import { speak } from "@/lib/speech";
import { Icon } from "./icons";
import { Word } from "./ui";

/** Tiny Markdown subset for grammar notes: paragraphs, "- " lists and **bold** (target-language examples). */
function inline(text: string, target: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") ? (
      <Word key={i} text={part.slice(2, -2)} lang={target} className="inline-block max-w-full rounded-md bg-cobalt-soft px-1.5 text-cobalt" />
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export function GrammarCard({ point, target, speechLang }: { point: GrammarPoint; target: string; speechLang: string }) {
  const blocks = point.explanation.trim().split(/\n\s*\n/);
  return (
    <article className="flex flex-col gap-5 leading-relaxed">
      <p className="flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-300">
        <Icon name="grammar" className="size-5" />
        דקדוק
      </p>
      <h1 className="text-3xl font-bold">{point.title.he}</h1>
      <div className="card flex flex-col gap-4 p-5">
        {blocks.map((b, i) =>
          b.trim().startsWith("- ") ? (
            <ul key={i} className="flex flex-col gap-2">
              {b.split("\n").map((li, j) => (
                <li key={j} className="flex gap-2 text-lg">
                  <span className="mt-2.5 size-2 shrink-0 rounded-full bg-cobalt" aria-hidden="true" />
                  <span>{inline(li.replace(/^\s*-\s*/, ""), target)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p key={i} className="text-lg">
              {inline(b, target)}
            </p>
          ),
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink-soft">דוגמאות</p>
        {point.examples.map((e) => (
          <button
            key={e.text}
            type="button"
            onClick={() => speak(e.text, speechLang)}
            className="flex items-center gap-3 rounded-2xl bg-sunken p-4 text-start"
          >
            <Icon name="volume" className="size-5 shrink-0 text-cobalt" />
            <span className="flex flex-col">
              <Word text={e.text} lang={target} className="text-xl" />
              <span className="text-ink-soft">{e.translation}</span>
            </span>
          </button>
        ))}
      </div>
    </article>
  );
}
