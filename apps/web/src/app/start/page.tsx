"use client";

import type { CourseManifest } from "@lingo/content-schema";
import { SCHEMA_VERSION } from "@lingo/sync";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/Brand";
import { BackLink, LoadError, Loading, Word } from "@/components/ui";
import { loadCourses, loadManifest, loadUnit, useLoad } from "@/lib/content";
import { uuidv7 } from "@/lib/ids";
import { languageName } from "@/lib/languages";
import { enrolledCourses } from "@/lib/progress";
import { getDeviceId, record, useLearner } from "@/lib/store";

const GREETING: Record<string, string> = { en: "Hello", es: "¡Hola!", fr: "Bonjour", de: "Hallo", ru: "Привет", it: "Ciao" };

/** Per-language accent, so each course has its own colour on cards. */
const LANG_ACCENT: Record<string, string> = { en: "text-cobalt", es: "text-amber" };
const LANG_BAR: Record<string, string> = { en: "bg-cobalt", es: "bg-amber" };

const GOALS = [
  { minutes: 5, label: "קליל", newPerDay: 5, note: "שיעור קצר אחד ביום" },
  { minutes: 10, label: "רגיל", newPerDay: 10, note: "שיעור וחזרה. מומלץ להתחלה" },
  { minutes: 15, label: "רציני", newPerDay: 15, note: "התקדמות מהירה ויציבה" },
  { minutes: 20, label: "אינטנסיבי", newPerDay: 20, note: "למי שיש מטרה קרובה" },
];

function Steps({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3" aria-label={`שלב ${step} מתוך 2`}>
      <div className="flex gap-1.5" aria-hidden="true">
        <span className="h-1.5 w-8 rounded-full bg-cobalt" />
        <span className={`h-1.5 w-8 rounded-full ${step === 2 ? "bg-cobalt" : "bg-line"}`} />
      </div>
      <span className="text-sm text-ink-soft">שלב {step} מתוך 2</span>
    </div>
  );
}

function CourseCard({ m, enrolled, onPick }: { m: CourseManifest; enrolled: boolean; onPick: () => void }) {
  const lessons = m.units.reduce((n, u) => n + u.lessonCount, 0);
  const levels = [...new Set(m.units.map((u) => u.cefr))].join("–");
  return (
    <button
      type="button"
      onClick={onPick}
      className="group relative flex w-full overflow-hidden rounded-2xl bg-surface text-start ring-1 ring-line transition hover:ring-2 hover:ring-cobalt active:scale-[0.99]"
    >
      <span className={`w-1.5 shrink-0 ${LANG_BAR[m.target] ?? "bg-cobalt"}`} aria-hidden="true" />
      <span className="flex flex-1 items-center justify-between gap-4 p-5">
        <span className="flex flex-col gap-1">
          <span className="text-2xl font-bold">{languageName(m.target)}</span>
          <span className="text-ink-soft">{enrolled ? "ממשיכים מאיפה שעצרתם" : m.description.he}</span>
          <span className="mt-2 text-sm text-ink-soft">
            רמה {levels}, {m.units.length} יחידות, {lessons} שיעורים
          </span>
        </span>
        <Word text={GREETING[m.target] ?? m.target} lang={m.target} className={`text-4xl ${LANG_ACCENT[m.target] ?? "text-cobalt"}`} />
      </span>
    </button>
  );
}

export default function Start() {
  const router = useRouter();
  const { state, loaded } = useLearner();
  const { data: manifests, error } = useLoad(
    async () => Promise.all((await loadCourses()).map((c) => loadManifest(c.id))),
    [],
  );
  const [course, setCourse] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (error) return <LoadError />;
  if (!manifests || !loaded) return <Loading />;
  const enrolled = enrolledCourses(state);

  async function begin(goal: (typeof GOALS)[number]) {
    if (!course) return;
    setBusy(true);
    const now = Date.now();
    const base = () => ({ id: uuidv7(now), at: now, deviceId: getDeviceId(), v: SCHEMA_VERSION });
    const already = enrolled.includes(course);
    await record([
      ...(already ? [] : [{ ...base(), kind: "enroll" as const, courseId: course, position: 0 }]),
      { ...base(), kind: "setting", field: "currentCourse", value: course },
      { ...base(), kind: "setting", field: "dailyGoalMinutes", value: goal.minutes },
      { ...base(), kind: "setting", field: "newPerDay", value: goal.newPerDay },
    ]);
    const manifest = await loadManifest(course);
    const first = await loadUnit(course, manifest.units[0]!.id);
    router.push(already ? "/learn/" : `/lesson/${course}/${first.lessons[0]!.id}`);
  }

  async function switchTo(id: string) {
    const now = Date.now();
    await record([{ id: uuidv7(now), at: now, deviceId: getDeviceId(), v: SCHEMA_VERSION, kind: "setting", field: "currentCourse", value: id }]);
    router.push("/learn/");
  }

  const chosen = manifests.find((m) => m.id === course);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 px-4 pb-10">
      <header className="flex items-center justify-between py-3">
        <Brand href={enrolled.length > 0 ? "/learn/" : "/"} />
        <BackLink href={enrolled.length > 0 ? "/learn/" : "/"} />
      </header>

      {!chosen ? (
        <>
          <div className="flex flex-col gap-3">
            <Steps step={1} />
            <h1 className="text-4xl font-bold">איזו שפה נלמד?</h1>
          </div>
          <ul className="flex flex-col gap-3">
            {manifests.map((m) => (
              <li key={m.id}>
                <CourseCard m={m} enrolled={enrolled.includes(m.id)} onPick={() => (enrolled.includes(m.id) ? switchTo(m.id) : setCourse(m.id))} />
              </li>
            ))}
          </ul>
          <p className="text-ink-soft">בקרוב גם צרפתית, גרמנית, רוסית ואיטלקית.</p>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <Steps step={2} />
            <h1 className="text-4xl font-bold">כמה זמן ביום?</h1>
            <p className="text-ink-soft">
              לומדים {languageName(chosen.target)}. את היעד אפשר לשנות בכל רגע בהגדרות.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {GOALS.map((g) => (
              <li key={g.minutes}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => begin(g)}
                  className="flex w-full items-center gap-4 rounded-2xl bg-surface p-4 text-start ring-1 ring-line transition hover:ring-2 hover:ring-cobalt active:scale-[0.99] disabled:opacity-50"
                >
                  <span className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-cobalt-soft text-cobalt">
                    <span className="text-xl leading-none font-bold">{g.minutes}</span>
                    <span className="text-xs">דקות</span>
                  </span>
                  <span className="flex flex-col">
                    <span className="text-lg font-semibold">{g.label}</span>
                    <span className="text-sm text-ink-soft">{g.note}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="min-h-11 self-start text-cobalt" onClick={() => setCourse(null)}>
            לבחור שפה אחרת
          </button>
        </>
      )}
    </main>
  );
}
