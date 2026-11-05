import { type LearnerState, lessonKey, type Op, SCHEMA_VERSION } from "@lingo/sync";
import type { UnitPack } from "./content";
import { flatLessons } from "./content";
import { PASS_SCORE, passedTest } from "./progress";
import { uuidv7 } from "./ids";

/**
 * Moving progress to another device without any server: a short code that says where the learner is.
 *
 *   lingo1.<course>.<next lesson>[.<passed level tests, joined with +>]
 *
 * It names a lesson id rather than a number, so it still works after new lessons are added to the course.
 * The same code is what the QR holds, what can be typed by hand, and what "choose my place" produces.
 */
export interface Position {
  courseId: string;
  /** The first lesson the learner has not finished (they continue here). */
  lessonId: string;
  /** Level tests passed on the old device, so certificates carry over. */
  passed: string[];
}

const PREFIX = "lingo1";
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function encodePosition(p: Position): string {
  const parts = [PREFIX, p.courseId, p.lessonId];
  if (p.passed.length) parts.push(p.passed.join("+"));
  return parts.join(".");
}

export function parsePosition(text: string): Position | null {
  const parts = text.trim().split(".");
  if (parts[0] !== PREFIX || parts.length < 3 || parts.length > 4) return null;
  const [, courseId, lessonId, passedRaw] = parts as [string, string, string, string | undefined];
  const passed = passedRaw ? passedRaw.split("+") : [];
  if (![courseId, lessonId, ...passed].every((x) => ID.test(x))) return null;
  return { courseId, lessonId, passed };
}

/** Where this learner is now, as a transferable position. Null when they have finished everything. */
export function currentPosition(state: LearnerState, courseId: string, units: UnitPack[]): Position | null {
  const all = flatLessons(units);
  const done = (id: string) => state.lessons.get(lessonKey(courseId, id))?.completed ?? false;
  const lastDone = all.reduce((m, { lesson }, i) => (done(lesson.id) ? i : m), -1);
  const next = all[lastDone + 1];
  const passed = all.filter(({ lesson }) => lesson.kind === "test" && passedTest(state, courseId, lesson.id)).map(({ lesson }) => lesson.id);
  // Everything is done: point at the last lesson, so the receiving device also has it all.
  const lessonId = next ? next.lesson.id : all.at(-1)?.lesson.id;
  return lessonId ? { courseId, lessonId, passed } : null;
}

export interface Plan {
  ok: boolean;
  /** Lessons that would be newly marked as done. */
  newlyDone: number;
  /** Human label of the lesson the learner continues from. */
  next?: { unit: UnitPack; lessonId: string; title: string };
  ops: Op[];
}

/**
 * Turns a position into ops: every lesson before it is marked done (the same way the placement test does),
 * level tests only when they were passed. Progress only moves forward — nothing already done is undone.
 */
export function planPosition(p: Position, state: LearnerState, units: UnitPack[], deviceId: string, now = Date.now()): Plan {
  const all = flatLessons(units);
  const target = all.findIndex(({ lesson }) => lesson.id === p.lessonId);
  if (target < 0) return { ok: false, newlyDone: 0, ops: [] };
  const ops: Op[] = [];
  let n = 0;
  const base = () => ({ id: uuidv7(now + n++), at: now, deviceId, v: SCHEMA_VERSION });
  for (const [i, { lesson }] of all.entries()) {
    const isTest = lesson.kind === "test";
    const wanted = isTest ? p.passed.includes(lesson.id) : i < target;
    if (!wanted) continue;
    const already = state.lessons.get(lessonKey(p.courseId, lesson.id));
    if (already?.completed && (!isTest || (already.bestScore ?? 0) >= PASS_SCORE)) continue;
    ops.push({ ...base(), kind: "lesson_result", courseId: p.courseId, lessonId: lesson.id, score: 1, completed: true });
  }
  const done = ops.length;
  ops.push({ ...base(), kind: "enroll", courseId: p.courseId, position: Math.max(target, 0) });
  const at = all[target]!;
  return { ok: true, newlyDone: done, next: { unit: at.unit, lessonId: at.lesson.id, title: at.lesson.title.he }, ops };
}
