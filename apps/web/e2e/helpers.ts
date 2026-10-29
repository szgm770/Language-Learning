import { readFileSync } from "node:fs";
import type { Exercise, Unit } from "@lingo/content-schema";
import { expect, type Page } from "@playwright/test";

const unit = JSON.parse(
  readFileSync(new URL("../public/content/en-for-he/units/a1-01-hello.json", import.meta.url), "utf8"),
) as Unit;
const exercises = new Map<string, Exercise>(unit.lessons.flatMap((l) => l.exercises.map((e) => [e.id, e] as const)));
/** Answers the exercise on screen correctly, using the course content. */
export async function solve(page: Page, ex: Exercise) {
  switch (ex.type) {
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
        await page.locator('[dir="ltr"]').nth(1).getByRole("button", { name: w, exact: true }).first().click();
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
export async function finishLesson(page: Page): Promise<number> {
  let mistakes = 0;
  for (let step = 0; step < 30; step++) {
    const stage = page.locator("[data-exercise]");
    const done = page.getByRole("heading", { name: "השיעור הושלם" });
    await expect(stage.or(done)).toBeVisible();
    if (await done.isVisible()) break;
    const id = (await stage.getAttribute("data-exercise"))!;
    await solve(page, exercises.get(id)!);
    const status = page.getByRole("status").first();
    await expect(status).toBeVisible();
    if (!(await status.textContent())?.startsWith("נכון")) mistakes++;
    await page.getByRole("button", { name: "המשך" }).click();
  }
  await expect(page.getByRole("heading", { name: "השיעור הושלם" })).toBeVisible();
  return mistakes;
}
