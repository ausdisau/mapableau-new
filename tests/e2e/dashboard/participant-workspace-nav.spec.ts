import { expect, test } from "@playwright/test";

test.describe("Participant workspace navigation", () => {
  test("dashboard responds and does not nest duplicate main landmarks when reachable", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // Auth may redirect; ensure page is usable and never exposes AI as enabled by default.
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);
    await expect(
      page
        .locator("text=AI-assisted view is off")
        .or(page.locator("[data-testid='my-day-view-picker']"))
        .or(page.locator("[data-testid='my-day-ai-disabled']"))
        .or(page.locator("text=Sign in"))
        .first(),
    ).toBeVisible({
      timeout: 15_000,
    });
    const mains = page.locator("main#main-content");
    const count = await mains.count();
    expect(count).toBeLessThanOrEqual(1);
  });
});
