import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const publicRouteFiles = [
  "app/(marketing)/page.tsx",
  "app/care/page.tsx",
  "app/transport/page.tsx",
  "app/employment/page.tsx",
  "app/marketplace/page.tsx",
  "app/foods/page.tsx",
  "app/access/page.tsx",
  "app/(marketing)/peer/page.tsx",
  "app/(marketing)/telehealth/page.tsx",
  "app/(marketing)/providers/page.tsx",
  "app/dashboard/page.tsx",
  "app/(marketing)/resources/page.tsx",
  "app/(marketing)/help/page.tsx",
  "app/(marketing)/privacy/page.tsx",
  "app/(marketing)/terms/page.tsx",
  "app/(marketing)/data-deletion/page.tsx",
  "app/(marketing)/accessibility-statement/page.tsx",
  "app/(marketing)/for-providers/page.tsx",
  "app/(marketing)/pricing/page.tsx",
  "app/(marketing)/about/page.tsx",
  "app/(marketing)/contact/page.tsx",
];

describe("Phase 0 public route contract", () => {
  it("has a page file for every required public route", () => {
    for (const routeFile of publicRouteFiles) {
      expect(
        existsSync(join(process.cwd(), routeFile)),
        `${routeFile} should exist`,
      ).toBe(true);
    }
  });
});
