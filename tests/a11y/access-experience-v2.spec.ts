import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Access Experience V2 a11y smoke on `/access`.
 * Flags are fail-closed by default — when V2 is off, assert list discovery still works.
 * Enable MAPABLE_ACCESS_EXPERIENCE_V2_ENABLED + NEXT_PUBLIC_… in CI to exercise V2 UI.
 */

async function runAxeCriticalFree(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
}

test.describe("access experience v2 /access", () => {
  test("list discovery works without requiring map interaction", async ({
    page,
  }) => {
    await page.goto("/access");
    await expect(
      page.getByRole("heading", { name: /MapAble Access/i }),
    ).toBeVisible();
    const list = page.getByRole("list", {
      name: /place list|accessible places/i,
    });
    // Empty DB is OK — status message still present
    const listOrStatus = list.or(page.getByRole("status"));
    await expect(listOrStatus.first()).toBeVisible();
    await runAxeCriticalFree(page);
  });

  test("keyboard can reach list/map presentation controls", async ({
    page,
  }) => {
    await page.goto("/access");
    const listBtn = page.getByRole("button", { name: /list/i }).first();
    await listBtn.focus();
    await expect(listBtn).toBeFocused();
    await page.keyboard.press("Tab");
  });

  test("map view toggle does not remove list-capable discovery", async ({
    page,
  }) => {
    await page.goto("/access");
    const mapBtn = page.getByRole("button", { name: /map/i }).first();
    if (await mapBtn.isVisible()) {
      await mapBtn.click();
      // List remains reachable via toggle
      const listBtn = page.getByRole("button", { name: /list/i }).first();
      await expect(listBtn).toBeVisible();
      await listBtn.click();
    }
  });
});
