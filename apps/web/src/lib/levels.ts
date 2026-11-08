import type { Course } from "@lingo/content-schema";

/** CEFR descriptions, for courses graded by CEFR. */
const CEFR_ABOUT: Record<string, string> = {
  A0: "לפני שמתחילים: אותיות, צלילים ומילים ראשונות",
  A1: "מתחילים: מילים ומשפטים ראשונים",
  A2: "בסיסי: להסתדר במצבים יומיומיים",
  B1: "בינוני: לדבר בחופשיות על רוב הנושאים",
  B2: "בינוני־גבוה: שיחה טבעית, גם בעבודה",
  C1: "מתקדם: שפה עשירה, מקצועית ואקדמית",
};

export interface LevelInfo {
  /** Short label for lists and badges: "A1", or a stage name such as "מילות הסוגיה". */
  short: string;
  /** Section heading: "רמה A1" or "שלב 1: מילות הסוגיה". */
  heading: string;
  /** One line about the level. */
  about: string;
}

/** How a level is shown. Courses with `stages` (Aramaic) name stages instead of CEFR levels. */
export function levelInfo(course: Pick<Course, "stages">, cefr: string): LevelInfo {
  const i = course.stages?.findIndex((s) => s.level === cefr) ?? -1;
  if (course.stages && i >= 0) {
    const s = course.stages[i]!;
    return { short: s.name.he, heading: `שלב ${i}: ${s.name.he}`, about: s.about };
  }
  return { short: cefr, heading: `רמה ${cefr}`, about: CEFR_ABOUT[cefr] ?? "" };
}

/** "רמות A0–C1", or "שלבים פתח–סוגיה שלמה" for staged courses. */
export function levelRange(course: Pick<Course, "stages">, levels: string[]): string {
  const u = [...new Set(levels)];
  const word = course.stages ? ["שלב", "שלבים"] : ["רמה", "רמות"];
  const label = (l: string | undefined) => (l ? levelInfo(course, l).short : "");
  return u.length > 1 ? `${word[1]} ${label(u[0])}–${label(u.at(-1))}` : `${word[0]} ${label(u[0])}`;
}
