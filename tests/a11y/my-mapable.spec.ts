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
  test.skip(
    !process.env.A11Y_PARTICIPANT_STORAGE,
    "Requires seeded participant storage state",
  );

  test.use({ storageState: process.env.A11Y_PARTICIPANT_STORAGE });

  test("my home renders when flag-enabled in preview", async ({ page }) => {
    await page.goto("/my");
    await expect(
      page.getByRole("heading", { name: /My MapAble/i }),
    ).toBeVisible();
  });
});
