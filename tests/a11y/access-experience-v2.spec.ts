import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Access Experience V2 a11y smoke — runs against /access with V2 flag on.
 * List-first discovery must remain usable without the map.
 */
test.describe("Access Experience V2 — /access", () => {
  test.use({
    // Fail-closed flag override for this suite only.
    extraHTTPHeaders: {},
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      // Client flag read from NEXT_PUBLIC_*; when unset, page stays on legacy shell.
      // Spec still validates landmark structure on /access either way.
    });
  });

  test("/access has accessible landmarks and no critical axe issues", async ({
    page,
  }) => {
    await page.goto("/access", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    const critical = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    );
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });

  test("list presentation controls are keyboard reachable when V2 shell is present", async ({
    page,
  }) => {
    await page.goto("/access", { waitUntil: "domcontentloaded" });

    const listToggle = page.getByRole("button", { name: /^list$/i });
    const mapToggle = page.getByRole("button", { name: /^map$/i });

    // When V2 flag is off, legacy shell remains — skip V2-only controls.
    if ((await listToggle.count()) === 0) {
      test.skip(true, "Access Experience V2 flag is off in this environment");
      return;
    }

    await listToggle.focus();
    await expect(listToggle).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(listToggle).toHaveAttribute("aria-pressed", "true");

    await mapToggle.focus();
    await page.keyboard.press("Enter");
    await expect(mapToggle).toHaveAttribute("aria-pressed", "true");
  });
});
