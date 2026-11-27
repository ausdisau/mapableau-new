import { expect, test } from "@playwright/test";

/**
 * Discovered by pnpm test:e2e:starting-work (playwright.e2e.config.ts).
 * Skips honestly when the interview preview gate is closed.
 */
test.describe("Starting Work interview journey", () => {
  test("confirms meaning, optional pickup change, and selective handoff", async ({
    page,
  }) => {
    await page.goto("/pilot/starting-work/interview");
    if (page.url().includes("404") || (await page.getByText("404").count()) > 0) {
      test.skip(true, "Interview preview unavailable (flags / production gate)");
    }

    const heading = page.getByRole("heading", {
      name: "Plan my interview journey",
    });
    if ((await heading.count()) === 0) {
      test.skip(true, "Interview preview unavailable");
    }

    await expect(heading).toBeVisible();
    await expect(
      page.getByText("Your support worker cancelled. Your ride is on hold."),
    ).toBeVisible();

    await page.getByLabel("Suggested meaning").fill("I need care before my interview");
    await page.getByRole("button", { name: "Confirm meaning" }).click();
    await expect(page.getByText(/Confirmed:/)).toBeVisible();

    await page.getByLabel("Ask about a different pickup").check();
    await expect(page.getByRole("status").filter({ hasText: "different pickup" })).toBeVisible();

    await page.getByRole("button", { name: "Ask my coordinator" }).click();
    await expect(page.getByRole("heading", { name: "Ask my coordinator" })).toBeVisible();
    await page.getByLabel("Original example words").check();
    await page.getByRole("button", { name: "Simulate handoff" }).click();
    await expect(page.getByText("Local handoff receipt")).toBeVisible();
    await expect(page.getByText("original_words")).toBeVisible();
  });
});
