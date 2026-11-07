import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    programmeAuraStop: {
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

vi.mock("@/lib/passport", () => ({
  invalidatePassportProjectionCache: vi.fn(),
}));

vi.mock("@/lib/programmes/authority/participant-authority-service", () => ({
  evaluateParticipantAuthority: vi.fn(async () => ({
    allowed: true,
    allowedFields: [],
  })),
}));

import {
  activateProgrammeAuraStop,
  clearProgrammeAuraStop,
  getProtectedReadInvalidationEpoch,
  isDurableProgrammeAuraStopped,
  __resetProtectedReadInvalidationEpochForTests,
} from "@/lib/programmes/aura/durable-stop";
import {
  assertProgrammeExecutionEligibility,
  __resetProgrammeAuraStopForTests,
} from "@/lib/programmes/aura/execution-gate";
import { prisma } from "@/lib/prisma";

describe("ACS Stage 1 — durable Stop AURA (N7)", () => {
  beforeEach(() => {
    __resetProgrammeAuraStopForTests();
    __resetProtectedReadInvalidationEpochForTests();
    vi.mocked(prisma.programmeAuraStop.create).mockReset();
    vi.mocked(prisma.programmeAuraStop.findFirst).mockReset();
    vi.mocked(prisma.programmeAuraStop.updateMany).mockReset();
  });

  it("persists stop and blocks execution eligibility", async () => {
    vi.mocked(prisma.programmeAuraStop.create).mockResolvedValue({
      id: "stop-1",
      correlationId: "corr-1",
    } as never);
    vi.mocked(prisma.programmeAuraStop.findFirst).mockResolvedValue({
      id: "stop-1",
    } as never);

    const before = getProtectedReadInvalidationEpoch();
    await activateProgrammeAuraStop({
      participantId: "p-a",
      organisationId: "org-1",
      stoppedById: "p-a",
      reason: "participant_stop",
    });
    expect(getProtectedReadInvalidationEpoch()).toBeGreaterThan(before);

    await expect(
      isDurableProgrammeAuraStopped({
        participantId: "p-a",
        organisationId: "org-1",
      }),
    ).resolves.toBe(true);

    // Reset process-local overlay so durable path is what blocks.
    __resetProgrammeAuraStopForTests();
    await expect(
      assertProgrammeExecutionEligibility({
        participantId: "p-a",
        actorUserId: "p-a",
        organisationId: "org-1",
        action: "book",
      }),
    ).rejects.toThrow(/stop is active/);
  });

  it("clears durable stop and bumps invalidation epoch", async () => {
    vi.mocked(prisma.programmeAuraStop.updateMany).mockResolvedValue({
      count: 1,
    } as never);
    vi.mocked(prisma.programmeAuraStop.findFirst).mockResolvedValue(null);

    const before = getProtectedReadInvalidationEpoch();
    const cleared = await clearProgrammeAuraStop({
      participantId: "p-a",
      clearedById: "p-a",
    });
    expect(cleared).toBe(1);
    expect(getProtectedReadInvalidationEpoch()).toBeGreaterThan(before);
  });
});
