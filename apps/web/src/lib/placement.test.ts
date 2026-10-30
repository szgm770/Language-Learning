import type { Exercise } from "@lingo/content-schema";
import { describe, expect, it } from "vitest";
import type { UnitPack } from "./content";
import { answerPlacement, type Placement, startPlacement } from "./placement";

const mc = (id: string): Exercise => ({ id, type: "multiple_choice", prompt: "?", options: ["a", "b"], correct: 0, lexemes: [] });

function unit(n: number, cefr: string, test = false): UnitPack {
  const lessons = [{ id: `u${n}-review`, kind: "review", title: { he: "r", en: "r" }, exercises: [mc(`u${n}-r1`), mc(`u${n}-r2`), mc(`u${n}-r3`)] }];
  if (test) lessons.push({ id: `${cefr}-test`, kind: "test", title: { he: "t", en: "t" }, exercises: Array.from({ length: 8 }, (_, i) => mc(`${cefr}-t${i}`)) });
  return { id: `u${n}`, cefr, lessons } as unknown as UnitPack;
}

/** Answers with `answers` in order and returns the final state. */
function run(units: UnitPack[], answers: boolean[]): Placement {
  let p = startPlacement(units);
  for (const a of answers) {
    if (p.phase === "done") break;
    p = answerPlacement(units, p, a);
  }
  return p;
}

const course = [unit(0, "A1"), unit(1, "A1"), unit(2, "A1", true), unit(3, "A2"), unit(4, "A2"), unit(5, "A2", true)];

describe("placement", () => {
  it("probes a level with its test questions first", () => {
    const p = startPlacement(course);
    expect(p.phase).toBe("level");
    expect(p.questions.map((q) => q.id).every((id) => id.startsWith("A1-t"))).toBe(true);
  });

  it("starts at the first unit when the first level probe fails", () => {
    const p = run(course, [false, false, false]);
    expect(p).toMatchObject({ phase: "done", start: 0 });
  });

  it("drops into units of a failed level and starts at the first unit with a mistake", () => {
    // Fail the A1 probe, then unit 0 fine (2), unit 1 wrong.
    const p = run(course, [false, false, true, true, false]);
    expect(p).toMatchObject({ phase: "done", start: 1 });
  });

  it("skips a passed level and continues in the next one", () => {
    // Pass A1 (4 right), fail A2 probe, unit 3 right, unit 4 wrong.
    const p = run(course, [true, true, true, true, false, false, true, true, false]);
    expect(p).toMatchObject({ phase: "done", start: 4 });
  });

  it("one wrong answer in a level probe is allowed", () => {
    const p = run(course, [true, false, true, true]);
    expect(p).toMatchObject({ phase: "level", level: 1 });
  });

  it("knowing everything places after the last unit", () => {
    const p = run(course, Array(8).fill(true));
    expect(p).toMatchObject({ phase: "done", start: course.length });
  });
});
