import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Public PBS page must remain accessible even when the module flag is off.
 * Clinical flows are flag-gated and covered by unit tests for access control.
 */
test.describe("Positive Behaviour Support a11y", () => {
  test("public landing meets axe WCAG 2.2 AA critical/serious", async ({
    page,
  }) => {
    await page.goto("/positive-behaviour-support");
    await expect(
      page.getByRole("heading", {
        name: /MapAble Positive Behaviour Support/i,
      }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
