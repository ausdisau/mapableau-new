import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("MapAble Access UI scaffold", () => {
  test("/access/scaffold renders canonical Access UI with no serious axe issues", async ({
    page,
  }) => {
    await page.goto("/access/scaffold", { waitUntil: "domcontentloaded" });

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /mapable access national discovery scaffold/i,
      }),
    ).toBeVisible();

    await expect(page.getByText(/synthetic fixture data/i)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /my access requirements/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /data sources and confidence/i }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();

    const blocking = results.violations.filter((violation) =>
      ["critical", "serious"].includes(violation.impact || ""),
    );

    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });

  test("canonical list and MapLibre controls remain keyboard operable", async ({
    page,
  }) => {
    await page.goto("/access/scaffold", { waitUntil: "domcontentloaded" });

    const mapButton = page.getByRole("button", { name: /^map$/i });
    await mapButton.focus();
    await expect(mapButton).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(mapButton).toHaveAttribute("aria-pressed", "true");

    const accessMap = page.getByRole("application", {
      name: /map of access-rated places/i,
    });
    await expect(accessMap).toBeVisible();

    const marker = accessMap.getByRole("button", {
      name: /sydney access library — scaffold/i,
    });
    await expect(marker).toBeVisible();
    await marker.focus();
    await expect(marker).toBeFocused();
  });
});
