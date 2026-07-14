import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Smoke a11y checks for public Academy surfaces.
 * Requires a running app (`pnpm dev`) and seeded Foundations course.
 */
test.describe("MapAble Academy public a11y smoke", () => {
  test("catalogue has no serious or critical axe violations", async ({
    page,
  }) => {
    await page.goto("/academy/catalogue");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(serious).toEqual([]);
  });
});
