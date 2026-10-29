"use client";

import type { Exercise, Lexeme } from "@lingo/content-schema";
import { dailyQueue, type Evaluation, gradeFromAnswer } from "@lingo/engine";
import { allCards, SCHEMA_VERSION } from "@lingo/sync";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { today } from "@/lib/day";
import { uuidv7, parseCardKey } from "@/lib/ids";
import { XP_PER_LESSON } from "@/lib/lesson";
import { modeFor, reviewExercise } from "@/lib/review";
import { getDeviceId, record, useLearner } from "@/lib/store";
import { ExerciseStage } from "./ExerciseStage";
import type { ExerciseContext } from "./exercises";
import { ProgressBar, Screen } from "./ui";

interface Item {
  key: string;
  ex: Exercise;
}

/** Today's spaced-repetition session: each due word once; a miss comes back once at the end. */
export function ReviewPlayer({ courseId, lexemes, ctx }: { courseId: string; lexemes: Map<string, Lexeme>; ctx: ExerciseContext }) {
  const { state } = useLearner();
  const [startedAt] = useState(Date.now());
  // The session is fixed when it starts, so answering does not reshuffle it.
  const initial = useMemo<Item[]>(() => {
    const cards = allCards(state, courseId).filter((c) => c.card.state !== 0);
    const pool = [...lexemes.values()];
    return dailyQueue(cards, { now: startedAt, newPerDay: 0, maxReviews: 200 })
      .map((c, i) => {
        const lx = lexemes.get(parseCardKey(c.key).lexemeId);
        return lx ? { key: c.key, ex: reviewExercise(lx, pool, modeFor(c.card, i), i + startedAt) } : null;
      })
      .filter((x): x is Item => x !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lexemes]);

  const [queue, setQueue] = useState(initial);
  const [graded, setGraded] = useState<Set<string>>(new Set());
  const [last, setLast] = useState<Evaluation | null>(null);
  const [requeued, setRequeued] = useState<Set<string>>(new Set());
  const [turn, setTurn] = useState(0);
  const [finished, setFinished] = useState(false);

  const item = queue[0];

  const onResult = useCallback(
    async (evaluation: Evaluation, ms: number) => {
      setLast(evaluation);
      if (!item || graded.has(item.key)) return;
      setGraded((g) => new Set(g).add(item.key));
      const now = Date.now();
      await record([
        {
          id: uuidv7(now),
          at: now,
          deviceId: getDeviceId(),
          v: SCHEMA_VERSION,
          kind: "review",
          cardKey: item.key,
          rating: gradeFromAnswer(evaluation.correct, ms, evaluation.verdict === "typo"),
          durationMs: Math.min(ms, 3_600_000),
        },
      ]);
    },
    [item, graded],
  );

  const onContinue = useCallback(async () => {
    if (!item) return;
    const rest = queue.slice(1);
    // A missed word comes back once more at the end (only the first answer is graded).
    const comeBack = last !== null && !last.correct && !requeued.has(item.key);
    if (comeBack) setRequeued((r) => new Set(r).add(item.key));
    const next = comeBack ? [...rest, item] : rest;
    setQueue(next);
    setTurn((t) => t + 1);
    setLast(null);
    if (next.length === 0) {
      setFinished(true);
      const now = Date.now();
      await record([
        {
          id: uuidv7(now),
          at: now,
          deviceId: getDeviceId(),
          v: SCHEMA_VERSION,
          kind: "activity",
          day: today(now),
          xp: Math.round(XP_PER_LESSON / 2) + graded.size,
          seconds: Math.min(86_400, Math.round((now - startedAt) / 1000)),
        },
      ]);
    }
  }, [item, last, queue, graded, requeued, startedAt]);

  if (initial.length === 0) {
    return (
      <Screen className="items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold">אין מילים לחזרה כרגע</h1>
        <p className="text-ink-soft">מילים חוזרות לתרגול בדיוק כשהן מתחילות להישכח. המשיכו בשיעור הבא.</p>
        <Link href="/learn/" className="btn-primary">
          למסך הבית
        </Link>
      </Screen>
    );
  }

  return (
    <Screen>
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-paper py-4">
        <Link href="/learn/" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft" aria-label="יציאה מהחזרה">
          <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </Link>
        <ProgressBar value={finished ? 1 : graded.size / initial.length} label="התקדמות בחזרה" />
      </header>
      {!finished && item && (
        <ExerciseStage key={`${item.key}-${turn}`} ex={item.ex} ctx={ctx} courseId={courseId} onResult={onResult} onContinue={onContinue} />
      )}
      {finished && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-3xl font-semibold">החזרה להיום הושלמה</h1>
          <p className="text-ink-soft">תרגלתם {graded.size} מילים. הן יחזרו בדיוק בזמן שכדאי.</p>
          <Link href="/learn/" className="btn-primary w-full">
            למסך הבית
          </Link>
        </div>
      )}
    </Screen>
  );
}
