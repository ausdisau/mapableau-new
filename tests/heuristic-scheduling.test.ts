import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/routing/travel-matrix-service", () => ({
  getTravelTimeSeconds: vi.fn().mockResolvedValue({
    durationSeconds: 600,
    distanceMeters: 5000,
    source: "haversine_fallback",
  }),
}));

import { HeuristicSchedulingEngine } from "@/lib/scheduling/heuristic-scheduling-engine";

describe("HeuristicSchedulingEngine", () => {
  it("proposes an assignment for feasible window", async () => {
    const engine = new HeuristicSchedulingEngine();
    const proposal = await engine.proposeAssignments({
      bookingId: "b1",
      organisationId: "o1",
      windows: [
        {
          start: new Date("2026-06-01T09:00:00Z"),
          end: new Date("2026-06-01T11:00:00Z"),
        },
      ],
      resources: [
        {
          type: "worker",
          id: "worker-1",
          siteLat: -33.87,
          siteLng: 151.21,
        },
      ],
      pickup: { lat: -33.88, lng: 151.22 },
    });
    expect(proposal.assignments).toHaveLength(1);
    expect(proposal.engine).toBe("heuristic");
  });
});
