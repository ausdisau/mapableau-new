import { describe, expect, it } from "vitest";

import { findRouteBfs } from "@/lib/accessops/twin/twin-service";
import type { AccessTwinRouteEdge } from "@/lib/accessops/types";

describe("AccessOps twin graph", () => {
  const edges: AccessTwinRouteEdge[] = [
    {
      id: "edge-1",
      fromAssetId: "a",
      toAssetId: "b",
      edgeType: "connects_to",
      direction: "undirected",
      securityClassification: "public",
    },
    {
      id: "edge-2",
      fromAssetId: "b",
      toAssetId: "c",
      edgeType: "connects_to",
      direction: "directed",
      securityClassification: "public",
    },
  ];

  it("routes through unblocked public edges", () => {
    expect(findRouteBfs(edges, "a", "c").found).toBe(true);
  });

  it("honours hard blocked assets", () => {
    const route = findRouteBfs(edges, "a", "c", { hardBlockedAssetIds: ["b"] });
    expect(route.found).toBe(false);
    expect(route.warnings).toContain("route_not_found");
  });
});
