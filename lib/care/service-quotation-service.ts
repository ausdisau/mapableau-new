import type {
  ServiceRequestApprovalStatus,
  ServiceQuotation,
  ServiceQuotationStatus,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

import { evaluateNdisApprovalGate } from "./ndis-approval-policy";

function estimateLineItems(tasks: unknown): {
  lineItems: Array<{ description: string; quantity: number; unitAmountCents: number; totalCents: number }>;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
} {
  const taskList = Array.isArray(tasks) ? tasks : [];
  const baseLineItems = taskList.map((task, index) => {
    const record = task && typeof task === "object" ? (task as Record<string, unknown>) : {};
    const description = typeof record.name === "string" && record.name.trim() ? record.name.trim() : `Support task ${index + 1}`;
    const quantity = Number.isFinite(Number(record.quantity)) && Number(record.quantity) > 0 ? Number(record.quantity) : 1;
    const unitAmountCents = 7500;
    return {
      description,
      quantity,
      unitAmountCents,
      totalCents: Math.round(quantity * unitAmountCents),
    };
  });

  const lineItems = baseLineItems.length > 0 ? baseLineItems : [{ description: "Care support service", quantity: 1, unitAmountCents: 12000, totalCents: 12000 }];
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.totalCents, 0);
  const taxCents = 0;
  return {
    lineItems,
    subtotalCents,
    taxCents,
    totalCents: subtotalCents + taxCents,
  };
}

export async function evaluateApprovalGate(careRequestId: string) {
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: {
      fundingSource: { select: { type: true } },
      serviceRequestApprovals: {
        orderBy: { decidedAt: "desc" },
        select: { actorRole: true, decision: true },
      },
      serviceQuotations: {
        where: { status: { in: ["draft", "awaiting_approval", "ready_for_review"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!request) throw new Error("NOT_FOUND");

  const gate = evaluateNdisApprovalGate({
    fundingSourceType: request.fundingSource?.type,
    approvals: request.serviceRequestApprovals,
  });

  if (gate.isApproved) {
    await prisma.careRequest.update({
      where: { id: careRequestId },
      data: { status: "matched" },
    });
  } else {
    await prisma.careRequest.update({
      where: { id: careRequestId },
      data: { status: "awaiting_admin_review" },
    });
  }

  const latestQuote = request.serviceQuotations[0] ?? null;
  if (latestQuote && latestQuote.status !== "confirmed") {
    const nextStatus: ServiceQuotationStatus = gate.isApproved ? "ready_for_review" : "awaiting_approval";
    if (latestQuote.status !== nextStatus) {
      await prisma.serviceQuotation.update({
        where: { id: latestQuote.id },
        data: { status: nextStatus },
      });
    }
  }

  return { gate, requestId: request.id };
}

export async function createQuotationDraftFromRequest(params: {
  careRequestId: string;
  actorUserId: string;
}) {
  const request = await prisma.careRequest.findUnique({
    where: { id: params.careRequestId },
    include: {
      fundingSource: { select: { type: true } },
      serviceRequestApprovals: {
        orderBy: { decidedAt: "desc" },
        select: { actorRole: true, decision: true },
      },
    },
  });
  if (!request) throw new Error("NOT_FOUND");

  const gate = evaluateNdisApprovalGate({
    fundingSourceType: request.fundingSource?.type,
    approvals: request.serviceRequestApprovals,
  });

  const existingOpenDraft = await prisma.serviceQuotation.findFirst({
    where: {
      careRequestId: request.id,
      status: { in: ["draft", "awaiting_approval", "ready_for_review"] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existingOpenDraft) return existingOpenDraft;

  const estimate = estimateLineItems(request.tasks);
  const quotation = await prisma.serviceQuotation.create({
    data: {
      careRequestId: request.id,
      status: gate.isApproved ? "ready_for_review" : "awaiting_approval",
      createdById: params.actorUserId,
      lineItems: estimate.lineItems,
      subtotalCents: estimate.subtotalCents,
      taxCents: estimate.taxCents,
      totalCents: estimate.totalCents,
      notes: `Generated from care request ${request.id}`,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "care_quotation.generated",
    entityType: "ServiceQuotation",
    entityId: quotation.id,
    participantId: request.participantId,
    organisationId: request.assignedOrganisationId,
    metadata: {
      gateApproved: gate.isApproved,
      eligibleApproverRoles: gate.eligibleApproverRoles,
    },
  });

  if (gate.isApproved) {
    await notifyUser(
      request.participantId,
      "booking",
      "Quotation draft ready",
      "A quotation draft is ready for your review.",
    );
  }

  return quotation;
}

export async function recordServiceRequestApproval(params: {
  careRequestId: string;
  actorUserId: string;
  actorRole: UserRole;
  decision: ServiceRequestApprovalStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  const request = await prisma.careRequest.findUnique({
    where: { id: params.careRequestId },
    select: { id: true, participantId: true, assignedOrganisationId: true },
  });
  if (!request) throw new Error("NOT_FOUND");

  const approval = await prisma.serviceRequestApproval.create({
    data: {
      careRequestId: params.careRequestId,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      decision: params.decision,
      reason: params.reason,
      metadata: params.metadata,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "care_request.approval_recorded",
    entityType: "ServiceRequestApproval",
    entityId: approval.id,
    participantId: request.participantId,
    organisationId: request.assignedOrganisationId,
    metadata: { decision: params.decision, actorRole: params.actorRole },
  });

  return approval;
}

export async function confirmQuotation(params: {
  quotationId: string;
  actorUserId: string;
}) {
  const quotation = await prisma.serviceQuotation.findUnique({
    where: { id: params.quotationId },
    include: {
      careRequest: {
        select: {
          id: true,
          participantId: true,
          assignedOrganisationId: true,
          fundingSource: { select: { type: true } },
          serviceRequestApprovals: {
            select: { actorRole: true, decision: true },
            orderBy: { decidedAt: "desc" },
          },
        },
      },
    },
  });

  if (!quotation) throw new Error("NOT_FOUND");
  const gate = evaluateNdisApprovalGate({
    fundingSourceType: quotation.careRequest.fundingSource?.type,
    approvals: quotation.careRequest.serviceRequestApprovals,
  });
  if (!gate.isApproved) {
    throw new Error("APPROVAL_REQUIRED");
  }

  const updated = await prisma.serviceQuotation.update({
    where: { id: quotation.id },
    data: {
      status: "confirmed",
      approvedByUserId: params.actorUserId,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "care_quotation.confirmed",
    entityType: "ServiceQuotation",
    entityId: updated.id,
    participantId: quotation.careRequest.participantId,
    organisationId: quotation.careRequest.assignedOrganisationId,
  });

  await notifyUser(
    quotation.careRequest.participantId,
    "booking",
    "Quotation confirmed",
    "Your care quotation has been confirmed.",
  );

  return updated;
}

export async function rejectQuotation(params: {
  quotationId: string;
  actorUserId: string;
  reason: string;
}) {
  const quotation = await prisma.serviceQuotation.update({
    where: { id: params.quotationId },
    data: {
      status: "rejected",
      rejectedReason: params.reason,
    },
    include: {
      careRequest: {
        select: {
          participantId: true,
          assignedOrganisationId: true,
        },
      },
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "care_quotation.rejected",
    entityType: "ServiceQuotation",
    entityId: quotation.id,
    participantId: quotation.careRequest.participantId,
    organisationId: quotation.careRequest.assignedOrganisationId,
    metadata: { reason: params.reason },
  });

  return quotation;
}
