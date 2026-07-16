import { describe, expect, it } from "vitest";

import {
  assertNotEvacuationPlan,
  createEmptyTemporaryGraph,
  simulateEventPassports,
} from "@/lib/access-intelligence/events";

describe("System 5 temporary events", () => {
  it("rejects evacuation-plan conflation", () => {
    expect(() => assertNotEvacuationPlan("Emergency evacuation certificate")).toThrow();
  });

  it("simulates blocked temporary edges", () => {
    const graph = createEmptyTemporaryGraph();
    graph.edges.push({
      id: "e1",
      fromElementId: "a",
      toElementId: "b",
      widthMm: 600,
      blocked: true,
    });
    const result = simulateEventPassports(graph);
    expect(result.blockedRoutes).toContain("e1");
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
