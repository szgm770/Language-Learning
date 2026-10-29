"use client";

import { SCHEMA_VERSION } from "@lingo/sync";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackLink, LoadError, Loading, Screen, Word } from "@/components/ui";
import { loadCourses, loadManifest, loadUnit, useLoad } from "@/lib/content";
import { uuidv7 } from "@/lib/ids";
import { languageName } from "@/lib/languages";
import { enrolledCourses } from "@/lib/progress";
import { getDeviceId, record, useLearner } from "@/lib/store";

const GREETING: Record<string, string> = { en: "Hello", es: "¡Hola!", fr: "Bonjour", de: "Hallo", ru: "Привет", it: "Ciao" };
const GOALS = [
  { minutes: 5, label: "קליל", newPerDay: 5 },
  { minutes: 10, label: "רגיל", newPerDay: 10 },
  { minutes: 15, label: "רציני", newPerDay: 15 },
  { minutes: 20, label: "אינטנסיבי", newPerDay: 20 },
];

export default function Start() {
  const router = useRouter();
  const { state, loaded } = useLearner();
  const { data: courses, error } = useLoad(loadCourses, []);
  const [course, setCourse] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (error) return <LoadError />;
  if (!courses || !loaded) return <Loading />;
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
    router.push(already ? "/" : `/lesson/${course}/${first.lessons[0]!.id}`);
  }

  async function switchTo(id: string) {
    const now = Date.now();
    await record([{ id: uuidv7(now), at: now, deviceId: getDeviceId(), v: SCHEMA_VERSION, kind: "setting", field: "currentCourse", value: id }]);
    router.push("/");
  }

  return (
    <Screen className="gap-8 pt-4">
      {enrolled.length > 0 && <BackLink href="/" />}
      {!course ? (
        <>
          <h1 className="text-3xl font-semibold">איזו שפה נלמד?</h1>
          <ul className="flex flex-col gap-3">
            {courses.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="choice min-h-24 justify-between"
                  onClick={() => (enrolled.includes(c.id) ? switchTo(c.id) : setCourse(c.id))}
                >
                  <span className="flex flex-col items-start">
                    <span className="text-xl font-medium">{languageName(c.target)}</span>
                    <span className="text-sm text-ink-soft">{enrolled.includes(c.id) ? "ממשיכים מאיפה שעצרתם" : c.title.he}</span>
                  </span>
                  <Word text={GREETING[c.target] ?? c.target} lang={c.target} className="text-3xl text-cobalt" />
                </button>
              </li>
            ))}
          </ul>
          <p className="text-ink-soft">עוד שפות בדרך: צרפתית, גרמנית, רוסית ועוד.</p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">כמה זמן ביום?</h1>
          <p className="text-ink-soft">אפשר לשנות את זה בכל רגע בהגדרות.</p>
          <ul className="flex flex-col gap-3">
            {GOALS.map((g) => (
              <li key={g.minutes}>
                <button type="button" disabled={busy} className="choice justify-between" onClick={() => begin(g)}>
                  <span className="font-medium">{g.label}</span>
                  <span className="text-ink-soft">{g.minutes} דקות ביום</span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="text-cobalt" onClick={() => setCourse(null)}>
            לבחור שפה אחרת
          </button>
        </>
      )}
    </Screen>
  );
}
