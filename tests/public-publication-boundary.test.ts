import { describe, expect, it } from "vitest";

import { PUBLIC_DISCOVERY_ROUTES } from "@/lib/public/discovery-routes";
import {
  EXCLUDED_TRANSACTIONAL_PATH_PREFIXES,
  informationalRoutePaths,
} from "@/lib/public/informational/routes";

describe("public route publication boundary", () => {
  it("keeps the public discovery catalogue outside transactional prefixes", () => {
    for (const route of PUBLIC_DISCOVERY_ROUTES) {
      expect(
        EXCLUDED_TRANSACTIONAL_PATH_PREFIXES.some(
          (prefix) =>
            route.path === prefix || route.path.startsWith(`${prefix}/`),
        ),
      ).toBe(false);
    }
  });

  it("publishes Explore and curated Knowledge as informational routes", () => {
    const paths = informationalRoutePaths();
    expect(paths).toContain("/explore");
    expect(paths).toContain("/knowledge");
  });

  it("does not publish authenticated Ask MapAble in public catalogues", () => {
    expect(informationalRoutePaths()).not.toContain("/ask");
    expect(PUBLIC_DISCOVERY_ROUTES.map((route) => route.path)).not.toContain(
      "/ask",
    );
  });
});
