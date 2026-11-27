/**
 * Greater Sydney Care pilot spine helpers.
 * Domain authority only — no agent auto-assignment.
 *
 * Flow: support request → compare options → introduction → agreement →
 * schedule → messaging/incident/invoice handoff → transport link only.
 */

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  isCareCompareEnabled,
  isCareTransportLinkEnabled,
} from "@/lib/config/care-pilot";
import { prisma } from "@/lib/prisma";

export type CompareOption = {
  candidateId: string;
  candidateType: "worker" | "provider";
  displayName: string;
  lane: "assured" | "choice" | "partner" | "unknown";
  fitReasons: string[];
  missingEvidence: string[];
  /** Explicitly not a ranking score for auto-assign. */
  participantSelectedOrder: number;
};

/**
 * Multi-option compare. Ordering is participant-selected; never pay-to-rank.
 */
export async function compareCareSupportOptions(input: {
  participantId: string;
  actorUserId: string;
  careRequestId?: string;
  /** Participant-chosen order of candidate ids. */
  orderedCandidateIds: string[];
  candidates: Array<{
    candidateId: string;
    candidateType: "worker" | "provider";
    displayName: string;
    lane?: CompareOption["lane"];
    fitReasons?: string[];
    missingEvidence?: string[];
  }>;
}): Promise<{ options: CompareOption[]; language: string }> {
  if (!isCareCompareEnabled()) {
    throw new Error("CARE_COMPARE_DISABLED");
  }

  const order = new Map(
    input.orderedCandidateIds.map((id, index) => [id, index]),
  );

  const options: CompareOption[] = input.candidates
    .map((c) => ({
      candidateId: c.candidateId,
      candidateType: c.candidateType,
      displayName: c.displayName,
      lane: c.lane ?? "unknown",
      fitReasons: c.fitReasons ?? [],
      missingEvidence: c.missingEvidence ?? [],
      participantSelectedOrder: order.get(c.candidateId) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort(
      (a, b) => a.participantSelectedOrder - b.participantSelectedOrder,
    );

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "care_pilot.compare_options",
    entityType: input.careRequestId ? "CareRequest" : "CarePilot",
    entityId: input.careRequestId ?? input.participantId,
    participantId: input.participantId,
    metadata: {
      optionCount: options.length,
      autoAssigned: false,
      payToRank: false,
      language: "options_that_may_fit_preferences",
    },
  });

  return {
    options,
    language: "options_that_may_fit_preferences",
  };
}

/**
 * Transport link only — requirements + buffer. No dispatch.
 */
export async function linkTransportRequirementsToCareRequest(input: {
  careRequestId: string;
  participantId: string;
  actorUserId: string;
  pickupNotes?: string;
  accessRequirements?: string;
  bufferMinutes?: number;
}) {
  if (!isCareTransportLinkEnabled()) {
    throw new Error("CARE_TRANSPORT_LINK_DISABLED");
  }

  const request = await prisma.careRequest.findUnique({
    where: { id: input.careRequestId },
  });
  if (!request || request.participantId !== input.participantId) {
    throw new Error("CARE_REQUEST_FORBIDDEN");
  }

  const intakeMetadata = {
    ...((request.intakeMetadata as Record<string, unknown> | null) ?? {}),
    transportLink: {
      linked: true,
      dispatch: false,
      pickupNotes: input.pickupNotes?.slice(0, 1000) ?? null,
      accessRequirements: input.accessRequirements?.slice(0, 1000) ?? null,
      bufferMinutes: Math.min(Math.max(input.bufferMinutes ?? 15, 0), 180),
      updatedAt: new Date().toISOString(),
    },
  };

  const updated = await prisma.careRequest.update({
    where: { id: request.id },
    data: {
      linkedTransportRequired: true,
      intakeMetadata,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: "care_pilot.transport_link",
    entityType: "CareRequest",
    entityId: updated.id,
    participantId: input.participantId,
    metadata: {
      dispatch: false,
      bufferMinutes: intakeMetadata.transportLink.bufferMinutes,
    },
  });

  return {
    careRequestId: updated.id,
    linkedTransportRequired: true,
    dispatch: false as const,
    transportLink: intakeMetadata.transportLink,
  };
}

/**
 * Invoice handoff pointer — reuses existing Care invoice placeholder path.
 * Does not approve invoices or submit NDIA claims.
 */
export function careInvoiceHandoffPath(careBookingId: string): string {
  return `/api/care/bookings/${careBookingId}/invoice-placeholder`;
}

/**
 * Incident handoff pointer — existing Care incidents API.
 */
export function careIncidentHandoffPath(): string {
  return `/api/care/incidents`;
}
