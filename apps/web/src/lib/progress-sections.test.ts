import type { Lesson } from "@lingo/content-schema";
import { apply, emptyState, SCHEMA_VERSION } from "@lingo/sync";
import { describe, expect, it } from "vitest";
import type { UnitPack } from "./content";
import { lessonOpen, nextLesson } from "./progress";

const L = (id: string): Lesson => ({ id, kind: "new", title: { he: id, en: id }, exercises: [] });
const U = (id: string, cefr: string, lessons: Lesson[], section?: string) => ({ id, cefr, section, lessons }) as unknown as UnitPack;
const C = "arc-for-he";
const units = [
  U("prep", "A0", [L("p1"), L("p2")]),
  U("u1", "A1", [L("a1"), L("a2")]),
  U("o1", "A1", [L("o1"), L("o2")], "onkelos"),
  U("z1", "A1", [L("z1"), L("z2")], "zohar"),
];
let n = 0;
const done = (lessonId: string) => ({ id: `op-${n++}`, at: n, deviceId: "d", v: SCHEMA_VERSION, kind: "lesson_result" as const, courseId: C, lessonId, score: 1, completed: true });

describe("optional preparation level", () => {
  it("does not lock the first real lesson", () => {
    const s = emptyState();
    expect(lessonOpen(s, C, units, "a1")).toBe(true);
    expect(lessonOpen(s, C, units, "p2")).toBe(true);
    expect(lessonOpen(s, C, units, "a2")).toBe(false);
  });
  it("is suggested first, but not any more once the learner skipped it", () => {
    const s = emptyState();
    expect(nextLesson(s, C, units)?.lesson.id).toBe("p1");
    apply(s, done("a1"));
    expect(nextLesson(s, C, units)?.lesson.id).toBe("a2");
  });
});

describe("sections", () => {
  it("open their first lesson to everyone, and lock inside the section only", () => {
    const s = emptyState();
    expect(lessonOpen(s, C, units, "o1")).toBe(true);
    expect(lessonOpen(s, C, units, "z1")).toBe(true);
    expect(lessonOpen(s, C, units, "o2")).toBe(false);
    apply(s, done("o1"));
    expect(lessonOpen(s, C, units, "o2")).toBe(true);
    expect(lessonOpen(s, C, units, "a2")).toBe(false);
  });
});
