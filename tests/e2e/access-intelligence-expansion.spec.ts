import { expect, test } from "@playwright/test";

test.describe("Access Intelligence expansion", () => {
  test("legacy /verify-my-venue redirects to /verify", async ({ page }) => {
    const response = await page.goto("/verify-my-venue", {
      waitUntil: "commit",
    });
    expect(response?.status()).toBe(308);
    expect(page.url()).toContain("/verify");
  });

  test("access intelligence hub loads", async ({ page }) => {
    await page.goto("/access-intelligence");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("reliability page loads", async ({ page }) => {
    await page.goto("/access-intelligence/reliability");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("missions page loads", async ({ page }) => {
    await page.goto("/access-intelligence/missions");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("mapper page loads", async ({ page }) => {
    await page.goto("/access/mapper");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("verify guides page loads", async ({ page }) => {
    await page.goto("/verify/guides");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
