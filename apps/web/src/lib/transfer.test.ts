import type { Lesson } from "@lingo/content-schema";
import { apply, emptyState, lessonKey } from "@lingo/sync";
import { describe, expect, it } from "vitest";
import type { UnitPack } from "./content";
import { nextLesson, lessonOpen, passedTest } from "./progress";
import { currentPosition, encodePosition, parsePosition, planPosition } from "./transfer";

const L = (id: string, kind: Lesson["kind"] = "new"): Lesson => ({ id, kind, title: { he: id, en: id }, exercises: [] });
const U = (id: string, cefr: "A1" | "A2", lessons: Lesson[]) => ({ id, cefr, lessons }) as unknown as UnitPack;
const units = [U("u1", "A1", [L("u1-l1"), L("u1-l2"), L("a1-test", "test")]), U("u2", "A2", [L("u2-l1"), L("u2-l2")])];
const C = "en-for-he";

describe("progress code", () => {
  it("round-trips", () => {
    const p = { courseId: C, lessonId: "u2-l1", passed: ["a1-test"] };
    expect(parsePosition(encodePosition(p))).toEqual(p);
    expect(parsePosition(encodePosition({ ...p, passed: [] }))).toEqual({ ...p, passed: [] });
  });
  it("rejects anything that is not a code", () => {
    for (const bad of ["", "hello", "lingo2.en.u1", "lingo1.en", "lingo1.En.u1-l1", "lingo1.en.u1-l1.x.y", "lingo1.en.u1_l1"]) expect(parsePosition(bad)).toBeNull();
  });
  it("tolerates spaces around a pasted code", () => {
    expect(parsePosition("  lingo1.en-for-he.u1-l2 \n")?.lessonId).toBe("u1-l2");
  });
});

describe("moving a position to another device", () => {
  it("marks everything before the lesson as done, and only that", () => {
    const plan = planPosition({ courseId: C, lessonId: "u2-l1", passed: [] }, emptyState(), units, "dev");
    expect(plan.ok).toBe(true);
    const s = emptyState();
    for (const op of plan.ops) apply(s, op);
    expect(s.lessons.get(lessonKey(C, "u1-l1"))?.completed).toBe(true);
    expect(s.lessons.get(lessonKey(C, "u1-l2"))?.completed).toBe(true);
    expect(s.lessons.get(lessonKey(C, "a1-test"))).toBeUndefined();
    expect(s.lessons.get(lessonKey(C, "u2-l1"))).toBeUndefined();
    // The level test they skipped does not lock the next lesson.
    expect(lessonOpen(s, C, units, "u2-l1")).toBe(true);
    expect(nextLesson(s, C, units)?.lesson.id).toBe("u2-l1");
  });
  it("keeps passed level tests so the certificate carries over", () => {
    const plan = planPosition({ courseId: C, lessonId: "u2-l1", passed: ["a1-test"] }, emptyState(), units, "dev");
    const s = emptyState();
    for (const op of plan.ops) apply(s, op);
    expect(passedTest(s, C, "a1-test")).toBe(true);
  });
  it("never moves progress backwards and is safe to apply twice", () => {
    const s = emptyState();
    for (const op of planPosition({ courseId: C, lessonId: "u2-l2", passed: [] }, s, units, "dev").ops) apply(s, op);
    const back = planPosition({ courseId: C, lessonId: "u1-l2", passed: [] }, s, units, "dev");
    expect(back.newlyDone).toBe(0);
    for (const op of back.ops) apply(s, op);
    expect(nextLesson(s, C, units)?.lesson.id).toBe("u2-l2");
    const again = planPosition({ courseId: C, lessonId: "u2-l2", passed: [] }, s, units, "dev");
    expect(again.newlyDone).toBe(0);
  });
  it("describes where a learner is, and the code takes another device to the same place", () => {
    const a = emptyState();
    for (const op of planPosition({ courseId: C, lessonId: "u2-l1", passed: ["a1-test"] }, a, units, "old").ops) apply(a, op);
    const pos = currentPosition(a, C, units)!;
    expect(pos.lessonId).toBe("u2-l1");
    const b = emptyState();
    for (const op of planPosition(parsePosition(encodePosition(pos))!, b, units, "new").ops) apply(b, op);
    expect(nextLesson(b, C, units)?.lesson.id).toBe("u2-l1");
    expect(passedTest(b, C, "a1-test")).toBe(true);
  });
  it("refuses a lesson the course does not have", () => {
    expect(planPosition({ courseId: C, lessonId: "nope", passed: [] }, emptyState(), units, "dev").ok).toBe(false);
  });
});
