import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Gated Marketplace evidence preview", () => {
  test("authenticated participant can search and compare without reaching payment", async ({ page }) => {
    await page.goto("/marketplace/browse/evidence-preview");
    await expect(page.getByRole("heading", { name: "Better information before you buy." })).toBeVisible();
    await expect(page.getByText(/All listings, suppliers and prices are synthetic/)).toBeVisible();

    await page.getByRole("searchbox", { name: "Search examples" }).fill("AAC");
    await expect(page.getByText(/2 synthetic example listings shown/)).toBeVisible();

    await page.getByRole("button", { name: "Compare Portable communication board" }).click();
    await expect(page.getByRole("table", { name: /Side-by-side evidence/ })).toBeVisible();

    const specialist = page.getByRole("button", { name: "Tablet and access-switch mount needs specialist review" });
    await expect(specialist).toBeDisabled();
    await expect(page.getByRole("button", { name: "Download local text draft" })).toBeDisabled();

    await page.getByRole("button", { name: "Use larger text" }).click();
    await expect(page.locator('[data-text-size="large"]')).toBeVisible();
  });

  test("new evidence preview has no detected WCAG A/AA issues", async ({ page }) => {
    await page.goto("/marketplace/browse/evidence-preview");
    await expect(page.getByRole("heading", { name: "Better information before you buy." })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .include("main")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
