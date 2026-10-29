import { readFileSync } from "node:fs";
import type { Exercise, Unit } from "@lingo/content-schema";
import { expect, type Page, test } from "@playwright/test";

const unit = JSON.parse(
  readFileSync(new URL("../public/content/en-for-he/units/a1-01-hello.json", import.meta.url), "utf8"),
) as Unit;
const exercises = new Map<string, Exercise>(unit.lessons.flatMap((l) => l.exercises.map((e) => [e.id, e] as const)));

/** Answers the exercise on screen correctly, using the course content. */
async function solve(page: Page, ex: Exercise) {
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

test("a new learner picks English and finishes the first lesson offline-first", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/start$/);
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await expect(page).toHaveURL(/\/lesson\/en-for-he\/en-u1-l1$/);

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
  expect(mistakes).toBe(0);
  await expect(page.getByText("100%")).toBeVisible();

  // Progress survives a reload: it lives in IndexedDB.
  await page.getByRole("link", { name: "למסך הבית" }).click();
  await expect(page.getByRole("link", { name: /להמשיך: מילות נימוס/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: /להמשיך: מילות נימוס/ })).toBeVisible();

  // The course map shows the first lesson as done and opens the second.
  await page.getByRole("link", { name: "מפת הקורס" }).click();
  await expect(page.getByText(/ברכות/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /מילות נימוס/ })).toBeVisible();
});

test("a wrong answer shows the correct one and comes back later", async ({ page }) => {
  await page.goto("/start");
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /קליל/ }).click();
  await expect(page.locator("[data-exercise]")).toHaveAttribute("data-exercise", "en-u1-l1-e1");
  await page.getByRole("button", { name: "Goodbye" }).click();
  await page.getByRole("button", { name: "בדיקה" }).click();
  await expect(page.getByText("התשובה הנכונה:")).toBeVisible();
  await expect(page.getByText("Hello", { exact: true }).last()).toBeVisible();
});
