import { expect, test } from "@playwright/test";
import { answerWrong, exercises, finishLesson, solve } from "./helpers";

test("a new learner picks English and finishes the first lesson offline-first", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "שפה חדשה, בעברית פשוטה." })).toBeVisible();
  await page.getByRole("link", { name: "להתחיל ללמוד בחינם" }).click();
  await expect(page).toHaveURL(/\/start\/$/);
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  await expect(page).toHaveURL(/\/lesson\/en-for-he\/u00a-l1\/$/);

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
  await expect(page.getByRole("link", { name: /האותיות I–Q/ })).toBeVisible();
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
  await page.goto("lesson/en-for-he/u1-l1/");
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
  const current = async () => exercises.get((await page.locator("[data-exercise]").getAttribute("data-exercise"))!, page)!;
  // The A0 level probe (letters and sounds) is answered correctly, so placement moves on to A1.
  for (let q = 0; q < 4; q++) {
    const ex = await current();
    expect(ex.id.startsWith("a0-t")).toBe(true);
    await solve(page, ex);
    await expect(page.locator("[data-verdict]")).toHaveAttribute("data-verdict", "correct");
    await page.getByRole("button", { name: "המשך" }).click();
  }
  // Miss two questions of the A1 level probe: placement goes through A1 unit by unit.
  for (let q = 0; q < 2; q++) {
    await answerWrong(page, await current());
    await page.getByRole("button", { name: "המשך" }).click();
  }
  // Unit 1 right (two questions), then miss the first unit 2 question.
  for (let q = 0; q < 2; q++) {
    const ex = await current();
    expect(ex.id.startsWith("u1")).toBe(true);
    await solve(page, ex);
    await expect(page.locator("[data-verdict]")).toHaveAttribute("data-verdict", "correct");
    await page.getByRole("button", { name: "המשך" }).click();
  }
  const ex = await current();
  expect(ex.id.startsWith("u2")).toBe(true);
  await answerWrong(page, ex);
  await page.getByRole("button", { name: "המשך" }).click();
  await expect(page.getByRole("heading", { name: "מתחילים מיחידה 5" })).toBeVisible();
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
  await expect(page).toHaveURL(/\/lesson\/en-for-he\/u00a-l1\/$/);
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

test("progress moves to another device: a code, a typed code, or a place chosen by hand", async ({ page }) => {
  await page.goto("start/");
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  await expect(page.locator("[data-exercise]")).toBeVisible();

  // Choose the place by hand: unit 4 (the first A1 unit follows the three A0 units).
  await page.goto("settings/");
  await page.getByRole("button", { name: "בחירת מקום ידנית" }).click();
  await page.getByLabel("יחידה").selectOption({ index: 5 });
  await page.getByRole("button", { name: "להמשיך מכאן" }).click();
  await expect(page.getByText(/ההתקדמות הועברה/)).toBeVisible();

  // The code now points at that lesson, and shows as a QR.
  await page.getByRole("button", { name: "הצגת הקוד שלי" }).click();
  await expect(page.getByTestId("transfer-code")).toHaveText("lingo1.en-for-he.u3-l1");
  await expect(page.getByRole("img", { name: /קוד QR/ })).toBeVisible();

  // A typed code from another device; a wrong one is refused.
  await page.getByRole("button", { name: "הקלדת קוד" }).click();
  await page.getByLabel("הקוד מהמכשיר הישן").fill("hello");
  await page.getByRole("button", { name: "להעביר" }).click();
  await expect(page.getByText(/הקוד לא תקין/)).toBeVisible();
  await page.getByLabel("הקוד מהמכשיר הישן").fill("lingo1.en-for-he.u5-l1");
  await page.getByRole("button", { name: "להעביר" }).click();
  await expect(page.getByText(/ההתקדמות הועברה/)).toBeVisible();
  await page.getByRole("button", { name: "הצגת הקוד שלי" }).click();
  await expect(page.getByTestId("transfer-code")).toHaveText("lingo1.en-for-he.u5-l1");

  // The camera is not available in the test browser: the scanner says so and offers the other ways.
  await page.getByRole("button", { name: "סריקת קוד" }).click();
  await expect(page.getByText(/אין גישה למצלמה/)).toBeVisible();

  // The learning path continues from there.
  await page.goto("learn/");
  await page.getByRole("link", { name: /^(להמשיך|להתחיל)$/ }).click();
  await expect(page).toHaveURL(/\/lesson\/en-for-he\/u5-l1\/$/);
});

test("exam practice: the Amirnet lessons open from the exams page and show reading passages", async ({ page }) => {
  await page.goto("exams/");
  await expect(page.getByRole("heading", { name: "אימון לאמירנט" })).toBeVisible();
  await page.getByRole("link", { name: /הבנת הנקרא/ }).first().click();
  await expect(page).toHaveURL(/\/lesson\/en-amirnet\/exam-1-c\/$/);
  await expect(page.getByText(/printing press/)).toBeVisible();
  const mistakes = await finishLesson(page);
  expect(mistakes).toBe(0);
});

test("alphabet cards stay out of the word list, and practice pages open", async ({ page }) => {
  await page.goto("start/");
  await page.getByRole("button", { name: /אנגלית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  await page.getByRole("button", { name: "המשך" }).click();
  await expect(page.getByText("אות חדשה")).toBeVisible();
  await finishLesson(page);
  await page.goto("words/");
  await expect(page.getByText("אין כאן מילים")).toBeVisible();
  await page.goto("achievements/");
  await expect(page.getByText("ההישגים שלי")).toBeVisible();
  await page.goto("review/en-for-he/?mode=weak");
  await expect(page.getByText("אין כרגע מילים חלשות")).toBeVisible();
});

test("Spanish can be started from zero", async ({ page }) => {
  await page.goto("start/");
  await page.getByRole("button", { name: /ספרדית/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  await expect(page).toHaveURL(/\/lesson\/es-for-he\/u00a-l1\/$/);
});

for (const id of ["u01-l2", "u02-l1", "u02-l3", "u03-l1", "u03-l3", "u04-l1", "u04-l3", "u05-l1", "u05-l3", "u06-l1", "u06-l3", "u07-l1", "u07-l3", "u08-l1", "u08-l3", "u09-l1", "u09-l3", "u10-l1", "u10-l3", "a1-test", "u11-l1", "u11-l3", "u12-l1", "u12-l3", "u13-l1", "u13-l3", "u14-l1", "u14-l3", "u15-l1", "u15-l3", "u16-l1", "u16-l3", "u17-l1", "u17-l3", "u18-l1", "u18-l3", "u19-l1", "u19-l3", "u20-l1", "u20-l3", "a2-test", "u21-l1", "u21-l3", "u21-review", "u22-l3", "u22-review", "u23-l1", "u23-l3", "u24-l1", "u24-l3", "u24-review", "u25-l1", "u25-l3", "u25-review", "u26-l1", "u26-l3", "u26-review", "u27-l1", "u27-l3", "u27-review", "u28-l1", "u28-l3", "u28-review", "u29-l1", "u29-l3", "u29-review", "u30-l1", "u30-l3", "u30-review", "b1-test", "u31-l1", "u31-l3", "u31-review", "u32-l1", "u32-l3", "u32-review", "u33-l1", "u33-l3", "u33-review", "u34-l1", "u34-l3", "u34-review", "u35-l1", "u35-l3", "u35-review", "u36-l1", "u36-l3", "u36-review", "u37-l1", "u37-l3", "u37-review", "u38-l1", "u38-l3", "u38-review", "u39-l1", "u39-l3", "u39-review", "u40-l1", "u40-l3", "u40-review", "b2-test", "u41-l1", "u41-l3", "u41-review", "u42-l1", "u42-l3", "u42-review", "u43-l1", "u43-l3", "u43-review", "u44-l1", "u44-l3", "u44-review", "u45-l1", "u45-l3", "u45-review", "u46-l1", "u46-l3", "u46-review", "c1-test", "p1-l1", "p1-l3", "p2-l1", "p2-l3", "p3-l1", "p3-l3", "p4-l1", "p4-l3", "p5-l1", "p5-l3", "p6-l1", "p6-l3"]) {
  test(`Spanish lesson ${id} can be solved from the content`, async ({ page }) => {
    await page.goto(`lesson/es-for-he/${id}/`);
    await finishLesson(page);
  });
}

test("Yiddish can be started from zero", async ({ page }) => {
  await page.goto("start/");
  await page.getByRole("button", { name: /יידיש/ }).click();
  await page.getByRole("button", { name: /רגיל/ }).click();
  await page.getByRole("button", { name: /מאפס/ }).click();
  await expect(page).toHaveURL(/\/lesson\/yi-for-he\/u00a-l1\/$/);
});

for (const id of ["u00a-l1", "u00a-review", "u00b-l1", "u00b-l2", "u00b-l3", "u00b-review", "u00c-l1", "u00c-l2", "u00c-review", "u01-l1", "u01-l2", "u01-review", "u02-l1", "u02-l2", "u02-review"]) {
  test(`Yiddish lesson ${id} can be solved from the content`, async ({ page }) => {
    await page.goto(`lesson/yi-for-he/${id}/`);
    await finishLesson(page);
  });
}
