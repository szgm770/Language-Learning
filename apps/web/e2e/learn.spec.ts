import { expect, test } from "@playwright/test";
import { exercises, finishLesson, solve } from "./helpers";

test("a new learner picks English and finishes the first lesson offline-first", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "שפה חדשה, בעברית פשוטה." })).toBeVisible();
  await page.getByRole("link", { name: "להתחיל ללמוד בחינם" }).click();
  await expect(page).toHaveURL(/\/start\/$/);
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  await expect(page).toHaveURL(/\/lesson\/en-for-he\/u1-l1\/$/);

  const mistakes = await finishLesson(page);
  expect(mistakes).toBe(0);
  await expect(page.getByText("100%")).toBeVisible();

  // Progress survives a reload: it lives in IndexedDB.
  await page.getByRole("link", { name: "למסך הבית" }).click();
  await expect(page).toHaveURL(/\/learn\/$/);
  await expect(page.getByRole("link", { name: /להמשיך|להתחיל/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("link", { name: /להמשיך|להתחיל/ })).toBeVisible();

  // The course map shows the first lesson as done and opens the second.
  await page.getByRole("link", { name: "המסלול" }).click();
  await expect(page.getByRole("link", { name: /בוקר טוב, ותודה/ })).toBeVisible();
});

test("the landing page has a working sample exercise", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Good morning" }).click();
  await expect(page.getByText("נכון! ככה נראה כל תרגיל.")).toBeVisible();
  await page.getByRole("link", { name: "להמשיך לשיעור הראשון" }).click();
  await expect(page).toHaveURL(/\/start\/$/);
});

test("returning learners skip the landing page", async ({ page }) => {
  await page.goto("start/");
  await page.getByRole("button", { name: /ספרדית/ }).click();
  await page.getByRole("button", { name: /קליל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  await expect(page.locator("[data-exercise]")).toBeVisible();
  await page.goto("./");
  await expect(page).toHaveURL(/\/learn\/$/);
  await expect(page.getByText(/לומדים ספרדית/)).toBeVisible();
});

test("a wrong answer shows the correct one and comes back later", async ({ page }) => {
  await page.goto("start/");
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /קליל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  for (const step of ["u1-l1-01", "u1-l1-02", "u1-l1-03"]) {
    await expect(page.locator("[data-exercise]")).toHaveAttribute("data-exercise", step);
    await page.getByRole("button", { name: /^(הבנתי|המשך)$/ }).click();
  }
  await expect(page.locator("[data-exercise]")).toHaveAttribute("data-exercise", "u1-l1-04");
  await page.getByRole("button", { name: "Goodbye" }).click();
  await page.getByRole("button", { name: "בדיקה" }).click();
  await expect(page.getByText("התשובה הנכונה:")).toBeVisible();
  await expect(page.getByText("Hello", { exact: true }).last()).toBeVisible();
});

test("lessons keep working without internet once the site was opened", async ({ page, context }) => {
  await page.goto("start/");
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  await expect(page.locator("[data-exercise]")).toBeVisible();
  // Wait until the service worker controls the page, then visit the pages once more so they are cached.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect(page.locator("[data-exercise]")).toBeVisible();
  await page.goto("learn/");
  const go = page.getByRole("link", { name: /^(להמשיך|להתחיל)$/ });
  await expect(go).toBeVisible();

  await context.setOffline(true);
  await page.reload();
  await expect(go).toBeVisible();
  await go.click();
  await expect(page.locator("[data-exercise]")).toBeVisible();
  await context.setOffline(false);
});

test("the placement test skips units the learner already knows", async ({ page }) => {
  await page.goto("start/");
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await page.getByRole("button", { name: /כבר יודע/ }).click();
  await expect(page).toHaveURL(/\/placement\/en-for-he\/$/);
  // Answer unit 1 correctly (two questions), then miss the first unit 2 question.
  for (let q = 0; q < 2; q++) {
    const id = (await page.locator("[data-exercise]").getAttribute("data-exercise"))!;
    await solve(page, exercises.get(id)!);
    await expect(page.locator("[data-verdict]")).toHaveAttribute("data-verdict", "correct");
    await page.getByRole("button", { name: "המשך" }).click();
  }
  const ex = exercises.get((await page.locator("[data-exercise]").getAttribute("data-exercise"))!)!;
  expect(ex.id.startsWith("u2")).toBe(true);
  if (ex.type === "fill_blank" && ex.options) await page.getByRole("button", { name: ex.options.find((o) => !ex.answers.includes(o))!, exact: true }).click();
  else if (ex.type === "multiple_choice") await page.locator("[data-exercise] .choice").nth(ex.correct === 0 ? 1 : 0).click();
  else await page.getByRole("textbox").fill("wrong answer");
  await page.getByRole("button", { name: "בדיקה" }).click();
  await page.getByRole("button", { name: "המשך" }).click();
  await expect(page.getByRole("heading", { name: "מתחילים מיחידה 2" })).toBeVisible();
  await page.getByRole("link", { name: "להתחיל ללמוד" }).click();
  await expect(page).toHaveURL(/\/lesson\/en-for-he\/u2-l1\/$/);
});

test("a returning learner opening the site (service worker active) lands on the dashboard", async ({ page }) => {
  await page.goto("start/");
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  await expect(page.locator("[data-exercise]")).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect(page.locator("[data-exercise]")).toBeVisible();
  await page.goto("./");
  await expect(page).toHaveURL(/\/learn\/$/, { timeout: 10_000 });
});

test("passing the A1 level test unlocks a printable certificate", async ({ page }) => {
  await page.goto("start/");
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  await expect(page).toHaveURL(/\/lesson\/en-for-he\/u1-l1\/$/);
  await page.goto("certificate/en-for-he/");
  await expect(page.getByText(/התעודה נפתחת אחרי מבחן הרמה/)).toBeVisible();

  await page.goto("lesson/en-for-he/a1-test/");
  expect(await finishLesson(page)).toBe(0);
  await expect(page.getByRole("heading", { name: "עברתם את מבחן הרמה!" })).toBeVisible();
  await page.getByRole("link", { name: "לתעודה שלי" }).click();
  await expect(page).toHaveURL(/\/certificate\/en-for-he\/$/);
  await expect(page.getByText("תעודת סיום")).toBeVisible();
  await expect(page.getByRole("heading", { name: "השם שלכם" })).toBeVisible();
});
