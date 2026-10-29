"use client";

import { LessonPlayer } from "@/components/LessonPlayer";
import { LoadError, Loading } from "@/components/ui";
import { flatLessons, loadCourse, useLoad } from "@/lib/content";

export function LessonRoute({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const { data, error } = useLoad(() => loadCourse(courseId), [courseId]);
  if (error) return <LoadError />;
  if (!data) return <Loading />;

  const all = flatLessons(data.units);
  const index = all.findIndex((l) => l.lesson.id === lessonId);
  const entry = all[index];
  if (!entry) return <LoadError />;
  const next = all[index + 1];
  const grammar = entry.lesson.grammar ? entry.unit.grammar.find((g) => g.id === entry.lesson.grammar) : undefined;

  return (
    <LessonPlayer
      key={lessonId}
      lesson={entry.lesson}
      lessonIndex={index}
      grammar={grammar}
      courseId={courseId}
      ctx={{ target: data.manifest.target, source: data.manifest.source, speechLang: data.manifest.speechLang }}
      nextHref={next ? `/lesson/${courseId}/${next.lesson.id}` : null}
    />
  );
}
