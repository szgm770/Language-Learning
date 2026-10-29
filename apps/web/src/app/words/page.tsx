"use client";

import type { Lexeme } from "@lingo/content-schema";
import { allCards } from "@lingo/sync";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { Loading, SpeakButton, Word } from "@/components/ui";
import { lexemeIndex, loadCourse, useLoad } from "@/lib/content";
import { parseCardKey } from "@/lib/ids";
import { currentCourse, mastery } from "@/lib/progress";
import { useLearner } from "@/lib/store";

const LEVELS = ["חדשה", "מתחילה", "בדרך", "טובה", "חזקה"];

/** Every word met so far, with how well it is known. */
export default function Words() {
  const { state, loaded } = useLearner();
  const courseId = loaded ? currentCourse(state) : undefined;
  const { data } = useLoad(async () => (courseId ? loadCourse(courseId) : null), [courseId]);
  const [q, setQ] = useState("");

  const words = useMemo(() => {
    if (!data || !courseId) return [];
    const lex = lexemeIndex(data.units);
    return allCards(state, courseId)
      .map((c) => ({ lx: lex.get(parseCardKey(c.key).lexemeId), m: mastery(c.card) }))
      .filter((w): w is { lx: Lexeme; m: number } => !!w.lx)
      .sort((a, b) => a.lx.text.localeCompare(b.lx.text));
  }, [data, courseId, state]);

  if (!loaded) return <Loading />;
  const shown = words.filter((w) => !q || w.lx.text.toLowerCase().includes(q.toLowerCase()) || w.lx.translation.includes(q));
  const strong = words.filter((w) => w.m >= 3).length;

  return (
    <AppShell>
      <header className="flex flex-col gap-1 pt-6">
        <h1 className="text-3xl font-bold">המילים שלי</h1>
        <p className="text-ink-soft">
          {words.length} מילים, מתוכן {strong} חזקות
        </p>
      </header>
      {words.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <Icon name="words" className="size-12 text-cobalt" />
          <p className="text-lg font-semibold">עוד אין כאן מילים</p>
          <p className="text-ink-soft">כל מילה שתלמדו בשיעורים תופיע כאן, עם כמה טוב אתם מכירים אותה.</p>
        </div>
      ) : (
        <>
          <input
            type="search"
            className="field mt-5"
            placeholder="חיפוש מילה"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="חיפוש מילה"
          />
          <ul className="mt-4 flex flex-col gap-2">
            {shown.map(({ lx, m }) => (
              <li key={lx.id} className="card flex items-center gap-3 p-3">
                {data && <SpeakButton text={lx.text} lang={data.manifest.speechLang} size="sm" label={`השמעה: ${lx.text}`} />}
                <span className="flex min-w-0 flex-1 flex-col">
                  <Word text={lx.text} lang={data?.manifest.target ?? "en"} className="text-lg" />
                  <span className="truncate text-sm text-ink-soft">{lx.translation}</span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="flex gap-0.5" aria-hidden="true">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className={`h-4 w-1.5 rounded-full ${i <= m ? "bg-mint" : "bg-sunken"}`} />
                    ))}
                  </span>
                  <span className="text-xs text-ink-soft">{LEVELS[m]}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </AppShell>
  );
}
