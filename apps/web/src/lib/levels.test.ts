import { describe, expect, it } from "vitest";
import { levelInfo, levelRange } from "./levels";

const stages = [
  { level: "A0" as const, name: { he: "פתח", en: "Opening" }, about: "קריאה בלי ניקוד" },
  { level: "A1" as const, name: { he: "מילות הסוגיה", en: "Key words" }, about: "מילות מפתח" },
];

describe("level labels", () => {
  it("show CEFR levels for ordinary courses", () => {
    expect(levelInfo({}, "B1").heading).toBe("רמה B1");
    expect(levelRange({}, ["A0", "A1", "C1"])).toBe("רמות A0–C1");
  });

  it("show stage names for staged courses", () => {
    expect(levelInfo({ stages }, "A1")).toEqual({ short: "מילות הסוגיה", heading: "שלב 1: מילות הסוגיה", about: "מילות מפתח" });
    expect(levelRange({ stages }, ["A0", "A1"])).toBe("שלבים פתח–מילות הסוגיה");
  });
});
