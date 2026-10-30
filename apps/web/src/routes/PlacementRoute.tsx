"use client";

import type { Exercise } from "@lingo/content-schema";
import type { Evaluation } from "@lingo/engine";
import { type Op, SCHEMA_VERSION } from "@lingo/sync";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { SceneArt } from "@/components/art";
import { ExerciseStage } from "@/components/ExerciseStage";
import { Icon } from "@/components/icons";
import { LoadError, Loading, ProgressBar, Screen } from "@/components/ui";
import { exerciseContext, flatLessons, loadCourse, useLoad } from "@/lib/content";
import { uuidv7 } from "@/lib/ids";
import { answerPlacement, type Placement, startPlacement } from "@/lib/placement";
import { getDeviceId, record } from "@/lib/store";

/** A short adaptive test: whole levels first, then unit by unit inside the first level not yet known. */
export function PlacementRoute({ courseId }: { courseId: string }) {
  const { data, error } = useLoad(() => loadCourse(courseId), [courseId]);
  const [plan, setPlan] = useState<Placement | null>(null);
  const [start, setStart] = useState<number | null>(null);
  const last = useRef<boolean>(true);
  const p = plan ?? (data ? startPlacement(data.units) : null);

  const finish = useCallback(
    async (unitIndex: number) => {
      if (!data) return;
      setStart(unitIndex);
      const now = Date.now();
      const base = () => ({ id: uuidv7(now), at: now, deviceId: getDeviceId(), v: SCHEMA_VERSION });
      const all = flatLessons(data.units);
      const skipped = all.filter(({ unit, lesson }) => data.units.indexOf(unit) < unitIndex && lesson.kind !== "test");
      const ops: Op[] = skipped.map(({ lesson }) => ({ ...base(), kind: "lesson_result", courseId, lessonId: lesson.id, score: 1, completed: true }));
      if (skipped.length) ops.push({ ...base(), kind: "enroll", courseId, position: skipped.length });
      if (ops.length) await record(ops);
    },
    [data, courseId],
  );

  const onResult = useCallback((e: Evaluation) => {
    last.current = e.correct;
  }, []);

  const onContinue = useCallback(() => {
    if (!data || !p) return;
    const next = answerPlacement(data.units, p, last.current);
    if (next.phase === "done") return void finish(next.start);
    setPlan(next);
  }, [data, p, finish]);

  if (error) return <LoadError />;
  if (!data) return <Loading />;
  const ctx = exerciseContext(data);

  if (start !== null) {
    const unit = data.units[Math.min(start, data.units.length - 1)]!;
    const first = start < data.units.length ? unit.lessons[0]! : null;
    return (
      <Screen className="items-center justify-center gap-6 text-center">
        <SceneArt scene={unit.scene} className="pop size-32" />
        <h1 className="text-3xl font-bold">{start === 0 ? "מתחילים מההתחלה" : start >= data.units.length ? "עברתם את כל היחידות!" : `מתחילים מיחידה ${start + 1}`}</h1>
        <p className="max-w-sm text-lg text-ink-soft">
          {start === 0
            ? "נבנה את הבסיס יחד, צעד אחר צעד."
            : start >= data.units.length
              ? "כל היחידות הזמינות סומנו כמושלמות. יחידות חדשות בדרך."
              : `דילגנו על מה שאתם כבר יודעים. הבא בתור: ${unit.title.he}.`}
        </p>
        {first ? (
          <Link href={`/lesson/${courseId}/${first.id}/`} className="btn-primary w-full max-w-sm">
            להתחיל ללמוד
          </Link>
        ) : (
          <Link href="/learn/" className="btn-primary w-full max-w-sm">
            למסך הבית
          </Link>
        )}
      </Screen>
    );
  }

  const q = p?.questions[p.at];
  if (!p || !q) return <LoadError />;
  const levels = new Set(data.units.map((u) => u.cefr)).size;
  return (
    <Screen>
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-paper py-4">
        <Link href="/learn/" className="grid size-11 shrink-0 place-items-center rounded-full text-ink-soft" aria-label="יציאה ממבחן המיקום">
          <Icon name="close" className="size-6" />
        </Link>
        <ProgressBar value={(p.level + p.at / p.questions.length) / levels} label="התקדמות במבחן המיקום" tone="cobalt" />
      </header>
      <p className="text-sm font-semibold text-cobalt">מבחן מיקום, שאלה {p.asked + 1}</p>
      <ExerciseStage key={`${p.asked}-${(q as Exercise).id}`} ex={q} ctx={ctx} onResult={onResult} onContinue={onContinue} />
    </Screen>
  );
}
