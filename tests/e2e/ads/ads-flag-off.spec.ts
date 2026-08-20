import { expect, test } from "@playwright/test";

/**
 * Flag-off acceptance: Access and Provider Finder must behave without ads UI.
 * Run with production-like flags (default false).
 */
test.describe("MapAble Ads rollback / flag-off", () => {
  test("Access has no sponsored disclosure when ads disabled", async ({
    page,
  }) => {
    await page.goto("/access");
    await expect(page.getByRole("heading", { name: /MapAble Access/i })).toBeVisible();
    await expect(page.locator("[data-ads-disclosure='sponsored']")).toHaveCount(
      0,
    );
    await expect(page.locator("[data-ads-kind='sponsored-card']")).toHaveCount(
      0,
    );
  });

  test("Provider Finder organic results render without sponsored slot when disabled", async ({
    page,
  }) => {
    await page.goto("/provider-finder");
    await expect(
      page.locator("[data-ads-disclosure='sponsored']"),
    ).toHaveCount(0);
  });
});
