import type { GrammarPoint } from "@lingo/content-schema";
import { Fragment, type ReactNode } from "react";
import { Word } from "./ui";

/** Tiny Markdown subset for grammar notes: paragraphs, "- " lists and **bold** (target-language examples). */
function inline(text: string, target: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") ? <Word key={i} text={part.slice(2, -2)} lang={target} className="text-[1.1em] font-semibold" /> : <Fragment key={i}>{part}</Fragment>,
  );
}

export function GrammarCard({ point, target }: { point: GrammarPoint; target: string }) {
  const blocks = point.explanation.trim().split(/\n\s*\n/);
  return (
    <article className="flex flex-col gap-4 leading-relaxed">
      <p className="text-sm text-cobalt">דקדוק</p>
      <h1 className="text-2xl font-semibold">{point.title.he}</h1>
      {blocks.map((b, i) =>
        b.trim().startsWith("- ") ? (
          <ul key={i} className="flex list-disc flex-col gap-1 ps-5">
            {b.split("\n").map((li, j) => (
              <li key={j}>{inline(li.replace(/^\s*-\s*/, ""), target)}</li>
            ))}
          </ul>
        ) : (
          <p key={i} className="text-lg">
            {inline(b, target)}
          </p>
        ),
      )}
      <ul className="flex flex-col gap-3 border-s-4 border-cobalt ps-4">
        {point.examples.map((e) => (
          <li key={e.text} className="flex flex-col">
            <Word text={e.text} lang={target} className="text-2xl" />
            <span className="text-ink-soft">{e.translation}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
