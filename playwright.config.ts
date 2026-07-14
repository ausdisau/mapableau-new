import { defineConfig, devices } from "@playwright/test";

/**
 * Academy a11y/E2E scaffolding. Run after `pnpm exec playwright install`.
 * Full vertical-slice coverage is tracked in tests/academy/e2e/README.ts.
 */
export default defineConfig({
  testDir: "tests/academy/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
