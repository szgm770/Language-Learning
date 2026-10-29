/**
 * Cloud sync end to end, against the Firebase emulators (set E2E_FIREBASE=1).
 * The promise being tested: progress made on one device reaches another, and clearing a device
 * never removes anything from the cloud.
 */
import { expect, type Page, test } from "@playwright/test";
import { finishLesson } from "./helpers";

test.skip(!process.env.E2E_FIREBASE, "needs the Firebase emulators");

const email = `learner-${Date.now()}@example.com`;
const password = "correct-horse-42";

async function synced(page: Page) {
  await page.goto("/settings");
  await expect(page.getByText(`מחוברים בתור`)).toBeVisible();
  await page.getByRole("button", { name: "לסנכרן עכשיו" }).click();
  await expect(page.getByText("הכל מסונכרן")).toBeVisible({ timeout: 20_000 });
}

test("progress follows the learner to a new device and survives clearing it", async ({ browser }) => {
  test.skip(test.info().project.name !== "desktop", "one browser is enough");
  // Device A: learn as a guest, then create an account. The guest progress joins the account.
  const a = await (await browser.newContext()).newPage();
  await a.goto("/start");
  await a.getByRole("button", { name: /אנגלית/ }).click();
  await a.getByRole("button", { name: /רגיל/ }).click();
  expect(await finishLesson(a)).toBe(0);
  await a.goto("/login");
  await a.getByRole("button", { name: /יצירת חשבון/ }).click();
  await a.getByLabel("מייל").fill(email);
  await a.getByLabel("סיסמה").fill(password);
  await a.getByRole("button", { name: "יצירת חשבון", exact: true }).click();
  await synced(a);

  // Device B: a fresh browser signs in and gets everything from the cloud.
  const b = await (await browser.newContext()).newPage();
  await b.goto("/login");
  await b.getByLabel("מייל").fill(email);
  await b.getByLabel("סיסמה").fill(password);
  await b.getByRole("button", { name: "התחברות", exact: true }).click();
  await synced(b);
  await b.goto("/");
  await expect(b.getByRole("link", { name: /להמשיך: מילות נימוס/ })).toBeVisible();

  // Clearing device B removes only its local copy; the next sync brings everything back.
  await b.goto("/settings");
  await b.getByRole("button", { name: "מחיקת הנתונים מהמכשיר הזה" }).click();
  await b.getByRole("button", { name: "למחוק מהמכשיר" }).click();
  await synced(b);
  await b.goto("/");
  await expect(b.getByRole("link", { name: /להמשיך: מילות נימוס/ })).toBeVisible();

  // And device A still sees its progress after syncing with the cloud again.
  await synced(a);
  await a.goto("/");
  await expect(a.getByRole("link", { name: /להמשיך: מילות נימוס/ })).toBeVisible();
});
