"use client";

import { lessonKey } from "@lingo/sync";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { LoadError, Loading } from "@/components/ui";
import { loadCourse, loadCourses, useLoad } from "@/lib/content";
import { useLearner } from "@/lib/store";

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Practice for exams (e.g. the Amirnet): a few full practice tests, each in parts, with a score per part. */
export default function Exams() {
  const { state, loaded } = useLearner();
  const { data, error } = useLoad(async () => {
    const all = await Promise.all((await loadCourses()).map((c) => loadCourse(c.id)));
    return all.filter((c) => c.manifest.exam);
  }, []);
  if (error) return <LoadError />;
  if (!data || !loaded) return <Loading />;

  return (
    <AppShell>
      <h1 className="mt-4 text-3xl font-bold">אימון למבחנים</h1>
      {data.length === 0 && <p className="mt-4 text-ink-soft">עוד אין מבחני אימון.</p>}
      {data.map(({ manifest, units }) => (
        <section key={manifest.id} className="mt-6 flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold">{manifest.title.he}</h2>
            <p className="mt-2 text-ink-soft">{manifest.description.he}</p>
          </div>
          {units.map((u) => (
            <div key={u.id} className="card flex flex-col gap-3 p-5">
              <h3 className="text-xl font-semibold">{u.title.he}</h3>
              <ul className="flex flex-col gap-2">
                {u.lessons.map((l) => {
                  const p = state.lessons.get(lessonKey(manifest.id, l.id));
                  return (
                    <li key={l.id}>
                      <Link href={`/lesson/${manifest.id}/${l.id}/`} className="choice flex min-h-12 items-center justify-between gap-3 px-4">
                        <span>{l.title.he}</span>
                        <span className="text-sm text-ink-soft tabular-nums">{p?.completed ? `התוצאה הטובה ביותר: ${pct(p.bestScore)}` : "עוד לא נעשה"}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </AppShell>
  );
}
