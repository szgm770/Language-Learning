"use client";

import Link from "next/link";
import { BackLink, LoadError, Loading, Screen } from "@/components/ui";
import { loadCourse, useLoad } from "@/lib/content";
import { isCompleted, lessonOpen } from "@/lib/progress";
import { useLearner } from "@/lib/store";

const KIND: Record<string, string> = {
  new: "מילים חדשות",
  grammar: "דקדוק",
  listening: "שמיעה",
  reading: "קריאה",
  review: "חזרה",
  test: "מבחן",
};

/** The course as a route: units in order, lessons as stops along a line. */
export function CourseRoute({ courseId }: { courseId: string }) {
  const { state, loaded } = useLearner();
  const { data, error } = useLoad(() => loadCourse(courseId), [courseId]);
  if (error) return <LoadError />;
  if (!data || !loaded) return <Loading />;

  return (
    <Screen className="gap-6 pt-2">
      <BackLink href="/" />
      <h1 className="text-3xl font-semibold">{data.manifest.title.he}</h1>
      {data.units.map((unit) => (
        <section key={unit.id} aria-labelledby={`u-${unit.id}`} className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-cobalt">רמה {unit.cefr}</p>
            <h2 id={`u-${unit.id}`} className="text-xl font-semibold">
              {unit.title.he}
            </h2>
            <ul className="mt-1 text-sm text-ink-soft">
              {unit.canDo.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
          <ol className="relative flex flex-col gap-1 border-s-2 border-line ps-6">
            {unit.lessons.map((lesson) => {
              const done = isCompleted(state, courseId, lesson.id);
              const open = lessonOpen(state, courseId, data.units, lesson.id);
              const dot = done ? "bg-mint border-mint" : open ? "bg-surface border-cobalt" : "bg-paper border-line";
              const label = (
                <>
                  <span className={`absolute -start-[33px] mt-1.5 size-4 rounded-full border-2 ${dot}`} aria-hidden="true" />
                  <span className="flex flex-col">
                    <span className={`text-lg ${open ? "" : "text-ink-soft"}`}>{lesson.title.he}</span>
                    <span className="text-sm text-ink-soft">
                      {KIND[lesson.kind]}, {lesson.exercises.length} תרגילים{done ? ", הושלם" : open ? "" : ", נעול"}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={lesson.id} className="relative">
                  {open ? (
                    <Link href={`/lesson/${courseId}/${lesson.id}`} className="flex min-h-14 items-start gap-3 rounded-lg py-2">
                      {label}
                    </Link>
                  ) : (
                    <div className="flex min-h-14 items-start gap-3 py-2" aria-disabled="true">
                      {label}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </Screen>
  );
}
