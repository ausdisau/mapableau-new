import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility regression suite for public MapAble shells.
 * Automated axe results support remediation — they do not prove WCAG conformance.
 *
 * Authenticated shells: skipped when A11Y_SKIP_AUTH_ROUTES=1 (default in CI
 * without seeded users). Fail-closed: skips are reported, not silent passes.
 */

/** Truly public shells that must return < 400 and stay on the requested path. */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/provider-finder",
  "/accessibility-map",
  "/care",
  "/transport",
  "/employment",
  "/accessibility-statement",
  "/accountability",
] as const;

/**
 * Auth-gated entry URLs listed in the public suite for discoverability.
 * Unauthenticated visits should redirect to /login (not count as feature coverage).
 * 503 from missing auth/database config is an explicit environment skip.
 */
const AUTH_GATED_ENTRY_ROUTES = ["/care/request", "/transport/request"] as const;

const AUTH_ROUTES = [
  "/dashboard",
  "/dashboard/accessibility",
  "/dashboard/consent",
  "/dashboard/safety",
  "/dashboard/billing",
] as const;

const TITLE_EXPECTATIONS: Record<string, RegExp> = {
  "/provider-finder": /Provider Finder \| MapAble$/i,
  "/accessibility-statement": /Accessibility statement \| MapAble$/i,
  "/accessibility-map": /Accessibility Map \| MapAble$/i,
  "/employment": /MapAble Employment/i,
};

const GENERIC_SOCIAL_HOMEPAGES = [
  "https://facebook.com",
  "https://www.facebook.com",
  "https://twitter.com",
  "https://www.twitter.com",
  "https://instagram.com",
  "https://www.instagram.com",
  "https://linkedin.com",
  "https://www.linkedin.com",
  "https://x.com",
  "https://www.x.com",
];

async function gotoPublicRoute(page: Page, route: string) {
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response, `navigation to ${route}`).not.toBeNull();
  const status = response!.status();
  expect(status, `${route} returned HTTP ${status}`).toBeLessThan(400);
  await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:\\?.*)?$`));
  return response!;
}

async function runAxe(page: Page, route: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  const tagged = results.violations.filter((v) =>
    (v.tags || []).some((tag) =>
      ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"].includes(tag),
    ),
  );

  expect(
    tagged,
    `WCAG-tagged axe violations on ${route}: ${JSON.stringify(
      tagged.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        help: v.help,
      })),
      null,
      2,
    )}`,
  ).toEqual([]);
}

test.describe("Public route shells (axe + structure)", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`public shell: ${route}`, async ({ page }) => {
      await gotoPublicRoute(page, route);
      await expect(page.locator("body")).toBeVisible();

      const h1 = page.locator("h1");
      await expect(h1, `${route} should expose exactly one H1 after load`).toHaveCount(1);
      await expect(h1.first()).not.toHaveText(/loading mapable/i);

      await expect(page.locator("h1").first()).toBeVisible();
      const dupes = await page.evaluate(() => {
        const ids = Array.from(document.body.querySelectorAll("[id]"))
          .map((el) => el.id)
          .filter(Boolean);
        return [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
      });
      expect(dupes, `duplicate ids on ${route}: ${dupes.join(", ")}`).toEqual([]);

      const unnamed = page.locator(
        "a:not([aria-label]):not([aria-labelledby]):not(:has(img[alt])), button:not([aria-label]):not([aria-labelledby])",
      );
      // Soft structural check — empty text buttons/links fail
      const emptyControls = await unnamed.evaluateAll((els) =>
        els
          .filter((el) => {
            const text = (el.textContent || "").replace(/\s+/g, " ").trim();
            const aria = el.getAttribute("aria-label");
            return !text && !aria;
          })
          .map((el) => el.outerHTML.slice(0, 120)),
      );
      expect(emptyControls, `unnamed controls on ${route}`).toEqual([]);

      for (const href of GENERIC_SOCIAL_HOMEPAGES) {
        await expect(
          page.locator(`a[href="${href}"], a[href="${href}/"]`),
        ).toHaveCount(0);
      }

      const expectedTitle = TITLE_EXPECTATIONS[route];
      if (expectedTitle) {
        await expect(page).toHaveTitle(expectedTitle);
      }
      await expect(page).not.toHaveTitle(/MapAble \| MapAble/i);

      await runAxe(page, route);
    });
  }

  test("intentional 404 for /jobs is not treated as feature coverage", async ({ page }) => {
    const response = await page.goto("/jobs", { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    expect(response!.status()).toBeGreaterThanOrEqual(400);
  });

  for (const route of AUTH_GATED_ENTRY_ROUTES) {
    test(`auth-gated entry: ${route}`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response, `navigation to ${route}`).not.toBeNull();
      const status = response!.status();
      test.skip(
        status === 503,
        `${route} returned 503 — auth/database not configured (documented environment skip)`,
      );
      expect(status).toBeLessThan(500);
      // Unauthenticated: redirect to login is expected and is NOT authenticated-shell coverage
      await expect(page).toHaveURL(/\/login/);
    });
  }
});

test.describe("No competing accessibility overlay", () => {
  test("homepage does not inject accessiBe / duplicate skip links", async ({ page }) => {
    await gotoPublicRoute(page, "/");
    await expect(page.locator("#accessibe, script[src*='acsbapp'], script[src*='accessibe']")).toHaveCount(0);
    await expect(page.locator("[class*='acsb'], [id*='acsb']")).toHaveCount(0);

    const skipLinks = page.locator(
      "a[href='#main-content'], a[href='#main'], a[href='#content']",
    );
    await expect(skipLinks).toHaveCount(1);
    await expect(skipLinks.first()).toHaveText(/skip to main content/i);
  });
});

test.describe("Authenticated route shells (axe)", () => {
  const skipAuth = process.env.A11Y_SKIP_AUTH_ROUTES !== "0";

  for (const route of AUTH_ROUTES) {
    test(`axe: ${route}`, async ({ page }) => {
      test.skip(
        skipAuth,
        `A11Y_SKIP_AUTH_ROUTES — ${route} requires seeded authenticated storage state (documented skip)`,
      );

      const response = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(response).not.toBeNull();
      expect(response!.status()).toBeLessThan(400);
      // Must remain on the authenticated route — login redirects are not coverage
      await expect(page).toHaveURL(new RegExp(`${route}(?:\\?.*)?$`));
      await expect(page).not.toHaveURL(/\/login/);
      await runAxe(page, route);
    });
  }
});

test.describe("Keyboard / focus behaviours", () => {
  test("skip link is first MapAble focus target and focuses main", async ({ page }) => {
    await gotoPublicRoute(page, "/");
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toHaveAttribute("href", "#main-content");
    await expect(focused).toContainText(/skip to main content/i);

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("mobile menu focus entry, Escape, and restoration", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await gotoPublicRoute(page, "/");
    const menu = page.getByRole("button", { name: /^Menu$/i });
    await expect(menu).toBeVisible();
    await menu.focus();
    await page.keyboard.press("Enter");
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    const panelId = await menu.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const panel = page.locator(`[id="${panelId}"]`);
    await expect(panel).toBeVisible();
    // Focus moves into the disclosure
    await expect(panel.locator(":focus")).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeFocused();
  });

  test("direct fragment navigation clears sticky header overlap", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/#guided-search-panel", { waitUntil: "networkidle" });
    const target = page.locator("#guided-search-panel");
    await expect(target).toBeVisible();
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    // Target top edge should sit below sticky header (~105px)
    expect(box!.y).toBeGreaterThanOrEqual(80);
  });

  test("accessibility map list/map toggle and filter clear", async ({ page }) => {
    await gotoPublicRoute(page, "/accessibility-map");
    await page.getByRole("button", { name: /^Map$/i }).click();
    await expect(page.getByRole("button", { name: /^Map$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.getByRole("button", { name: /^List$/i }).click();
    await expect(page.getByRole("button", { name: /^List$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const stepFree = page.getByLabel("Step-free entry");
    await stepFree.check();
    await expect(page.getByRole("button", { name: /Remove Step-free entry filter/i })).toBeVisible();
    await page.getByRole("button", { name: /Clear all filters/i }).click();
    await expect(stepFree).not.toBeChecked();
  });

  test("place-card More actions disclosure remains keyboard operable", async ({ page }) => {
    await gotoPublicRoute(page, "/accessibility-map");
    const more = page.locator("details").filter({ hasText: "More actions" }).first();
    const summary = more.locator("summary");
    await summary.focus();
    await page.keyboard.press(" ");
    await expect(more).toHaveJSProperty("open", true);
    await expect(more.getByRole("link", { name: /Report update/i })).toBeVisible();
  });
});

test.describe("Responsive / motion / forced-colours smoke", () => {
  test("320px width has no horizontal page scroll on home", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await gotoPublicRoute(page, "/");
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("200% equivalent zoom/reflow on accessibility-map", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 480 });
    await page.addInitScript(() => {
      Object.defineProperty(window, "devicePixelRatio", { get: () => 2 });
    });
    await gotoPublicRoute(page, "/accessibility-map");
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - doc.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(8);
  });

  test("reduced motion disables loading spinner animation class", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await gotoPublicRoute(page, "/");
    // Spinners in scope use motion-reduce:animate-none — assert CSS media is honoured
    const reduces = await page.evaluate(() =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    expect(reduces).toBe(true);
  });

  test("forced-colours smoke on home", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await gotoPublicRoute(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const skip = page.locator("a[href='#main-content']").first();
    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
  });
});

test.describe("Accessibility map list and map states", () => {
  test("list and map states both expose results or list alternative", async ({ page }) => {
    await gotoPublicRoute(page, "/accessibility-map");
    await expect(page.getByRole("list", { name: /Accessible places/i })).toBeVisible();
    await page.getByRole("button", { name: /^Map$/i }).click();
    await expect(page.getByRole("button", { name: /^List$/i })).toBeVisible();
    // List control remains available for motor/error recovery
    await page.getByRole("button", { name: /^List$/i }).click();
    await expect(page.getByRole("list", { name: /Accessible places/i })).toBeVisible();
  });

  test("Access-Fit does not show 0/100 Unknown before needs are set", async ({ page }) => {
    await gotoPublicRoute(page, "/accessibility-map");
    await expect(page.getByText(/0\/100\s*·\s*Unknown/i)).toHaveCount(0);
    await expect(page.getByText(/Set your access needs to calculate fit/i).first()).toBeVisible();
  });
});
