import { newCard, replay, type ReviewEntry, type StoredCard } from "@lingo/engine";
import type { Op, SettingField } from "./ops";

export interface LessonProgress {
  courseId: string;
  completed: boolean;
  bestScore: number;
  attempts: number;
  firstCompletedAt: number | null;
}

export interface Enrollment {
  courseId: string;
  position: number;
  /** First enrollment; null when only an unenroll has been seen so far. */
  enrolledAt: number | null;
  lastEnrollAt: number;
  lastUnenrollAt: number;
}

interface SettingValue {
  value: string | number | boolean | null;
  at: number;
  /** Tie-breaker when two devices change a field at the same millisecond. */
  opId: string;
}

/**
 * Learner state built purely from ops. `apply` is idempotent (an op applied twice changes nothing)
 * and commutative (any order gives the same result), so every device and the cloud converge.
 */
export interface LearnerState {
  applied: Set<string>;
  reviews: Map<string, ReviewEntry[]>;
  cardCreatedAt: Map<string, { at: number; courseId: string; opId: string }>;
  /** Keyed by lessonKey(courseId, lessonId). */
  lessons: Map<string, LessonProgress>;
  days: Map<string, { xp: number; seconds: number }>;
  settings: Map<SettingField, SettingValue>;
  enrollments: Map<string, Enrollment>;
}

export function emptyState(): LearnerState {
  return {
    applied: new Set(),
    reviews: new Map(),
    cardCreatedAt: new Map(),
    lessons: new Map(),
    days: new Map(),
    settings: new Map(),
    enrollments: new Map(),
  };
}

export const lessonKey = (courseId: string, lessonId: string) => `${courseId}/${lessonId}`;

const later = (a: SettingValue, b: { at: number; opId: string }) => b.at > a.at || (b.at === a.at && b.opId > a.opId);

/** Applies one op in place. Returns false when the op was already applied. */
export function apply(state: LearnerState, op: Op): boolean {
  if (state.applied.has(op.id)) return false;
  state.applied.add(op.id);

  switch (op.kind) {
    case "review": {
      const list = state.reviews.get(op.cardKey) ?? [];
      list.push({ id: op.id, cardKey: op.cardKey, rating: op.rating, reviewedAt: op.at, durationMs: op.durationMs });
      state.reviews.set(op.cardKey, list);
      break;
    }
    case "card_add": {
      const prev = state.cardCreatedAt.get(op.cardKey);
      if (!prev || op.at < prev.at || (op.at === prev.at && op.id < prev.opId)) {
        state.cardCreatedAt.set(op.cardKey, { at: op.at, courseId: op.courseId, opId: op.id });
      }
      break;
    }
    case "lesson_result": {
      const key = lessonKey(op.courseId, op.lessonId);
      const prev = state.lessons.get(key);
      const firstCompletedAt = op.completed
        ? Math.min(prev?.firstCompletedAt ?? Number.POSITIVE_INFINITY, op.at)
        : (prev?.firstCompletedAt ?? null);
      state.lessons.set(key, {
        courseId: op.courseId,
        // Progress only moves forward: a completed lesson never becomes "not completed".
        completed: (prev?.completed ?? false) || op.completed,
        bestScore: Math.max(prev?.bestScore ?? 0, op.score),
        attempts: (prev?.attempts ?? 0) + 1,
        firstCompletedAt,
      });
      break;
    }
    case "activity": {
      const prev = state.days.get(op.day) ?? { xp: 0, seconds: 0 };
      state.days.set(op.day, { xp: prev.xp + op.xp, seconds: prev.seconds + op.seconds });
      break;
    }
    case "setting": {
      const prev = state.settings.get(op.field);
      // Last writer wins per field, never per whole profile.
      if (!prev || later(prev, { at: op.at, opId: op.id })) {
        state.settings.set(op.field, { value: op.value, at: op.at, opId: op.id });
      }
      break;
    }
    case "enroll": {
      const prev = state.enrollments.get(op.courseId);
      state.enrollments.set(op.courseId, {
        courseId: op.courseId,
        position: Math.max(prev?.position ?? 0, op.position),
        enrolledAt: prev?.enrolledAt == null ? op.at : Math.min(prev.enrolledAt, op.at),
        lastEnrollAt: Math.max(prev?.lastEnrollAt ?? 0, op.at),
        lastUnenrollAt: prev?.lastUnenrollAt ?? 0,
      });
      break;
    }
    case "unenroll": {
      const prev = state.enrollments.get(op.courseId);
      state.enrollments.set(op.courseId, {
        courseId: op.courseId,
        position: prev?.position ?? 0,
        enrolledAt: prev?.enrolledAt ?? null,
        lastEnrollAt: prev?.lastEnrollAt ?? 0,
        lastUnenrollAt: Math.max(prev?.lastUnenrollAt ?? 0, op.at),
      });
      break;
    }
  }
  return true;
}

export function applyAll(state: LearnerState, ops: Iterable<Op>): LearnerState {
  for (const op of ops) apply(state, op);
  return state;
}

/** A course is active unless it was left after the most recent enrollment; progress is kept either way. */
export function isEnrolled(e: Enrollment): boolean {
  return e.lastEnrollAt > e.lastUnenrollAt;
}

export function setting<T extends string | number | boolean | null>(
  state: LearnerState,
  field: SettingField,
  fallback: T,
): T {
  const s = state.settings.get(field);
  return s === undefined ? fallback : (s.value as T);
}

/** Card state is never stored as truth: it is rebuilt from the merged review history. */
export function cardState(state: LearnerState, cardKey: string, retention?: number): StoredCard {
  const created = state.cardCreatedAt.get(cardKey)?.at;
  const log = state.reviews.get(cardKey) ?? [];
  const createdAt = created ?? log[0]?.reviewedAt ?? 0;
  return log.length === 0 ? newCard(createdAt) : replay(log, createdAt, retention);
}

export function allCards(state: LearnerState, courseId?: string): { key: string; card: StoredCard }[] {
  const retention = setting(state, "retention", 0.9);
  const keys = new Set([...state.cardCreatedAt.keys(), ...state.reviews.keys()]);
  const out: { key: string; card: StoredCard }[] = [];
  for (const key of keys) {
    if (courseId && state.cardCreatedAt.get(key)?.courseId !== courseId) continue;
    out.push({ key, card: cardState(state, key, retention) });
  }
  return out;
}

/** Order-independent plain view of the state, for comparing devices and for debugging. */
export function snapshot(state: LearnerState) {
  const sortObj = <V>(m: Map<string, V>) => Object.fromEntries([...m.entries()].sort(([a], [b]) => a.localeCompare(b)));
  return {
    applied: [...state.applied].sort(),
    cards: Object.fromEntries(allCards(state).sort((a, b) => a.key.localeCompare(b.key)).map((c) => [c.key, c.card])),
    reviewCount: [...state.reviews.values()].reduce((n, l) => n + l.length, 0),
    cardCreatedAt: sortObj(state.cardCreatedAt),
    lessons: sortObj(state.lessons),
    days: sortObj(state.days),
    settings: sortObj(state.settings as Map<string, SettingValue>),
    enrollments: sortObj(state.enrollments),
  };
}
