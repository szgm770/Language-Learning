import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { brakeCheck, clampClock } from "./brake";
import { Op, SCHEMA_VERSION } from "./ops";
import { allCards, apply, applyAll, emptyState, isEnrolled, setting, snapshot } from "./state";
import { computeStreak } from "./streak";

const T0 = Date.UTC(2026, 0, 1);
let n = 0;
const uuid = () => `00000000-0000-4000-8000-${(++n).toString(16).padStart(12, "0")}`;
const base = (at: number, deviceId = "d1") => ({ id: uuid(), at, deviceId, v: SCHEMA_VERSION });

// ---- random op generator -------------------------------------------------------------
const opArb: fc.Arbitrary<Op> = fc
  .record({
    id: fc.uuid({ version: 4 }),
    at: fc.integer({ min: T0, max: T0 + 30 * 86_400_000 }),
    deviceId: fc.constantFrom("phone", "laptop", "tablet"),
    pick: fc.integer({ min: 0, max: 6 }),
    key: fc.constantFrom("en:hello", "en:goodbye", "en:thanks", "en:please"),
    course: fc.constantFrom("en-for-he", "es-for-he"),
    lesson: fc.constantFrom("l1", "l2", "l3"),
    rating: fc.constantFrom(1 as const, 2 as const, 3 as const, 4 as const),
    score: fc.double({ min: 0, max: 1, noNaN: true }),
    flag: fc.boolean(),
    num: fc.integer({ min: 0, max: 50 }),
  })
  .map(({ id, at, deviceId, pick, key, course, lesson, rating, score, flag, num }): Op => {
    const b = { id, at, deviceId, v: SCHEMA_VERSION } as const;
    switch (pick) {
      case 0:
        return { ...b, kind: "review", cardKey: key, rating, durationMs: num * 100 };
      case 1:
        return { ...b, kind: "card_add", cardKey: key, courseId: course };
      case 2:
        return { ...b, kind: "lesson_result", courseId: course, lessonId: lesson, score, completed: flag };
      case 3:
        return { ...b, kind: "activity", day: new Date(at).toISOString().slice(0, 10), xp: num, seconds: num * 10 };
      case 4:
        return { ...b, kind: "setting", field: "newPerDay", value: num };
      case 5:
        return { ...b, kind: "enroll", courseId: course, position: num };
      default:
        return { ...b, kind: "unenroll", courseId: course };
    }
  });

/** Real ops never share an id (UUIDs), so generated batches must not either. */
const uniqueOps = (maxLength: number) => fc.uniqueArray(opArb, { selector: (o) => o.id, maxLength });

const shuffled = <T>(xs: T[], seed: number) => {
  const out = [...xs];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
};

describe("merge rules (property-based)", () => {
  it("every op is valid against the schema", () => {
    fc.assert(fc.property(opArb, (op) => Op.safeParse(op).success));
  });

  it("converges: any order, any duplicates, same state", () => {
    fc.assert(
      fc.property(uniqueOps(60), fc.integer(), fc.integer(), (ops, s1, s2) => {
        const a = applyAll(emptyState(), shuffled(ops, s1));
        const b = applyAll(emptyState(), [...shuffled(ops, s2), ...shuffled(ops, s1)]);
        expect(snapshot(b)).toEqual(snapshot(a));
      }),
      { numRuns: 150 },
    );
  });

  it("two offline devices that sync later lose nothing", () => {
    fc.assert(
      fc.property(uniqueOps(60), fc.integer({ min: 0, max: 60 }), (all, cut) => {
        const phone = all.slice(0, cut);
        const laptop = all.slice(cut);
        // Each device applies its own ops, then they exchange everything through the cloud.
        const cloud = applyAll(applyAll(emptyState(), phone), laptop);
        const phoneAfter = applyAll(applyAll(emptyState(), phone), laptop);
        const laptopAfter = applyAll(applyAll(emptyState(), laptop), phone);
        expect(snapshot(phoneAfter)).toEqual(snapshot(cloud));
        expect(snapshot(laptopAfter)).toEqual(snapshot(cloud));
        const reviews = [...phone, ...laptop].filter((o) => o.kind === "review");
        expect(snapshot(cloud).reviewCount).toBe(new Set(reviews.map((r) => r.id)).size);
      }),
      { numRuns: 100 },
    );
  });

  it("an empty device that connects changes nothing in the cloud", () => {
    fc.assert(
      fc.property(uniqueOps(40), (ops) => {
        const cloud = applyAll(emptyState(), ops);
        const before = snapshot(cloud);
        applyAll(cloud, []); // the new device has no ops to push
        expect(snapshot(cloud)).toEqual(before);
      }),
    );
  });
});

describe("specific rules", () => {
  it("a completed lesson stays completed and keeps the best score", () => {
    const s = emptyState();
    apply(s, { ...base(T0), kind: "lesson_result", courseId: "c", lessonId: "l1", score: 0.9, completed: true });
    apply(s, { ...base(T0 + 1000, "d2"), kind: "lesson_result", courseId: "c", lessonId: "l1", score: 0.4, completed: false });
    expect(s.lessons.get("c/l1")).toMatchObject({ completed: true, bestScore: 0.9, attempts: 2 });
  });

  it("settings are last-writer-wins per field", () => {
    const s = emptyState();
    apply(s, { ...base(T0 + 2000, "phone"), kind: "setting", field: "newPerDay", value: 15 });
    apply(s, { ...base(T0 + 1000, "laptop"), kind: "setting", field: "newPerDay", value: 5 });
    apply(s, { ...base(T0 + 1000, "laptop"), kind: "setting", field: "theme", value: "dark" });
    expect(setting(s, "newPerDay", 10)).toBe(15);
    expect(setting(s, "theme", "light")).toBe("dark");
  });

  it("re-enrolling after leaving a course restores it with its progress", () => {
    const s = emptyState();
    apply(s, { ...base(T0), kind: "enroll", courseId: "c", position: 7 });
    apply(s, { ...base(T0 + 1000), kind: "unenroll", courseId: "c" });
    expect(isEnrolled(s.enrollments.get("c")!)).toBe(false);
    apply(s, { ...base(T0 + 2000), kind: "enroll", courseId: "c", position: 0 });
    expect(s.enrollments.get("c")).toMatchObject({ position: 7 });
    expect(isEnrolled(s.enrollments.get("c")!)).toBe(true);
  });

  it("card state comes from the merged review log", () => {
    const s = emptyState();
    apply(s, { ...base(T0), kind: "card_add", cardKey: "k", courseId: "c" });
    apply(s, { ...base(T0 + 60_000, "phone"), kind: "review", cardKey: "k", rating: 3, durationMs: 4000 });
    apply(s, { ...base(T0 + 86_400_000, "laptop"), kind: "review", cardKey: "k", rating: 3, durationMs: 4000 });
    expect(allCards(s, "c")[0]!.card.reps).toBe(2);
  });
});

describe("safety brake", () => {
  it("blocks a batch that unenrolls more than 20 courses", () => {
    const ops: Op[] = Array.from({ length: 21 }, (_, i) => ({ ...base(T0), kind: "unenroll", courseId: `c${i}` }));
    expect(brakeCheck(ops, emptyState())).toMatch(/limit/);
  });
  it("allows normal batches", () => {
    const ops: Op[] = [{ ...base(T0), kind: "review", cardKey: "k", rating: 3, durationMs: 1 }];
    expect(brakeCheck(ops, emptyState())).toBeUndefined();
  });
  it("clamps timestamps from clocks far in the future", () => {
    const op: Op = { ...base(T0 + 86_400_000), kind: "setting", field: "theme", value: "dark" };
    expect(clampClock(op, T0).at).toBe(T0);
  });
});

describe("streak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-03-01", "2026-03-02", "2026-03-03"], "2026-03-03")).toEqual({ length: 3, activeToday: true });
  });
  it("still counts when today is not done yet", () => {
    expect(computeStreak(["2026-03-01", "2026-03-02"], "2026-03-03").length).toBe(2);
  });
  it("forgives one missed day per week", () => {
    expect(computeStreak(["2026-03-02", "2026-03-04"], "2026-03-04").length).toBe(2);
  });
  it("breaks after two missed days", () => {
    expect(computeStreak(["2026-03-01", "2026-03-04"], "2026-03-04").length).toBe(1);
  });
});
