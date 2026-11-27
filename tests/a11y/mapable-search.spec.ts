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

  test("combined workspace demo is keyboard operable with skip links", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(
      "/search?presentation=conversation&tier=quick&demo=st-ives",
      { waitUntil: "domcontentloaded" },
    );

    await expect(page.getByTestId("mapable-search-workspace")).toHaveAttribute(
      "data-hydrated",
      "true",
    );
    await expect(
      page.getByRole("heading", { name: /Find what works for you/i }),
    ).toBeVisible();
    await expect(page.getByText(/synthetic/i).first()).toBeVisible();

    await page.getByRole("link", { name: /Skip to results/i }).click();
    await expect(page.locator("#results-region")).toBeFocused();

    const listBtn = page
      .getByRole("group", { name: "Result view" })
      .getByRole("button", { name: /^List$/i });
    await expect(async () => {
      await listBtn.click();
      await expect(listBtn).toHaveAttribute("aria-pressed", "true");
    }).toPass();
    await page
      .locator("#results-region")
      .getByRole("button", { name: /Ku-ring-gai Rehab Clinic/i })
      .click();
    await expect(
      page
        .locator("#results-region")
        .getByRole("button", { name: /Ku-ring-gai Rehab Clinic/i }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /3D floor plan/i }).click();
    await expect(
      page.getByRole("heading", { name: /No floor plan for Ku-ring-gai/i }),
    ).toBeVisible();
    await expect(page.getByText(/gradient remains unknown/i)).toBeVisible();

    const door = page.getByLabel(/Doorway minimum/i);
    await door.fill("930");
    await expect(
      page
        .locator("#results-region")
        .getByText(/2 alternatives below minimum/i),
    ).toBeVisible();
    await page.getByRole("button", { name: /Reset 900 mm/i }).click();
    await expect(
      page.locator("#results-region").getByText(/1 match/i),
    ).toBeVisible();

    await page.getByRole("button", { name: /Manage consent/i }).click();
    await expect(
      page.getByRole("dialog", { name: /Manage consent/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Close$/i }).click();

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(axe.violations).toEqual([]);
  });

  test("workspace stacks at 320px and keeps composer reachable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(
      "/search?presentation=conversation&tier=quick&demo=st-ives",
      { waitUntil: "domcontentloaded" },
    );
    await expect(page.getByTestId("mapable-search-workspace")).toHaveAttribute(
      "data-hydrated",
      "true",
    );
    await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Find a clinic/i }),
    ).toBeVisible();
  });
});
