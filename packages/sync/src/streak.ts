/** Adds `delta` days to a YYYY-MM-DD string. */
export function addDays(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Local calendar day for a timestamp in an IANA time zone. */
export function dayIn(timeZone: string, at: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

function weekKey(day: string): string {
  // Week starts on Sunday, as in Israel.
  const d = new Date(`${day}T12:00:00Z`);
  return addDays(day, -d.getUTCDay());
}

/**
 * Consecutive active days ending today (or yesterday, if today is not done yet).
 * One missed day per week is forgiven automatically (a "freeze").
 * Recomputed from the merged set of active days, so devices can never disagree.
 */
export function computeStreak(activeDays: Iterable<string>, today: string): { length: number; activeToday: boolean } {
  const days = new Set(activeDays);
  const activeToday = days.has(today);
  let cursor = activeToday ? today : addDays(today, -1);
  const frozenWeeks = new Set<string>();
  let length = 0;
  while (true) {
    if (days.has(cursor)) {
      length++;
    } else {
      const week = weekKey(cursor);
      const prev = addDays(cursor, -1);
      // A freeze only bridges a single gap between two active days.
      if (length === 0 || frozenWeeks.has(week) || !days.has(prev)) break;
      frozenWeeks.add(week);
    }
    cursor = addDays(cursor, -1);
  }
  return { length, activeToday };
}
