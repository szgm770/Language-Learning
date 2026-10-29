"use client";

import { seededShuffle } from "@lingo/engine";
import { useMemo, useState } from "react";
import { speak } from "@/lib/speech";
import { Word } from "../ui";
import { type ExerciseProps, seedOf } from "./types";

type Side = "target" | "source";

export function MatchPairs({ ex, ctx, locked, onChange }: ExerciseProps<"match_pairs">) {
  const seed = seedOf(ex.id);
  const left = useMemo(() => seededShuffle(ex.pairs.map((_, i) => i), seed), [ex.pairs, seed]);
  const right = useMemo(() => seededShuffle(ex.pairs.map((_, i) => i), seed + 7), [ex.pairs, seed]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [sel, setSel] = useState<{ side: Side; pair: number } | null>(null);
  const [miss, setMiss] = useState<{ a: number; b: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);

  function tap(side: Side, pair: number) {
    if (locked || matched.has(pair)) return;
    if (side === "target") speak(ex.pairs[pair]![0], ctx.speechLang);
    if (!sel || sel.side === side) return setSel({ side, pair });
    if (sel.pair === pair) {
      const next = new Set(matched).add(pair);
      setMatched(next);
      setSel(null);
      if (next.size === ex.pairs.length) onChange({ type: "match_pairs", mistakes });
    } else {
      setMistakes((m) => m + 1);
      setMiss({ a: sel.pair, b: pair });
      setSel(null);
      setTimeout(() => setMiss(null), 500);
    }
  }

  const cell = (side: Side, pair: number) => {
    const done = matched.has(pair);
    const chosen = sel?.side === side && sel.pair === pair;
    const wrong = miss && (miss.a === pair || miss.b === pair) && !done;
    const text = side === "target" ? ex.pairs[pair]![0] : ex.pairs[pair]![1];
    return (
      <button
        key={`${side}-${pair}`}
        type="button"
        disabled={done || locked}
        aria-pressed={chosen}
        onClick={() => tap(side, pair)}
        className={`choice justify-center ${done ? "border-transparent bg-mint-soft text-mint opacity-70" : ""} ${
          wrong ? "border-rose bg-rose-soft" : ""
        }`}
      >
        {side === "target" ? <Word text={text} lang={ctx.target} className="text-xl" /> : text}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-medium">התאימו את הזוגות</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">{right.map((p) => cell("source", p))}</div>
        <div className="flex flex-col gap-3">{left.map((p) => cell("target", p))}</div>
      </div>
    </div>
  );
}
