"use client";

import { SCHEMA_VERSION } from "@lingo/sync";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Word } from "@/components/ui";
import { loadCourses, loadManifest, useLoad } from "@/lib/content";
import { uuidv7 } from "@/lib/ids";
import { courseName } from "@/lib/languages";
import { currentCourse, enrolledCourses } from "@/lib/progress";
import { getDeviceId, record, useLearner } from "@/lib/store";

const GREETING: Record<string, string> = { en: "Hello", es: "¡Hola!", fr: "Bonjour", de: "Hallo", ru: "Привет", it: "Ciao" };

/** A button for the header that opens a sheet to jump straight to another language. */
export function LanguageSwitcher() {
  const { state } = useLearner();
  const [open, setOpen] = useState(false);
  const { data: manifests } = useLoad(
    async () => (await Promise.all((await loadCourses()).map((c) => loadManifest(c.id)))).filter((m) => !m.exam),
    [],
  );
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const current = currentCourse(state);
  const enrolled = enrolledCourses(state);

  async function switchTo(id: string) {
    setOpen(false);
    if (id === current) return;
    const now = Date.now();
    await record([{ id: uuidv7(now), at: now, deviceId: getDeviceId(), v: SCHEMA_VERSION, kind: "setting", field: "currentCourse", value: id }]);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 items-center gap-1.5 rounded-full bg-cobalt-soft px-3 font-bold text-cobalt-strong ring-1 ring-line transition active:scale-95"
        aria-haspopup="dialog"
      >
        <Icon name="globe" className="size-5" />
        <span className="text-sm">שפה</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="בחירת שפה"
            className="w-full max-w-md rounded-t-3xl bg-surface p-5 shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">לאיזו שפה לעבור?</h2>
              <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full" aria-label="סגירה">
                <Icon name="close" className="size-6" />
              </button>
            </div>
            <ul className="flex flex-col gap-3">
              {(manifests ?? []).map((m) => {
                const isCurrent = m.id === current;
                const isEnrolled = enrolled.includes(m.id);
                const body = (
                  <>
                    <span className="flex flex-1 flex-col text-start">
                      <span className="text-lg font-bold">{courseName(m)}</span>
                      <span className="text-sm text-ink-soft">{isCurrent ? "הקורס הנוכחי" : isEnrolled ? "להמשיך מאיפה שעצרתם" : "להתחיל קורס חדש"}</span>
                    </span>
                    <Word text={GREETING[m.target] ?? m.target} lang={m.target} className="text-2xl text-cobalt" />
                    {isCurrent && <Icon name="check" className="size-6 text-mint" />}
                  </>
                );
                const cls = `flex min-h-16 w-full items-center gap-3 rounded-2xl p-4 ring-1 transition ${isCurrent ? "bg-cobalt-soft ring-cobalt" : "bg-surface ring-line hover:ring-2 hover:ring-cobalt"}`;
                return (
                  <li key={m.id}>
                    {isEnrolled ? (
                      <button type="button" className={cls} onClick={() => switchTo(m.id)}>
                        {body}
                      </button>
                    ) : (
                      <Link href="/start/" className={cls}>
                        {body}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
