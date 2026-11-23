import { expect, test } from "@playwright/test";

/**
 * Sponsored-phrase pilot: default-off, no network when gated.
 * Flags remain false in CI unless explicitly enabled for a local fixture run.
 */
test.describe("Sponsored phrase Explore pilot", () => {
  test("homepage has no sponsored phrase when flags default off", async ({
    page,
  }) => {
    const adRequests: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/ads/")) {
        adRequests.push(url);
      }
    });

    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /What you can use on the public site today/i,
      }),
    ).toBeVisible();
    await expect(page.locator("[data-ads-sponsored-phrase]")).toHaveCount(0);
    await expect(
      page.locator("[data-ads-sponsored-phrase-link]"),
    ).toHaveCount(0);
    expect(adRequests).toEqual([]);
  });

  test("search conversation path never mounts sponsored phrase", async ({
    page,
  }) => {
    await page.goto("/search?presentation=conversation");
    await expect(page.locator("[data-ads-sponsored-phrase]")).toHaveCount(0);
    await expect(
      page.locator("[data-ads-sponsored-phrase-link]"),
    ).toHaveCount(0);
  });

  test("evidence preview path never mounts sponsored phrase", async ({
    page,
  }) => {
    await page.goto("/marketplace/browse/evidence-preview");
    await expect(page.locator("[data-ads-sponsored-phrase]")).toHaveCount(0);
  });
});
