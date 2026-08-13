import { expect, test } from "@playwright/test";

import {
  expectMainLandmark,
  expectNoSeriousAxe,
  settle,
} from "./helpers/auth-a11y";

/**
 * Requires AaI flags on the app server (CI Accessibility workflow sets them):
 * MAPABLE_ACCESS_INFRASTRUCTURE_ENABLED, MAPABLE_ACCESS_PASSPORT_ENABLED,
 * and optionally capabilities/compatibility for place panels.
 */
test.describe("My Access passport (flags on)", () => {
  test.beforeEach(async ({ page }) => {
    const response = await page.goto("/my-access", {
      waitUntil: "domcontentloaded",
    });
    expect(response, "navigation to /my-access").not.toBeNull();
    await settle(page);
  });

  test("renders My Access (not redirected) and passes axe", async ({
    page,
  }) => {
    expect(new URL(page.url()).pathname).toBe("/my-access");
    await expect(page.getByRole("heading", { name: "My Access" })).toBeVisible();
    await expectMainLandmark(page);
    await expectNoSeriousAxe(page, "/my-access");
  });

  test("keyboard: sharing save and first-run or add controls are reachable", async ({
    page,
  }) => {
    await expect(page.getByRole("button", { name: "Save sharing" })).toBeVisible();

    const firstRun = page.getByRole("heading", {
      name: "Start with 3 common needs",
    });
    if (await firstRun.isVisible().catch(() => false)) {
      const addStepFree = page.getByRole("button", {
        name: /Add Step-free access/i,
      });
      await addStepFree.focus();
      await expect(addStepFree).toBeFocused();
      return;
    }

    const addButton = page.getByRole("button", { name: "Add to My Access" });
    await addButton.focus();
    await expect(addButton).toBeFocused();
  });

  test("remove requires confirm", async ({ page }) => {
    const remove = page.getByRole("button", { name: "Remove" }).first();
    if (!(await remove.isVisible().catch(() => false))) {
      test.skip(true, "No existing requirements to remove");
      return;
    }
    await remove.click();
    await expect(
      page.getByRole("button", { name: "Confirm remove" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("button", { name: "Confirm remove" }),
    ).toHaveCount(0);
  });
});
