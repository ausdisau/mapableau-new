import { describe, expect, it } from "vitest";

import { createDemoPassports, getDemoGraph } from "@/lib/access-intelligence/demo-data";
import {
  assertEligibleRoute,
  buildAccessibleRoute,
} from "@/lib/access-intelligence/route-engine";

describe("route-engine", () => {
  it("active lift outage rejects the affected route and selects alternative", () => {
    const graph = getDemoGraph("place-northside-library")!;
    const passport = createDemoPassports()[0]!;
    const result = buildAccessibleRoute({
      placeId: graph.place.id,
      nodes: graph.nodes,
      edges: graph.edges,
      passport,
      fromNodeId: "n-nsl-ent",
      toNodeId: "n-nsl-room",
      incidents: [
        {
          id: "1",
          placeId: graph.place.id,
          elementId: "nsl-lift-main",
          type: "lift_outage",
          severity: "high",
          description: "Out",
          sourceType: "system_feed",
          reportedAt: "2026-07-10T00:00:00.000Z",
          status: "active",
          affectedEdgeIds: ["e-nsl-main-lift"],
        },
        {
          id: "2",
          placeId: graph.place.id,
          type: "blocked_route",
          severity: "moderate",
          description: "Blocked",
          sourceType: "venue_attestation",
          reportedAt: "2026-07-10T00:00:00.000Z",
          status: "active",
          affectedEdgeIds: ["e-nsl-short-room"],
        },
      ],
    });
    const route = assertEligibleRoute(result);
    expect(route.edgeIds).toContain("e-nsl-alt-lift");
    expect(route.steps.length).toBeGreaterThan(1);
  });
});
