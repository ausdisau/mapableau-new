import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Synthetic pilot-user validation only. This is not a substitute for
 * participant-led screen-reader, AAC, switch or zoom usability testing.
 * CI enables MAPABLE_ASSESSMENT_REGISTRATION_ENABLED only for this run.
 */
test.describe("participant assessment journey", () => {
  test("participant can navigate registration using keyboard and AAC-compatible text", async ({
    page,
  }) => {
    await page.goto("/register/assessment");
    await expect(
      page.getByRole("heading", { name: /not an NDIA assessment/i }),
    ).toBeVisible();

    const start = page.getByRole("button", { name: "Start snapshot" });
    await start.focus();
    await page.keyboard.press("Enter");

    const communication = page.getByRole("button", {
      name: /Talking & understanding/i,
    });
    await communication.focus();
    await page.keyboard.press("Space");
    await expect(communication).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("radio", { name: /Some support/i }).check();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Skip priority" }).click();

    const communicationAccess = page.getByLabel(
      "How should we communicate with you? (optional)",
    );
    await communicationAccess.fill("I use AAC and need additional response time.");
    await expect(communicationAccess).toHaveValue(
      "I use AAC and need additional response time.",
    );

    await page.getByLabel("Do your support needs change? (optional)").fill(
      "My fatigue varies. I may need a longer response time.",
    );
    await expect(
      page.getByRole("heading", { name: "Anything else we should know?" }),
    ).toBeVisible();
    // Deliberately do not save synthetic disclosure to the database here.
  });

  test("assessment comparison draft can be approved locally without automatic sending", async ({
    page,
  }) => {
    await page.goto("/dashboard/assessment/review");
    await expect(
      page.getByRole("heading", { name: "Review an assessor's report" }),
    ).toBeVisible();

    await page.getByLabel("What did you originally say you need?").fill(
      "Extra time to communicate using AAC.",
    );
    await page.getByLabel("What should happen next?").fill(
      "Please correct the communication access finding.",
    );
    await page.getByRole("button", { name: "Add concern" }).click();
    await expect(page.getByRole("heading", { name: /Your concerns \(1\)/ })).toBeVisible();

    await page.getByRole("checkbox", { name: /I have reviewed this wording/i }).check();
    await expect(
      page.getByRole("button", { name: /Download approved wording/i }),
    ).toBeEnabled();

    // Draft is intentionally session-only: reloading must not imply persistence.
    await page.reload();
    await expect(
      page.getByRole("heading", { name: /Your concerns \(0\)/ }),
    ).toBeVisible();
  });

  test("review form passes serious/critical automated accessibility checks", async ({
    page,
  }) => {
    await page.goto("/dashboard/assessment/review");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(
      results.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact || ""),
      ),
    ).toEqual([]);
  });

  test("assessment routes reflow at 200–400% equivalent widths", async ({
    page,
  }) => {
    for (const route of ["/register/assessment", "/dashboard/assessment/review"]) {
      for (const width of [640, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(route);
        await expect(page.locator("main, [role='main']").first()).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 4,
        );
        expect(overflow, `${route} overflows at ${width}px`).toBe(false);
      }
    }
  });

  test("reduced-motion preference keeps the review form usable", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dashboard/assessment/review");
    await expect(
      page.getByRole("button", { name: "Add concern" }),
    ).toBeEnabled();
  });
});
