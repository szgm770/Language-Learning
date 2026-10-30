import { type Exercise, isGraded } from "@lingo/content-schema";
import type { UnitPack } from "./content";
import { courseLevels } from "./progress";

/** Kinds of checks that work well out of context, quickly. */
const GOOD: Exercise["type"][] = ["multiple_choice", "fill_blank", "dialogue_gap", "translate", "listening_choice", "word_bank"];

const LEVEL_PROBE = 4;
/** Wrong answers in a level probe that send the learner into that level's units. */
const LEVEL_FAIL = 2;

const pool = (exs: Exercise[]) => exs.filter((e) => isGraded(e) && GOOD.includes(e.type));

/** `n` items spread evenly through a list. */
function spread<T>(xs: T[], n: number): T[] {
  if (xs.length <= n) return xs;
  return Array.from({ length: n }, (_, i) => xs[Math.floor(((i + 0.5) * xs.length) / n)]!);
}

/** Two questions from a unit's review lesson. */
export function unitProbe(unit: UnitPack): Exercise[] {
  const review = unit.lessons.find((l) => l.kind === "review") ?? unit.lessons.at(-1)!;
  return pool(review.exercises).slice(0, 2);
}

/** A few questions across a whole level: from its level test, or one per unit review. */
export function levelProbe(units: UnitPack[]): Exercise[] {
  const test = units.flatMap((u) => u.lessons).find((l) => l.kind === "test");
  if (test) return spread(pool(test.exercises), LEVEL_PROBE);
  return spread(units, LEVEL_PROBE).flatMap((u) => unitProbe(u).slice(0, 1));
}

/**
 * Adaptive placement as a small state machine. Whole levels are probed first (a few questions each);
 * in the first level the learner does not pass, units are probed one by one, and the first unit with a
 * mistake is where the learner starts.
 */
export type Placement = {
  phase: "level" | "unit" | "done";
  level: number;
  /** Unit index inside the level (phase "unit"). */
  unit: number;
  questions: Exercise[];
  at: number;
  wrong: number;
  /** Global unit index to start from, once done (units.length = knows everything). */
  start: number;
  asked: number;
};

export function startPlacement(units: UnitPack[]): Placement {
  return enterLevel(units, 0, 0);
}

function enterLevel(units: UnitPack[], level: number, asked: number): Placement {
  const levels = courseLevels(units);
  if (level >= levels.length) return { phase: "done", level, unit: 0, questions: [], at: 0, wrong: 0, start: units.length, asked };
  const questions = levelProbe(levels[level]!.units);
  if (!questions.length) return enterUnit(units, level, 0, asked);
  return { phase: "level", level, unit: 0, questions, at: 0, wrong: 0, start: 0, asked };
}

function enterUnit(units: UnitPack[], level: number, unit: number, asked: number): Placement {
  const levels = courseLevels(units);
  const lv = levels[level]!;
  const first = units.indexOf(lv.units[0]!);
  if (unit >= lv.units.length) return enterLevel(units, level + 1, asked);
  const questions = unitProbe(lv.units[unit]!);
  if (!questions.length) return enterUnit(units, level, unit + 1, asked);
  return { phase: "unit", level, unit, questions, at: 0, wrong: 0, start: first + unit, asked };
}

/** The next state after answering the current question. */
export function answerPlacement(units: UnitPack[], p: Placement, correct: boolean): Placement {
  const asked = p.asked + 1;
  const wrong = p.wrong + (correct ? 0 : 1);
  const at = p.at + 1;
  if (p.phase === "level") {
    if (wrong >= LEVEL_FAIL) return enterUnit(units, p.level, 0, asked);
    if (at >= p.questions.length) return enterLevel(units, p.level + 1, asked);
    return { ...p, at, wrong, asked };
  }
  if (p.phase === "unit") {
    if (!correct) return { ...p, phase: "done", asked };
    if (at >= p.questions.length) return enterUnit(units, p.level, p.unit + 1, asked);
    return { ...p, at, wrong, asked };
  }
  return p;
}
