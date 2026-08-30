import { expect, test } from "@playwright/test";

import {
  expectMainLandmark,
  expectNoSeriousAxe,
  expectVisibleFocus,
  settle,
} from "./helpers/auth-a11y";

test.describe("unified participant UI", () => {
  test("participant controls are explicit and axe-clean", async ({ page }) => {
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await settle(page);

    await expectMainLandmark(page);
    await expect(page.getByRole("heading", { name: /Today/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /My Access/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Need help\?/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Review sharing/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get human support/i })).toBeVisible();
    await expectNoSeriousAxe(page, "/my");
  });

  test("keyboard focus remains visible on participant actions", async ({ page }) => {
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await settle(page);
    await expectVisibleFocus(page);

    const reviewSharing = page.getByRole("link", { name: /Review sharing/i });
    await reviewSharing.focus();
    await expect(reviewSharing).toBeFocused();
  });

  test("dashboard reflows at 200 and 400 percent equivalent widths", async ({ page }) => {
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await settle(page);

    for (const width of [640, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole("heading", { name: /Today/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /My Access/i })).toBeVisible();
      await expect(page.getByRole("heading", { name: /Need help\?/i })).toBeVisible();

      const overflowX = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 40,
      );
      expect
        .soft(overflowX, `excessive horizontal overflow at width=${width}`)
        .toBeFalsy();
    }
  });

  test("reduced motion does not hide critical controls", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await settle(page);

    await expect(page.getByRole("link", { name: /Review sharing/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get human support/i })).toBeVisible();
  });
});
