"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { InstallHint } from "@/components/InstallHint";
import { TopBar } from "@/components/TopBar";
import { LoadError, Loading, Screen, Word } from "@/components/ui";
import { loadCourse, useLoad } from "@/lib/content";
import { today } from "@/lib/day";
import { currentCourse, dailyGoal, dueCount, nextLesson } from "@/lib/progress";
import { useLearner } from "@/lib/store";

export default function Home() {
  const { state, loaded } = useLearner();
  const router = useRouter();
  const courseId = loaded ? currentCourse(state) : undefined;

  useEffect(() => {
    if (loaded && !courseId) router.replace("/start");
  }, [loaded, courseId, router]);

  const { data, error } = useLoad(async () => (courseId ? loadCourse(courseId) : null), [courseId]);
  if (error) return <LoadError />;
  if (!loaded || !courseId || !data) return <Loading />;

  const next = nextLesson(state, courseId, data.units);
  const due = dueCount(state, courseId);
  const goal = dailyGoal(state, today());
  const firstWord = next?.unit.vocabulary[0];

  return (
    <Screen>
      <TopBar />
      <InstallHint />
      <section className="flex flex-col gap-1 pt-6">
        <p className="text-ink-soft">{data.manifest.title.he}</p>
        <h1 className="text-3xl font-semibold">{next ? next.unit.title.he : "סיימתם את כל השיעורים הזמינים"}</h1>
      </section>

      {next && firstWord && (
        // The word display: one real word from the next unit, large, as the face of the lesson.
        <div className="flex flex-col items-center gap-2 py-12" aria-hidden="true">
          <Word text={firstWord.text} lang={data.manifest.target} className="text-6xl sm:text-7xl" />
          {firstWord.pronunciation && <span className="text-lg text-ink-soft">{firstWord.pronunciation}</span>}
          <span className="text-ink-soft">{firstWord.translation}</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {next && (
          <Link href={`/lesson/${courseId}/${next.lesson.id}`} className="btn-primary min-h-16 w-full text-lg">
            להמשיך: {next.lesson.title.he}
          </Link>
        )}
        <Link
          href={`/review/${courseId}`}
          className={`btn-quiet min-h-14 w-full ${due === 0 ? "text-ink-soft" : ""}`}
          aria-disabled={due === 0}
        >
          {due > 0 ? `חזרה על ${due} מילים` : "אין מילים לחזרה כרגע"}
        </Link>
      </div>

      <section className="mt-10 flex flex-col gap-2" aria-label="היעד היומי">
        <div className="flex items-baseline justify-between">
          <h2 className="font-medium">היעד להיום</h2>
          <span className="text-ink-soft tabular-nums">
            {goal.minutes} מתוך {goal.goalMinutes} דקות
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-saffron" style={{ width: `${Math.min(100, (goal.minutes / goal.goalMinutes) * 100)}%` }} />
        </div>
      </section>

      <nav className="mt-auto flex justify-between pt-10 text-cobalt">
        <Link href={`/course/${courseId}`} className="min-h-11 py-2 underline-offset-4 hover:underline">
          מפת הקורס
        </Link>
        <Link href="/start" className="min-h-11 py-2 underline-offset-4 hover:underline">
          קורס אחר
        </Link>
      </nav>
    </Screen>
  );
}
