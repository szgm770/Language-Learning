import { describe, expect, it } from "vitest";
import { checkText } from "./check";
import { normalize } from "./normalize";

describe("normalize", () => {
  it("ignores case, punctuation and extra spaces", () => {
    expect(normalize("  Hello,   World! ", { lang: "en" })).toBe("hello world");
  });
  it("expands English contractions", () => {
    expect(normalize("I’m fine", { lang: "en" })).toBe(normalize("I am fine", { lang: "en" }));
  });
  it("strips Hebrew niqqud", () => {
    expect(normalize("שָׁלוֹם", { lang: "he" })).toBe("שלום");
  });
  it("strips Spanish accents", () => {
    expect(normalize("¿Cómo estás?", { lang: "es" })).toBe("como estas");
  });
});

describe("checkText", () => {
  const accepted = ["I am a student", "I'm a student"];

  it("accepts any listed answer", () => {
    expect(checkText("i'm a student.", accepted, "en").verdict).toBe("correct");
    expect(checkText("I am a student", accepted, "en").verdict).toBe("correct");
  });
  it("forgives one typo in a long word", () => {
    const r = checkText("I am a studnet", accepted, "en");
    expect(r.verdict).toBe("typo");
  });
  it("does not forgive changes to short words", () => {
    expect(checkText("he is a student", ["she is a student"], "en").verdict).toBe("wrong");
  });
  it("rejects a missing word", () => {
    expect(checkText("I am student", accepted, "en").verdict).toBe("wrong");
  });
  it("rejects empty input", () => {
    expect(checkText("   ", accepted, "en").verdict).toBe("wrong");
  });
  it("flags missing accents but counts them", () => {
    expect(checkText("como estas", ["¿Cómo estás?"], "es").verdict).toBe("accent");
  });
  it("treats extra accents on an unaccented answer as correct", () => {
    expect(checkText("café", ["cafe"], "en").verdict).toBe("correct");
  });
});
