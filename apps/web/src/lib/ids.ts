/** UUID v7: time-ordered, created on the device, no coordination needed. */
export function uuidv7(now = Date.now()): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const ts = BigInt(now);
  for (let i = 0; i < 6; i++) bytes[i] = Number((ts >> BigInt(8 * (5 - i))) & 0xffn);
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Card key for a word in a course. Lexeme ids are unique within a course. */
export const cardKey = (courseId: string, lexemeId: string) => `${courseId}:${lexemeId}`;

export function parseCardKey(key: string): { courseId: string; lexemeId: string } {
  const i = key.indexOf(":");
  return { courseId: key.slice(0, i), lexemeId: key.slice(i + 1) };
}
