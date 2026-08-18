import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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

// Provider dispatch board accessibility checks
test.describe("Provider dispatch accessibility", () => {
  test("dispatch board is a11y-clean at baseline", async ({ page }) => {
    await page.goto("/provider/transport/dispatch", { waitUntil: "domcontentloaded" });

    // Ensure dispatch heading and panel exist
    await expect(page.getByRole("heading", { name: /Dispatch board/i })).toHaveCount(1);
    await expect(page.getByRole("listbox", { name: /Trips list/i })).toHaveCount(1);

    // Run axe against the main dispatch panel
    await runAxe(page, "div.grid");
  });
});
