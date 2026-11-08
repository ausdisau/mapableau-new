import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("body")).toBeVisible();
  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => undefined);
}

async function expectNoSeriousAxe(page: Page, route: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const serious = results.violations.filter((violation) =>
    ["critical", "serious"].includes(violation.impact || ""),
  );
  expect(
    serious,
    `${route}: ${JSON.stringify(serious.map((item) => item.id))}`,
  ).toEqual([]);
}

test.describe("MapAble Tourism prototype (axe, not a WCAG claim)", () => {
  test("discover", async ({ page }) => {
    const response = await page.goto("/tourism", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);
    await settle(page);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Go places",
    );
    await expect(page.getByRole("status").first()).toContainText("prototype");
    await expectNoSeriousAxe(page, "/tourism");
  });

  test("plan generate", async ({ page }) => {
    await page.goto("/tourism/plan", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page
      .getByRole("button", { name: "Generate sample itinerary" })
      .focus();
    await expect(
      page.getByRole("button", { name: "Generate sample itinerary" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("status").filter({ hasText: "saved locally" }),
    ).toBeVisible();
    await expectNoSeriousAxe(page, "/tourism/plan");
  });

  test("trip reorder without map", async ({ page }) => {
    await page.goto("/tourism/trips/sydney-demo", {
      waitUntil: "domcontentloaded",
    });
    await settle(page);
    await page.getByRole("button", { name: "Later" }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Sydney itinerary",
    );
    await expectNoSeriousAxe(page, "/tourism/trips/sydney-demo");
  });

  test("place evidence", async ({ page }) => {
    await page.goto("/tourism/places/opera", { waitUntil: "domcontentloaded" });
    await settle(page);
    await expect(
      page.getByRole("heading", { name: "Accessibility evidence" }),
    ).toBeVisible();
    await expect(
      page.getByText("not an independent MapAble inspection", { exact: false }),
    ).toBeVisible();
    await expectNoSeriousAxe(page, "/tourism/places/opera");
  });

  test("map list-only", async ({ page }) => {
    await page.goto("/tourism/map", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.getByRole("button", { name: "List of tourism places" }).click();
    await expect(
      page.getByRole("button", {
        name: "Museum of Contemporary Art Australia",
      }),
    ).toBeVisible();
    await expectNoSeriousAxe(page, "/tourism/map");
  });
});
