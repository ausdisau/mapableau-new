import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

const routes = [
  "/",
  "/access",
  "/contact",
  "/early-access",
  "/demo/care-transport",
  "/employment",
  "/for-providers",
  "/design-system",
];

for (const route of routes) {
  test(`a11y smoke: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    const skipLink = page.getByRole("link", { name: /skip to/i });
    if ((await skipLink.count()) > 0) {
      await expect(skipLink.first()).toBeVisible();
    }
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
}
