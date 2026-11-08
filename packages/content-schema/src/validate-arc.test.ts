import { describe, expect, it } from "vitest";
import { Course, Unit } from "./schema";
import { validateNoSpeech, validateQuotes, validateStages } from "./validate";

const course = (extra: object = {}) =>
  Course.parse({
    id: "arc-for-he",
    source: "he",
    target: "arc",
    speechLang: "none",
    title: { he: "ארמית", en: "Aramaic" },
    description: { he: "ארמית", en: "Aramaic" },
    units: ["u01"],
    quotesOnly: true,
    ...extra,
  });

const unit = (exercises: object[], vocabulary: object[] = []) =>
  Unit.parse({
    id: "u01",
    cefr: "A1",
    title: { he: "מאי", en: "What" },
    scene: "study",
    story: "סיפור",
    canDo: ["לקרוא"],
    vocabulary,
    lessons: [{ id: "l1", title: { he: "א", en: "a" }, kind: "new", exercises }],
  });

const translate = (source?: string) => ({
  id: "t1",
  type: "translate",
  direction: "to_source",
  prompt: "מאי קאמר",
  answers: ["מה הוא אומר"],
  ...(source ? { source } : {}),
});
const tip = { id: "tip1", type: "tip", title: "ניקוד", text: "הגמרא כתובה בלי ניקוד." };
const mc = { id: "m1", type: "multiple_choice", prompt: "מה פירוש מאי?", options: ["מה", "מי"], correct: 0 };

describe("quotesOnly courses", () => {
  it("require a source on sentence exercises", () => {
    expect(validateQuotes(course(), [unit([translate(), tip, mc])])).toEqual([
      '"t1": a translate needs a source (quotesOnly course)',
    ]);
    expect(validateQuotes(course(), [unit([translate("בבלי, ברכות ב ע״א"), tip, mc])])).toEqual([]);
  });

  it("require a source on word examples", () => {
    const word = { id: "may", text: "מאי", translation: "מה", pos: "pronoun", example: { text: "מאי טעמא", translation: "מה הטעם" } };
    expect(validateQuotes(course(), [unit([tip, mc, mc], [word])])).toEqual([
      'word "may": the example needs a source (quotesOnly course)',
    ]);
  });

  it("do nothing in ordinary courses", () => {
    expect(validateQuotes(course({ quotesOnly: false }), [unit([translate(), tip, mc])])).toEqual([]);
  });
});

describe("stages", () => {
  it("must name every level a unit uses", () => {
    const stages = [{ level: "A0", name: { he: "פתח", en: "Opening" }, about: "קריאה בלי ניקוד" }];
    expect(validateStages(course({ stages }), [unit([tip, mc, mc])])).toEqual(["level A1 is used by a unit but has no stage name"]);
  });
});

describe("courses without a voice", () => {
  it("cannot have listening tasks", () => {
    const dictation = { id: "d1", type: "dictation", text: "מאי" };
    expect(validateNoSpeech(course(), [unit([dictation, tip, mc])])).toEqual([
      '"d1": dictation needs a voice, but speechLang is none',
    ]);
  });
});
