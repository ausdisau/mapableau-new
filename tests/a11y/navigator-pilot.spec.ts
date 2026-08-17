import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility smoke for `/navigator/pilot` with production flags off.
 * This is the non-AI equivalent shell (Provider Finder continuation).
 * Lived-experience / AAC / enabled-journey testing remain manual.
 */

async function settle(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("body")).toBeVisible();
  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => undefined);
}

test.describe("Navigator pilot (flags off)", () => {
  test("disabled shell exposes heading, live region, and Finder continuation", async ({
    page,
  }) => {
    const response = await page.goto("/navigator/pilot", {
      waitUntil: "domcontentloaded",
    });
    expect(response, "navigation to /navigator/pilot").not.toBeNull();
    expect(response!.status()).toBeLessThan(400);

    await settle(page);

    await expect(page.locator("main, [role='main']").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /navigator pilot is not enabled/i }),
    ).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      /turned off|not enabled|provider finder/i,
    );
    await expect(
      page.getByRole("link", { name: /continue to provider finder/i }),
    ).toHaveAttribute("href", "/provider-finder");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    );
    expect
      .soft(
        serious,
        `Serious/critical axe on /navigator/pilot: ${JSON.stringify(
          serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
        )}`,
      )
      .toEqual([]);
  });

  test("keyboard tab reaches Provider Finder continuation", async ({ page }) => {
    await page.goto("/navigator/pilot", { waitUntil: "domcontentloaded" });
    await settle(page);

    let reachedFinder = false;
    for (let i = 0; i < 24; i += 1) {
      await page.keyboard.press("Tab");
      const href = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        return el.getAttribute("href");
      });
      if (href === "/provider-finder") {
        reachedFinder = true;
        break;
      }
    }
    expect(reachedFinder).toBe(true);

    const tag = await page.evaluate(
      () => document.activeElement?.tagName?.toLowerCase() ?? "",
    );
    expect(tag).toBe("a");
  });
});
