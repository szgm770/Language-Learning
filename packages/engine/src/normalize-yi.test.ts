import { describe, expect, it } from "vitest";
import { normalize } from "./normalize";

describe("Yiddish normalisation", () => {
  it("treats ligature letters and their two-letter spellings as the same", () => {
    expect(normalize("ײַדיש", { lang: "yi" })).toBe(normalize("יידיש", { lang: "yi" }));
    expect(normalize("װאָס", { lang: "yi" })).toBe(normalize("וואס", { lang: "yi" }));
    expect(normalize("ױ", { lang: "yi" })).toBe(normalize("וי", { lang: "yi" }));
  });
  it("ignores pasekh/komets marks on alef", () => {
    expect(normalize("גאָט", { lang: "yi" })).toBe(normalize("גאט", { lang: "yi" }));
  });
  it("treats נישט and the Litvish ניט as the same word, but not inside other words", () => {
    expect(normalize("איך גיי נישט", { lang: "yi" })).toBe(normalize("איך גיי ניט", { lang: "yi" }));
    expect(normalize("נישטערן", { lang: "yi" })).not.toBe(normalize("ניטערן", { lang: "yi" }));
  });
});
