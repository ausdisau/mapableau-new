import { describe, expect, it, vi, beforeEach } from "vitest";

const upsertQueue = vi.fn().mockResolvedValue({ id: "q1" });
const findManyRoutePlan = vi.fn().mockResolvedValue([]);
const findManyOptimJobs = vi.fn().mockResolvedValue([]);
const findManyTrips = vi.fn().mockResolvedValue([]);
const findUniqueBooking = vi.fn().mockResolvedValue(null);

vi.mock("@/lib/dispatch-console/dispatch-service", () => ({
  upsertQueue,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    routePlan: { findMany: findManyRoutePlan },
    transportRouteOptimisationJob: { findMany: findManyOptimJobs },
    transportTrip: { findMany: findManyTrips },
    transportBooking: { findUnique: findUniqueBooking },
  },
}));

vi.mock("@/lib/config/phase5", () => ({
  phase5Config: { routeOptimisationEnabled: true },
}));

vi.mock("@/lib/config/phase6", () => ({
  phase6Config: { dispatchConsoleEnabled: true },
}));

describe("syncTransportPlanningQueues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queues route plans in review_required", async () => {
    findManyRoutePlan.mockResolvedValueOnce([
      { id: "rp1", transportBookingId: "tb1" },
    ]);
    findUniqueBooking.mockResolvedValueOnce({
      operatorOrganisationId: "org1",
    });

    const { syncTransportPlanningQueues } = await import(
      "@/lib/transport-dispatch/planning-bridge"
    );
    const result = await syncTransportPlanningQueues();

    expect(result.syncedCount).toBeGreaterThanOrEqual(1);
    expect(upsertQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        queueType: "transport_plan_review",
        entityType: "RoutePlan",
        entityId: "rp1",
      })
    );
  });

  it("queues dispatch_pending trips without active assignment", async () => {
    findManyTrips.mockResolvedValueOnce([{ id: "trip1", providerOrganisationId: "org1" }]);

    const { syncTransportPlanningQueues } = await import(
      "@/lib/transport-dispatch/planning-bridge"
    );
    await syncTransportPlanningQueues();

    expect(upsertQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        queueType: "transport_dispatch",
        entityType: "TransportTrip",
        entityId: "trip1",
      })
    );
  });
});
