import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** WCAG 2.2 A/AA tags used for authenticated shells. */
export const AXE_AA_TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
] as const;

/** Marketing / public surfaces gate on AAA tags (plus AA). */
export const AXE_AAA_TAGS = [
  ...AXE_AA_TAGS,
  "wcag2aaa",
  "wcag22aaa",
] as const;

export async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("body")).toBeVisible();
  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => undefined);
}

export async function expectMainLandmark(page: Page): Promise<void> {
  const main = page.locator("main, [role='main']");
  await expect(main.first()).toBeVisible({ timeout: 15_000 });
  const name = await main.first().getAttribute("aria-label");
  const labelledBy = await main.first().getAttribute("aria-labelledby");
  const hasAccessibleName =
    Boolean(name?.trim()) ||
    Boolean(labelledBy?.trim()) ||
    (await main.locator("h1").count()) > 0;
  expect(
    hasAccessibleName,
    "primary page should expose a main landmark with an accessible name or h1",
  ).toBeTruthy();
}

export async function expectNoSeriousAxe(
  page: Page,
  route: string,
  tags: readonly string[] = AXE_AA_TAGS,
): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags([...tags]).analyze();
  const serious = results.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact || ""),
  );
  expect(
    serious,
    `Serious/critical axe on ${route}: ${JSON.stringify(
      serious.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
      })),
    )}`,
  ).toEqual([]);
}

/** Marketing routes: full AAA tag set, assert zero critical/serious. */
export async function expectNoSeriousAxeAaa(
  page: Page,
  route: string,
): Promise<void> {
  return expectNoSeriousAxe(page, route, AXE_AAA_TAGS);
}

/** Hard gate: zero axe violations at the requested tag set (panel-style). */
export async function expectZeroAxeViolations(
  page: Page,
  route: string,
  tags: readonly string[] = AXE_AAA_TAGS,
): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags([...tags]).analyze();
  expect(
    results.violations,
    `Axe violations on ${route}: ${JSON.stringify(
      results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
      })),
    )}`,
  ).toEqual([]);
}

export async function expectVisibleFocus(page: Page): Promise<void> {
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus-visible, :focus");
  await expect(focused.first()).toBeVisible({ timeout: 5_000 });
}

export async function assertAuthShell(
  page: Page,
  route: string,
): Promise<void> {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response, `navigation to ${route}`).not.toBeNull();
  const status = response!.status();
  expect(status, `${route} status`).toBeLessThan(500);
  expect(status, `${route} must not 404`).not.toBe(404);
  await settle(page);
  expect(new URL(page.url()).pathname).not.toMatch(/^\/login/);
  await expectMainLandmark(page);
  await expectNoSeriousAxe(page, route);
  await expectVisibleFocus(page);
}

export async function assertMarketingShellAaa(
  page: Page,
  route: string,
): Promise<void> {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response, `navigation to ${route}`).not.toBeNull();
  const status = response!.status();
  expect(status, `${route} status`).toBeLessThan(400);
  await settle(page);
  await expectMainLandmark(page);
  await expectNoSeriousAxeAaa(page, route);
  await expectVisibleFocus(page);
}
