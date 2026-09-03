import { test, expect } from "@playwright/test";

test("Ask MapAble page and guest launcher behaviour", async ({ page }) => {
  await page.goto("/ask");
  await expect(page.getByRole("heading", { name: "Ask MapAble" })).toBeVisible();
  await expect(
    page.getByText(/Accessible information, planning and support across MapAble/i),
  ).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/ask-mapable-page.png",
    fullPage: false,
  });

  await page.fill(
    "#ask-query",
    "Find a place with step-free entrance and accessible toilet and power-wheelchair access",
  );
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
  await page.screenshot({
    path: "/opt/cursor/artifacts/ask-mapable-ask-result.png",
    fullPage: false,
  });

  await page.goto("/");
  await expect(page.locator('[data-testid="ask-mapable-launcher"]')).toHaveCount(0);
  await page.screenshot({
    path: "/opt/cursor/artifacts/ask-mapable-home-no-launcher.png",
    fullPage: false,
  });
});
