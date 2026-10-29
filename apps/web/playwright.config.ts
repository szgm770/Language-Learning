import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
// Same sub-path as the build (GitHub Pages serves the site under /<repo>/).
const base = process.env.PAGES_BASE_PATH ?? "";

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  use: { baseURL: `http://localhost:${port}${base}/`, locale: "he-IL", timezoneId: "Asia/Jerusalem" },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: { command: "node e2e/serve.mjs", port, reuseExistingServer: false, timeout: 30_000 },
});
