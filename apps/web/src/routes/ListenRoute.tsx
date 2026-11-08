"use client";

import type { DialogueLine } from "@lingo/content-schema";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bubble } from "@/components/exercises/Dialogue";
import { Icon } from "@/components/icons";
import { LoadError, Loading } from "@/components/ui";
import { loadManifest, loadUnit, useLoad } from "@/lib/content";
import { speakSequence } from "@/lib/speech";

/** A unit's dialogues joined into one chapter: read it, or listen to the whole story in the characters' voices. */
export function ListenRoute({ courseId, unitId }: { courseId: string; unitId: string }) {
  const { data, error } = useLoad(async () => ({ manifest: await loadManifest(courseId), unit: await loadUnit(courseId, unitId) }), [courseId, unitId]);
  const [playing, setPlaying] = useState(-1);
  const [stop, setStop] = useState<(() => void) | null>(null);
  const [translate, setTranslate] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const scenes = useMemo(
    () =>
      (data?.unit.lessons ?? []).flatMap((l) =>
        l.exercises.flatMap((e) => (e.type === "dialogue" ? [{ id: e.id, scene: e.scene, lines: e.lines }] : [])),
      ),
    [data],
  );
  if (error) return <LoadError />;
  if (!data) return <Loading />;
  const { manifest, unit } = data;
  const all: DialogueLine[] = scenes.flatMap((s) => s.lines);
  const ctx = { target: manifest.target, source: manifest.source, speechLang: manifest.speechLang, characters: manifest.characters, lexemes: new Map() };
  const first = scenes[0]?.lines[0]?.speaker;
  const side = (l: DialogueLine) => (l.speaker === first ? "start" : "end") as "start" | "end";

  const play = () => {
    const s = speakSequence(
      all.map((l) => ({ text: l.text, pitch: manifest.characters.find((c) => c.id === l.speaker)?.pitch })),
      manifest.speechLang,
      (i) => {
        setPlaying(i);
        if (i === -1) setStop(null);
      },
    );
    setStop(() => s);
  };
  let offset = 0;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <Link href={`/course/${courseId}/`} className="flex items-center gap-1 text-sm font-semibold text-cobalt">
        <Icon name="back" className="size-4" />
        חזרה לקורס
      </Link>
      <h1 className="text-3xl font-bold">{unit.title.he}</h1>
      <p className="text-ink-soft">פרק להאזנה: כל השיחות של היחידה ברצף, בקולות של הדמויות.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary min-h-11 px-4 text-sm" onClick={() => (stop ? (stop(), setPlaying(-1), setStop(null)) : play())}>
          <Icon name={stop ? "close" : "play"} className="size-5" filled={!stop} />
          {stop ? "עצירה" : "להשמיע את הפרק"}
        </button>
        <button type="button" className="btn-quiet min-h-11 px-4 text-sm" aria-pressed={translate} onClick={() => setTranslate((t) => !t)}>
          {translate ? "להסתיר תרגום" : "להציג תרגום"}
        </button>
      </div>
      {scenes.map((s) => {
        const start = offset;
        offset += s.lines.length;
        return (
          <section key={s.id} className="flex flex-col gap-3">
            <p className="text-ink-soft">{s.scene}</p>
            <div className="flex flex-col gap-4 rounded-3xl bg-sunken p-4">
              {s.lines.map((l, i) => (
                <Bubble key={i} line={l} ctx={ctx} side={side(l)} active={playing === start + i} showTranslation={translate} />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
