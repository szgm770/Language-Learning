import { State, type StoredCard } from "./srs";

export interface QueueOptions {
  now: number;
  /** New items the learner wants per day. */
  newPerDay: number;
  /** Hard cap on reviews per day, so missing a week does not bury the learner. */
  maxReviews?: number;
  /** New cards already introduced today. */
  newDoneToday?: number;
}

export interface QueueItem {
  key: string;
  card: StoredCard;
}

/** Due reviews first (most overdue first), then new cards up to the daily limit. */
export function dailyQueue(cards: readonly QueueItem[], opts: QueueOptions): QueueItem[] {
  const { now, newPerDay, maxReviews = 200, newDoneToday = 0 } = opts;
  const due = cards
    .filter((c) => c.card.state !== State.New && c.card.due <= now)
    .sort((a, b) => a.card.due - b.card.due)
    .slice(0, maxReviews);
  const fresh = cards.filter((c) => c.card.state === State.New).slice(0, Math.max(0, newPerDay - newDoneToday));
  return [...due, ...fresh];
}
