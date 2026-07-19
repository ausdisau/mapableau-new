import { expect, test, type Page } from "@playwright/test";

async function mockBarrierSubmit(page: Page) {
  await page.route("**/api/access-barrier-reports", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        report: {
          id: "test-report",
          referenceNumber: "ABR-TEST123",
          status: "received",
          isDraft: false,
        },
      }),
    });
  });
}

test.describe("Access independence public flows", () => {
  test("submits a barrier report without an image", async ({ page }) => {
    await mockBarrierSubmit(page);
    await page.goto("/report-barrier?placeSlug=demo&placeName=Demo%20Place", {
      waitUntil: "domcontentloaded",
    });
    await page.getByLabel(/barrier category/i).selectOption("lift");
    await page
      .getByLabel(/plain-language description/i)
      .fill("The lift was out of service and no alternative route was signed.");
    await page.getByLabel(/^urgency$/i).selectOption("high");
    await page.getByRole("button", { name: /submit barrier report/i }).click();
    await expect(page.getByTestId("barrier-report-confirmation")).toBeVisible();
    await expect(page.getByText(/ABR-TEST123/i)).toBeVisible();
  });

  test("saves and resumes a barrier draft on this device", async ({ page }) => {
    await page.goto("/report-barrier", { waitUntil: "domcontentloaded" });
    await page.getByLabel(/barrier category/i).selectOption("entrance");
    await page
      .getByLabel(/plain-language description/i)
      .fill("Temporary ramp removed at the side entrance.");
    await page.getByRole("button", { name: /save on this device/i }).click();
    await expect(page.getByText(/draft saved on this device/i)).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(/draft restored on this device/i)).toBeVisible();
    await expect(page.getByLabel(/plain-language description/i)).toHaveValue(
      /Temporary ramp removed/,
    );
  });

  test("map/list toggle works at a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto("/accessibility-map", { waitUntil: "domcontentloaded" });
    const toggle = page.getByTestId("accessible-map-list-toggle");
    await expect(toggle).toBeVisible();
    await page.getByRole("button", { name: /^list$/i }).click();
    await expect(page.getByRole("button", { name: /^list$/i }).first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: /^map$/i }).click();
    await expect(page.getByRole("button", { name: /^map$/i }).first()).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("help dialog restores focus after Escape", async ({ page }) => {
    await page.goto("/report-barrier", { waitUntil: "domcontentloaded" });
    const help = page.getByRole("button", { name: /^help$/i }).first();
    await help.focus();
    await help.click();
    await expect(
      page.getByRole("dialog", { name: /help: barrier reporting/i }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("dialog", { name: /help: barrier reporting/i }),
    ).toHaveCount(0);
    await expect(help).toBeFocused();
  });

  test("login exposes email sign-in link without puzzles", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.getByTestId("login-magic-link-toggle").click();
    await expect(
      page.getByRole("button", { name: /send sign-in link/i }),
    ).toBeVisible();
    await expect(page.getByText(/no puzzle/i)).toBeVisible();
  });
});
