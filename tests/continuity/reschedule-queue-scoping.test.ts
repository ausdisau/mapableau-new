import { describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn().mockResolvedValue([]);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    orchestrationRescheduleRequest: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    // Unused in these tests but referenced by the module import graph.
    careRequest: { findUnique: vi.fn() },
    orchestrationEvent: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    transportBooking: { findUnique: vi.fn() },
    careShift: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/continuity/signals/signal-service", () => ({
  recordContinuitySignal: vi.fn(),
}));
vi.mock("@/lib/continuity/cases/case-service", () => ({
  openOrExtendContinuityCase: vi.fn(),
}));
vi.mock("@/lib/transport/transport-booking-service", () => ({
  createTransportBooking: vi.fn(),
}));
vi.mock("@/lib/consent/micro-consent-service", () => ({
  requireMicroConsent: vi.fn(),
}));

import {
  listPendingRescheduleRequests,
  OrchestrationInvalidError,
} from "@/lib/orchestration/care-transport-orchestrator";

describe("listPendingRescheduleRequests scoping", () => {
  it("fails closed if organisationId is missing", async () => {
    await expect(
      // @ts-expect-error intentional missing organisationId
      listPendingRescheduleRequests({})
    ).rejects.toBeInstanceOf(OrchestrationInvalidError);
  });

  it("throws with code RESCHEDULE_QUEUE_UNSCOPED when no params", async () => {
    await expect(
      // @ts-expect-error intentional
      listPendingRescheduleRequests(undefined)
    ).rejects.toMatchObject({ code: "RESCHEDULE_QUEUE_UNSCOPED" });
  });

  it("passes coordinator + organisation to prisma when provided", async () => {
    findManyMock.mockResolvedValueOnce([]);
    await listPendingRescheduleRequests({ organisationId: "org-1", coordinatorId: "coord-a" });
    const call = findManyMock.mock.calls.at(-1)?.[0];
    expect(call?.where).toMatchObject({
      status: "pending",
      organisationId: "org-1",
      coordinatorId: "coord-a",
    });
    expect(call?.orderBy).toEqual([{ createdAt: "desc" }, { id: "desc" }]);
    expect(call?.take).toBeLessThanOrEqual(200);
  });

  it("does not pass coordinatorId when omitted", async () => {
    findManyMock.mockResolvedValueOnce([]);
    await listPendingRescheduleRequests({ organisationId: "org-2" });
    const call = findManyMock.mock.calls.at(-1)?.[0];
    expect(call?.where.coordinatorId).toBeUndefined();
    expect(call?.where.organisationId).toBe("org-2");
  });

  it("caps take at 200 even when larger limit provided", async () => {
    findManyMock.mockResolvedValueOnce([]);
    await listPendingRescheduleRequests({ organisationId: "org-3", limit: 9999 });
    const call = findManyMock.mock.calls.at(-1)?.[0];
    expect(call?.take).toBe(200);
  });
});
