import { readFileSync } from "node:fs";
import type { Exercise, Unit } from "@lingo/content-schema";
import { expect, type Page } from "@playwright/test";

const read = <T,>(path: string) => JSON.parse(readFileSync(new URL(`../public/content/${path}`, import.meta.url), "utf8")) as T;
const units = read<{ units: { id: string }[] }>("en-for-he/manifest.json").units.map((u) => read<Unit>(`en-for-he/units/${u.id}.json`));
export const exercises = new Map<string, Exercise>(units.flatMap((u) => u.lessons.flatMap((l) => l.exercises.map((e) => [e.id, e] as const))));
/** Answers the exercise on screen correctly, using the course content. */
export async function solve(page: Page, ex: Exercise) {
  switch (ex.type) {
    case "learn":
    case "dialogue":
    case "tip":
      await page.getByRole("button", { name: /^(הבנתי|המשך)$/ }).click();
      return "seen";
    case "dialogue_gap":
      await page.locator("[data-exercise] .choice").filter({ hasText: ex.lines[ex.gap]!.text }).first().click();
      break;
    case "multiple_choice":
    case "listening_choice":
      await page.getByRole("button", { name: ex.options[ex.correct]!, exact: false }).first().click();
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
        await page.locator("[data-bank]").getByRole("button", { name: w, exact: true }).first().click();
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
    if ((await solve(page, exercises.get(id)!)) === "seen") continue;
    const status = page.locator("[data-verdict]");
    await expect(status).toBeVisible();
    if ((await status.getAttribute("data-verdict")) !== "correct") mistakes++;
    await page.getByRole("button", { name: "המשך" }).click();
  }
  await expect(page.getByRole("heading", { name: DONE })).toBeVisible();
  return mistakes;
}
