import { randomUUID } from "crypto";

import type { BookingStatus } from "@prisma/client";

import { phase2Config } from "@/lib/config/phase2";
import { prisma } from "@/lib/prisma";
import { buildBillingGraph, graphToPatch } from "@/server/billing/billingGraph";
import { buildParticipantBillingSummary } from "@/server/billing/billingExplanationService";
import {
  recordDisputeAudit,
  recordGuardrailAudit,
  recordInvoiceDraftAudit,
} from "@/server/billing/billingAuditService";
import { evaluateBillingGuardrails } from "@/server/billing/billingGuardrails";
import {
  getAgenticInvoice,
  saveAgenticInvoice,
  updateAgenticInvoice,
} from "@/server/billing/billingStore";
import type {
  AgenticInvoiceDraft,
  AgenticInvoiceLineItem,
  BookingEvidenceRef,
  DraftInvoiceInput,
  DraftInvoiceResponse,
  GuardrailDecision,
} from "@/server/billing/billingTypes";

const BILLABLE_BOOKING_STATUSES: BookingStatus[] = [
  "confirmed",
  "in_progress",
  "completed",
];

const DEFAULT_UNIT_CENTS = 0;

export class AgenticBillingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "BOOKING_NOT_FOUND"
      | "PARTICIPANT_MISMATCH"
      | "BOOKING_NOT_CONFIRMED"
      | "INVOICE_NOT_FOUND"
      | "FORBIDDEN"
  ) {
    super(message);
    this.name = "AgenticBillingError";
  }
}

async function collectBookingEvidence(
  bookingId: string,
  status: BookingStatus
): Promise<BookingEvidenceRef> {
  const timeline = await prisma.bookingTimelineEvent.findMany({
    where: { bookingId, isAdminOnly: false },
    select: { id: true, eventType: true, title: true },
    take: 10,
  });

  const careShift = await prisma.careShift.findFirst({
    where: { bookingId },
    select: { id: true, status: true },
  });

  const transport = await prisma.transportBooking.findFirst({
    where: { bookingId },
    select: { id: true, status: true },
  });

  const evidenceIds: string[] = [];
  let evidenceType: BookingEvidenceRef["evidenceType"] = "booking_status";
  let summary = `Booking status: ${status}`;

  if (timeline.length > 0) {
    evidenceType = "timeline";
    evidenceIds.push(...timeline.map((t) => t.id));
    summary = `Timeline: ${timeline.map((t) => t.title).join("; ")}`;
  }

  if (careShift) {
    evidenceType = "care_shift";
    evidenceIds.push(careShift.id);
    summary = `Care shift (${careShift.status})`;
    if (["approved", "completed", "checked_out"].includes(careShift.status)) {
      return {
        bookingId,
        evidenceType,
        evidenceIds,
        summary,
      };
    }
  }

  if (transport) {
    evidenceType = "transport";
    evidenceIds.push(transport.id);
    summary = `Transport (${transport.status})`;
    if (transport.status === "completed") {
      return {
        bookingId,
        evidenceType,
        evidenceIds,
        summary,
      };
    }
  }

  if (BILLABLE_BOOKING_STATUSES.includes(status)) {
    evidenceIds.push(`booking-status:${bookingId}`);
    return {
      bookingId,
      evidenceType: "booking_status",
      evidenceIds,
      summary,
    };
  }

  return {
    bookingId,
    evidenceType,
    evidenceIds: [],
    summary: "No service evidence on record",
  };
}

function bookingLineDescription(bookingType: string, serviceDate: Date): string {
  const label = bookingType.replace(/_/g, " ");
  return `Support service — ${label} (${serviceDate.toISOString().slice(0, 10)})`;
}

export async function createAgenticInvoiceDraft(
  actorUserId: string,
  input: DraftInvoiceInput
): Promise<DraftInvoiceResponse> {
  const bookings = await prisma.booking.findMany({
    where: { id: { in: input.bookingIds } },
    include: {
      assignedOrganisation: { select: { id: true, name: true } },
    },
  });

  if (bookings.length !== input.bookingIds.length) {
    throw new AgenticBillingError(
      "One or more bookings were not found",
      "BOOKING_NOT_FOUND"
    );
  }

  for (const booking of bookings) {
    if (booking.participantId !== input.participantId) {
      throw new AgenticBillingError(
        "All bookings must belong to the specified participant",
        "PARTICIPANT_MISMATCH"
      );
    }
    if (!BILLABLE_BOOKING_STATUSES.includes(booking.status)) {
      throw new AgenticBillingError(
        `Booking ${booking.id} must be confirmed, in progress, or completed`,
        "BOOKING_NOT_CONFIRMED"
      );
    }
  }

  const lineItems: AgenticInvoiceLineItem[] = [];
  for (const booking of bookings) {
    const evidence = await collectBookingEvidence(booking.id, booking.status);
    const quantity = 1;
    const unitAmountCents = DEFAULT_UNIT_CENTS;
    lineItems.push({
      id: randomUUID(),
      bookingId: booking.id,
      description: bookingLineDescription(
        booking.bookingType,
        booking.requestedStart
      ),
      quantity,
      unitAmountCents,
      totalAmountCents: Math.round(quantity * unitAmountCents),
      serviceDate: booking.requestedStart.toISOString(),
      evidence,
    });
  }

  const subtotalCents = lineItems.reduce((s, li) => s + li.totalAmountCents, 0);
  const draft: AgenticInvoiceDraft = {
    id: randomUUID(),
    participantId: input.participantId,
    bookingIds: input.bookingIds,
    fundingContext: input.fundingContext,
    status: "pending_approval",
    currency: phase2Config.billingDefaultCurrency,
    lineItems,
    subtotalCents,
    totalCents: subtotalCents,
    createdAt: new Date().toISOString(),
    createdByUserId: actorUserId,
    sendBlocked: true,
    claimSubmissionBlocked: true,
  };

  const guardrailDecision = evaluateBillingGuardrails(draft);
  if (guardrailDecision.overallStatus === "blocked") {
    draft.status = "draft";
  }

  const graph = buildBillingGraph(draft, guardrailDecision);
  saveAgenticInvoice({ draft, guardrailDecision, graph });

  await recordInvoiceDraftAudit({ actorUserId, draft });
  await recordGuardrailAudit({
    actorUserId,
    invoiceId: draft.id,
    decision: guardrailDecision,
  });

  const participantSummary = buildParticipantBillingSummary(
    draft,
    guardrailDecision
  );

  return {
    invoiceDraft: draft,
    participantSummary,
    guardrailDecision,
    billingGraphPatch: graphToPatch(graph),
    requiresApproval: true,
  };
}

export async function reevaluateAgenticGuardrails(
  invoiceId: string,
  actorUserId?: string
): Promise<{ guardrailDecision: GuardrailDecision; requiresApproval: true }> {
  const stored = getAgenticInvoice(invoiceId);
  if (!stored) {
    throw new AgenticBillingError("Invoice draft not found", "INVOICE_NOT_FOUND");
  }

  const guardrailDecision = evaluateBillingGuardrails(stored.draft);
  const graph = buildBillingGraph(stored.draft, guardrailDecision);

  updateAgenticInvoice(invoiceId, (current) => ({
    ...current,
    guardrailDecision,
    graph,
  }));

  await recordGuardrailAudit({
    actorUserId,
    invoiceId,
    decision: guardrailDecision,
  });

  return { guardrailDecision, requiresApproval: true };
}

export async function getAgenticInvoiceSummary(invoiceId: string) {
  const stored = getAgenticInvoice(invoiceId);
  if (!stored) {
    throw new AgenticBillingError("Invoice draft not found", "INVOICE_NOT_FOUND");
  }

  return {
    invoiceDraft: stored.draft,
    participantSummary: buildParticipantBillingSummary(
      stored.draft,
      stored.guardrailDecision
    ),
    guardrailDecision: stored.guardrailDecision,
    billingGraph: stored.graph,
    requiresApproval: true as const,
  };
}

export async function disputeAgenticInvoice(
  actorUserId: string,
  invoiceId: string,
  reason: string
): Promise<DraftInvoiceResponse> {
  const updated = updateAgenticInvoice(invoiceId, (current) => {
    const draft: AgenticInvoiceDraft = {
      ...current.draft,
      status: "disputed",
      disputedAt: new Date().toISOString(),
      disputeReason: reason,
      sendBlocked: true,
    };
    const guardrailDecision = evaluateBillingGuardrails(draft);
    const graph = buildBillingGraph(draft, guardrailDecision);
    return { draft, guardrailDecision, graph };
  });

  if (!updated) {
    throw new AgenticBillingError("Invoice draft not found", "INVOICE_NOT_FOUND");
  }

  await recordDisputeAudit({ actorUserId, invoiceId, reason });
  await recordGuardrailAudit({
    actorUserId,
    invoiceId,
    decision: updated.guardrailDecision,
  });

  return {
    invoiceDraft: updated.draft,
    participantSummary: buildParticipantBillingSummary(
      updated.draft,
      updated.guardrailDecision
    ),
    guardrailDecision: updated.guardrailDecision,
    billingGraphPatch: graphToPatch(updated.graph),
    requiresApproval: true,
  };
}

export function assertParticipantAccess(
  actorUserId: string,
  participantId: string,
  isAdmin: boolean
): void {
  if (isAdmin) return;
  if (actorUserId !== participantId) {
    throw new AgenticBillingError("Not allowed to access this invoice", "FORBIDDEN");
  }
}
