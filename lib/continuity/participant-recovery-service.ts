/**
 * Participant-controlled Continuity recovery.
 * Distinctions preserved:
 * candidate ≠ available ≠ compatible ≠ provider accepted ≠ participant approved ≠ confirmed ≠ delivered
 * Care cancellation never auto-cancels connected Transport.
 */

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { cancelCareShiftWithRecoveryHook } from "@/lib/care/care-recurring-schedule-service";
import { isContinuityRecoveryEnabled } from "@/lib/config/continuity-recovery";
import { prisma } from "@/lib/prisma";

export type RecoveryCaseView = {
  id: string;
  caseKey: string;
  status: string;
  failureSignal: string;
  transportPreserved: boolean;
  transportAutoCancelled: boolean;
  alternatives: Array<{
    id: string;
    kind: string;
    label: string;
    readinessState: string;
    compatible: boolean;
    providerAccepted: boolean;
    participantApproved: boolean;
    confirmed: boolean;
    reasons: string[];
  }>;
  receiptId?: string;
};

function assertEnabled(): void {
  if (!isContinuityRecoveryEnabled()) {
    throw new Error("FEATURE_DISABLED");
  }
}

async function findLinkedTransport(careShiftId: string): Promise<{
  transportBookingId?: string;
  transportTripId?: string;
}> {
  const shift = await prisma.careShift.findUnique({
    where: { id: careShiftId },
  });
  if (!shift?.careRequestId) return {};

  const event = await prisma.orchestrationEvent.findFirst({
    where: {
      careRequestId: shift.careRequestId,
      transportBookingId: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    transportBookingId: event?.transportBookingId ?? undefined,
    transportTripId: undefined,
  };
}

function toView(row: {
  id: string;
  caseKey: string;
  status: string;
  failureSignal: string;
  transportPreserved: boolean;
  transportAutoCancelled: boolean;
  alternatives: Array<{
    id: string;
    kind: string;
    label: string;
    readinessState: string;
    compatible: boolean;
    providerAccepted: boolean;
    participantApproved: boolean;
    confirmed: boolean;
    reasonsJson: unknown;
  }>;
  receipt?: { id: string } | null;
}): RecoveryCaseView {
  return {
    id: row.id,
    caseKey: row.caseKey,
    status: row.status,
    failureSignal: row.failureSignal,
    transportPreserved: row.transportPreserved,
    transportAutoCancelled: row.transportAutoCancelled,
    alternatives: row.alternatives.map((a) => ({
      id: a.id,
      kind: a.kind,
      label: a.label,
      readinessState: a.readinessState,
      compatible: a.compatible,
      providerAccepted: a.providerAccepted,
      participantApproved: a.participantApproved,
      confirmed: a.confirmed,
      reasons: Array.isArray(a.reasonsJson)
        ? (a.reasonsJson as string[])
        : [],
    })),
    receiptId: row.receipt?.id,
  };
}

/**
 * Worker cancellation → Care cancel + Continuity case.
 * Connected Transport is preserved until participant chooses.
 */
export async function openRecoveryFromWorkerCancellation(input: {
  careShiftId: string;
  actor: CurrentUser;
  reason: string;
  missionRef?: string;
}): Promise<RecoveryCaseView> {
  assertEnabled();

  const cancel = await cancelCareShiftWithRecoveryHook({
    careShiftId: input.careShiftId,
    actor: input.actor,
    reason: input.reason,
  });

  const shift = await prisma.careShift.findUnique({
    where: { id: input.careShiftId },
  });
  if (!shift) throw new Error("NOT_FOUND");

  const linked = await findLinkedTransport(input.careShiftId);
  const caseKey = `recovery_${input.careShiftId}_${Date.now()}`;

  const created = await prisma.continuityRecoveryCase.create({
    data: {
      caseKey,
      participantId: shift.participantId,
      organisationId: shift.organisationId,
      careShiftId: shift.id,
      careBookingId: shift.careBookingId,
      transportBookingId: linked.transportBookingId,
      transportTripId: linked.transportTripId,
      missionRef: input.missionRef,
      failureSignal: "worker_cancellation",
      status: "detected",
      transportPreserved: true,
      transportAutoCancelled: false,
      summary: `Worker cancellation for shift ${shift.id}. Transport preserved pending participant choice.`,
      createdById: input.actor.id,
      alternatives: {
        create: [
          {
            kind: "worker_candidate",
            label: "Propose replacement worker (candidate — not confirmed)",
            readinessState: "candidate",
            compatible: false,
            providerAccepted: false,
            reasonsJson: [
              "candidate ≠ available",
              "available ≠ compatible",
              "compatible ≠ participant approved",
            ],
          },
          {
            kind: "transport_keep",
            label: "Keep connected Transport as planned",
            readinessState: "available",
            compatible: true,
            reasonsJson: [
              "Care cancel does not auto-cancel Transport",
              "Participant must approve any Transport change",
            ],
          },
          {
            kind: "transport_reschedule",
            label: "Ask to reschedule Transport (requires participant approval)",
            readinessState: "candidate",
            compatible: false,
            reasonsJson: ["Requires participant approval before confirmation"],
          },
          {
            kind: "transport_cancel_request",
            label: "Request Transport cancellation (participant-controlled)",
            readinessState: "candidate",
            compatible: false,
            reasonsJson: [
              "Never automatic",
              "Creates cancel request only after participant approval",
            ],
          },
        ],
      },
    },
    include: { alternatives: true, receipt: true },
  });

  const prepared = await prisma.continuityRecoveryCase.update({
    where: { id: created.id },
    data: { status: "awaiting_participant" },
    include: { alternatives: true, receipt: true },
  });

  await createAuditEvent({
    actorUserId: input.actor.id,
    action: "continuity_recovery.opened",
    entityType: "ContinuityRecoveryCase",
    entityId: prepared.id,
    organisationId: shift.organisationId,
    participantId: shift.participantId,
    metadata: {
      careShiftId: shift.id,
      careCancellationId: cancel.cancellationId,
      transportPreserved: true,
      transportAutoCancelled: false,
    },
  });

  return toView(prepared);
}

export async function participantChooseRecoveryAlternative(input: {
  caseId: string;
  alternativeId: string;
  actor: CurrentUser;
}): Promise<RecoveryCaseView> {
  assertEnabled();
  const recoveryCase = await prisma.continuityRecoveryCase.findUnique({
    where: { id: input.caseId },
    include: { alternatives: true, receipt: true },
  });
  if (!recoveryCase) throw new Error("NOT_FOUND");
  if (
    recoveryCase.participantId !== input.actor.id &&
    !isAdminRole(input.actor.primaryRole)
  ) {
    throw new Error("PARTICIPANT_ONLY");
  }

  const alternative = recoveryCase.alternatives.find(
    (a) => a.id === input.alternativeId,
  );
  if (!alternative) throw new Error("ALTERNATIVE_NOT_FOUND");

  // Mark chosen alternative as participant-approved — still not auto-confirmed delivery
  await prisma.continuityRecoveryAlternative.update({
    where: { id: alternative.id },
    data: {
      participantApproved: true,
      readinessState: "participant_approved",
      // Confirmation of operational delivery remains a later human/canonical step
      confirmed: false,
    },
  });

  let transportPreserved = recoveryCase.transportPreserved;
  let transportCancelRequested = false;
  if (alternative.kind === "transport_cancel_request") {
    transportPreserved = false;
    transportCancelRequested = true;
    // Do not mutate TransportBooking/Trip here — emit request only
  }
  if (alternative.kind === "transport_keep") {
    transportPreserved = true;
  }

  const outcome =
    alternative.kind === "transport_cancel_request"
      ? "transport_cancel_requested_by_participant"
      : alternative.kind === "transport_keep"
        ? "transport_preserved"
        : "alternative_approved_awaiting_confirmation";

  const receipt = await prisma.continuityRecoveryReceipt.create({
    data: {
      caseId: recoveryCase.id,
      chosenAlternativeId: alternative.id,
      participantUserId: input.actor.id,
      transportPreserved,
      transportCancelRequested,
      outcome,
      plainLanguageSummary:
        alternative.kind === "transport_keep"
          ? "You chose to keep your transport. Your care shift was cancelled, but transport was not cancelled automatically."
          : alternative.kind === "transport_cancel_request"
            ? "You asked to cancel transport. Staff will confirm the cancellation — it was not automatic."
            : `You approved “${alternative.label}”. This is not yet a confirmed delivery.`,
    },
  });

  const updated = await prisma.continuityRecoveryCase.update({
    where: { id: recoveryCase.id },
    data: {
      status: "participant_approved",
      transportPreserved,
      transportAutoCancelled: false,
      summary: receipt.plainLanguageSummary,
    },
    include: { alternatives: true, receipt: true },
  });

  await createAuditEvent({
    actorUserId: input.actor.id,
    action: "continuity_recovery.participant_chose",
    entityType: "ContinuityRecoveryCase",
    entityId: updated.id,
    organisationId: recoveryCase.organisationId ?? undefined,
    participantId: recoveryCase.participantId,
    metadata: {
      alternativeId: alternative.id,
      kind: alternative.kind,
      transportPreserved,
      transportAutoCancelled: false,
      receiptId: receipt.id,
    },
  });

  return toView(updated);
}

export async function getRecoveryCase(
  caseId: string,
  actor: CurrentUser,
): Promise<RecoveryCaseView> {
  assertEnabled();
  const recoveryCase = await prisma.continuityRecoveryCase.findUnique({
    where: { id: caseId },
    include: { alternatives: true, receipt: true },
  });
  if (!recoveryCase) throw new Error("NOT_FOUND");
  if (
    recoveryCase.participantId !== actor.id &&
    !isAdminRole(actor.primaryRole)
  ) {
    throw new Error("FORBIDDEN");
  }
  return toView(recoveryCase);
}
