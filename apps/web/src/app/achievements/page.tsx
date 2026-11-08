"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { Loading } from "@/components/ui";
import { today } from "@/lib/day";
import { achievements, currentCourse } from "@/lib/progress";
import { useLearner } from "@/lib/store";

/** Badges, computed from what the learner has done. */
export default function Achievements() {
  const { state, loaded } = useLearner();
  if (!loaded) return <Loading />;
  const list = achievements(state, currentCourse(state) ?? "en-for-he", today());
  const courseId = currentCourse(state) ?? "en-for-he";
  const earned = list.filter((a) => a.value >= a.target).length;
  return (
    <AppShell>
      <header className="flex flex-col gap-1 pt-6">
        <h1 className="text-3xl font-bold">ההישגים שלי</h1>
        <p className="text-ink-soft">
          {earned} מתוך {list.length}
        </p>
      </header>
      <Link href={`/certificate/${courseId}/`} className="card mt-5 flex min-h-16 items-center gap-4 p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-saffron-soft text-saffron-strong">
          <Icon name="trophy" className="size-6" />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="font-bold">התעודה שלי</span>
          <span className="text-sm text-ink-soft">תעודה להדפסה על כל רמה שעברתם</span>
        </span>
      </Link>
      <ul className="mt-3 flex flex-col gap-3">
        {list.map((a) => {
          const done = a.value >= a.target;
          return (
            <li key={a.id} className="card flex items-center gap-4 p-4">
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${done ? "bg-saffron-soft text-saffron-strong" : "bg-sunken text-ink-soft"}`}>
                <Icon name={done ? "trophy" : "lock"} className="size-6" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-bold">{a.title}</span>
                <span className="text-sm text-ink-soft">{a.hint}</span>
                {!done && (
                  <span className="mt-1 h-2 overflow-hidden rounded-full bg-sunken" role="progressbar" aria-valuenow={a.value} aria-valuemax={a.target} aria-label={a.title}>
                    <span className="block h-full rounded-full bg-cobalt" style={{ width: `${(a.value / a.target) * 100}%` }} />
                  </span>
                )}
              </span>
              <span className="text-sm text-ink-soft tabular-nums">
                {a.value}/{a.target}
              </span>
            </li>
          );
        })}
      </ul>
    </AppShell>
  );
}
