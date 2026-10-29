import type { Character, Exercise, Lexeme } from "@lingo/content-schema";
import type { Response } from "@lingo/engine";

export interface ExerciseContext {
  /** Language being learned, e.g. "en". */
  target: string;
  /** Learner's language, e.g. "he". */
  source: string;
  /** Voice for text-to-speech, e.g. "en-US". */
  speechLang: string;
  /** Course characters, for dialogues. */
  characters: Character[];
  /** Words of the unit, for learn cards. */
  lexemes: Map<string, Lexeme>;
}

export interface ExerciseProps<T extends Exercise["type"]> {
  ex: Extract<Exercise, { type: T }>;
  ctx: ExerciseContext;
  /** True after the answer was checked: inputs freeze. */
  locked: boolean;
  /** Reports the current answer, or null while there is nothing to check yet. */
  onChange: (response: Response | null) => void;
}

/** Stable small number from an id, used to shuffle the same way on every visit. */
export function seedOf(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const hasHebrew = (s: string) => /[֐-׿]/.test(s);
