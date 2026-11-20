import { expect, test } from "@playwright/test";

/**
 * Synthetic Service Cartography pilot. Requires:
 *   MAPABLE_SERVICE_CARTOGRAPHY_PILOT=true
 *   MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY=true
 */
test.describe("Service Cartography synthetic pilot", () => {
  test("shows advisory community-visit options without booking controls", async ({
    page,
  }) => {
    const res = await page.goto("/pilot/service-cartography");
    expect(res?.status()).toBe(200);
    const disabled = await page
      .getByText("Pilot is disabled")
      .isVisible()
      .catch(() => false);
    test.skip(disabled, "Service Cartography pilot flag is off");

    await expect(
      page.getByRole("heading", { name: /Service Cartography/i }),
    ).toBeVisible();
    await expect(page.getByTestId("honesty-line")).toContainText("Public claim: none");
    await expect(page.getByTestId("honesty-line")).toContainText("isBooking=false");
    await expect(page.getByTestId("matching-status")).toContainText("advisory_options");
    await expect(page.getByTestId("ranked-options").locator("li")).toHaveCount(2);
    await expect(page.getByTestId("missing-dependencies")).toContainText(
      "personal-care-fallback",
    );
    await expect(page.getByRole("button", { name: /book/i })).toHaveCount(0);
  });

  test("simulate no-match fails closed and still is not a booking", async ({
    page,
  }) => {
    await page.goto("/pilot/service-cartography");
    const disabled = await page
      .getByText("Pilot is disabled")
      .isVisible()
      .catch(() => false);
    test.skip(disabled, "Service Cartography pilot flag is off");

    await page.getByTestId("run-failure-no_match").click();
    await expect(page.getByTestId("simulate-result")).toBeVisible({ timeout: 15_000 });
    const result = await page.getByTestId("simulate-result").innerText();
    expect(result).toMatch(/"blocked": true/);
    expect(result).toMatch(/no_verified_match/);
    expect(result).toMatch(/"isBooking": false/);
  });
});
