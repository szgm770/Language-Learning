"use client";

import { useEffect, useState } from "react";

const KEY = "install-hint-dismissed";

/**
 * On iPhone and iPad, Safari deletes a website's stored data after 7 days without a visit,
 * unless the site was added to the home screen. Progress lives only in the browser, so we ask.
 */
export function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const installed =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === "1";
    } catch {
      // Storage may be blocked; then the hint simply shows again next time.
    }
    setShow(ios && !installed && !dismissed);
  }, []);

  if (!show) return null;
  return (
    <aside className="mt-4 flex flex-col gap-2 rounded-xl bg-saffron-soft p-4" aria-label="שמירת ההתקדמות באייפון">
      <p className="font-medium">כדי שההתקדמות לא תימחק</p>
      <p className="text-sm">
        באייפון, Safari מוחק נתונים של אתר שלא נכנסו אליו שבוע. הוסיפו את האתר למסך הבית: לחצו על כפתור השיתוף ואז על
        &quot;הוספה למסך הבית&quot;.
      </p>
      <button
        type="button"
        className="min-h-11 self-start text-sm underline underline-offset-4"
        onClick={() => {
          try {
            localStorage.setItem(KEY, "1");
          } catch {}
          setShow(false);
        }}
      >
        הבנתי
      </button>
    </aside>
  );
}
