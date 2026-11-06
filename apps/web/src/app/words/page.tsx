"use client";

import type { Lexeme } from "@lingo/content-schema";
import { allCards } from "@lingo/sync";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { Loading, SpeakButton, Word } from "@/components/ui";
import { lexemeIndex, loadCourse, useLoad } from "@/lib/content";
import { parseCardKey } from "@/lib/ids";
import { currentCourse, isAlphabetCard, mastery } from "@/lib/progress";
import { useLearner } from "@/lib/store";

const LEVELS = ["חדשה", "מתחילה", "בדרך", "טובה", "חזקה"];
const FILTERS = [
  { id: "all", label: "הכול", test: () => true },
  { id: "weak", label: "לחיזוק", test: (m: number) => m <= 2 },
  { id: "strong", label: "חזקות", test: (m: number) => m >= 3 },
] as const;

/** Every word met so far, grouped by unit (so it stays manageable as it grows), with how well it is known. */
export default function Words() {
  const { state, loaded } = useLearner();
  const courseId = loaded ? currentCourse(state) : undefined;
  const { data } = useLoad(async () => (courseId ? loadCourse(courseId) : null), [courseId]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [cefr, setCefr] = useState("all");

  const groups = useMemo(() => {
    if (!data || !courseId) return [];
    const lex = lexemeIndex(data.units);
    const met = new Map(
      allCards(state, courseId)
        .filter((c) => !isAlphabetCard(c.key))
        .map((c) => [parseCardKey(c.key).lexemeId, mastery(c.card)] as const),
    );
    const f = FILTERS.find((x) => x.id === filter)!;
    const needle = q.trim().toLowerCase();
    return data.units
      .map((unit) => ({
        unit,
        words: unit.vocabulary
          .filter((v) => met.has(v.id) && lex.get(v.id) === v)
          .map((lx) => ({ lx, m: met.get(lx.id)! }))
          .filter((w) => f.test(w.m) && (!needle || w.lx.text.toLowerCase().includes(needle) || w.lx.translation.includes(q.trim()))),
      }))
      .filter((g) => g.words.length > 0 && (cefr === "all" || g.unit.cefr === cefr));
  }, [data, courseId, state, q, filter, cefr]);

  if (!loaded) return <Loading />;
  const total = groups.reduce((n, g) => n + g.words.length, 0);
  const levels = [...new Set(data?.units.map((u) => u.cefr) ?? [])].filter((c) => c !== "A0");

  return (
    <AppShell>
      <header className="flex items-start justify-between gap-3 pt-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">המילים שלי</h1>
          <p className="text-ink-soft">{total} מילים</p>
        </div>
        {total > 0 && (
          <button type="button" className="btn-quiet print:hidden" onClick={() => window.print()}>
            הדפסה
          </button>
        )}
      </header>
      <div className="mt-5 flex flex-col gap-3 print:hidden">
        <input type="search" className="field" placeholder="חיפוש מילה" value={q} onChange={(e) => setQ(e.target.value)} aria-label="חיפוש מילה" />
        <div className="flex flex-wrap gap-2" role="group" aria-label="סינון">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === f.id ? "bg-cobalt text-white" : "bg-sunken text-ink-soft"}`}>
              {f.label}
            </button>
          ))}
          <select className="field !w-auto !py-2 text-sm" value={cefr} onChange={(e) => setCefr(e.target.value)} aria-label="רמה">
            <option value="all">כל הרמות</option>
            {levels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      {total === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-3 p-8 text-center">
          <Icon name="words" className="size-12 text-cobalt" />
          <p className="text-lg font-semibold">אין כאן מילים</p>
          <p className="text-ink-soft">כל מילה שתלמדו בשיעורים תופיע כאן, עם כמה טוב אתם מכירים אותה.</p>
        </div>
      ) : (
        groups.map(({ unit, words }) => (
          <section key={unit.id} className="mt-6 break-inside-avoid">
            <h2 className="mb-2 flex items-baseline gap-2 text-lg font-bold">
              {unit.title.he}
              <span className="text-xs font-normal text-ink-soft">
                {unit.cefr} · {words.length}
              </span>
            </h2>
            <ul className="flex flex-col gap-2 print:gap-0 print:[column-count:2]">
              {words.map(({ lx, m }) => (
                <li key={lx.id} className="card flex items-center gap-3 p-3 print:break-inside-avoid print:rounded-none print:border-0 print:border-b print:p-1 print:shadow-none">
                  {data && (
                    <span className="print:hidden">
                      <SpeakButton text={lx.text} lang={data.manifest.speechLang} size="sm" label={`השמעה: ${lx.text}`} />
                    </span>
                  )}
                  <span className="flex min-w-0 flex-1 flex-col">
                    <Word text={lx.text} lang={data?.manifest.target ?? "en"} className="text-lg" />
                    <span className="truncate text-sm text-ink-soft print:whitespace-normal">{lx.translation}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1 print:hidden">
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
          </section>
        ))
      )}
    </AppShell>
  );
}
