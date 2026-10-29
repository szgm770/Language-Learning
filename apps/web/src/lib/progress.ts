import { State } from "@lingo/engine";
import { allCards, computeStreak, isEnrolled, type LearnerState, lessonKey, setting } from "@lingo/sync";
import type { UnitPack } from "./content";
import { flatLessons } from "./content";

export function enrolledCourses(state: LearnerState): string[] {
  return [...state.enrollments.values()].filter(isEnrolled).map((e) => e.courseId);
}

export function currentCourse(state: LearnerState): string | undefined {
  const chosen = setting<string | null>(state, "currentCourse", null);
  const enrolled = enrolledCourses(state);
  return chosen && enrolled.includes(chosen) ? chosen : enrolled[0];
}

/** Share of the level test that must be right to earn the certificate. */
export const PASS_SCORE = 0.7;

export const isCompleted = (state: LearnerState, courseId: string, lessonId: string) =>
  state.lessons.get(lessonKey(courseId, lessonId))?.completed ?? false;

/** First lesson in course order that is not completed yet. */
export function nextLesson(state: LearnerState, courseId: string, units: UnitPack[]) {
  return flatLessons(units).find(({ lesson }) => !isCompleted(state, courseId, lesson.id));
}

/** A lesson opens once the one before it is completed. */
export function lessonOpen(state: LearnerState, courseId: string, units: UnitPack[], lessonId: string): boolean {
  const all = flatLessons(units);
  const i = all.findIndex((l) => l.lesson.id === lessonId);
  return i <= 0 || isCompleted(state, courseId, all[i - 1]!.lesson.id);
}

export function dueCount(state: LearnerState, courseId: string, now = Date.now()): number {
  return allCards(state, courseId).filter((c) => c.card.state !== State.New && c.card.due <= now).length;
}

export function streak(state: LearnerState, day: string) {
  const active = [...state.days.entries()].filter(([, d]) => d.xp > 0).map(([k]) => k);
  return computeStreak(active, day);
}

export function dailyGoal(state: LearnerState, day: string) {
  const goalMinutes = setting(state, "dailyGoalMinutes", 10);
  const d = state.days.get(day);
  const minutes = Math.round((d?.seconds ?? 0) / 60);
  return { goalMinutes, minutes, xp: d?.xp ?? 0, done: minutes >= goalMinutes };
}

/** The current week, Sunday first, with whether the learner was active each day. */
export function weekActivity(state: LearnerState, day: string): { day: string; active: boolean; isToday: boolean }[] {
  const d = new Date(`${day}T12:00:00Z`);
  const sunday = new Date(d);
  sunday.setUTCDate(d.getUTCDate() - d.getUTCDay());
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(sunday);
    x.setUTCDate(sunday.getUTCDate() + i);
    const key = x.toISOString().slice(0, 10);
    return { day: key, active: (state.days.get(key)?.xp ?? 0) > 0, isToday: key === day };
  });
}

export function totalXp(state: LearnerState): number {
  let xp = 0;
  for (const d of state.days.values()) xp += d.xp;
  return xp;
}

/** How well a word is known, 0 (new) to 4 (solid), from its review card. */
export function mastery(card: { state: number; stability: number; lapses: number }): number {
  if (card.state === State.New) return 0;
  if (card.stability < 1) return 1;
  if (card.stability < 7) return 2;
  if (card.stability < 30) return 3;
  return 4;
}
