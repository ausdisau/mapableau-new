import { phase3Config } from "@/lib/config/phase3";
import {
  CARE_TRANSPORT_PICKUP_BUFFER_MINUTES,
  y2OrchestrationConfig,
} from "@/lib/config/y2-orchestration";
import { requireMicroConsent } from "@/lib/consent/micro-consent-service";
import { prisma } from "@/lib/prisma";
import { createTransportBooking } from "@/lib/transport/transport-booking-service";
import { recordContinuitySignal } from "@/lib/continuity/signals/signal-service";
import { openOrExtendContinuityCase } from "@/lib/continuity/cases/case-service";

/**
 * Wave 11 remediation. This orchestrator no longer auto-cancels linked
 * transport when a care shift is cancelled. Instead it emits a
 * ContinuitySignal and opens/updates a ContinuityCase so that a person can
 * choose a goal-preserving recovery option. Transport status is only mutated
 * via an approved recovery plan step.
 *
 * All idempotency keys are DETERMINISTIC — never derived from `Date.now()`.
 * Executable bookings refuse placeholder operational data
 * ("Address to be confirmed") and require a preferredDate.
 * `listPendingRescheduleRequests` fails closed when unscoped.
 *
 * A legacy `compatibilityMode` read path is preserved for callers that only
 * consume the `orchestration_reschedule_requests` table via row ids they
 * already own; broad, unscoped queries are rejected.
 */

export type UnifiedCareTransportState = {
  careRequestId: string;
  transportBookingId: string | null;
  transportStatus: string | null;
  careRequestStatus: string;
  pickupWindowStart: Date | null;
  linked: boolean;
};

export class OrchestrationInvalidError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export const PLACEHOLDER_ADDRESSES = new Set([
  "address to be confirmed",
  "tbd",
  "tba",
  "unknown",
  "placeholder",
]);

export function isPlaceholderAddress(value: string | null | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return true;
  return PLACEHOLDER_ADDRESSES.has(trimmed);
}

function isOrchestrationV2Enabled() {
  return (
    y2OrchestrationConfig.careTransportOrchestrationV2Enabled &&
    phase3Config.orchestrationEnabled
  );
}

export async function createLinkedTransportFromCareRequest(
  careRequestId: string,
  actorUserId: string
) {
  if (!phase3Config.orchestrationEnabled) {
    return { skipped: true, reason: "Orchestration disabled" };
  }

  const key = `care-transport-${careRequestId}`;
  const existing = await prisma.orchestrationEvent.findUnique({
    where: { idempotencyKey: key },
  });
  if (existing?.transportBookingId) {
    return { duplicate: true, transportBookingId: existing.transportBookingId };
  }

  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: {
      participant: {
        include: { participantProfile: true },
      },
    },
  });
  if (!request || !request.linkedTransportRequired) {
    throw new OrchestrationInvalidError("LINK_NOT_REQUESTED", "Care request does not require linked transport");
  }

  if (isOrchestrationV2Enabled()) {
    await requireMicroConsent({
      action: "orchestration.share_transport",
      subjectUserId: request.participantId,
      actorUserId,
    });
    await requireMicroConsent({
      action: "orchestration.share_care_location",
      subjectUserId: request.participantId,
      actorUserId,
    });
  }

  const homeAddress =
    request.participant.participantProfile?.homeSuburb ??
    request.address ??
    null;
  const careAddress = request.address ?? homeAddress;

  // Wave 11 remediation: refuse executable bookings without real data.
  const preferredDate = request.preferredDate;
  const wantsExecutable = !isPlaceholderAddress(homeAddress) && !isPlaceholderAddress(careAddress);

  if (!preferredDate) {
    throw new OrchestrationInvalidError(
      "MISSING_PREFERRED_DATE",
      "Cannot create an executable linked transport booking without a preferredDate. Save the transport as a draft in the care request first."
    );
  }
  if (!wantsExecutable) {
    throw new OrchestrationInvalidError(
      "PLACEHOLDER_ADDRESS",
      "Cannot create an executable linked transport booking with a placeholder address. Confirm the participant's pickup and drop-off addresses before linking."
    );
  }

  const shiftStart = preferredDate;
  const pickupStart = isOrchestrationV2Enabled()
    ? new Date(
        shiftStart.getTime() - CARE_TRANSPORT_PICKUP_BUFFER_MINUTES * 60 * 1000
      )
    : shiftStart;

  const tb = await createTransportBooking({
    participantId: request.participantId,
    pickupAddress: homeAddress as string,
    dropoffAddress: careAddress as string,
    pickupWindowStart: pickupStart,
    shareAccessibility: request.shareAccessibility,
    shareAccessibilityConfirmed: request.shareAccessibility,
    pickupNotes: isOrchestrationV2Enabled()
      ? `Linked to care request (${CARE_TRANSPORT_PICKUP_BUFFER_MINUTES}min buffer)`
      : "Linked to care request",
    careRequestId,
    status: "draft",
  });

  await prisma.orchestrationEvent.create({
    data: {
      eventType: "care_transport_link_created",
      careRequestId,
      transportBookingId: tb.id,
      idempotencyKey: key,
      createdById: actorUserId,
      metadata: {
        careRequestId,
        pickupBufferMinutes: isOrchestrationV2Enabled()
          ? CARE_TRANSPORT_PICKUP_BUFFER_MINUTES
          : 0,
      },
    },
  });

  return { transportBooking: tb };
}

export async function getUnifiedCareTransportState(
  careRequestId: string
): Promise<UnifiedCareTransportState | null> {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!request) return null;

  const event = await prisma.orchestrationEvent.findFirst({
    where: { careRequestId, eventType: "care_transport_link_created" },
    orderBy: { createdAt: "desc" },
  });

  let transportStatus: string | null = null;
  if (event?.transportBookingId) {
    const tb = await prisma.transportBooking.findUnique({
      where: { id: event.transportBookingId },
    });
    transportStatus = tb?.status ?? null;
  }

  return {
    careRequestId,
    transportBookingId: event?.transportBookingId ?? null,
    transportStatus,
    careRequestStatus: request.status,
    pickupWindowStart: request.preferredDate,
    linked: Boolean(event?.transportBookingId),
  };
}

/**
 * Wave 11 remediation. This function DOES NOT auto-cancel linked transport
 * when a care shift is cancelled. Cancellation of one linked service is a
 * SIGNAL, not a decision. It creates a ContinuitySignal, opens/updates a
 * ContinuityCase, and returns the case reference. Transport status is only
 * mutated by an approved recovery plan step (see
 * lib/continuity/recovery/execution-service.ts).
 */
export async function propagateCareShiftStatusToTransport(params: {
  careShiftId: string;
  newStatus: string;
  actorUserId: string;
}) {
  if (!isOrchestrationV2Enabled()) return { skipped: true, reason: "orchestration_v2_disabled" };

  const shift = await prisma.careShift.findUnique({
    where: { id: params.careShiftId },
    include: { careRequest: true },
  });
  if (!shift?.careRequestId) return { skipped: true, reason: "no_care_request" };

  const event = await prisma.orchestrationEvent.findFirst({
    where: {
      careRequestId: shift.careRequestId,
      transportBookingId: { not: null },
    },
  });
  if (!event?.transportBookingId) return { skipped: true, reason: "no_linked_transport" };

  if (params.newStatus !== "cancelled") {
    return { skipped: true, reason: "status_not_cancelled" };
  }

  // Deterministic dedupe key. NEVER Date.now().
  const dedupeKey = `care-cancel-signal-${shift.id}-${event.transportBookingId}`;

  const signal = await recordContinuitySignal({
    kind: "care_shift_cancelled",
    participantId: shift.participantId ?? shift.careRequest?.participantId ?? null,
    organisationId: shift.organisationId ?? null,
    sourceKind: "care_shift",
    sourceRef: shift.id,
    payload: {
      careShiftId: shift.id,
      careRequestId: shift.careRequestId,
      linkedTransportBookingId: event.transportBookingId,
      cancelledByUserId: params.actorUserId,
    },
    dedupeKey,
    observedAt: new Date(),
  });

  const continuityCase = await openOrExtendContinuityCase({
    participantId: shift.participantId ?? shift.careRequest?.participantId ?? "",
    organisationId: shift.organisationId ?? null,
    category: "transport",
    title: "Care cancellation may affect linked transport",
    summary:
      "A care shift was cancelled. Do not automatically cancel the linked transport — the participant may still need this trip for a different purpose or the ride may be repurposed by them.",
    openedById: params.actorUserId,
    signalIds: [signal.id],
    contextJson: {
      careShiftId: shift.id,
      careRequestId: shift.careRequestId,
      linkedTransportBookingId: event.transportBookingId,
    },
  });

  // Deterministic idempotency key for the orchestration audit row. We only
  // ever write it once per (shift, transport) pair.
  const orchestrationKey = `cancel-${shift.id}-${event.transportBookingId}`;
  await prisma.orchestrationEvent.upsert({
    where: { idempotencyKey: orchestrationKey },
    update: {},
    create: {
      eventType: "care_transport_cancel_propagated",
      careRequestId: shift.careRequestId,
      transportBookingId: event.transportBookingId,
      idempotencyKey: orchestrationKey,
      createdById: params.actorUserId,
      metadata: {
        careShiftId: shift.id,
        transportMutated: false,
        continuityCaseId: continuityCase.id,
        continuitySignalId: signal.id,
        reason: "recorded_signal_only_wave11",
      },
    },
  });

  return {
    propagated: false,
    signalRecorded: true,
    continuityCaseId: continuityCase.id,
    continuitySignalId: signal.id,
    transportBookingId: event.transportBookingId,
    reason: "wave11_no_auto_cancel",
  };
}

export async function requestOrchestrationReschedule(params: {
  careRequestId?: string;
  careShiftId?: string;
  transportBookingId?: string;
  requestedById: string;
  coordinatorId?: string;
  organisationId?: string;
  notes?: string;
}) {
  if (!isOrchestrationV2Enabled()) {
    throw new OrchestrationInvalidError("ORCHESTRATION_V2_DISABLED", "Orchestration v2 disabled");
  }

  return prisma.orchestrationRescheduleRequest.create({
    data: {
      careRequestId: params.careRequestId,
      careShiftId: params.careShiftId,
      transportBookingId: params.transportBookingId,
      requestedById: params.requestedById,
      coordinatorId: params.coordinatorId,
      organisationId: params.organisationId,
      notes: params.notes,
      status: "pending",
    },
  });
}

export interface ListPendingRescheduleParams {
  organisationId: string;
  coordinatorId?: string;
  status?: string;
  limit?: number;
  cursorId?: string;
}

/**
 * Wave 11 remediation. Requires an `organisationId` filter (fails closed if
 * unscoped). When `coordinatorId` is provided, the queue is restricted to
 * that coordinator's requests. Ordering is stable (createdAt desc, then id
 * desc) and results are paginated.
 *
 * Legacy read path (before Wave 11): callers could invoke this with an
 * optional coordinatorId argument only and receive the global queue.
 * That path is REMOVED. If a legacy caller needs a specific row, it must
 * fetch by id directly on `prisma.orchestrationRescheduleRequest.findUnique`.
 */
export async function listPendingRescheduleRequests(params: ListPendingRescheduleParams) {
  if (!params || !params.organisationId) {
    throw new OrchestrationInvalidError(
      "RESCHEDULE_QUEUE_UNSCOPED",
      "listPendingRescheduleRequests requires an organisationId. Global unscoped queues are not permitted."
    );
  }

  const take = Math.min(Math.max(params.limit ?? 50, 1), 200);

  return prisma.orchestrationRescheduleRequest.findMany({
    where: {
      status: params.status ?? "pending",
      organisationId: params.organisationId,
      ...(params.coordinatorId ? { coordinatorId: params.coordinatorId } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    ...(params.cursorId ? { cursor: { id: params.cursorId }, skip: 1 } : {}),
  });
}
