"use client";

import Link from "next/link";
import { today } from "@/lib/day";
import { streak } from "@/lib/progress";
import { useLearner } from "@/lib/store";

export function TopBar() {
  const { state } = useLearner();
  const st = streak(state, today());
  return (
    <header className="flex items-center justify-between py-3">
      <div className="flex items-center gap-2" title="ימים רצופים של לימוד">
        <svg viewBox="0 0 24 24" className={`size-6 ${st.activeToday ? "text-saffron" : "text-line"}`} aria-hidden="true">
          <path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.3 1.6 1 2.5 2 3 0-3.5-.5-6.5 1-9.5z" fill="currentColor" />
        </svg>
        <span className="text-lg font-semibold tabular-nums">{st.length}</span>
        <span className="sr-only">ימים רצופים</span>
      </div>
      <div className="flex items-center">
        <Link href="/settings" className="inline-flex size-11 items-center justify-center text-ink-soft" aria-label="הגדרות">
          <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" fill="none" />
            <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
