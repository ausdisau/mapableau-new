import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config/continuity-recovery", () => ({
  continuityRecoveryConfig: {
    enabled: true,
    allowCareTransportAutoCancel: false,
  },
  isContinuityRecoveryEnabled: () => true,
  allowCareTransportAutoCancel: () => false,
}));

vi.mock("@/lib/config/y2-orchestration", () => ({
  isOrchestrationV2Enabled: () => true,
  CARE_TRANSPORT_PICKUP_BUFFER_MINUTES: 30,
  y2OrchestrationConfig: {
    careTransportOrchestrationV2Enabled: true,
  },
  isBackupRecoveryEnabled: () => false,
  isMicroConsentActive: () => false,
  RECONCILIATION_AMOUNT_TOLERANCE_CENTS: 1,
}));

vi.mock("@/lib/config/phase3", () => ({
  phase3Config: { orchestrationEnabled: true },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    careShift: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    careShiftCancellation: { create: vi.fn() },
    orchestrationEvent: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    transportBooking: { update: vi.fn() },
    continuityRecoveryCase: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    continuityRecoveryAlternative: { update: vi.fn() },
    continuityRecoveryReceipt: { create: vi.fn() },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/care/access-control", () => ({
  CareAccessError: class CareAccessError extends Error {},
  assertProviderOrgAccess: vi.fn(async () => undefined),
}));

import { prisma } from "@/lib/prisma";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  openRecoveryFromWorkerCancellation,
  participantChooseRecoveryAlternative,
} from "@/lib/continuity/participant-recovery-service";
import { propagateCareShiftStatusToTransport } from "@/lib/orchestration/care-transport-orchestrator";
import { allowCareTransportAutoCancel } from "@/lib/config/continuity-recovery";
import type { CurrentUser } from "@/lib/auth/current-user";

const provider = {
  id: "provider-1",
  primaryRole: "provider_admin",
} as CurrentUser;

const participant = {
  id: "taylor",
  primaryRole: "participant",
} as CurrentUser;

describe("worker cancellation → participant-controlled recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    expect(allowCareTransportAutoCancel()).toBe(false);
  });

  it("cancels Care, preserves Transport, prepares alternatives", async () => {
    vi.mocked(prisma.careShift.findUnique).mockResolvedValue({
      id: "shift-1",
      participantId: "taylor",
      organisationId: "org-a",
      careBookingId: "booking-1",
      careRequestId: "req-1",
      status: "scheduled",
    } as never);
    vi.mocked(prisma.careShiftCancellation.create).mockResolvedValue({
      id: "cancel-1",
    } as never);
    vi.mocked(prisma.careShift.update).mockResolvedValue({
      id: "shift-1",
      status: "cancelled",
    } as never);
    vi.mocked(prisma.orchestrationEvent.findFirst).mockResolvedValue({
      transportBookingId: "tb-1",
    } as never);

    const alternatives = [
      {
        id: "alt-keep",
        kind: "transport_keep",
        label: "Keep connected Transport as planned",
        readinessState: "available",
        compatible: true,
        providerAccepted: false,
        participantApproved: false,
        confirmed: false,
        reasonsJson: ["Care cancel does not auto-cancel Transport"],
      },
      {
        id: "alt-cancel",
        kind: "transport_cancel_request",
        label: "Request Transport cancellation",
        readinessState: "candidate",
        compatible: false,
        providerAccepted: false,
        participantApproved: false,
        confirmed: false,
        reasonsJson: ["Never automatic"],
      },
    ];

    vi.mocked(prisma.continuityRecoveryCase.create).mockResolvedValue({
      id: "case-1",
      caseKey: "recovery_shift-1_1",
      status: "detected",
      failureSignal: "worker_cancellation",
      transportPreserved: true,
      transportAutoCancelled: false,
      alternatives,
      receipt: null,
    } as never);

    vi.mocked(prisma.continuityRecoveryCase.update).mockResolvedValue({
      id: "case-1",
      caseKey: "recovery_shift-1_1",
      status: "awaiting_participant",
      failureSignal: "worker_cancellation",
      transportPreserved: true,
      transportAutoCancelled: false,
      alternatives,
      receipt: null,
    } as never);

    const view = await openRecoveryFromWorkerCancellation({
      careShiftId: "shift-1",
      actor: provider,
      reason: "Worker unavailable",
    });

    expect(view.transportPreserved).toBe(true);
    expect(view.transportAutoCancelled).toBe(false);
    expect(view.status).toBe("awaiting_participant");
    expect(prisma.transportBooking.update).not.toHaveBeenCalled();
    expect(createAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "continuity_recovery.opened",
        metadata: expect.objectContaining({ transportAutoCancelled: false }),
      }),
    );
  });

  it("issues recovery receipt when participant keeps Transport", async () => {
    const alternatives = [
      {
        id: "alt-keep",
        kind: "transport_keep",
        label: "Keep connected Transport as planned",
        readinessState: "available",
        compatible: true,
        providerAccepted: false,
        participantApproved: false,
        confirmed: false,
        reasonsJson: [],
      },
    ];

    vi.mocked(prisma.continuityRecoveryCase.findUnique).mockResolvedValue({
      id: "case-1",
      participantId: "taylor",
      organisationId: "org-a",
      transportPreserved: true,
      alternatives,
      receipt: null,
    } as never);

    vi.mocked(prisma.continuityRecoveryAlternative.update).mockResolvedValue({
      id: "alt-keep",
      participantApproved: true,
    } as never);

    vi.mocked(prisma.continuityRecoveryReceipt.create).mockResolvedValue({
      id: "receipt-1",
      plainLanguageSummary: "You chose to keep your transport.",
    } as never);

    vi.mocked(prisma.continuityRecoveryCase.update).mockResolvedValue({
      id: "case-1",
      caseKey: "recovery_1",
      status: "participant_approved",
      failureSignal: "worker_cancellation",
      transportPreserved: true,
      transportAutoCancelled: false,
      alternatives: [{ ...alternatives[0]!, participantApproved: true }],
      receipt: { id: "receipt-1" },
    } as never);

    const view = await participantChooseRecoveryAlternative({
      caseId: "case-1",
      alternativeId: "alt-keep",
      actor: participant,
    });

    expect(view.transportPreserved).toBe(true);
    expect(view.transportAutoCancelled).toBe(false);
    expect(view.receiptId).toBe("receipt-1");
    expect(prisma.transportBooking.update).not.toHaveBeenCalled();
  });

  it("does not auto-cancel Transport when Care shift cancel is propagated", async () => {
    vi.mocked(prisma.careShift.findUnique).mockResolvedValue({
      id: "shift-1",
      careRequestId: "req-1",
    } as never);
    vi.mocked(prisma.orchestrationEvent.findFirst).mockResolvedValue({
      transportBookingId: "tb-1",
    } as never);
    vi.mocked(prisma.orchestrationEvent.create).mockResolvedValue({
      id: "evt-1",
    } as never);

    const result = await propagateCareShiftStatusToTransport({
      careShiftId: "shift-1",
      newStatus: "cancelled",
      actorUserId: "provider-1",
    });

    expect(result).toMatchObject({
      propagated: false,
      deferredToParticipant: true,
      transportPreserved: true,
      transportBookingId: "tb-1",
    });
    expect(prisma.transportBooking.update).not.toHaveBeenCalled();
    expect(prisma.orchestrationEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "care_transport_cancel_deferred_to_participant",
          metadata: expect.objectContaining({ transportAutoCancelled: false }),
        }),
      }),
    );
  });
});
