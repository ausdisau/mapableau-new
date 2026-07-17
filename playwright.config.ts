import { defineConfig, devices } from "@playwright/test";

/**
 * Browser suites:
 * - tests/a11y — accessibility route shells (CI: `pnpm test:a11y`)
 * - tests/e2e — Access Intelligence Wave 0+ smoke (`pnpm test:e2e`)
 */
export default defineConfig({
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  timeout: 60_000,
  webServer: process.env.PLAYWRIGHT_WEB_SERVER
    ? {
        command: process.env.PLAYWRIGHT_WEB_SERVER,
        url: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
  projects: [
    {
      name: "a11y-chromium",
      testDir: "tests/a11y",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "e2e-chromium",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
