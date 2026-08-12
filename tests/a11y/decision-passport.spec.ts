import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility checks for the synthetic Decision Passport shell.
 * Automated axe is not lived-experience evidence.
 */
test.describe("Decision Passport panel (axe + keyboard)", () => {
  test("fixture page is axe-clean and keyboard-operable", async ({ page }) => {
    const response = await page.goto("/navigator/pilot/decision-passport", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);

    const panel = page.getByTestId("decision-passport-panel");
    await expect(panel).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /your provider search summary/i }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include('[data-testid="decision-passport-panel"]')
      .withTags([
        "wcag2a",
        "wcag2aa",
        "wcag21a",
        "wcag21aa",
        "wcag22aa",
      ])
      .analyze();

    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);

    await page.getByTestId("decision-passport-request-human").focus();
    await expect(page.getByTestId("decision-passport-request-human")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(
      page.getByTestId("decision-passport-continue-non-ai"),
    ).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(
      page.getByTestId("decision-passport-withdraw-consent"),
    ).toBeFocused();
  });
});
