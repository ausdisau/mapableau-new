import { expect, test } from "@playwright/test";

test.describe("Ads Manager flags off", () => {
  test("manager surface explains disabled state without placement tables", async ({
    page,
  }) => {
    // Unauthenticated redirect or disabled notice — never exposes buyable inventory.
    await page.goto("/provider/ads/manager");
    const body = await page.locator("body").innerText();
    expect(body.length).toBeGreaterThan(0);
    await expect(page.locator("text=Buyable")).toHaveCount(0);
  });
});
