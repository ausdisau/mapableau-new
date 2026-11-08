import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("placement OpenAPI contract paths", () => {
  it("checks in OpenAPI and maps to App Router handlers", () => {
    const openapiPath = path.join(
      ROOT,
      "docs/ads/contracts/mapable_ads_placement_openapi_v1_2.yaml",
    );
    expect(existsSync(openapiPath)).toBe(true);
    const yaml = readFileSync(openapiPath, "utf8");
    expect(yaml).toContain("/v1/providers");
    expect(yaml).toContain("/v1/placements/search");
    expect(yaml).toContain("/v1/quotes");
    expect(yaml).toContain("/v1/orders");

    const routes = [
      "app/api/ads/v1/providers/route.ts",
      "app/api/ads/v1/placements/search/route.ts",
      "app/api/ads/v1/quotes/route.ts",
      "app/api/ads/v1/orders/route.ts",
      "app/api/ads/v1/orders/[orderId]/route.ts",
      "app/api/ads/v1/orders/[orderId]/pause/route.ts",
      "app/api/ads/v1/orders/[orderId]/delivery/route.ts",
      "app/api/ads/v1/orders/[orderId]/reconciliation/route.ts",
    ];
    for (const route of routes) {
      expect(existsSync(path.join(ROOT, route))).toBe(true);
    }
  });
});
