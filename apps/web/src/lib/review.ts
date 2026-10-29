import type { Exercise, Lexeme } from "@lingo/content-schema";
import { seededShuffle, State, type StoredCard } from "@lingo/engine";

export type ReviewMode = "recognize" | "listen" | "recall";

/** Young cards are recognised from choices; mature ones must be recalled and typed. */
export function modeFor(card: StoredCard, seed: number): ReviewMode {
  if (card.state === State.Review && card.stability >= 3) return "recall";
  return seed % 2 === 0 ? "recognize" : "listen";
}

/** Builds a practice exercise for one word, in the same format as lesson exercises. */
export function reviewExercise(lexeme: Lexeme, pool: readonly Lexeme[], mode: ReviewMode, seed: number): Exercise {
  const others = seededShuffle(
    pool.filter((l) => l.id !== lexeme.id && l.translation !== lexeme.translation),
    seed,
  ).slice(0, 3);
  const options = seededShuffle([lexeme, ...others], seed + 1);
  const correct = options.findIndex((l) => l.id === lexeme.id);
  const id = `review-${lexeme.id}`;
  switch (mode) {
    case "recall":
      return { id, type: "translate", direction: "to_target", prompt: lexeme.translation, answers: [lexeme.text], lexemes: [lexeme.id] };
    case "listen":
      return {
        id,
        type: "listening_choice",
        audioText: lexeme.text,
        question: "מה שמעתם?",
        options: options.map((l) => l.translation),
        correct,
        lexemes: [lexeme.id],
      };
    case "recognize":
      return {
        id,
        type: "multiple_choice",
        prompt: `מה פירוש "${lexeme.text}"?`,
        options: options.map((l) => l.translation),
        correct,
        lexemes: [lexeme.id],
      };
  }
}
