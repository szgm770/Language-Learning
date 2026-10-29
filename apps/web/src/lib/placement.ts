import { type Exercise, isGraded } from "@lingo/content-schema";
import type { UnitPack } from "./content";

/** Kinds of checks that work well out of context, quickly. */
const GOOD: Exercise["type"][] = ["multiple_choice", "fill_blank", "dialogue_gap", "translate", "listening_choice", "word_bank"];

/** Two questions per unit, taken from the unit's review lesson. */
export function placementQuestions(units: UnitPack[]): { unitIndex: number; ex: Exercise }[][] {
  return units.map((unit, unitIndex) => {
    const review = unit.lessons.find((l) => l.kind === "review" || l.kind === "test") ?? unit.lessons.at(-1)!;
    const pool = review.exercises.filter((e) => isGraded(e) && GOOD.includes(e.type));
    return pool.slice(0, 2).map((ex) => ({ unitIndex, ex }));
  });
}

/**
 * Adaptive: units are tested in order; the first unit with a mistake is where the learner starts.
 * Returns the unit index to start from (units.length = knows everything tested).
 */
export function placementStart(results: boolean[][]): number {
  const i = results.findIndex((r) => r.some((ok) => !ok));
  return i === -1 ? results.length : i;
}
