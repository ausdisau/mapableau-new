import { test, expect } from "@playwright/test";

test.describe("MapAble Go a11y shell", () => {
  test("go page renders disabled or planner heading", async ({ page }) => {
    await page.goto("/go");
    await expect(
      page.getByRole("heading", { name: /MapAble Go/i }),
    ).toBeVisible();
  });

  test("keyboard can focus primary controls when enabled", async ({ page }) => {
    await page.goto("/go");
    const search = page.getByRole("search");
    if (await search.isVisible()) {
      await page.keyboard.press("Tab");
      const focused = page.locator(":focus");
      await expect(focused).toBeVisible();
    }
  });
});
