import type { Op } from "@lingo/sync";

/**
 * Where the cloud keeps each learner's ops. Append-only by design: there is no update or delete.
 * Implemented with Firestore in production and in memory for tests.
 */
export interface OpStore {
  /** Ops received after the cursor, oldest first, each with its own position. */
  pull(uid: string, cursor: Cursor | null, limit: number): Promise<{ ops: Op[]; positions: Cursor[] }>;
  /** Stores ops whose id is new for this learner; returns how many were new. */
  append(uid: string, ops: Op[]): Promise<number>;
  /** Enroll/unenroll ops, for the safety brake. */
  enrollmentOps(uid: string): Promise<Op[]>;
  recordBlocked(uid: string, info: { deviceId: string; reason: string; opCount: number; sample: Op[] }): Promise<void>;
  addReport(uid: string, report: ContentReport): Promise<void>;
}

export interface ContentReport {
  courseId: string;
  exerciseId: string;
  category: "answer_rejected" | "mistake" | "audio" | "other";
  learnerAnswer: string;
  comment: string;
}

/** Position in a learner's log: server receive time (ms) and op id as a tie-breaker. */
export interface Cursor {
  t: number;
  id: string;
}

/**
 * A pull starts this far before the saved cursor, so an op whose write finished a moment after
 * the previous pull is never skipped. Ops that come twice are harmless: merging is idempotent.
 */
export const PULL_OVERLAP_MS = 2 * 60_000;

/**
 * Opaque cursor string for clients.
 * - paging (`startedAt` set): continue right after `c`; `startedAt` is when this pull began.
 * - resume (`startedAt` absent): start at time `c.t`, inclusive.
 */
export interface DecodedCursor {
  cursor: Cursor;
  startedAt: number | null;
}

export function encodeCursor(d: DecodedCursor): string {
  return Buffer.from(JSON.stringify({ t: d.cursor.t, id: d.cursor.id, s: d.startedAt })).toString("base64url");
}

export function decodeCursor(s: string | null): DecodedCursor | null {
  if (!s) return null;
  try {
    const v = JSON.parse(Buffer.from(s, "base64url").toString("utf8")) as { t: unknown; id: unknown; s: unknown };
    if (typeof v.t !== "number" || typeof v.id !== "string" || v.id.length > 64) return null;
    if (v.s !== null && typeof v.s !== "number") return null;
    return { cursor: { t: v.t, id: v.id }, startedAt: v.s };
  } catch {
    return null;
  }
}
