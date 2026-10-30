import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const REVIEW_ROUTE = "/dashboard/assessment/review";

test.describe("assessment registration and review (synthetic only)", () => {
  test("public assessment entry preserves informed choice", async ({ page }) => {
    await page.goto("/assessment");
    await expect(
      page.getByRole("heading", { name: /your needs.*your words.*your choices/i }),
    ).toBeVisible();
    await expect(page.getByText(/not.*official NDIA assessment/i)).toBeVisible();
    await expect(page.getByRole("link", { name: "Create an account" }))
      .toHaveAttribute("href", "/signup/assessment");
  });

  test("participant can navigate the questionnaire without a submission", async ({ page }) => {
    await page.goto("/register/assessment");
    await expect(
      page.getByRole("heading", { name: "What support do you need?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Start snapshot" }).click();
    await expect(
      page.getByRole("heading", { name: "Which areas matter for you?" }),
    ).toBeVisible();
    const area = page.getByRole("button", { name: /getting around/i });
    await area.click();
    await expect(area).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("heading", { name: /how much support with getting around/i }),
    ).toBeVisible();
  });

  test("review supports drafting and manual approved text export", async ({ page }) => {
    await page.goto(REVIEW_ROUTE);
    await expect(
      page.getByRole("heading", { name: "Review an assessor's report" }),
    ).toBeVisible();
    await page.getByLabel("What did you originally say you need?").fill(
      "Fictional example: assistance with a community outing.",
    );
    await page.getByLabel("What should happen next?").fill(
      "Fictional example: request clarification.",
    );
    await page.getByRole("button", { name: "Add concern" }).click();
    await expect(page.getByRole("heading", { name: /concern 1/i })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("not been sent");
    await page.getByRole("checkbox").check();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /download approved wording/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("mapable-assessment-review.txt");
  });

  test("keyboard focus, 400% reflow and reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(REVIEW_ROUTE);
    const textarea = page.getByLabel("What did you originally say you need?");
    await textarea.focus();
    await expect(textarea).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByLabel("What does the assessor's report say? (optional)"),
    ).toBeFocused();
    await expect(page.locator("main").first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    );
    expect(overflow).toBe(false);
  });

  test("drafts warn about session-only storage", async ({ page }) => {
    await page.goto(REVIEW_ROUTE);
    await expect(page.getByText(/held only in this browser session/i)).toBeVisible();
    await page.getByLabel("What did you originally say you need?").fill(
      "Synthetic session recovery marker",
    );
    await page.reload();
    await expect(page.getByLabel("What did you originally say you need?"))
      .toBeEmpty();
  });

  test("axe reports no serious issues on public entry or private review", async ({ page }) => {
    for (const route of ["/assessment", REVIEW_ROUTE]) {
      await page.goto(route);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const serious = result.violations.filter((violation) =>
        ["critical", "serious"].includes(violation.impact || ""),
      );
      expect(serious).toEqual([]);
    }
  });

  test("anonymous users and provider accounts cannot review participant drafts", async ({
    browser,
  }) => {
    for (const storageState of [undefined, "tests/a11y/.auth/provider.json"]) {
      const context = await browser.newContext({ storageState });
      const page = await context.newPage();
      await page.goto(REVIEW_ROUTE);
      await expect(
        page.getByRole("heading", { name: "Review an assessor's report" }),
      ).toHaveCount(0);
      await context.close();
    }
  });
});
