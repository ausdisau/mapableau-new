import { test, expect } from "@playwright/test";

import { settle } from "./helpers/auth-a11y";

test.describe("My MapAble public surfaces", () => {
  test("personal-agency explainer is public", async ({ page }) => {
    await page.goto("/personal-agency");
    await expect(
      page.getByRole("heading", { name: /My MapAble/i, level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/Being developed/i)).toBeVisible();
  });

  test("unauthenticated /my redirects to login", async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await settle(page);
    expect(new URL(page.url()).pathname).toMatch(/^\/login/);
    await context.close();
  });
});

test.describe("My MapAble authenticated shell", () => {
  // Storage state comes from playwright project `my-mapable` (participant.json).
  test("my home or login gate renders for participant session", async ({
    page,
  }) => {
    await page.goto("/my");
    await settle(page);
    const path = new URL(page.url()).pathname;
    if (path.startsWith("/login")) {
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      return;
    }
    await expect(
      page.getByRole("heading", { name: /My MapAble/i }),
    ).toBeVisible();
  });
});
