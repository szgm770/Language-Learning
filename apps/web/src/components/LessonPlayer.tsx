"use client";

import type { GrammarPoint, Lesson } from "@lingo/content-schema";
import type { Evaluation } from "@lingo/engine";
import Link from "next/link";
import { useCallback, useState } from "react";
import { today } from "@/lib/day";
import { answer, current, finishOps, isDone, type LessonRun, progress, startRun, summarize } from "@/lib/lesson";
import { getDeviceId, getState, record } from "@/lib/store";
import { ExerciseStage } from "./ExerciseStage";
import type { ExerciseContext } from "./exercises";
import { GrammarCard } from "./GrammarCard";
import { ProgressBar, Screen } from "./ui";

export function LessonPlayer({
  lesson,
  lessonIndex,
  grammar,
  courseId,
  ctx,
  nextHref,
}: {
  lesson: Lesson;
  lessonIndex: number;
  grammar?: GrammarPoint;
  courseId: string;
  ctx: ExerciseContext;
  nextHref: string | null;
}) {
  const [stage, setStage] = useState<"intro" | "play" | "done">(grammar ? "intro" : "play");
  const [run, setRun] = useState<LessonRun>(() => startRun(lesson, Date.now()));
  const [pending, setPending] = useState<LessonRun | null>(null);
  const [turn, setTurn] = useState(0);
  const [summary, setSummary] = useState<ReturnType<typeof summarize> | null>(null);

  const onResult = useCallback((evaluation: Evaluation, ms: number) => setPending(answer(run, evaluation, ms)), [run]);

  const onContinue = useCallback(async () => {
    if (!pending) return;
    setRun(pending);
    setPending(null);
    setTurn((t) => t + 1);
    if (isDone(pending)) {
      const now = Date.now();
      setSummary(summarize(pending, now));
      setStage("done");
      await record(
        finishOps(pending, {
          courseId,
          lessonId: lesson.id,
          lessonIndex,
          deviceId: getDeviceId(),
          day: today(now),
          now,
          existingCards: new Set(getState().cardCreatedAt.keys()),
        }),
      );
    }
  }, [pending, courseId, lesson.id, lessonIndex]);

  const ex = current(run);
  const shown = pending ? progress(pending) : progress(run);

  return (
    <Screen>
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-paper py-4">
        <Link href={`/course/${courseId}`} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-soft" aria-label="יציאה מהשיעור">
          <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </Link>
        <ProgressBar value={stage === "done" ? 1 : shown} label="התקדמות בשיעור" />
      </header>

      {stage === "intro" && grammar && (
        <div className="flex flex-1 flex-col gap-6 py-4">
          <GrammarCard point={grammar} target={ctx.target} />
          <button className="btn-primary mt-auto w-full" onClick={() => setStage("play")} autoFocus>
            לתרגול
          </button>
        </div>
      )}

      {stage === "play" && ex && (
        <ExerciseStage
          key={`${ex.id}-${turn}`}
          ex={ex}
          ctx={ctx}
          courseId={courseId}
          onResult={onResult}
          onContinue={onContinue}
        />
      )}

      {stage === "done" && summary && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold">השיעור הושלם</h1>
            <p className="text-ink-soft">{lesson.title.he}</p>
          </div>
          <dl className="grid w-full grid-cols-2 gap-3">
            <div className="rounded-2xl bg-saffron-soft p-4">
              <dt className="text-sm text-ink-soft">נקודות</dt>
              <dd className="text-3xl font-semibold">+{summary.xp}</dd>
            </div>
            <div className="rounded-2xl bg-mint-soft p-4">
              <dt className="text-sm text-ink-soft">נכון בניסיון ראשון</dt>
              <dd className="text-3xl font-semibold">{Math.round(summary.score * 100)}%</dd>
            </div>
          </dl>
          <div className="flex w-full flex-col gap-3">
            {nextHref && (
              <Link href={nextHref} className="btn-primary w-full">
                לשיעור הבא
              </Link>
            )}
            <Link href="/" className="btn-quiet w-full">
              למסך הבית
            </Link>
          </div>
        </div>
      )}
    </Screen>
  );
}
