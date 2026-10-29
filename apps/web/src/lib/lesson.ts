import { type Exercise, isGraded, type Lesson } from "@lingo/content-schema";
import { type Evaluation, gradeFromAnswer, type Grade, Rating } from "@lingo/engine";
import { type Op, SCHEMA_VERSION } from "@lingo/sync";
import { cardKey, uuidv7 } from "./ids";

/** How many times a missed exercise comes back at the end of the lesson. */
export const MAX_RETRIES = 2;
export const XP_PER_LESSON = 10;

export interface Attempt {
  exerciseId: string;
  correct: boolean;
  hadTypo: boolean;
  durationMs: number;
}

export interface LessonRun {
  exercises: Record<string, Exercise>;
  /** Exercise ids still to do, in order. Missed exercises are appended again. */
  queue: string[];
  /** All steps, for the progress bar. */
  total: number;
  /** Steps with an answer to check, for the score. */
  graded: number;
  attempts: Attempt[];
  startedAt: number;
}

export function startRun(lesson: Lesson, now: number): LessonRun {
  return {
    exercises: Object.fromEntries(lesson.exercises.map((e) => [e.id, e])),
    queue: lesson.exercises.map((e) => e.id),
    total: lesson.exercises.length,
    graded: lesson.exercises.filter(isGraded).length,
    attempts: [],
    startedAt: now,
  };
}

export const current = (run: LessonRun): Exercise | undefined =>
  run.queue[0] === undefined ? undefined : run.exercises[run.queue[0]];

export const isDone = (run: LessonRun) => run.queue.length === 0;

/** Share of exercises finished correctly, for the progress bar. */
export function progress(run: LessonRun): number {
  const solved = new Set(run.attempts.filter((a) => a.correct).map((a) => a.exerciseId));
  const given = new Set(run.attempts.map((a) => a.exerciseId));
  const droppedAfterRetries = [...given].filter((id) => !solved.has(id) && !run.queue.includes(id)).length;
  return Math.min(1, (solved.size + droppedAfterRetries) / run.total);
}

export function answer(run: LessonRun, evaluation: Evaluation, durationMs: number): LessonRun {
  const [id, ...rest] = run.queue;
  if (id === undefined) return run;
  const attempts = [
    ...run.attempts,
    { exerciseId: id, correct: evaluation.correct, hadTypo: evaluation.verdict === "typo", durationMs },
  ];
  const misses = attempts.filter((a) => a.exerciseId === id && !a.correct).length;
  const queue = !evaluation.correct && misses <= MAX_RETRIES ? [...rest, id] : rest;
  return { ...run, attempts, queue };
}

export interface RunSummary {
  /** Share of exercises right on the first try. */
  score: number;
  xp: number;
  seconds: number;
  /** One grade per word practised in the lesson. */
  grades: Map<string, Grade>;
}

export function summarize(run: LessonRun, now: number): RunSummary {
  const first = new Map<string, Attempt>();
  for (const a of run.attempts) {
    const ex = run.exercises[a.exerciseId];
    if (ex && isGraded(ex) && !first.has(a.exerciseId)) first.set(a.exerciseId, a);
  }
  const firstTry = [...first.values()].filter((a) => a.correct).length;

  // A word gets "Again" if any exercise with it was missed, otherwise a grade from typos and speed.
  const grades = new Map<string, Grade>();
  for (const a of first.values()) {
    const grade = gradeFromAnswer(a.correct, a.durationMs, a.hadTypo);
    for (const lx of run.exercises[a.exerciseId]?.lexemes ?? []) {
      const prev = grades.get(lx);
      grades.set(lx, prev === undefined ? grade : (Math.min(prev, grade) as Grade));
    }
  }
  return {
    score: run.graded === 0 ? 1 : firstTry / run.graded,
    xp: XP_PER_LESSON + firstTry,
    seconds: Math.round((now - run.startedAt) / 1000),
    grades,
  };
}

export interface FinishContext {
  courseId: string;
  lessonId: string;
  /** Position of this lesson in the whole course, for the enrollment marker. */
  lessonIndex: number;
  deviceId: string;
  day: string;
  now: number;
  /** Card keys the learner already has, so words are only added once. */
  existingCards: ReadonlySet<string>;
}

/** Everything a finished lesson records. Applied locally right away, synced later. */
export function finishOps(run: LessonRun, ctx: FinishContext): Op[] {
  const s = summarize(run, ctx.now);
  const base = () => ({ id: uuidv7(ctx.now), at: ctx.now, deviceId: ctx.deviceId, v: SCHEMA_VERSION });
  const ops: Op[] = [];
  for (const [lexemeId, rating] of s.grades) {
    const key = cardKey(ctx.courseId, lexemeId);
    if (!ctx.existingCards.has(key)) ops.push({ ...base(), kind: "card_add", cardKey: key, courseId: ctx.courseId });
    ops.push({ ...base(), kind: "review", cardKey: key, rating, durationMs: 0 });
  }
  ops.push({ ...base(), kind: "lesson_result", courseId: ctx.courseId, lessonId: ctx.lessonId, score: s.score, completed: true });
  ops.push({ ...base(), kind: "enroll", courseId: ctx.courseId, position: ctx.lessonIndex + 1 });
  ops.push({ ...base(), kind: "activity", day: ctx.day, xp: s.xp, seconds: Math.min(s.seconds, 86_400) });
  return ops;
}

export { Rating };
