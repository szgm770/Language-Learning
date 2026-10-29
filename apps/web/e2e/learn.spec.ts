import { expect, test } from "@playwright/test";
import { finishLesson } from "./helpers";

test("a new learner picks English and finishes the first lesson offline-first", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/start$/);
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await expect(page).toHaveURL(/\/lesson\/en-for-he\/en-u1-l1$/);

  const mistakes = await finishLesson(page);
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
