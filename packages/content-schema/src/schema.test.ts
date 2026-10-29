import { describe, expect, it } from "vitest";
import { Exercise, Unit } from "./schema";
import { validateUnitReferences } from "./validate";

const unit = {
  id: "u1",
  cefr: "A1",
  title: { he: "יחידה", en: "Unit" },
  canDo: ["x"],
  vocabulary: [{ id: "hello", text: "Hello", translation: "שלום", pos: "interjection" }],
  lessons: [
    {
      id: "l1",
      kind: "new",
      title: { he: "שיעור", en: "Lesson" },
      exercises: [
        { id: "e1", type: "dictation", text: "Hello", lexemes: ["hello"] },
        { id: "e2", type: "dictation", text: "Hello" },
        { id: "e3", type: "dictation", text: "Hello", lexemes: ["missing"] },
      ],
    },
  ],
};

describe("content schema", () => {
  it("accepts a valid unit", () => {
    expect(Unit.safeParse(unit).success).toBe(true);
  });
  it("rejects a choice index outside the options", () => {
    const r = Exercise.safeParse({ id: "x", type: "multiple_choice", prompt: "p", options: ["a", "b"], correct: 2 });
    expect(r.success).toBe(false);
  });
  it("rejects a fill-in sentence without a gap", () => {
    expect(Exercise.safeParse({ id: "x", type: "fill_blank", sentence: "no gap", answers: ["a"] }).success).toBe(false);
  });
  it("rejects ids that are not kebab-case", () => {
    expect(Exercise.safeParse({ id: "Bad Id", type: "dictation", text: "a" }).success).toBe(false);
  });
  it("finds references to unknown vocabulary", () => {
    const parsed = Unit.parse(unit);
    expect(validateUnitReferences(parsed)).toEqual(['exercise "e3" points to unknown lexeme "missing"']);
  });
});
