import { describe, expect, it } from "vitest";
import { dailyQueue } from "./queue";
import { gradeFromAnswer, newCard, Rating, replay, review, type ReviewEntry, State } from "./srs";

const DAY = 86_400_000;
const t0 = Date.UTC(2026, 0, 1, 9);

describe("srs", () => {
  it("schedules a good review further out than an again", () => {
    const c = newCard(t0);
    const good = review(c, Rating.Good, t0);
    const again = review(c, Rating.Again, t0);
    expect(good.due).toBeGreaterThan(again.due);
    expect(good.reps).toBe(1);
  });

  it("replay gives the same card no matter the order entries arrive in", () => {
    const entries: ReviewEntry[] = [
      { id: "a", cardKey: "k", rating: Rating.Good, reviewedAt: t0, durationMs: 2000 },
      { id: "b", cardKey: "k", rating: Rating.Hard, reviewedAt: t0 + DAY, durationMs: 2000 },
      { id: "c", cardKey: "k", rating: Rating.Good, reviewedAt: t0 + 4 * DAY, durationMs: 2000 },
    ];
    const forward = replay(entries, t0);
    const backward = replay([...entries].reverse(), t0);
    expect(backward).toEqual(forward);
    expect(forward.reps).toBe(3);
    expect(forward.state).toBe(State.Review);
  });

  it("grades answers automatically", () => {
    expect(gradeFromAnswer(false, 1000)).toBe(Rating.Again);
    expect(gradeFromAnswer(true, 1000)).toBe(Rating.Easy);
    expect(gradeFromAnswer(true, 6000)).toBe(Rating.Good);
    expect(gradeFromAnswer(true, 6000, true)).toBe(Rating.Hard);
  });
});

describe("dailyQueue", () => {
  it("puts overdue reviews first and limits new cards", () => {
    const reviewed = review(newCard(t0), Rating.Good, t0);
    const cards = [
      { key: "new1", card: newCard(t0) },
      { key: "new2", card: newCard(t0) },
      { key: "old", card: { ...reviewed, due: t0 - DAY } },
      { key: "later", card: { ...reviewed, due: t0 + 10 * DAY } },
    ];
    const q = dailyQueue(cards, { now: t0, newPerDay: 1 });
    expect(q.map((c) => c.key)).toEqual(["old", "new1"]);
  });
});
