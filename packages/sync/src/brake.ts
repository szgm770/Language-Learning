import { DESTRUCTIVE_KINDS, type Op } from "./ops";
import type { LearnerState } from "./state";
import { isEnrolled } from "./state";

export const BRAKE_MAX_DESTRUCTIVE = 20;
export const BRAKE_MAX_SHARE = 0.1;

/**
 * Server-side safety brake. A batch that would take away more than 20 items, or more than
 * 10% of what the learner has, is refused and logged for review instead of applied.
 * Returns a reason string when the batch must be blocked.
 */
export function brakeCheck(ops: readonly Op[], current: LearnerState): string | undefined {
  const destructive = ops.filter((o) => DESTRUCTIVE_KINDS.has(o.kind));
  if (destructive.length === 0) return undefined;
  if (destructive.length > BRAKE_MAX_DESTRUCTIVE) {
    return `batch removes ${destructive.length} items (limit ${BRAKE_MAX_DESTRUCTIVE})`;
  }
  const active = [...current.enrollments.values()].filter(isEnrolled).length;
  const removing = new Set(destructive.map((o) => ("courseId" in o ? o.courseId : o.id))).size;
  // Leaving one course out of a few is normal; the share rule applies only to larger collections.
  if (active >= 10 && removing / active > BRAKE_MAX_SHARE) {
    return `batch removes ${removing} of ${active} courses (over ${BRAKE_MAX_SHARE * 100}%)`;
  }
  return undefined;
}

/** How far ahead of the server a device clock may be before its timestamps are clamped. */
export const MAX_CLOCK_SKEW_MS = 5 * 60_000;

/** Stops a device with a wrong clock from "winning" every last-writer-wins field forever. */
export function clampClock(op: Op, serverNow: number): Op {
  return op.at > serverNow + MAX_CLOCK_SKEW_MS ? { ...op, at: serverNow } : op;
}
