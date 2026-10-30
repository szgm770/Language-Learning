"use client";

import { SCHEMA_VERSION, setting } from "@lingo/sync";
import { useState } from "react";
import { Logo } from "@/components/Brand";
import { Icon } from "@/components/icons";
import { BackLink, LoadError, Loading, ProgressBar, Screen } from "@/components/ui";
import { loadCourse, useLoad } from "@/lib/content";
import { uuidv7 } from "@/lib/ids";
import { languageName } from "@/lib/languages";
import { courseLevels, isCompleted, PASS_SCORE, passedTest } from "@/lib/progress";
import { getDeviceId, record, useLearner } from "@/lib/store";

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** One printable certificate per CEFR level, earned by passing that level's test. */
export function CertificateRoute({ courseId }: { courseId: string }) {
  const { state, loaded } = useLearner();
  const { data, error } = useLoad(() => loadCourse(courseId), [courseId]);
  const saved = setting<string | null>(state, "displayName", null);
  const [name, setName] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  if (error) return <LoadError />;
  if (!data || !loaded) return <Loading />;

  const levels = courseLevels(data.units).map((l) => {
    const done = l.lessons.filter((x) => isCompleted(state, courseId, x.id)).length;
    const progress = l.test ? state.lessons.get(`${courseId}/${l.test.id}`) : undefined;
    return { ...l, done, progress, earned: passedTest(state, courseId, l.test?.id) };
  });
  const earned = levels.filter((l) => l.earned);
  const shown = levels.find((l) => l.level === picked) ?? earned.at(-1) ?? levels.find((l) => !l.earned) ?? levels[0]!;
  const language = languageName(data.manifest.target);
  const shownName = name ?? saved ?? "";

  return (
    <Screen className="gap-6 pt-4">
      <div className="flex items-center justify-between print:hidden">
        <BackLink href="/learn/" />
        {shown.earned && (
          <button type="button" className="btn-primary min-h-11 px-4" onClick={() => window.print()}>
            הדפסה או שמירה כ־PDF
          </button>
        )}
      </div>

      {levels.length > 1 && (
        <nav className="flex flex-wrap gap-2 print:hidden" aria-label="רמות">
          {levels.map((l) => (
            <button
              key={l.level}
              type="button"
              aria-pressed={l.level === shown.level}
              onClick={() => setPicked(l.level)}
              className="choice flex min-h-11 items-center gap-2 px-4"
            >
              {l.earned ? <Icon name="trophy" className="size-5 text-saffron" /> : <Icon name="lock" className="size-5 text-ink-soft" />}
              <span className="font-bold">{l.level}</span>
            </button>
          ))}
        </nav>
      )}

      {!shown.earned ? (
        <section className="flex flex-col gap-6">
          <span className="grid size-24 place-items-center self-center rounded-full bg-saffron-soft text-saffron">
            <Icon name="trophy" className="size-14" />
          </span>
          <h1 className="text-center text-3xl font-bold">
            תעודת {language} ברמה {shown.level}
          </h1>
          <p className="text-center text-lg text-ink-soft">
            {!shown.test
              ? "מבחן הרמה הזאת יתווסף יחד עם היחידות האחרונות שלה."
              : shown.progress?.completed
                ? `במבחן הרמה צריך לפחות ${pct(PASS_SCORE)} תשובות נכונות. התוצאה הטובה שלכם: ${pct(shown.progress.bestScore)}. אפשר לחזור על השיעורים ולנסות שוב.`
                : `התעודה נפתחת אחרי מבחן הרמה בסוף כל היחידות, עם לפחות ${pct(PASS_SCORE)} תשובות נכונות.`}
          </p>
          <ProgressBar value={shown.done / shown.lessons.length} label="התקדמות לתעודה" tone="saffron" />
          <p className="text-center text-ink-soft tabular-nums">
            {shown.done} מתוך {shown.lessons.length} שיעורים ברמה {shown.level}
          </p>
        </section>
      ) : (
        <>
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
                השלים/ה בהצלחה את קורס {language} ברמה <strong>{shown.level}</strong>
              </p>
              <p className="text-ink-soft">{data.manifest.title.he}</p>
              <div className="mt-4 flex items-center gap-2 text-saffron-strong">
                <Icon name="star" className="size-6" filled />
                <Icon name="star" className="size-6" filled />
                <Icon name="star" className="size-6" filled />
              </div>
              <p className="text-sm text-ink-soft">
                {new Date(shown.progress?.firstCompletedAt ?? Date.now()).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </article>
        </>
      )}
    </Screen>
  );
}
