"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SCENE_HUE, SceneArt } from "@/components/art";
import { AppShell } from "@/components/AppShell";
import { KIND } from "@/components/CoursePath";
import { Icon, type IconName } from "@/components/icons";
import { InstallHint } from "@/components/InstallHint";
import { LoadError, Loading, Ring, SpeakButton, Word } from "@/components/ui";
import { lexemeIndex, loadCourse, useLoad } from "@/lib/content";
import { today } from "@/lib/day";
import { courseName, languageName } from "@/lib/languages";
import { currentCourse, dailyGoal, dueCount, isCompleted, nextLesson, reviewCards, streak, totalXp, weekActivity, weakCards, weeklySummary, wordOfTheDay } from "@/lib/progress";
import { useLearner } from "@/lib/store";

const DAY_LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

function greeting(hour: number) {
  if (hour < 5) return "לילה טוב";
  if (hour < 12) return "בוקר טוב";
  if (hour < 17) return "צהריים טובים";
  if (hour < 21) return "ערב טוב";
  return "לילה טוב";
}

export default function Dashboard() {
  const { state, loaded } = useLearner();
  const router = useRouter();
  const courseId = loaded ? currentCourse(state) : undefined;

  useEffect(() => {
    if (loaded && !courseId) router.replace("/");
  }, [loaded, courseId, router]);

  const { data, error } = useLoad(async () => (courseId ? loadCourse(courseId) : null), [courseId]);
  if (error) return <LoadError />;
  if (!loaded || !courseId || !data) return <Loading />;

  const day = today();
  const { manifest } = data;
  const next = nextLesson(state, courseId, data.units);
  const due = dueCount(state, courseId);
  const goal = dailyGoal(state, day);
  const st = streak(state, day);
  const week = weekActivity(state, day);
  const summary = weeklySummary(state, day);
  const weak = weakCards(state, courseId).length;
  const known = reviewCards(state, courseId).length;
  const wotd = wordOfTheDay(state, courseId, day);
  const wotdWord = wotd ? lexemeIndex(data.units).get(wotd) : undefined;
  const unit = next?.unit ?? data.units.at(-1)!;
  const unitIndex = data.units.indexOf(unit);
  const lessonIndex = next ? unit.lessons.indexOf(next.lesson) : unit.lessons.length - 1;
  const doneInUnit = unit.lessons.filter((l) => isCompleted(state, courseId, l.id)).length;
  const hue = SCENE_HUE[unit.scene];

  return (
    <AppShell>
      <header className="flex items-center justify-between gap-3 pt-6">
        <div>
          <p className="text-ink-soft">{greeting(new Date().getHours())}</p>
          <h1 className="text-2xl font-bold">לומדים {courseName(manifest)}</h1>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 font-bold ring-1 ring-line" title="ימים רצופים">
            <Icon name="flame" className={`size-5 ${st.activeToday ? "text-saffron" : "text-ink-soft/40"}`} filled />
            <span className="tabular-nums">{st.length}</span>
            <span className="sr-only">ימים רצופים</span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 font-bold ring-1 ring-line" title="נקודות">
            <Icon name="star" className="size-5 text-cobalt" filled />
            <span className="tabular-nums">{totalXp(state)}</span>
            <span className="sr-only">נקודות</span>
          </span>
        </div>
      </header>

      <InstallHint />

      {next ? (
        <section
          className="mt-6 overflow-hidden rounded-[1.75rem] p-5"
          style={{ background: `var(--color-u-${hue}-soft)` }}
          aria-label="השיעור הבא"
        >
          <div className="flex items-start gap-4">
            <SceneArt scene={unit.scene} className="size-24 shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold" style={{ color: `var(--color-u-${hue})` }}>
                יחידה {unitIndex + 1}, שיעור {lessonIndex + 1} מתוך {unit.lessons.length}
              </span>
              <h2 className="text-2xl leading-tight font-bold">{next.lesson.title.he}</h2>
              <span className="flex items-center gap-1 text-sm text-ink-soft">
                <Icon name={KIND[next.lesson.kind]!.icon} className="size-4" />
                {KIND[next.lesson.kind]!.label}, {unit.title.he}
              </span>
            </div>
          </div>
          <div className="mt-4 flex gap-1.5" aria-label={`${doneInUnit} מתוך ${unit.lessons.length} שיעורים ביחידה`}>
            {unit.lessons.map((l) => (
              <span
                key={l.id}
                className="h-2 flex-1 rounded-full"
                style={{ background: isCompleted(state, courseId, l.id) ? `var(--color-u-${hue})` : "var(--color-surface)" }}
              />
            ))}
          </div>
          <Link href={`/lesson/${courseId}/${next.lesson.id}/`} className="btn-primary mt-5 min-h-14 w-full text-lg">
            <Icon name="play" className="size-5" filled />
            {doneInUnit === 0 && unitIndex === 0 ? "להתחיל" : "להמשיך"}
          </Link>
        </section>
      ) : (
        <section className="card mt-6 flex flex-col items-center gap-3 p-6 text-center">
          <Icon name="trophy" className="size-12 text-saffron" />
          <h2 className="text-2xl font-bold">סיימתם את כל השיעורים הזמינים</h2>
          <p className="text-ink-soft">המשיכו לחזור על המילים כדי שלא יישכחו.</p>
        </section>
      )}

      <Link href={`/review/${courseId}/`} className="card mt-4 flex items-center gap-4 p-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-saffron-soft text-saffron-strong">
          <Icon name="repeat" className="size-6" />
        </span>
        <span className="flex flex-1 flex-col">
          <span className="text-lg font-bold">חזרה יומית</span>
          <span className="text-sm text-ink-soft">{due > 0 ? `${due} מילים מחכות לכם` : "אין מילים לחזרה כרגע"}</span>
        </span>
        {due > 0 && <span className="rounded-full bg-saffron px-3 py-1 font-bold text-[#12203a] tabular-nums">{due}</span>}
      </Link>

      {known > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Link href={`/review/${courseId}/?mode=quick`} className="card flex flex-col gap-1 p-4">
            <Icon name="flame" className="size-6 text-saffron" />
            <span className="font-bold">5 דקות</span>
            <span className="text-sm text-ink-soft">תרגול מהיר</span>
          </Link>
          <Link href={`/review/${courseId}/?mode=weak`} className="card flex flex-col gap-1 p-4">
            <Icon name="repeat" className="size-6 text-cobalt" />
            <span className="font-bold">מילים חלשות</span>
            <span className="text-sm text-ink-soft">{weak > 0 ? `${weak} מילים לחיזוק` : "אין כרגע"}</span>
          </Link>
        </div>
      )}

      {st.length > 0 && !st.activeToday && (
        <p className="mt-4 rounded-2xl bg-saffron-soft p-3 text-center font-semibold text-saffron-strong">
          הרצף שלכם ({st.length} ימים) מחכה להיום. אפילו שיעור אחד שומר עליו.
        </p>
      )}

      <section className="card mt-4 flex items-center gap-4 p-4" aria-label="היעד היומי">
        <Ring value={goal.minutes / goal.goalMinutes} size={64} tone="var(--color-saffron)">
          <Icon name={goal.done ? "check" : "flame"} className={`size-6 ${goal.done ? "text-mint" : "text-saffron"}`} filled={!goal.done} />
        </Ring>
        <div className="flex flex-1 flex-col gap-2">
          <span className="font-bold">
            {goal.done ? "עמדתם ביעד היומי!" : "היעד להיום"}{" "}
            <span className="font-normal text-ink-soft tabular-nums">
              {goal.minutes} מתוך {goal.goalMinutes} דקות
            </span>
          </span>
          <ol className="flex justify-between" aria-label="השבוע">
            {week.map((w, i) => (
              <li key={w.day} className="flex flex-col items-center gap-1">
                <span
                  className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                    w.active ? "bg-saffron text-[#12203a]" : w.isToday ? "ring-2 ring-saffron" : "bg-sunken text-ink-soft"
                  }`}
                >
                  {w.active ? <Icon name="check" className="size-4" /> : DAY_LETTERS[i]}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="card mt-4 flex flex-col gap-2 p-4" aria-label="סיכום שבועי">
        <h2 className="font-bold">
          השבוע: {summary.activeDays} מתוך {summary.goalDays} ימים
        </h2>
        <span className="h-2 overflow-hidden rounded-full bg-sunken">
          <span className="block h-full rounded-full bg-mint" style={{ width: `${Math.min(1, summary.activeDays / summary.goalDays) * 100}%` }} />
        </span>
        <p className="text-sm text-ink-soft">
          {summary.minutes} דקות, {summary.xp} נקודות
          {summary.lastWeekMinutes > 0 && ` · שבוע שעבר: ${summary.lastWeekMinutes} דקות`}
          {summary.activeDays >= summary.goalDays && " · עמדתם ביעד השבועי!"}
        </p>
      </section>

      {wotdWord && (
        <section className="card mt-4 flex items-center gap-3 p-4" aria-label="המילה של היום">
          <SpeakButton text={wotdWord.text} lang={manifest.speechLang} size="sm" label={`השמעה: ${wotdWord.text}`} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-semibold text-cobalt">המילה של היום</span>
            <Word text={wotdWord.text} lang={manifest.target} className="text-xl" />
            <span className="truncate text-sm text-ink-soft">{wotdWord.translation}</span>
          </span>
        </section>
      )}

      <nav className="mt-6 grid grid-cols-2 gap-3" aria-label="עוד באתר">
        {[
          { href: "/achievements/", icon: "star", label: "ההישגים שלי" },
          { href: `/certificate/${courseId}/`, icon: "trophy", label: "התעודה שלי" },
          // Exam practice (Amirnet) exists for English only.
          ...(manifest.target === "en" ? [{ href: "/exams/", icon: "grammar", label: "אימון למבחנים" }] : []),
          { href: "/start/", icon: "chat", label: "לעבור לשפה אחרת" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="card flex min-h-14 items-center gap-3 p-3 text-cobalt">
            <Icon name={l.icon as IconName} className="size-6 shrink-0" />
            <span className="font-semibold">{l.label}</span>
          </Link>
        ))}
      </nav>
    </AppShell>
  );
}
