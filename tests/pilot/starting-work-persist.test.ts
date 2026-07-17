import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    pilotStartingWorkRun: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/config/starting-work-pilot", () => ({
  startingWorkPilotConfig: { enabled: true, syntheticOnly: true },
  isStartingWorkPilotEnabled: () => true,
}));

import { prisma } from "@/lib/prisma";
import {
  assertStartingWorkIntegrationHonesty,
  runAndPersistStartingWorkJourney,
} from "@/lib/pilot/starting-work/persist-journey";

describe("database-backed Starting Work journey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists completed journey with seed integration chain", async () => {
    vi.mocked(prisma.pilotStartingWorkRun.create).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => {
        return {
          id: "run-1",
          ...data,
          synthetic: true,
        } as never;
      },
    );

    const run = await runAndPersistStartingWorkJourney({
      actorUserId: "tester",
    });
    expect(run.status).toBe("completed");
    expect(run.synthetic).toBe(true);
    expect(run.careBookingId).toMatch(/^seed_care_booking_/);
    expect(run.transportQuoteId).toMatch(/^seed_tq_/);
    expect(run.billingServiceRecordId).toMatch(/^seed_bsr_/);
    expect(run.accesscastJourneyRef).toContain("starting-work");
    expect(run.visitPackRef).toMatch(/^seed_visit_pack_/);
    expect(run.links.stagedDisclosure).toContain("suburb_until_accept");
    expect(run.links.workerReadiness).toBe("ready_human_assignment_required");
    expect(run.returnTransportStatus).toContain("recovery_required");
    expect(assertStartingWorkIntegrationHonesty(run)).toEqual([]);
  });

  it("persists blocked inaccessible vehicle without transport quote", async () => {
    vi.mocked(prisma.pilotStartingWorkRun.create).mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => {
        return { id: "run-2", ...data, synthetic: true } as never;
      },
    );

    const run = await runAndPersistStartingWorkJourney({
      failureMode: "inaccessible_vehicle",
    });
    expect(run.status).toBe("blocked");
    expect(run.transportQuoteId).toBeUndefined();
    expect(run.links.vehicleEligibility).toBe("incompatible");
    expect(assertStartingWorkIntegrationHonesty(run)).toEqual([]);
  });
});
