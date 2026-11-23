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

    const search = page.getByRole("searchbox", { name: /Search MapAble/i });
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

  test("search controls remain usable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/search", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
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
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(
      page
        .locator("figcaption")
        .filter({ hasText: /Concept visualisation — routes illustrative/i }),
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

test("clinic comparison keeps an AAC draft private and reflows with the route map open", async ({
  page,
}) => {
  await page.goto("/search");
  await page
    .getByRole("link", { name: "Open the AAC and spatial search workspace" })
    .click();
  await page.getByRole("button", { name: "Open synthetic example" }).click();
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page
    .getByRole("button", { name: "Step-free trip", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Select clinic 2, Ku-ring-gai Rehab Clinic" })
    .click();
  await page
    .getByRole("button", { name: "3D floor plan", exact: true })
    .click();
  await expect(page.getByText(/No plan supplied for clinic 2/)).toBeVisible();
  await expect(page.getByLabel("Ask MapAble", { exact: true })).toHaveValue(
    "Step-free trip",
  );
  await page.getByRole("button", { name: "2D map", exact: true }).click();
  await page.setViewportSize({ width: 320, height: 760 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBe(320);
  await page.getByRole("link", { name: "Skip to results" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#results")).toBeFocused();
  const report = await new AxeBuilder({ page })
    .include("main")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(report.violations).toEqual([]);
  expect(requests.some((url) => url.includes("/api/mapable-search"))).toBe(
    false,
  );
});
