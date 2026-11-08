import { type Exercise, isGraded } from "@lingo/content-schema";
import { checkText, type TextVerdict } from "./check";

/** What the learner did, per exercise type. */
export type Response =
  /** Learn cards, dialogues and tips: the learner read or listened and moved on. */
  | { type: "seen" }
  | { type: "dialogue_gap"; choice: string }
  | { type: "multiple_choice"; choice: number }
  | { type: "listening_choice"; choice: number }
  /** The UI submits once every pair is matched, with the number of wrong attempts on the way. */
  | { type: "match_pairs"; mistakes: number }
  | { type: "word_bank"; tiles: string[] }
  | { type: "fill_blank"; text: string }
  | { type: "translate"; text: string }
  | { type: "dictation"; text: string }
  | { type: "write"; text: string }
  /** Self-assessment after comparing the recording with the speaker. */
  | { type: "speak_repeat"; selfRating: "good" | "retry" };

export interface Evaluation {
  correct: boolean;
  verdict: TextVerdict;
  /** The answer to show the learner when they were wrong (or had a typo). */
  expected: string;
}

/**
 * Turns a response into a verdict. The rule-based evaluator below needs no network.
 * A future AI evaluator (free writing, pronunciation) implements the same interface,
 * so lessons never change when it is added.
 */
export interface Evaluator {
  evaluate(exercise: Exercise, response: Response, ctx: EvaluationContext): Evaluation;
}

export interface EvaluationContext {
  /** Language the learner is studying, e.g. "en". */
  target: string;
  /** Learner's own language, e.g. "he". */
  source: string;
}

const ok = (expected: string): Evaluation => ({ correct: true, verdict: "correct", expected });
const bad = (expected: string): Evaluation => ({ correct: false, verdict: "wrong", expected });

function fromText(input: string, accepted: readonly string[], lang: string): Evaluation {
  const r = checkText(input, accepted, lang);
  return { correct: r.verdict !== "wrong", verdict: r.verdict, expected: r.matched };
}

export class RuleEvaluator implements Evaluator {
  evaluate(ex: Exercise, res: Response, ctx: EvaluationContext): Evaluation {
    const ungraded = !isGraded(ex);
    if (ungraded ? res.type !== "seen" : ex.type !== res.type) {
      throw new Error(`response type ${res.type} does not match exercise ${ex.type}`);
    }
    switch (ex.type) {
      case "learn":
      case "dialogue":
      case "tip":
      case "reading":
        return ok("");
      case "dialogue_gap": {
        const expected = ex.lines[ex.gap]!.text;
        return (res as { choice: string }).choice === expected ? ok(expected) : bad(expected);
      }
      case "multiple_choice":
      case "listening_choice": {
        const expected = ex.options[ex.correct]!;
        return (res as { choice: number }).choice === ex.correct ? ok(expected) : bad(expected);
      }
      case "match_pairs": {
        const expected = ex.pairs.map(([a, b]) => `${a} = ${b}`).join(", ");
        return (res as { mistakes: number }).mistakes === 0 ? ok(expected) : bad(expected);
      }
      case "word_bank":
        return fromText((res as { tiles: string[] }).tiles.join(" "), ex.answers, ctx.target);
      case "fill_blank":
        return fromText((res as { text: string }).text, ex.answers, ctx.target);
      case "translate":
        return fromText(
          (res as { text: string }).text,
          ex.answers,
          ex.direction === "to_target" ? ctx.target : ctx.source,
        );
      case "dictation":
        return fromText((res as { text: string }).text, ex.answers ?? [ex.text], ctx.target);
      case "write": {
        const r = checkWriting((res as { text: string }).text, ex);
        return r.pass ? ok(ex.model) : bad(ex.model);
      }
      case "speak_repeat":
        return (res as { selfRating: string }).selfRating === "good" ? ok(ex.text) : bad(ex.text);
    }
  }
}

/** Words of the first answer plus distractors, shuffled with a seed so a retry shows the same order. */
export function wordBankTiles(ex: Extract<Exercise, { type: "word_bank" }>, seed: number): string[] {
  const words = ex.answers[0]!.replace(/[.!?,]/g, "").split(/\s+/).filter(Boolean);
  return seededShuffle([...words, ...ex.distractors], seed);
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  // Mix the seed first: xorshift gives almost the same first numbers for nearby seeds (seed, seed + 7).
  let s = seed >>> 0;
  s = Math.imul(s ^ (s >>> 16), 0x85ebca6b);
  s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35);
  s = (s ^ (s >>> 16)) >>> 0 || 1;
  const rand = () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Rule-based check of a free text: enough words, and at least 60% of the required items present. */
/** Accents are removed (ñ is kept) so check patterns can be written without them and still match what a learner typed. */
function foldAccents(s: string): string {
  return s
    .replace(/ñ/g, "\uE000")
    .replace(/Ñ/g, "\uE001")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\uE000/g, "ñ")
    .replace(/\uE001/g, "Ñ");
}

export function checkWriting(text: string, ex: Pick<Extract<Exercise, { type: "write" }>, "minWords" | "checks">) {
  const words = (text.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length;
  const folded = foldAccents(text);
  const results = ex.checks.map((c) => ({
    label: c.label,
    ok: c.any.some((p) => {
      try {
        return new RegExp(p, "iu").test(folded);
      } catch {
        return false;
      }
    }),
  }));
  const passed = results.filter((r) => r.ok).length;
  return { words, enough: words >= ex.minWords, results, passed, pass: words >= ex.minWords && passed >= Math.ceil(ex.checks.length * 0.6) };
}
