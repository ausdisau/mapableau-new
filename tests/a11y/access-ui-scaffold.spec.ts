import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("MapAble Access UI scaffold", () => {
  test("/access/scaffold renders the fixture-backed discovery shell", async ({
    page,
  }) => {
    await page.goto("/access/scaffold", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /find places that fit your access requirements/i,
      }),
    ).toBeVisible();

    await expect(page.getByText(/prototype data/i)).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();

    const blocking = results.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact || ""),
    );

    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test("list and map controls remain keyboard operable", async ({ page }) => {
    await page.goto("/access/scaffold", { waitUntil: "domcontentloaded" });

    const mapButton = page.getByRole("button", { name: "Map" });
    await mapButton.focus();
    await expect(mapButton).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(mapButton).toHaveAttribute("aria-pressed", "true");

    const firstMarker = page
      .getByRole("region", { name: /scaffold map presentation/i })
      .getByRole("button")
      .first();

    await firstMarker.focus();
    await expect(firstMarker).toBeFocused();
  });
});
