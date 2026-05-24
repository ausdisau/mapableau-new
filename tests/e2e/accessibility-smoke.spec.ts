import { test, expect } from "@playwright/test";

test.describe("accessibility smoke", () => {
  test.skip(!process.env.PLAYWRIGHT_BASE_URL && !process.env.CI, "Set PLAYWRIGHT_BASE_URL or run with webServer");

  test("home has main landmark", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main, [role=main]").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
