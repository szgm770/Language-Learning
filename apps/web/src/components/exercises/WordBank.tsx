"use client";

import { wordBankTiles } from "@lingo/engine";
import { useMemo, useState } from "react";
import { Word } from "../ui";
import { type ExerciseProps, seedOf } from "./types";

export function WordBank({ ex, ctx, locked, onChange }: ExerciseProps<"word_bank">) {
  const tiles = useMemo(() => wordBankTiles(ex, seedOf(ex.id)), [ex]);
  // Indexes into `tiles`, so repeated words stay distinct.
  const [chosen, setChosen] = useState<number[]>([]);

  function update(next: number[]) {
    setChosen(next);
    onChange(next.length ? { type: "word_bank", tiles: next.map((i) => tiles[i]!) } : null);
  }

  const tile = (i: number, onClick: () => void, faded = false) => (
    <button
      key={i}
      type="button"
      disabled={locked || faded}
      onClick={onClick}
      className={`min-h-12 rounded-xl border-2 border-line bg-surface px-4 text-xl transition active:scale-95 ${
        faded ? "border-dashed bg-transparent text-transparent" : ""
      }`}
    >
      <Word text={tiles[i]!} lang={ctx.target} />
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">תרגמו את המשפט</h2>
      <p className="text-xl">{ex.prompt}</p>
      <div
        dir="ltr"
        className="flex min-h-28 flex-wrap content-start gap-2 border-b-2 border-line pb-3"
        aria-label="התשובה שלכם"
      >
        {chosen.map((i) => tile(i, () => update(chosen.filter((c) => c !== i))))}
      </div>
      <div dir="ltr" data-bank className="flex flex-wrap justify-center gap-2">
        {tiles.map((_, i) => tile(i, () => update([...chosen, i]), chosen.includes(i)))}
      </div>
    </div>
  );
}
