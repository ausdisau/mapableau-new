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
    await page.addInitScript(() => {
      localStorage.setItem("mapable:ads:show-sponsored-links:v1", "true");
    });
    await page.goto("/search?presentation=conversation");
    await expect(page.locator("[data-ads-sponsored-phrase]")).toHaveCount(0);
    await expect(
      page.locator("[data-ads-sponsored-phrase-link]"),
    ).toHaveCount(0);
  });

  test("evidence preview path never mounts sponsored phrase", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("mapable:ads:show-sponsored-links:v1", "true");
    });
    await page.goto("/marketplace/browse/evidence-preview");
    await expect(page.locator("[data-ads-sponsored-phrase]")).toHaveCount(0);
  });

  test("with flags enabled and preference on, phrase appears on home and not on excluded routes", async ({
    page,
  }) => {
    test.skip(
      process.env.NEXT_PUBLIC_MAPABLE_ADS_SPONSORED_PHRASE_ENABLED !== "true" ||
        process.env.NEXT_PUBLIC_MAPABLE_ADS_ENABLED !== "true",
      "Requires local phrase flags; covered by unit isolation tests in CI",
    );
    await page.addInitScript(() => {
      localStorage.setItem("mapable:ads:show-sponsored-links:v1", "true");
    });
    await page.goto("/");
    await expect(page.locator("[data-ads-sponsored-phrase]")).toHaveCount(1);
    await page.goto("/search?presentation=conversation");
    await expect(page.locator("[data-ads-sponsored-phrase]")).toHaveCount(0);
    await page.goto("/marketplace/browse/evidence-preview");
    await expect(page.locator("[data-ads-sponsored-phrase]")).toHaveCount(0);
  });
});
