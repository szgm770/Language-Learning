import type { Exercise } from "@lingo/content-schema";
import { describe, expect, it } from "vitest";
import { RuleEvaluator, seededShuffle, wordBankTiles } from "./evaluate";

const ctx = { target: "en", source: "he" };
const ev = new RuleEvaluator();

describe("RuleEvaluator", () => {
  it("checks multiple choice", () => {
    const ex: Exercise = { id: "x", type: "multiple_choice", prompt: "שלום", options: ["Hello", "Bye"], correct: 0, lexemes: [] };
    expect(ev.evaluate(ex, { type: "multiple_choice", choice: 0 }, ctx).correct).toBe(true);
    const wrong = ev.evaluate(ex, { type: "multiple_choice", choice: 1 }, ctx);
    expect(wrong.correct).toBe(false);
    expect(wrong.expected).toBe("Hello");
  });

  it("checks word bank tiles as a sentence", () => {
    const ex: Exercise = { id: "x", type: "word_bank", prompt: "אני סטודנט", answers: ["I am a student."], distractors: ["she"], lexemes: [] };
    expect(ev.evaluate(ex, { type: "word_bank", tiles: ["I", "am", "a", "student"] }, ctx).correct).toBe(true);
    expect(ev.evaluate(ex, { type: "word_bank", tiles: ["she", "am", "a", "student"] }, ctx).correct).toBe(false);
  });

  it("checks a translation into the learner's own language with Hebrew rules", () => {
    const ex: Exercise = { id: "x", type: "translate", direction: "to_source", prompt: "Good morning", answers: ["בוקר טוב"], lexemes: [] };
    expect(ev.evaluate(ex, { type: "translate", text: "בּוֹקֶר טוֹב!" }, ctx).correct).toBe(true);
  });

  it("refuses a response of the wrong type", () => {
    const ex: Exercise = { id: "x", type: "dictation", text: "Hello", lexemes: [] };
    expect(() => ev.evaluate(ex, { type: "translate", text: "Hello" }, ctx)).toThrow();
  });
});

describe("tiles", () => {
  it("contains every word of the answer plus distractors", () => {
    const ex = { id: "x", type: "word_bank" as const, prompt: "p", answers: ["I am here."], distractors: ["is"], lexemes: [] };
    expect(wordBankTiles(ex, 7).sort()).toEqual(["I", "am", "here", "is"].sort());
  });
  it("shuffles the same way for the same seed", () => {
    expect(seededShuffle([1, 2, 3, 4, 5, 6], 42)).toEqual(seededShuffle([1, 2, 3, 4, 5, 6], 42));
  });
});
