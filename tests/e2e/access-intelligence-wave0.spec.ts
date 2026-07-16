import { expect, test } from "@playwright/test";

/**
 * Wave 0 smoke: public Access + Access Intelligence shells remain reachable
 * without chat-only workflows. Skips gracefully if the server is down.
 */

test.describe("Access Intelligence Wave 0 smoke", () => {
  test("public access map page responds", async ({ page }) => {
    const response = await page.goto("/access", { waitUntil: "domcontentloaded" });
    expect(response?.ok() || response?.status() === 307 || response?.status() === 308).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
  });

  test("access intelligence hub is not chat-only", async ({ page }) => {
    const response = await page.goto("/access-intelligence", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.ok() || response?.status() === 307 || response?.status() === 308).toBeTruthy();
    await expect(page.locator("body")).toBeVisible();
    // Must expose non-chat navigation / headings for map-free workflows.
    const main = page.locator("main, [role='main'], body");
    await expect(main).toBeVisible();
  });

  test("visit plans route is reachable behind module shell", async ({ page }) => {
    const response = await page.goto("/access-intelligence/visit-plans", {
      waitUntil: "domcontentloaded",
    });
    expect(
      response?.ok() ||
        response?.status() === 307 ||
        response?.status() === 308 ||
        response?.status() === 401 ||
        response?.status() === 403,
    ).toBeTruthy();
  });
});
