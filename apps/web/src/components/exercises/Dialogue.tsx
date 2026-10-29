"use client";

import type { DialogueLine } from "@lingo/content-schema";
import { useEffect, useState } from "react";
import { speak, speakSequence } from "@/lib/speech";
import { Avatar } from "../art";
import { Icon } from "../icons";
import { Word } from "../ui";
import type { ExerciseContext, ExerciseProps } from "./types";

/** Chat bubbles: the first speaker on the start side, others opposite, like a messaging app. */
export function Bubble({
  line,
  ctx,
  side,
  active = false,
  showTranslation,
  children,
}: {
  line: DialogueLine;
  ctx: ExerciseContext;
  side: "start" | "end";
  active?: boolean;
  showTranslation: boolean;
  children?: React.ReactNode;
}) {
  const who = ctx.characters.find((c) => c.id === line.speaker);
  return (
    <div className={`flex items-end gap-2 ${side === "end" ? "flex-row-reverse" : ""}`}>
      {who && <Avatar character={who} className="size-10" />}
      <div className={`flex max-w-[80%] flex-col ${side === "end" ? "items-end" : "items-start"}`}>
        <span className="mb-1 px-1 text-xs text-ink-soft">{who?.he ?? line.speaker}</span>
        {children ?? (
          <button
            type="button"
            onClick={() => speak(line.text, ctx.speechLang, { pitch: who?.pitch })}
            className={`rounded-3xl px-4 py-3 text-start transition ${
              side === "end" ? "rounded-ee-md bg-cobalt text-white" : "rounded-es-md bg-surface ring-1 ring-line"
            } ${active ? "ring-4 ring-saffron" : ""}`}
          >
            <Word text={line.text} lang={ctx.target} className="block text-lg" />
            {showTranslation && <span className={`mt-1 block text-sm ${side === "end" ? "text-white/80" : "text-ink-soft"}`}>{line.translation}</span>}
          </button>
        )}
      </div>
    </div>
  );
}

export function useSides(lines: DialogueLine[]) {
  const first = lines[0]?.speaker;
  return (l: DialogueLine) => (l.speaker === first ? "start" : "end") as "start" | "end";
}

export function Dialogue({ ex, ctx }: ExerciseProps<"dialogue">) {
  const [playing, setPlaying] = useState(-1);
  const [stop, setStop] = useState<(() => void) | null>(null);
  const [translate, setTranslate] = useState(false);
  const side = useSides(ex.lines);

  const playAll = () => {
    const s = speakSequence(
      ex.lines.map((l) => ({ text: l.text, pitch: ctx.characters.find((c) => c.id === l.speaker)?.pitch })),
      ctx.speechLang,
      (i) => {
        setPlaying(i);
        if (i === -1) setStop(null);
      },
    );
    setStop(() => s);
  };
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-cobalt">
        <Icon name="chat" className="size-5" />
        שיחה
      </div>
      <p className="text-lg">{ex.scene}</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary min-h-11 px-4 text-sm" onClick={() => (stop ? stop() : playAll())}>
          <Icon name={stop ? "close" : "play"} className="size-5" filled={!stop} />
          {stop ? "עצירה" : "להשמיע את השיחה"}
        </button>
        <button type="button" className="btn-quiet min-h-11 px-4 text-sm" aria-pressed={translate} onClick={() => setTranslate((t) => !t)}>
          {translate ? "להסתיר תרגום" : "להציג תרגום"}
        </button>
      </div>
      <div className="flex flex-col gap-4 rounded-3xl bg-sunken p-4">
        {ex.lines.map((l, i) => (
          <Bubble key={i} line={l} ctx={ctx} side={side(l)} active={playing === i} showTranslation={translate} />
        ))}
      </div>
    </div>
  );
}
