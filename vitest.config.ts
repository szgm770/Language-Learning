import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/*/src/**/*.test.ts", "apps/web/src/**/*.test.ts"],
    alias: { "@/": new URL("./apps/web/src/", import.meta.url).pathname },
    environment: "node",
  },
});
