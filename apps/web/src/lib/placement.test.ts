import { describe, expect, it } from "vitest";
import { placementStart } from "./placement";

describe("placement", () => {
  it("starts at the first unit with a mistake", () => {
    expect(placementStart([[true, true], [true, false], [false, false]])).toBe(1);
  });
  it("starts at the beginning after an early mistake", () => {
    expect(placementStart([[false, true]])).toBe(0);
  });
  it("passes everything when every answer is right", () => {
    expect(placementStart([[true, true], [true, true]])).toBe(2);
  });
});
