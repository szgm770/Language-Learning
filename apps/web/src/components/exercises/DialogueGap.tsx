"use client";

import { seededShuffle } from "@lingo/engine";
import { useMemo, useState } from "react";
import { Icon } from "../icons";
import { Word } from "../ui";
import { Bubble, useSides } from "./Dialogue";
import { type ExerciseProps, seedOf } from "./types";

/** Complete the conversation: pick the line that fits the gap. */
export function DialogueGap({ ex, ctx, locked, onChange }: ExerciseProps<"dialogue_gap">) {
  const side = useSides(ex.lines);
  const options = useMemo(() => seededShuffle([ex.lines[ex.gap]!.text, ...ex.distractors], seedOf(ex.id)), [ex]);
  const [picked, setPicked] = useState<string | null>(null);
  const gapLine = ex.lines[ex.gap]!;
  const s = side(gapLine);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-cobalt">
        <Icon name="chat" className="size-5" />
        השלימו את השיחה
      </div>
      <div className="flex flex-col gap-4 rounded-3xl bg-sunken p-4">
        {ex.lines.slice(0, ex.gap + 1).map((l, i) =>
          i === ex.gap ? (
            <Bubble key={i} line={l} ctx={ctx} side={s} showTranslation={false}>
              <span
                className={`rounded-3xl border-2 border-dashed px-4 py-3 ${
                  picked ? "border-cobalt bg-cobalt-soft" : "border-ink-soft/40"
                } ${s === "end" ? "rounded-ee-md" : "rounded-es-md"}`}
              >
                {picked ? <Word text={picked} lang={ctx.target} className="text-lg" /> : <span className="text-ink-soft">?</span>}
              </span>
            </Bubble>
          ) : (
            <Bubble key={i} line={l} ctx={ctx} side={side(l)} showTranslation />
          ),
        )}
      </div>
      <ul className="flex flex-col gap-3">
        {options.map((o) => (
          <li key={o}>
            <button
              type="button"
              className="choice"
              aria-pressed={picked === o}
              disabled={locked}
              onClick={() => {
                setPicked(o);
                onChange({ type: "dialogue_gap", choice: o });
              }}
            >
              <Word text={o} lang={ctx.target} className="text-lg" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
