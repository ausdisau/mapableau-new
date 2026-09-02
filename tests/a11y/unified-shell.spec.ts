import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const unifiedShellEnabled =
  process.env.NEXT_PUBLIC_UNIFIED_SHELL === "true";

test.describe("Unified participant shell", () => {
  test.skip(!unifiedShellEnabled, "Requires NEXT_PUBLIC_UNIFIED_SHELL=true");

  test("my home renders unified shell with accessibility trigger", async ({
    page,
  }) => {
    await page.goto("/my", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("unified-participant-shell")).toBeVisible();
    await expect(page.getByTestId("mapable-sidebar")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /open accessibility settings/i }).first(),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const tagged = results.violations.filter((v) =>
      (v.tags || []).some((tag) =>
        ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"].includes(tag),
      ),
    );
    expect(tagged, JSON.stringify(tagged, null, 2)).toEqual([]);
  });
});
