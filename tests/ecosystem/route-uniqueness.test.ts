import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CORE_CIVIC_LINKS } from "@/lib/platform/core-ui/navigation";

const appDir = join(process.cwd(), "app");

/** Collect every page.tsx route (route groups stripped) under app/. */
function collectRoutes(dir: string, prefix = ""): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "api") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const segment = entry.name.startsWith("(") ? "" : `/${entry.name}`;
      routes.push(...collectRoutes(full, `${prefix}${segment}`));
    } else if (entry.name === "page.tsx") {
      routes.push(prefix || "/");
    }
  }
  return routes;
}

describe("ecosystem route uniqueness", () => {
  it("has exactly one page resolving to /ecosystem", () => {
    const routes = collectRoutes(appDir);
    expect(routes.filter((route) => route === "/ecosystem")).toHaveLength(1);
    expect(existsSync(join(appDir, "ecosystem", "page.tsx"))).toBe(true);
    expect(existsSync(join(appDir, "(core)", "ecosystem", "page.tsx"))).toBe(
      false,
    );
  });

  it("serves the Certified API directory at its own route, not /ecosystem", () => {
    const routes = collectRoutes(appDir);
    expect(
      routes.filter((route) => route === "/certified-api-ecosystem"),
    ).toHaveLength(1);
    expect(
      CORE_CIVIC_LINKS.some(
        (link) =>
          link.href === "/certified-api-ecosystem" &&
          link.label === "API ecosystem",
      ),
    ).toBe(true);
    expect(CORE_CIVIC_LINKS.some((link) => link.href === "/ecosystem")).toBe(
      false,
    );
  });

  it("has no duplicate resolved routes anywhere under app/", () => {
    const routes = collectRoutes(appDir);
    const duplicates = routes.filter(
      (route, index) => routes.indexOf(route) !== index,
    );
    expect([...new Set(duplicates)]).toEqual([]);
  });
});
