import { State } from "@lingo/engine";
import { parseCardKey } from "./ids";
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

/** The preparation level (A0: letters, sounds, first words) is optional and can be skipped. */
export const isOptional = (unit: Pick<UnitPack, "cefr">) => unit.cefr === "A0";

/**
 * First lesson in course order that is not completed yet. A level test that was passed over
 * (placement, or moving progress from another device) does not hold the learner back.
 */
export function nextLesson(state: LearnerState, courseId: string, units: UnitPack[]) {
  const reached = state.enrollments.get(courseId)?.position ?? 0;
  const all = flatLessons(units);
  // The preparation level (A0) is optional: once the learner has done any later lesson, it is not suggested again.
  const skippedPrep = all.some(({ unit, lesson }) => !isOptional(unit) && isCompleted(state, courseId, lesson.id));
  return all.find(
    ({ unit, lesson }, i) =>
      !isCompleted(state, courseId, lesson.id) && !(lesson.kind === "test" && i < reached) && !(skippedPrep && isOptional(unit)),
  );
}

/**
 * A lesson opens once the lesson before it (in its own section) is completed. Level tests and the optional
 * preparation level never block what follows, and the first lesson of every section is open.
 */
export function lessonOpen(state: LearnerState, courseId: string, units: UnitPack[], lessonId: string): boolean {
  const all = flatLessons(units);
  const i = all.findIndex((l) => l.lesson.id === lessonId);
  const section = all[i]?.unit.section;
  let j = i - 1;
  while (j >= 0 && (all[j]!.lesson.kind === "test" || isOptional(all[j]!.unit) || all[j]!.unit.section !== section)) j--;
  return j < 0 || isCompleted(state, courseId, all[j]!.lesson.id);
}

/** Letter and sound cards (A0) are for learning the alphabet, not for spaced repetition lists. */
export const isAlphabetCard = (cardKey: string) => /^[ls]-/.test(parseCardKey(cardKey).lexemeId);

/** Cards the learner has met, without the alphabet. */
export const reviewCards = (state: LearnerState, courseId: string) =>
  allCards(state, courseId).filter((c) => c.card.state !== State.New && !isAlphabetCard(c.key));

export function dueCount(state: LearnerState, courseId: string, now = Date.now()): number {
  return reviewCards(state, courseId).filter((c) => c.card.due <= now).length;
}

/** Words that keep slipping: missed more than once, or missed at least once and still not solid. Worst first. */
export function weakCards(state: LearnerState, courseId: string) {
  return reviewCards(state, courseId)
    .filter((c) => c.card.lapses >= 2 || (c.card.lapses >= 1 && mastery(c.card) <= 2))
    .sort((a, b) => b.card.lapses - a.card.lapses || a.card.stability - b.card.stability);
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

/** The course split into CEFR levels, in order, each with its lessons and level test (if written yet). */
export function courseLevels(units: UnitPack[]) {
  const levels: { level: string; units: UnitPack[] }[] = [];
  // Sections (open side tracks) are not CEFR levels: no placement test, no level certificate.
  for (const u of units.filter((x) => !x.section)) {
    const last = levels.at(-1);
    if (last?.level === u.cefr) last.units.push(u);
    else levels.push({ level: u.cefr, units: [u] });
  }
  return levels.map(({ level, units }) => {
    const lessons = units.flatMap((u) => u.lessons);
    return { level, units, lessons, test: lessons.find((l) => l.kind === "test") };
  });
}

/** Whether the learner passed a level's test (best score at least PASS_SCORE). */
export function passedTest(state: LearnerState, courseId: string, testId: string | undefined) {
  if (!testId) return false;
  return isCompleted(state, courseId, testId) && (state.lessons.get(`${courseId}/${testId}`)?.bestScore ?? 0) >= PASS_SCORE;
}

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Days with learning, minutes and XP for a week (Sunday first), plus last week's minutes for comparison. */
export function weeklySummary(state: LearnerState, day: string) {
  const sunday = addDays(day, -new Date(`${day}T12:00:00Z`).getUTCDay());
  const sum = (from: string) => {
    let activeDays = 0, seconds = 0, xp = 0;
    for (let i = 0; i < 7; i++) {
      const d = state.days.get(addDays(from, i));
      if (d && d.xp > 0) activeDays++;
      seconds += d?.seconds ?? 0;
      xp += d?.xp ?? 0;
    }
    return { activeDays, minutes: Math.round(seconds / 60), xp };
  };
  return { goalDays: 5, ...sum(sunday), lastWeekMinutes: sum(addDays(sunday, -7)).minutes };
}

/** A word to look at today: the same all day, different tomorrow, from the words met so far. */
export function wordOfTheDay(state: LearnerState, courseId: string, day: string): string | undefined {
  const keys = reviewCards(state, courseId).map((c) => parseCardKey(c.key).lexemeId).sort();
  if (keys.length === 0) return undefined;
  let h = 0;
  for (const ch of `${courseId}${day}`) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return keys[h % keys.length];
}

export interface Achievement {
  id: string;
  title: string;
  hint: string;
  value: number;
  target: number;
}

/** Badges are computed from the learner's history, so nothing extra is stored and they can never get out of sync. */
export function achievements(state: LearnerState, courseId: string, day: string): Achievement[] {
  let lessons = 0, perfect = 0, tests = 0, xp = 0, minutes = 0;
  for (const [key, p] of state.lessons) {
    if (!key.startsWith(`${courseId}/`) || !p.completed) continue;
    if (/-test$/.test(key)) {
      if (p.bestScore >= PASS_SCORE) tests++;
    } else lessons++;
    if (p.bestScore >= 1) perfect++;
  }
  for (const d of state.days.values()) {
    xp += d.xp;
    minutes += (d.seconds ?? 0) / 60;
  }
  const cards = reviewCards(state, courseId);
  const solid = cards.filter((c) => mastery(c.card) >= 3).length;
  const st = streak(state, day).length;
  const a = (id: string, title: string, hint: string, value: number, target: number): Achievement => ({ id, title, hint, value: Math.min(value, target), target });
  return [
    a("first", "הצעד הראשון", "סיימו שיעור ראשון", lessons, 1),
    a("l25", "בדרך", "סיימו 25 שיעורים", lessons, 25),
    a("l100", "מתמידים", "סיימו 100 שיעורים", lessons, 100),
    a("l250", "מסלול שלם", "סיימו 250 שיעורים", lessons, 250),
    a("s3", "שלושה ימים ברצף", "למדו 3 ימים ברצף", st, 3),
    a("s7", "שבוע שלם", "למדו 7 ימים ברצף", st, 7),
    a("s30", "חודש של למידה", "למדו 30 ימים ברצף", st, 30),
    a("w100", "100 מילים", "הכירו 100 מילים", cards.length, 100),
    a("w500", "500 מילים", "הכירו 500 מילים", cards.length, 500),
    a("w1000", "1,000 מילים", "הכירו 1,000 מילים", cards.length, 1000),
    a("solid", "מילים חזקות", "50 מילים שאתם זוכרים היטב", solid, 50),
    a("perfect", "בלי טעויות", "10 שיעורים ב־100%", perfect, 10),
    a("tests", "עוברים רמה", "עברו מבחן רמה", tests, 1),
    a("hour", "שעה של אנגלית", "60 דקות למידה", Math.round(minutes), 60),
    a("xp", "5,000 נקודות", "צברו 5,000 נקודות ניסיון", xp, 5000),
  ];
}
