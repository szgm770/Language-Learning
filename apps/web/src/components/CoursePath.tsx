"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { type UnitPack } from "@/lib/content";
import { courseName, languageName } from "@/lib/languages";
import { levelInfo, levelRange } from "@/lib/levels";
import { isCompleted, isOptional, lessonOpen, nextLesson } from "@/lib/progress";
import { useLearner } from "@/lib/store";
import type { CourseManifest } from "@lingo/content-schema";
import { SCENE_HUE, SceneArt } from "./art";
import { Icon, type IconName } from "./icons";
import { Ring } from "./ui";

export const KIND: Record<string, { label: string; icon: IconName }> = {
  new: { label: "מילים חדשות", icon: "star" },
  grammar: { label: "דקדוק", icon: "grammar" },
  listening: { label: "שיחה ושמיעה", icon: "ear" },
  reading: { label: "קריאה", icon: "words" },
  review: { label: "חזרה ומבחן", icon: "repeat" },
  test: { label: "מבחן רמה", icon: "trophy" },
};

/** The course as a route: unit cards in order, each opening to its lessons. */
export function CoursePath({
  courseId,
  manifest,
  units,
}: {
  courseId: string;
  manifest: CourseManifest;
  units: UnitPack[];
}) {
  const { state } = useLearner();
  const all = units.flatMap((u) => u.lessons);
  const doneAll = all.filter((l) => isCompleted(state, courseId, l.id)).length;
  const currentUnit = nextLesson(state, courseId, units)?.unit.id;
  const [open, setOpen] = useState<string | undefined>(currentUnit);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-center justify-between gap-4 pt-6">
        <div>
          <p className="text-ink-soft">
            {levelRange(manifest, manifest.units.map((u) => u.cefr))}
          </p>
          <h1 className="text-3xl font-bold">
            {courseName(manifest)}
          </h1>
        </div>
        <Ring value={all.length ? doneAll / all.length : 0} size={64}>
          <span className="text-sm font-bold tabular-nums">
            {Math.round((doneAll / Math.max(1, all.length)) * 100)}%
          </span>
        </Ring>
      </header>

      <ol className="flex flex-col gap-4">
        {units.map((unit, ui) => {
          const done = unit.lessons.filter((l) =>
            isCompleted(state, courseId, l.id),
          ).length;
          const firstOpen = lessonOpen(
            state,
            courseId,
            units,
            unit.lessons[0]!.id,
          );
          const expanded = open === unit.id;
          const hue = SCENE_HUE[unit.scene];
          const prev = units[ui - 1];
          const section = unit.section ? manifest.sections?.find((x) => x.id === unit.section) : undefined;
          const newSection = !!unit.section && prev?.section !== unit.section;
          const newLevel = !unit.section && (ui === 0 || prev!.cefr !== unit.cefr);
          const skipTo = isOptional(unit) && newLevel ? units.find((u) => !isOptional(u) && !u.section) : undefined;
          return (
            <Fragment key={unit.id}>
              {newSection && section && (
                <li className="flex flex-col gap-1 pt-6" data-section={section.id}>
                  <h2 className="text-2xl font-bold">{section.title.he}</h2>
                  <p className="text-ink-soft">{section.about}</p>
                  <p className="text-sm font-semibold text-mint-strong">פתוח לכולם: אפשר להתחיל כאן בכל שלב</p>
                </li>
              )}
              {newLevel && (
                <li
                  className="flex items-end justify-between gap-3 pt-4"
                  data-level={unit.cefr}
                >
                  <div>
                    <h2 className="text-2xl font-bold">{levelInfo(manifest, unit.cefr).heading}</h2>
                    <p className="text-ink-soft">
                      {levelInfo(manifest, unit.cefr).about}
                    </p>
                  </div>
                  <Link
                    href={`/certificate/${courseId}/`}
                    className="flex items-center gap-1 text-sm font-semibold text-cobalt"
                  >
                    <Icon name="trophy" className="size-4" />
                    תעודת {levelInfo(manifest, unit.cefr).short}
                  </Link>
                </li>
              )}
              {skipTo && (
                <li className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sunken p-4" data-optional-prep>
                  <span className="text-ink-soft">שלב ההכנה הוא רשות. מי שכבר מכיר את האותיות והצלילים יכול לדלג.</span>
                  <Link href={`/lesson/${courseId}/${skipTo.lessons[0]!.id}/`} className="text-sm font-semibold text-cobalt">
                    דילוג לשיעור הראשון של ״{skipTo.title.he}״
                  </Link>
                </li>
              )}
              <li className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? undefined : unit.id)}
                  aria-expanded={expanded}
                  className={`flex w-full items-center gap-4 p-4 text-start ${firstOpen ? "" : "opacity-60"}`}
                >
                  <SceneArt scene={unit.scene} className="size-18 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="text-sm text-ink-soft">
                      יחידה {ui + 1}, {section ? section.title.he : levelInfo(manifest, unit.cefr).short}
                    </span>
                    <span className="text-xl font-bold">{unit.title.he}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-sunken">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(done / unit.lessons.length) * 100}%`,
                          background: `var(--color-u-${hue})`,
                        }}
                      />
                    </span>
                  </span>
                  {!firstOpen ? (
                    <Icon name="lock" className="size-6 text-ink-soft" />
                  ) : done === unit.lessons.length ? (
                    <span className="grid size-8 place-items-center rounded-full bg-mint text-white">
                      <Icon name="check" className="size-5" />
                    </span>
                  ) : null}
                </button>

                {expanded && (
                  <div className="border-t border-line px-4 pb-4">
                    <p className="py-3 text-ink-soft">{unit.story}</p>
                    <ul className="mb-3 flex flex-col gap-1 text-sm">
                      {unit.canDo.map((c) => (
                        <li key={c} className="flex gap-2">
                          <Icon
                            name="check"
                            className="size-4 shrink-0 text-mint"
                          />
                          {c}
                        </li>
                      ))}
                    </ul>
                    {manifest.speechLang !== "none" &&
                      unit.lessons.flatMap((l) => l.exercises).filter((e) => e.type === "dialogue").length >= 2 && (
                        <Link
                          href={`/listen/${courseId}/${unit.id}/`}
                          className="mb-3 flex min-h-12 items-center gap-2 rounded-2xl bg-sunken px-3 font-semibold text-cobalt"
                        >
                          <Icon name="volume" className="size-5" />
                          פרק להאזנה: כל שיחות היחידה ברצף
                        </Link>
                      )}
                    <ol className="flex flex-col gap-2">
                      {unit.lessons.map((lesson) => {
                        const isDone = isCompleted(state, courseId, lesson.id);
                        const isOpen = lessonOpen(
                          state,
                          courseId,
                          units,
                          lesson.id,
                        );
                        const isNext = isOpen && !isDone;
                        const k = KIND[lesson.kind]!;
                        const row = (
                          <>
                            <span
                              className={`grid size-11 shrink-0 place-items-center rounded-full ${
                                isDone
                                  ? "bg-mint text-white"
                                  : isNext
                                    ? "bg-cobalt text-white shadow-[0_3px_0_0_var(--color-cobalt-strong)]"
                                    : "bg-sunken text-ink-soft"
                              }`}
                            >
                              <Icon
                                name={
                                  isDone
                                    ? "check"
                                    : isNext
                                      ? "play"
                                      : isOpen
                                        ? k.icon
                                        : "lock"
                                }
                                className="size-5"
                                filled={isNext}
                              />
                            </span>
                            <span className="flex flex-1 flex-col">
                              <span
                                className={`font-semibold ${isOpen ? "" : "text-ink-soft"}`}
                              >
                                {lesson.title.he}
                              </span>
                              <span className="text-sm text-ink-soft">
                                {k.label}, {lesson.exercises.length} צעדים
                              </span>
                            </span>
                          </>
                        );
                        return (
                          <li key={lesson.id}>
                            {isOpen ? (
                              <Link
                                href={`/lesson/${courseId}/${lesson.id}/`}
                                className={`flex min-h-16 items-center gap-3 rounded-2xl px-2 py-2 ${isNext ? "bg-cobalt-soft" : "hover:bg-sunken"}`}
                              >
                                {row}
                              </Link>
                            ) : (
                              <div
                                className="flex min-h-16 items-center gap-3 px-2 py-2"
                                aria-disabled="true"
                              >
                                {row}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}
