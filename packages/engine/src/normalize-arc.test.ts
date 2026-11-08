import { describe, expect, it } from "vitest";
import { normalize } from "./normalize";

const arc = (s: string) => normalize(s, { lang: "arc" });

describe("normalize for Aramaic", () => {
  it("ignores niqqud", () => {
    expect(arc("מַאי טַעְמָא")).toBe(arc("מאי טעמא"));
  });

  it("treats every way of typing an abbreviation as the same", () => {
    expect(arc("ת״ש")).toBe("תש");
    expect(arc('ת"ש')).toBe("תש");
    expect(arc("מתני׳")).toBe(arc("מתני'"));
    expect(arc("מתני׳")).toBe("מתני");
  });

  it("splits words joined by a maqaf", () => {
    expect(arc("בַּר־נָשׁ")).toBe("בר נש");
  });

  it("keeps the words of a sentence", () => {
    expect(arc("אמר רבא: הכא במאי עסקינן?")).toBe("אמר רבא הכא במאי עסקינן");
  });
});
