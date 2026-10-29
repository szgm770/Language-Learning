"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { InstallHint } from "@/components/InstallHint";
import { TopBar } from "@/components/TopBar";
import { LoadError, Loading, Screen, Word } from "@/components/ui";
import { loadCourse, useLoad } from "@/lib/content";
import { today } from "@/lib/day";
import { languageName } from "@/lib/languages";
import { currentCourse, dailyGoal, dueCount, isCompleted, nextLesson } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { useLearner } from "@/lib/store";

export default function Dashboard() {
  const { state, loaded } = useLearner();
  const router = useRouter();
  const courseId = loaded ? currentCourse(state) : undefined;

  useEffect(() => {
    if (loaded && !courseId) router.replace("/");
  }, [loaded, courseId, router]);

  const { data, error } = useLoad(async () => (courseId ? loadCourse(courseId) : null), [courseId]);
  if (error) return <LoadError />;
  if (!loaded || !courseId || !data) return <Loading />;

  const { manifest } = data;
  const next = nextLesson(state, courseId, data.units);
  const due = dueCount(state, courseId);
  const goal = dailyGoal(state, today());
  const unit = next?.unit ?? data.units.at(-1)!;
  const unitIndex = data.units.indexOf(unit);
  const done = unit.lessons.filter((l) => isCompleted(state, courseId, l.id)).length;
  // The word display: a real word from the lesson ahead, as the face of today's work.
  const word = next ? (next.unit.vocabulary.find((v) => next.lesson.exercises.some((e) => e.lexemes.includes(v.id))) ?? next.unit.vocabulary[0]) : undefined;

  return (
    <Screen>
      <TopBar />
      <InstallHint />

      <section className="mt-4 flex flex-col gap-1">
        <p className="text-ink-soft">
          {languageName(manifest.target)}, יחידה {unitIndex + 1}, רמה {unit.cefr}
        </p>
        <h1 className="text-3xl font-bold">{next ? unit.title.he : "סיימתם את כל השיעורים הזמינים"}</h1>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full bg-mint" style={{ width: `${(done / unit.lessons.length) * 100}%` }} />
          </div>
          <span className="text-sm text-ink-soft tabular-nums">
            {done} מתוך {unit.lessons.length} שיעורים
          </span>
        </div>
      </section>

      {next && word && (
        <button
          type="button"
          onClick={() => speak(word.text, manifest.speechLang)}
          className="mt-6 flex flex-col items-center gap-1 rounded-3xl bg-surface px-4 py-10 ring-1 ring-line"
          aria-label={`${word.text}, ${word.translation}. השמעה`}
        >
          <span className="text-sm text-ink-soft">מילה מהשיעור הבא</span>
          <Word text={word.text} lang={manifest.target} className="text-6xl text-cobalt sm:text-7xl" />
          {word.pronunciation && <span className="text-lg text-ink-soft">{word.pronunciation}</span>}
          <span className="text-lg">{word.translation}</span>
        </button>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {next && (
          <Link href={`/lesson/${courseId}/${next.lesson.id}/`} className="btn-primary min-h-16 w-full text-lg">
            להמשיך: {next.lesson.title.he}
          </Link>
        )}
        <Link
          href={`/review/${courseId}/`}
          className="flex min-h-14 items-center justify-between rounded-xl bg-surface px-5 ring-1 ring-line"
        >
          <span className={due === 0 ? "text-ink-soft" : "font-medium"}>{due > 0 ? "חזרה יומית" : "אין מילים לחזרה כרגע"}</span>
          {due > 0 && (
            <span className="rounded-full bg-saffron-soft px-3 py-1 text-sm font-semibold tabular-nums">{due} מילים</span>
          )}
        </Link>
      </div>

      <section className="mt-8 flex flex-col gap-2" aria-label="היעד היומי">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">היעד להיום</h2>
          <span className="text-sm text-ink-soft tabular-nums">
            {goal.minutes} מתוך {goal.goalMinutes} דקות{goal.xp > 0 ? `, ${goal.xp} נקודות` : ""}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-saffron" style={{ width: `${Math.min(100, (goal.minutes / goal.goalMinutes) * 100)}%` }} />
        </div>
      </section>

      <nav className="mt-auto flex justify-between pt-10 text-cobalt">
        <Link href={`/course/${courseId}/`} className="min-h-11 py-2 underline-offset-4 hover:underline">
          מפת הקורס
        </Link>
        <Link href="/start/" className="min-h-11 py-2 underline-offset-4 hover:underline">
          קורס אחר
        </Link>
      </nav>
    </Screen>
  );
}
