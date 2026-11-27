import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("MapAble Search a11y", () => {
  test("search page is keyboard reachable and axe-clean at desktop", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto("/search", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBeLessThan(400);

    await expect(
      page.getByRole("heading", { name: /Find what works for you/i }),
    ).toBeVisible();

    const search = page
      .locator("#main-content")
      .getByRole("searchbox", { name: /Search MapAble/i });
    await search.focus();
    await expect(search).toBeFocused();
    await search.fill("accessible transport");

    const conversation = page.getByLabel("Conversation");
    await conversation.scrollIntoViewIfNeeded();
    await conversation.check({ force: true });
    await expect(page.getByLabel("Quick · Free")).toBeChecked();

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
  });

  test("header omnibox is keyboard operable and submits to /search", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page
      .waitForLoadState("networkidle", { timeout: 10_000 })
      .catch(() => undefined);

    await expect(
      page.getByRole("link", { name: /Skip to search/i }),
    ).toHaveAttribute("href", "#mapable-header-search");

    await page.locator("#mapable-header-search").evaluate((el) => {
      (el as HTMLElement).focus();
    });
    await expect(page.locator("#mapable-header-search")).toBeFocused();

    const headerSearch = page
      .getByRole("search", { name: /MapAble Search/i })
      .getByRole("searchbox", { name: /Search MapAble/i });
    await headerSearch.click();
    await headerSearch.fill("accessible transport");
    await expect(headerSearch).toHaveValue("accessible transport");
    await headerSearch.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=accessible(\+|%20)transport/);
  });

  test("search controls remain usable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await page
      .waitForLoadState("networkidle", { timeout: 10_000 })
      .catch(() => undefined);

    const openSearch = page.getByRole("button", { name: /Open search/i });
    await expect(openSearch).toBeVisible();
    await expect(async () => {
      if (await page.getByRole("button", { name: /Hide search/i }).count()) {
        return;
      }
      await openSearch.click();
      await expect(
        page.getByRole("button", { name: /Hide search/i }),
      ).toBeVisible({ timeout: 1_500 });
    }).toPass({ timeout: 10_000 });

    await expect(page.locator("#mapable-header-search")).toBeVisible();
    await expect(
      page
        .locator("#mapable-header-search")
        .getByRole("searchbox", { name: /Search MapAble/i }),
    ).toBeVisible();
    await expect(
      page.locator("#main-content").getByRole("button", { name: "Search" }),
    ).toBeVisible();
    await expect(
      page.getByRole("radiogroup", { name: "Search experience" }),
    ).toBeVisible();
    await expect(
      page.getByRole("radiogroup", { name: "Search depth" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Places" })).toBeVisible();
  });

  test("reduced motion still exposes search without requiring media", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await expect(
      page.locator("#main-content").getByRole("button", { name: "Search" }),
    ).toBeVisible();
    await expect(
      page.getByText(/Concept visualisation — routes illustrative/i),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: /Explore Sydney concept animation|Animation paused/i,
      }),
    ).toBeDisabled();
  });

  test("deep selection explains credits are inactive", async ({ page }) => {
    await page.goto("/search?tier=deep", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("complementary", { name: "Deep Search availability" }),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Deep Search availability" }),
    ).toContainText(/Deep Search is not yet active/i);
  });
});
