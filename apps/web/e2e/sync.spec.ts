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

/** Prints the browser's console and what is on screen, so CI failures can be read from the log. */
function watch(page: Page, name: string) {
  page.on("console", (m) => console.log(`[${name} console.${m.type()}] ${m.text()}`));
  page.on("pageerror", (e) => console.log(`[${name} pageerror] ${e.message}`));
  page.on("requestfailed", (r) => console.log(`[${name} requestfailed] ${r.url()} ${r.failure()?.errorText}`));
}

async function synced(page: Page) {
  // After sign-in the app is already on its way to /settings; a second navigation would cancel it.
  if (!new URL(page.url()).pathname.startsWith("/settings")) await page.goto("/settings");
  try {
    await expect(page.getByText(`מחוברים בתור`)).toBeVisible({ timeout: 15_000 });
  } catch (err) {
    console.log("[screen]", await page.locator("body").innerText());
    throw err;
  }
  await page.getByRole("button", { name: "לסנכרן עכשיו" }).click();
  await expect(page.getByText("הכל מסונכרן")).toBeVisible({ timeout: 20_000 });
}

test("progress follows the learner to a new device and survives clearing it", async ({ browser }) => {
  test.skip(test.info().project.name !== "desktop", "one browser is enough");
  // Device A: learn as a guest, then create an account. The guest progress joins the account.
  const a = await (await browser.newContext()).newPage();
  watch(a, "A");
  await a.goto("/start");
  await a.getByRole("button", { name: /אנגלית/ }).click();
  await a.getByRole("button", { name: /רגיל/ }).click();
  expect(await finishLesson(a)).toBe(0);
  await a.goto("/login");
  await a.getByRole("button", { name: /יצירת חשבון/ }).click();
  await a.getByLabel("מייל").fill(email);
  await a.getByLabel("סיסמה").fill(password);
  await a.getByRole("button", { name: "יצירת חשבון", exact: true }).click();
  await expect(a).toHaveURL(/\/settings$/, { timeout: 15_000 }).catch(async (err) => {
    console.log("[A after sign-up]", await a.locator("body").innerText());
    throw err;
  });
  await synced(a);

  // Device B: a fresh browser signs in and gets everything from the cloud.
  const b = await (await browser.newContext()).newPage();
  watch(b, "B");
  await b.goto("/login");
  await b.getByLabel("מייל").fill(email);
  await b.getByLabel("סיסמה").fill(password);
  await b.getByRole("button", { name: "התחברות", exact: true }).click();
  await expect(b).toHaveURL(/\/settings$/, { timeout: 15_000 });
  await synced(b);
  await b.goto("/");
  await expect(b.getByRole("link", { name: /להמשיך: מילות נימוס/ })).toBeVisible();

  // Clearing device B removes only its local copy; the next sync brings everything back.
  await b.goto("/settings");
  await b.getByRole("button", { name: "מחיקת הנתונים מהמכשיר הזה" }).click();
  await b.getByRole("button", { name: "למחוק מהמכשיר" }).click();
  await expect(b).not.toHaveURL(/\/settings$/); // the app reloads at the home screen
  await synced(b);
  await b.goto("/");
  await expect(b.getByRole("link", { name: /להמשיך: מילות נימוס/ })).toBeVisible();

  // And device A still sees its progress after syncing with the cloud again.
  await synced(a);
  await a.goto("/");
  await expect(a.getByRole("link", { name: /להמשיך: מילות נימוס/ })).toBeVisible();
});
