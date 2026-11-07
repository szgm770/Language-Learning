import { readFileSync } from "node:fs";
import type { Exercise, Unit } from "@lingo/content-schema";
import { expect, type Page } from "@playwright/test";

const read = <T,>(path: string) => JSON.parse(readFileSync(new URL(`../public/content/${path}`, import.meta.url), "utf8")) as T;
const courses = ["en-for-he", "en-amirnet", "es-for-he"];
const byCourse = new Map<string, Map<string, Exercise>>(
  courses.map((course) => {
    const units = read<{ units: { id: string }[] }>(`${course}/manifest.json`).units.map((u) => read<Unit>(`${course}/units/${u.id}.json`));
    return [course, new Map(units.flatMap((u) => u.lessons.flatMap((l) => l.exercises.map((e) => [e.id, e] as const))))];
  }),
);
/** Exercise ids repeat between courses, so look them up in the course of the page being tested. */
export const exercises = {
  get(id: string, page: Page): Exercise | undefined {
    const course = /\/(?:lesson|review|placement)\/([^/]+)\//.exec(page.url())?.[1] ?? "en-for-he";
    return byCourse.get(course)?.get(id);
  },
};
/** Answers the exercise on screen correctly, using the course content. */
export async function solve(page: Page, ex: Exercise) {
  switch (ex.type) {
    case "learn":
    case "dialogue":
    case "tip":
    case "reading":
      await page.getByRole("button", { name: /^(הבנתי|המשך)$/ }).click();
      return "seen";
    case "dialogue_gap":
      await page.locator("[data-exercise] .choice").filter({ hasText: ex.lines[ex.gap]!.text }).first().click();
      break;
    case "multiple_choice":
    case "listening_choice":
      await page.locator("[data-exercise] .choice").nth(ex.correct).click();
      break;
    case "match_pairs":
      for (const [target, source] of ex.pairs) {
        await page.getByRole("button", { name: target, exact: true }).click();
        await page.getByRole("button", { name: source, exact: true }).click();
      }
      return; // checks itself
    case "word_bank": {
      const words = ex.answers[0]!.replace(/[.!?,]/g, "").split(/\s+/);
      for (const w of words) {
        await page.locator("[data-bank]").getByRole("button", { name: w, exact: true, disabled: false }).first().click();
      }
      break;
    }
    case "fill_blank":
      if (ex.options) await page.getByRole("button", { name: ex.answers[0]!, exact: true }).click();
      else await page.getByRole("textbox").fill(ex.answers[0]!);
      break;
    case "translate":
      await page.getByRole("textbox").fill(ex.answers[0]!);
      break;
    case "dictation":
      await page.getByRole("textbox").fill(ex.answers?.[0] ?? ex.text);
      break;
    case "speak_repeat":
      await page.getByRole("button", { name: "אמרתי נכון" }).click();
      break;
    case "write":
      await page.getByRole("textbox").fill(ex.model);
      break;
  }
  await page.getByRole("button", { name: "בדיקה" }).click();
}

/** Plays the lesson on screen to the end, answering everything correctly. Returns the number of mistakes. */
const DONE = /השיעור הושלם|עברתם את מבחן הרמה|כמעט שם/;

export async function finishLesson(page: Page): Promise<number> {
  let mistakes = 0;
  for (let step = 0; step < 60; step++) {
    const stage = page.locator("[data-exercise]");
    const done = page.getByRole("heading", { name: DONE });
    const intro = page.getByRole("button", { name: "לתרגול" });
    await expect(stage.or(done).or(intro)).toBeVisible();
    if (await done.isVisible()) break;
    if (await intro.isVisible()) {
      await intro.click();
      continue;
    }
    const id = (await stage.getAttribute("data-exercise"))!;
    if ((await solve(page, exercises.get(id, page)!)) === "seen") continue;
    const status = page.locator("[data-verdict]");
    await expect(status).toBeVisible();
    if ((await status.getAttribute("data-verdict")) !== "correct") mistakes++;
    await page.getByRole("button", { name: "המשך" }).click();
  }
  await expect(page.getByRole("heading", { name: DONE })).toBeVisible();
  return mistakes;
}

/** Gives a wrong answer to the exercise on screen and checks it. */
export async function answerWrong(page: Page, ex: Exercise) {
  if (ex.type === "fill_blank" && ex.options) await page.getByRole("button", { name: ex.options.find((o) => !ex.answers.includes(o))!, exact: true }).click();
  else if (ex.type === "multiple_choice" || ex.type === "listening_choice") await page.locator("[data-exercise] .choice").filter({ hasNotText: ex.options[ex.correct]! }).first().click();
  else if (ex.type === "dialogue_gap") await page.locator("[data-exercise] .choice").filter({ hasText: ex.distractors[0]! }).first().click();
  else if (ex.type === "word_bank") await page.locator("[data-bank]").getByRole("button").first().click();
  else await page.getByRole("textbox").fill("wrong answer");
  await page.getByRole("button", { name: "בדיקה" }).click();
  await expect(page.locator("[data-verdict]")).not.toHaveAttribute("data-verdict", "correct");
}
