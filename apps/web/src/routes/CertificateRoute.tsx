"use client";

import { SCHEMA_VERSION, setting } from "@lingo/sync";
import { useState } from "react";
import { Logo } from "@/components/Brand";
import { Icon } from "@/components/icons";
import { BackLink, LoadError, Loading, ProgressBar, Screen } from "@/components/ui";
import { flatLessons, loadCourse, useLoad } from "@/lib/content";
import { uuidv7 } from "@/lib/ids";
import { languageName } from "@/lib/languages";
import { isCompleted, PASS_SCORE } from "@/lib/progress";
import { getDeviceId, record, useLearner } from "@/lib/store";

/** A printable certificate once the level test is passed. */
export function CertificateRoute({ courseId }: { courseId: string }) {
  const { state, loaded } = useLearner();
  const { data, error } = useLoad(() => loadCourse(courseId), [courseId]);
  const saved = setting<string | null>(state, "displayName", null);
  const [name, setName] = useState<string | null>(null);
  if (error) return <LoadError />;
  if (!data || !loaded) return <Loading />;

  const lessons = flatLessons(data.units);
  const done = lessons.filter(({ lesson }) => isCompleted(state, courseId, lesson.id)).length;
  const test = lessons.find(({ lesson }) => lesson.kind === "test");
  const testProgress = test ? state.lessons.get(`${courseId}/${test.lesson.id}`) : undefined;
  const tried = !!test && isCompleted(state, courseId, test.lesson.id);
  const earned = tried && (testProgress?.bestScore ?? 0) >= PASS_SCORE;
  const level = data.units[0]?.cefr ?? "A1";
  const shownName = name ?? saved ?? "";
  const date = new Date(testProgress?.firstCompletedAt ?? Date.now());

  if (!earned) {
    return (
      <Screen className="gap-6 pt-4">
        <BackLink href="/learn/" />
        <span className="grid size-24 place-items-center self-center rounded-full bg-saffron-soft text-saffron">
          <Icon name="trophy" className="size-14" />
        </span>
        <h1 className="text-center text-3xl font-bold">תעודת {languageName(data.manifest.target)} ברמה {level}</h1>
        <p className="text-center text-lg text-ink-soft">
          {tried
            ? `במבחן הרמה צריך לפחות ${Math.round(PASS_SCORE * 100)}% תשובות נכונות. התוצאה הטובה שלכם: ${Math.round((testProgress?.bestScore ?? 0) * 100)}%. אפשר לחזור על השיעורים ולנסות שוב.`
            : `התעודה נפתחת אחרי מבחן הרמה בסוף כל היחידות, עם לפחות ${Math.round(PASS_SCORE * 100)}% תשובות נכונות.`}
        </p>
        <ProgressBar value={done / lessons.length} label="התקדמות לתעודה" tone="saffron" />
        <p className="text-center text-ink-soft tabular-nums">
          {done} מתוך {lessons.length} שיעורים
        </p>
      </Screen>
    );
  }

  return (
    <Screen className="gap-6 pt-4">
      <div className="flex items-center justify-between print:hidden">
        <BackLink href="/learn/" />
        <button type="button" className="btn-primary min-h-11 px-4" onClick={() => window.print()}>
          הדפסה או שמירה כ־PDF
        </button>
      </div>
      <label className="flex flex-col gap-2 print:hidden">
        <span className="font-semibold">השם שיופיע בתעודה</span>
        <input
          className="field"
          value={shownName}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            const now = Date.now();
            void record([{ id: uuidv7(now), at: now, deviceId: getDeviceId(), v: SCHEMA_VERSION, kind: "setting", field: "displayName", value: shownName }]);
          }}
        />
      </label>
      <article className="relative overflow-hidden rounded-3xl border-8 border-double border-saffron bg-surface p-8 text-center print:border-4">
        <div className="flex flex-col items-center gap-4">
          <Logo className="size-14" />
          <p className="text-sm font-semibold tracking-wide text-ink-soft">תעודת סיום</p>
          <h1 className="text-4xl font-bold">{shownName || "השם שלכם"}</h1>
          <p className="text-lg">
            השלים/ה בהצלחה את קורס {languageName(data.manifest.target)} ברמה <strong>{level}</strong>
          </p>
          <p className="text-ink-soft">{data.manifest.title.he}</p>
          <div className="mt-4 flex items-center gap-2 text-saffron-strong">
            <Icon name="star" className="size-6" filled />
            <Icon name="star" className="size-6" filled />
            <Icon name="star" className="size-6" filled />
          </div>
          <p className="text-sm text-ink-soft">{date.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </article>
    </Screen>
  );
}
