import { dayIn } from "@lingo/sync";

/** The learner's local calendar day, YYYY-MM-DD. */
export function today(now = Date.now()): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jerusalem";
  return dayIn(tz, now);
}
