import type { Lesson } from "@lingo/content-schema";
import { Op } from "@lingo/sync";
import { describe, expect, it } from "vitest";
import { answer, current, finishOps, isDone, progress, startRun, summarize } from "./lesson";
import { reviewExercise } from "./review";

const lesson: Lesson = {
  id: "l1",
  kind: "new",
  title: { he: "ש", en: "L" },
  exercises: [
    { id: "e1", type: "dictation", text: "Hello", lexemes: ["hello"] },
    { id: "e2", type: "dictation", text: "Bye", lexemes: ["bye"] },
    { id: "e3", type: "dictation", text: "Hello bye", lexemes: ["hello", "bye"] },
  ],
};
const right = { correct: true, verdict: "correct" as const, expected: "" };
const wrong = { correct: false, verdict: "wrong" as const, expected: "" };

describe("lesson run", () => {
  it("brings a missed exercise back at the end", () => {
    let run = startRun(lesson, 0);
    run = answer(run, wrong, 4000); // e1 missed
    expect(current(run)?.id).toBe("e2");
    run = answer(run, right, 4000);
    run = answer(run, right, 4000);
    expect(current(run)?.id).toBe("e1");
    run = answer(run, right, 4000);
    expect(isDone(run)).toBe(true);
    expect(progress(run)).toBe(1);
  });

  it("gives up on an exercise after the retry limit", () => {
    let run = startRun({ ...lesson, exercises: lesson.exercises.slice(0, 1) }, 0);
    for (let i = 0; i < 3; i++) run = answer(run, wrong, 1000);
    expect(isDone(run)).toBe(true);
  });

  it("scores first tries and grades each word by its worst exercise", () => {
    let run = startRun(lesson, 0);
    run = answer(run, wrong, 4000);
    run = answer(run, right, 4000);
    run = answer(run, right, 4000);
    run = answer(run, right, 4000);
    const s = summarize(run, 60_000);
    expect(s.score).toBeCloseTo(2 / 3);
    expect(s.grades.get("hello")).toBe(1); // Again
    expect(s.grades.get("bye")).toBe(3); // Good
    expect(s.seconds).toBe(60);
  });

  it("records valid ops and adds each word once", () => {
    let run = startRun(lesson, 0);
    for (let i = 0; i < 3; i++) run = answer(run, right, 4000);
    const ops = finishOps(run, {
      courseId: "en-for-he",
      lessonId: "l1",
      lessonIndex: 0,
      deviceId: "d",
      day: "2026-01-01",
      now: 1_000,
      existingCards: new Set(["en-for-he:bye"]),
    });
    for (const op of ops) expect(Op.safeParse(op).success).toBe(true);
    expect(ops.filter((o) => o.kind === "card_add").map((o) => (o as { cardKey: string }).cardKey)).toEqual(["en-for-he:hello"]);
    expect(ops.filter((o) => o.kind === "review")).toHaveLength(2);
    expect(new Set(ops.map((o) => o.id)).size).toBe(ops.length);
  });
});

describe("review exercises", () => {
  const pool = [
    { id: "a", text: "one", translation: "אחת", pos: "number" as const },
    { id: "b", text: "two", translation: "שתיים", pos: "number" as const },
    { id: "c", text: "three", translation: "שלוש", pos: "number" as const },
  ];
  it("puts the right answer among the options", () => {
    const ex = reviewExercise(pool[1]!, pool, "recognize", 5);
    if (ex.type !== "multiple_choice") throw new Error("expected multiple choice");
    expect(ex.options[ex.correct]).toBe("שתיים");
    expect(ex.options).toHaveLength(3);
  });
});
