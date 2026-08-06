import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const STORAGE_KEY = "mapable:accessibility-ui:v1";

async function clearStoredPreferences(page: any) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => window.localStorage.removeItem(key), STORAGE_KEY);
}

async function runAxe(page: any, include?: string) {
  let builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
  ]);
  if (include) builder = builder.include(include);
  const results = await builder.analyze();
  const violations = results.violations.filter((v) =>
    (v.tags || []).some((t: string) =>
      ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"].includes(t),
    ),
  );
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
}

test.describe("Care request wizard accessibility", () => {
  test("form is a11y-clean at baseline", async ({ page }) => {
    await clearStoredPreferences(page);
    await page.goto("/care/request", { waitUntil: "domcontentloaded" });

    // Ensure form is present
    const form = page.locator("form");
    await expect(form).toHaveCount(1);

    // Fill basic required fields without submitting
    await page.fill("#care-title", "Morning personal care");
    await page.fill(
      "#care-description",
      "Support needed for showering and getting dressed each morning.",
    );
    await page.fill("#task-name-0", "Assist with showering");

    // Check required consent checkboxes by label text
    await page.getByLabel(/MapAble may process this support description/i).check();
    await page.getByLabel(/I confirm I have not pasted NDIS plan documents/i).check();

    // Run axe scoped to the form
    await runAxe(page, "form");
  });
});
