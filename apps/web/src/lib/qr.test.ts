import jsQR from "jsqr";
import qrcode from "qrcode-generator";
import { describe, expect, it } from "vitest";
import { encodePosition, parsePosition } from "./transfer";

/** What the camera does, in miniature: draw the QR as pixels, then decode the pixels. */
function roundTrip(text: string): string | undefined {
  const q = qrcode(0, "M");
  q.addData(text);
  q.make();
  const cell = 6;
  const margin = 4;
  const n = q.getModuleCount();
  const size = (n + margin * 2) * cell;
  const px = new Uint8ClampedArray(size * size * 4).fill(255);
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (!q.isDark(r, c)) continue;
      for (let y = 0; y < cell; y++)
        for (let x = 0; x < cell; x++) {
          const i = ((((r + margin) * cell + y) * size) + (c + margin) * cell + x) * 4;
          px[i] = px[i + 1] = px[i + 2] = 0;
        }
    }
  return jsQR(px, size, size)?.data;
}

describe("QR progress code", () => {
  it("survives being drawn and scanned", () => {
    const code = encodePosition({ courseId: "en-for-he", lessonId: "u12-l3", passed: ["a0-test", "a1-test", "a2-test"] });
    const read = roundTrip(code);
    expect(read).toBe(code);
    expect(parsePosition(read!)?.lessonId).toBe("u12-l3");
  });
});
