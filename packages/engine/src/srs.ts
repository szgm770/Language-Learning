import { type Card, createEmptyCard, fsrs, type FSRS, type Grade, Rating, State } from "ts-fsrs";

export { Rating, State };
export type { Grade };

/**
 * A review card as stored locally and in the cloud: plain JSON, dates as epoch milliseconds.
 * One card per (user, item, facet); an item is a lexeme or grammar point.
 */
export interface StoredCard {
  due: number;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  state: State;
  lastReview: number | null;
}

/** One answer to one card. The review log is append-only and is the source of truth for card state. */
export interface ReviewEntry {
  id: string;
  cardKey: string;
  rating: Grade;
  /** When the review happened (device clock), epoch ms. */
  reviewedAt: number;
  /** How long the learner took, ms. */
  durationMs: number;
}

export const DEFAULT_RETENTION = 0.9;

let cached: { retention: number; scheduler: FSRS } | undefined;
export function scheduler(retention = DEFAULT_RETENTION): FSRS {
  if (!cached || cached.retention !== retention) {
    cached = { retention, scheduler: fsrs({ request_retention: retention, enable_fuzz: false }) };
  }
  return cached.scheduler;
}

function toStored(c: Card): StoredCard {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    scheduledDays: c.scheduled_days,
    learningSteps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    lastReview: c.last_review ? c.last_review.getTime() : null,
  };
}

function fromStored(c: StoredCard): Card {
  return {
    due: new Date(c.due),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: 0,
    scheduled_days: c.scheduledDays,
    learning_steps: c.learningSteps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.lastReview === null ? undefined : new Date(c.lastReview),
  };
}

export function newCard(now: number): StoredCard {
  return toStored(createEmptyCard(new Date(now)));
}

export function review(card: StoredCard, rating: Grade, now: number, retention = DEFAULT_RETENTION): StoredCard {
  return toStored(scheduler(retention).next(fromStored(card), new Date(now), rating).card);
}

/**
 * Rebuilds a card from its full review history, in time order.
 * Used after merging logs from several devices, so no review is ever lost.
 */
export function replay(entries: readonly ReviewEntry[], createdAt: number, retention = DEFAULT_RETENTION): StoredCard {
  const sorted = [...entries].sort((a, b) => a.reviewedAt - b.reviewedAt || a.id.localeCompare(b.id));
  let card = newCard(Math.min(createdAt, sorted[0]?.reviewedAt ?? createdAt));
  for (const e of sorted) card = review(card, e.rating, e.reviewedAt, retention);
  return card;
}

/** Maps an exercise result to an FSRS grade without asking the learner. */
export function gradeFromAnswer(correct: boolean, durationMs: number, hadTypo = false): Grade {
  if (!correct) return Rating.Again;
  if (hadTypo || durationMs > 15_000) return Rating.Hard;
  if (durationMs < 3_000) return Rating.Easy;
  return Rating.Good;
}
