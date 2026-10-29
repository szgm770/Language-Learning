"use client";

import { type GrammarPoint, isGraded, type Lesson } from "@lingo/content-schema";
import type { Evaluation } from "@lingo/engine";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { today } from "@/lib/day";
import { answer, current, finishOps, isDone, type LessonRun, progress, startRun, summarize } from "@/lib/lesson";
import { PASS_SCORE } from "@/lib/progress";
import { sfx } from "@/lib/sfx";
import { getDeviceId, getState, record } from "@/lib/store";
import { Confetti } from "./Confetti";
import { ExerciseStage } from "./ExerciseStage";
import type { ExerciseContext } from "./exercises";
import { GrammarCard } from "./GrammarCard";
import { Icon } from "./icons";
import { ProgressBar, Screen } from "./ui";

/** Counts up to `to` over ~0.8 s, for the XP number at the end. */
function useCountUp(to: number, active: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setN(to);
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 800);
      setN(Math.round(to * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, active]);
  return n;
}

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
  const pending = useRef<LessonRun | null>(null);
  const [turn, setTurn] = useState(0);
  const [streak, setStreak] = useState(0);
  const [summary, setSummary] = useState<ReturnType<typeof summarize> | null>(null);
  const passed = !!summary && summary.score >= PASS_SCORE;

  const onResult = useCallback(
    (evaluation: Evaluation, ms: number) => {
      pending.current = answer(run, evaluation, ms);
      const ex = current(run);
      if (ex && isGraded(ex)) setStreak((s) => (evaluation.correct ? s + 1 : 0));
    },
    [run],
  );

  const onContinue = useCallback(async () => {
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    setRun(next);
    setTurn((t) => t + 1);
    if (isDone(next)) {
      const now = Date.now();
      setSummary(summarize(next, now));
      setStage("done");
      sfx.complete();
      await record(
        finishOps(next, {
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
  }, [courseId, lesson.id, lessonIndex]);

  const ex = current(run);
  const xp = useCountUp(summary?.xp ?? 0, stage === "done");

  return (
    <Screen>
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-paper py-4">
        <Link
          href={`/course/${courseId}/`}
          className="grid size-11 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-sunken"
          aria-label="יציאה מהשיעור"
        >
          <Icon name="close" className="size-6" />
        </Link>
        <ProgressBar value={stage === "done" ? 1 : progress(run)} label="התקדמות בשיעור" />
        {streak >= 3 && stage === "play" && (
          <span key={streak} className="pop flex shrink-0 items-center gap-1 rounded-full bg-saffron-soft px-3 py-1 text-sm font-bold text-saffron-strong">
            <Icon name="flame" className="size-4" filled />
            {streak} ברצף
          </span>
        )}
      </header>

      {stage === "intro" && grammar && (
        <div className="flex flex-1 flex-col gap-6 py-4 rise-in">
          <GrammarCard point={grammar} target={ctx.target} speechLang={ctx.speechLang} />
          <div className="sticky bottom-0 -mx-4 mt-auto bg-paper px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button className="btn-primary w-full" onClick={() => setStage("play")} autoFocus>
              לתרגול
            </button>
          </div>
        </div>
      )}

      {stage === "play" && ex && (
        <ExerciseStage key={`${ex.id}-${turn}`} ex={ex} ctx={ctx} onResult={onResult} onContinue={onContinue} />
      )}

      {stage === "done" && summary && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <Confetti />
          <span className="pop grid size-28 place-items-center rounded-full bg-saffron-soft text-saffron">
            <Icon name="trophy" className="size-16" />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">
              {lesson.kind !== "test" ? "השיעור הושלם!" : passed ? "עברתם את מבחן הרמה!" : "כמעט שם!"}
            </h1>
            <p className="text-lg text-ink-soft">{lesson.title.he}</p>
          </div>
          <dl className="grid w-full grid-cols-3 gap-3">
            <div className="card flex flex-col items-center gap-1 p-4">
              <dt className="text-xs font-semibold text-saffron-strong">נקודות</dt>
              <dd className="text-3xl font-bold tabular-nums">+{xp}</dd>
            </div>
            <div className="card flex flex-col items-center gap-1 p-4">
              <dt className="text-xs font-semibold text-mint-strong">דיוק</dt>
              <dd className="text-3xl font-bold tabular-nums">{Math.round(summary.score * 100)}%</dd>
            </div>
            <div className="card flex flex-col items-center gap-1 p-4">
              <dt className="text-xs font-semibold text-cobalt">זמן</dt>
              <dd className="text-3xl font-bold tabular-nums">
                {Math.floor(summary.seconds / 60)}:{String(summary.seconds % 60).padStart(2, "0")}
              </dd>
            </div>
          </dl>
          <div className="flex w-full flex-col gap-3">
            {lesson.kind === "test" && (
              <Link href={`/certificate/${courseId}/`} className="btn-primary w-full">
                {passed ? "לתעודה שלי" : `צריך ${Math.round(PASS_SCORE * 100)}% כדי לקבל תעודה`}
              </Link>
            )}
            {nextHref && (
              <Link href={nextHref} className="btn-primary w-full">
                לשיעור הבא
              </Link>
            )}
            <Link href="/learn/" className="btn-quiet w-full">
              למסך הבית
            </Link>
          </div>
        </div>
      )}
    </Screen>
  );
}
