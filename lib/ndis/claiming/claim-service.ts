import type {
  NdisClaimLineStatus,
  NdisPaymentRoute,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { persistPlanManagerInvoices } from "@/lib/ndis/claiming/adapters/PlanManagerInvoiceAdapter";
import { portalExportAdapter } from "@/lib/ndis/claiming/adapters/PortalExportAdapter";
import { persistSelfManagedInvoices } from "@/lib/ndis/claiming/adapters/SelfManagedInvoiceAdapter";
import { createClaimBatch, validateClaimBatch } from "@/lib/ndis/claiming/batchBuilder";
import {
  buildBulkPaymentRequestExport,
  checksumExport,
} from "@/lib/ndis/claiming/exporters/bulkPaymentRequestExporter";
import { fundingSourceToPaymentRoute } from "@/lib/ndis/claiming/paymentRoute";
import type {
  ClaimBatchExportResult,
  ClaimLineInput,
  ClaimLineStatusUpdate,
} from "@/lib/ndis/claiming/types";
import {
  mergeValidationJson,
  validateClaimLineInput,
  validationResultToStatus,
} from "@/lib/ndis/claiming/validation";
import { createClaimSnapshot } from "@/lib/ndis-gateway/security/claim-snapshot-service";
import { sanitiseAuditJson } from "@/lib/ndis-gateway/security/log-sanitiser";
import type { ExternalClaimPayload } from "@/lib/ndis-gateway/security/sensitive-payload";
import { prisma } from "@/lib/prisma";

export async function assertOrgAccess(user: CurrentUser, organisationId: string) {
  if (isAdminRole(user.primaryRole)) return;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new Error("FORBIDDEN");
  }
}

/**
 * Allowed claim-line status transitions (Wave 4 hardening).
 * Forbidden: arbitrary jumps such as draft → paid without export/submit.
 */
const CLAIM_LINE_ALLOWED_TRANSITIONS: Record<
  NdisClaimLineStatus,
  readonly NdisClaimLineStatus[]
> = {
  draft: ["validated", "validation_failed", "voided"],
  validated: ["included_in_batch", "validation_failed", "draft", "voided"],
  validation_failed: ["draft", "validated", "voided"],
  included_in_batch: ["exported", "validated", "voided"],
  exported: ["submitted", "pending", "voided"],
  submitted: ["pending", "paid", "rejected", "voided"],
  pending: ["paid", "rejected", "submitted"],
  paid: [],
  rejected: ["corrected", "voided"],
  corrected: ["resubmitted", "voided"],
  resubmitted: ["included_in_batch", "exported", "submitted", "pending", "voided"],
  voided: [],
};

function assertClaimLineStatusTransition(
  from: NdisClaimLineStatus,
  to: NdisClaimLineStatus
): void {
  if (from === to) return;
  if (!CLAIM_LINE_ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new Error(`CLAIM_LINE_TRANSITION_FORBIDDEN:${from}->${to}`);
  }
}

export async function createClaimLineFromBooking(params: {
  bookingId: string;
  providerOrgId: string;
  createdById: string;
  supportItemCode?: string;
  unitPriceCents?: number;
  quantity?: number;
  evidenceJson?: Record<string, unknown>;
  participantConfirmationException?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      participant: { include: { participantProfile: true } },
      fundingSource: true,
      careRequest: true,
      careShifts: {
        where: { status: { in: ["completed", "checked_out"] } },
        take: 5,
      },
      assignedOrganisation: true,
    },
  });

  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.status !== "completed") {
    throw new Error("BOOKING_NOT_COMPLETED");
  }
  if (booking.assignedOrganisationId !== params.providerOrgId) {
    throw new Error("BOOKING_ORG_MISMATCH");
  }

  const paymentRoute = fundingSourceToPaymentRoute(booking.fundingSource?.type);
  if (!paymentRoute) throw new Error("FUNDING_ROUTE_UNKNOWN");

  const supportItemCode =
    params.supportItemCode ?? booking.careRequest?.supportItemCode ?? null;
  if (!supportItemCode || supportItemCode.toUpperCase() === "PENDING_CODE") {
    throw new Error("PENDING_CODE_REFUSED");
  }

  const shift = booking.careShifts[0];
  const serviceStart = shift?.startAt ?? booking.requestedStart;
  const serviceEnd = shift?.endAt ?? booking.requestedEnd ?? serviceStart;

  const quantity = params.quantity ?? 1;
  const unitPriceCents = params.unitPriceCents;
  if (unitPriceCents == null) {
    throw new Error("UNIT_PRICE_REQUIRED");
  }
  if (!Number.isInteger(unitPriceCents)) {
    throw new Error("UNIT_PRICE_MUST_BE_INTEGER_CENTS");
  }
  if (unitPriceCents <= 0) {
    throw new Error("ZERO_PRICE_REFUSED");
  }
  const totalAmountCents = Math.round(quantity * unitPriceCents);

  // NEVER decrypt NDIS into general claim input — presence/mask only.
  const profile = booking.participant.participantProfile;
  const hasNdisOnFile = Boolean(profile?.ndisParticipantNumberEnc);
  const ndisMasked: string | null = null;

  const evidenceJson: Record<string, unknown> = sanitiseAuditJson({
    deliveryRecorded: true,
    shiftIds: booking.careShifts.map((s) => s.id),
    bookingId: booking.id,
    bookingStatus: booking.status,
    hasNdisOnFile,
    ...params.evidenceJson,
    ...(params.participantConfirmationException
      ? {
          participantConfirmationException:
            params.participantConfirmationException,
        }
      : {}),
  })!;

  const input: ClaimLineInput = {
    participantId: booking.participantId,
    providerOrgId: params.providerOrgId,
    bookingId: booking.id,
    // Masked/presence only — never raw decrypted NDIS number.
    ndisParticipantNumber: ndisMasked,
    participantName: booking.participant.name,
    supportItemCode,
    supportDescription: booking.careRequest?.supportItemCode
      ? `Support — ${supportItemCode}`
      : `Booking ${booking.id.slice(0, 8)}`,
    serviceStartDate: serviceStart.toISOString(),
    serviceEndDate: serviceEnd.toISOString(),
    quantity,
    unitPriceCents,
    totalAmountCents,
    paymentRoute,
    evidenceJson,
    participantConfirmationException: params.participantConfirmationException,
  };

  const validation = await validateClaimLineInput(input);
  const status = validationResultToStatus(validation);

  const line = await prisma.ndisClaimLine.create({
    data: {
      participantId: input.participantId,
      providerOrgId: input.providerOrgId,
      bookingId: input.bookingId,
      ndisParticipantNumber: ndisMasked,
      participantName: input.participantName,
      supportItemCode: input.supportItemCode.trim(),
      supportDescription: input.supportDescription,
      serviceStartDate: new Date(input.serviceStartDate),
      serviceEndDate: new Date(input.serviceEndDate),
      quantity: new Prisma.Decimal(input.quantity),
      unitPriceCents: input.unitPriceCents,
      totalAmountCents: input.totalAmountCents,
      paymentRoute: input.paymentRoute,
      status,
      evidenceJson: evidenceJson as Prisma.InputJsonValue,
      validationJson: mergeValidationJson(validation) as Prisma.InputJsonValue,
      createdById: params.createdById,
    },
  });

  const org = await prisma.organisation.findUnique({
    where: { id: params.providerOrgId },
  });
  const externalPayload: ExternalClaimPayload = {
    claimType: "registered_provider",
    provider: {
      abn: org?.abn ?? null,
      ndisRegistrationNumber: org?.ndisRegistrationNumber ?? "",
      organisationId: params.providerOrgId,
      name: org?.name ?? "",
    },
    participant: {
      // Encrypted snapshot path may load NDIS separately; never put raw decrypt here.
      ndisNumber: null,
      ndisNumberMasked: ndisMasked,
      mapableUserId: booking.participantId,
    },
    invoiceReference: {},
    servicePeriod: {
      start: serviceStart.toISOString().slice(0, 10),
      end: serviceEnd.toISOString().slice(0, 10),
    },
    lines: [
      {
        lineNumber: 1,
        supportItemCode: input.supportItemCode.trim(),
        description: input.supportDescription,
        serviceDate: serviceStart.toISOString().slice(0, 10),
        quantity,
        unitPriceCents,
        totalCents: totalAmountCents,
        gstIncluded: false,
      },
    ],
    totals: {
      subtotalCents: totalAmountCents,
      taxCents: 0,
      totalCents: totalAmountCents,
      currency: "AUD",
    },
    metadata: {
      builtAt: new Date().toISOString(),
      mapableVersion: "1",
    },
  };

  let snapshotId: string | null = null;
  let payloadHash: string | null = null;
  try {
    const actor = {
      id: params.createdById,
      primaryRole: "provider_admin" as const,
    } as CurrentUser;
    const snap = await createClaimSnapshot({
      user: actor,
      organisationId: params.providerOrgId,
      participantId: booking.participantId,
      sourceType: "ndis_claim_line",
      sourceId: line.id,
      fundingRoute: paymentRoute,
      externalPayload,
      forDirectSubmission: paymentRoute === "ndia_managed",
    });
    snapshotId = snap.snapshot.id;
    payloadHash = snap.payloadHash;
    await prisma.ndisClaimLine.update({
      where: { id: line.id },
      data: {
        currentSnapshotId: snap.snapshot.id,
        payloadHash: snap.payloadHash,
      },
    });
  } catch {
    // Snapshot optional for blocked funding; line remains without raw NDIS.
  }

  const refreshed = await prisma.ndisClaimLine.findUniqueOrThrow({
    where: { id: line.id },
  });

  await prisma.claimAuditEvent.create({
    data: {
      claimLineId: line.id,
      entityType: "ndis_claim_line",
      entityId: line.id,
      action: "line.created_from_booking",
      actorUserId: params.createdById,
      afterJson: sanitiseAuditJson({
        status,
        bookingId: booking.id,
        snapshotId,
        payloadHash,
        hasNdisOnFile,
      }) as Prisma.InputJsonValue,
    },
  });

  return { line: refreshed, validation };
}

export async function validateClaimLineById(lineId: string, actorUserId: string) {
  const line = await prisma.ndisClaimLine.findUnique({ where: { id: lineId } });
  if (!line) throw new Error("LINE_NOT_FOUND");

  const input: ClaimLineInput = {
    participantId: line.participantId,
    providerOrgId: line.providerOrgId,
    bookingId: line.bookingId,
    ndisParticipantNumber: line.ndisParticipantNumber,
    participantName: line.participantName,
    supportItemCode: line.supportItemCode,
    supportDescription: line.supportDescription,
    serviceStartDate: line.serviceStartDate.toISOString(),
    serviceEndDate: line.serviceEndDate.toISOString(),
    quantity: Number(line.quantity),
    unitPriceCents: line.unitPriceCents,
    totalAmountCents: line.totalAmountCents,
    paymentRoute: line.paymentRoute,
    evidenceJson: (line.evidenceJson as Record<string, unknown>) ?? {},
    participantConfirmationException:
      (line.evidenceJson as Record<string, unknown>)
        ?.participantConfirmationException as string | undefined,
  };

  if (input.supportItemCode.toUpperCase() === "PENDING_CODE") {
    throw new Error("PENDING_CODE_REFUSED");
  }
  if (input.unitPriceCents <= 0) {
    throw new Error("ZERO_PRICE_REFUSED");
  }

  const validation = await validateClaimLineInput(input);
  const status = validationResultToStatus(validation);

  const updated = await prisma.ndisClaimLine.update({
    where: { id: lineId },
    data: {
      status,
      validationJson: mergeValidationJson(validation) as Prisma.InputJsonValue,
    },
  });

  await prisma.claimAuditEvent.create({
    data: {
      claimLineId: lineId,
      entityType: "ndis_claim_line",
      entityId: lineId,
      action: "line.validated",
      actorUserId,
      beforeJson: { status: line.status },
      afterJson: { status, valid: validation.valid },
    },
  });

  return { line: updated, validation };
}

export async function exportClaimBatch(
  batchId: string,
  actorUserId: string
): Promise<ClaimBatchExportResult & { invoiceIds?: string[] }> {
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: batchId },
    include: { providerOrg: true, lines: true },
  });
  if (!batch) throw new Error("BATCH_NOT_FOUND");

  let content = "";
  let contentType = "text/csv";
  let adapter: ClaimBatchExportResult["adapter"] = "portal_export";
  let fileName = `export-${batch.id}.csv`;
  let invoiceIds: string[] = [];

  if (batch.paymentRoute === "ndia_managed") {
    // Adapter already builds and persists the portal export — do not double-build.
    await portalExportAdapter.submitClaimBatch(batchId);
    const refreshed = await prisma.ndisClaimBatch.findUniqueOrThrow({
      where: { id: batchId },
    });
    fileName = refreshed.exportFileName ?? `ndia-bulk-payment-${batch.batchReference ?? batch.id}.csv`;
    // Load content once for download payload only (adapter already stored checksum).
    const exp = await buildBulkPaymentRequestExport(batchId);
    if (!exp) throw new Error("EXPORT_FAILED");
    content = exp.csv;
    // Prefer adapter-stored checksum; recompute only for response payload integrity.
    checksumExport(content);
  } else if (batch.paymentRoute === "self_managed") {
    const created = await persistSelfManagedInvoices(batchId, actorUserId);
    invoiceIds = created.map((i) => i.id);
    content = JSON.stringify(
      created.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        participantId: i.participantId,
        totalCents: i.totalCents,
        lines: i.lines,
      })),
      null,
      2
    );
    contentType = "application/json";
    adapter = "self_managed_invoice";
    fileName = `self-managed-invoices-${batch.batchReference ?? batch.id}.json`;
    await prisma.ndisClaimBatch.update({
      where: { id: batchId },
      data: { status: "exported", exportedAt: new Date(), exportFileName: fileName },
    });
  } else if (batch.paymentRoute === "plan_managed") {
    const created = await persistPlanManagerInvoices(batchId, actorUserId);
    invoiceIds = created.map((i) => i.id);
    content = JSON.stringify(
      created.map((i) => ({
        id: i.id,
        invoiceNumber: i.invoiceNumber,
        planManagerName: i.planManagerName,
        totalCents: i.totalCents,
        lines: i.lines,
      })),
      null,
      2
    );
    contentType = "application/json";
    adapter = "plan_manager_invoice";
    fileName = `plan-manager-invoices-${batch.batchReference ?? batch.id}.json`;
    await prisma.ndisClaimBatch.update({
      where: { id: batchId },
      data: { status: "exported", exportedAt: new Date(), exportFileName: fileName },
    });
  }

  const checksum = checksumExport(content);
  await prisma.ndisClaimBatch.update({
    where: { id: batchId },
    data: { exportChecksum: checksum },
  });

  await prisma.claimAuditEvent.create({
    data: {
      batchId,
      entityType: "ndis_claim_batch",
      entityId: batchId,
      action: "batch.exported",
      actorUserId,
      afterJson: sanitiseAuditJson({
        fileName,
        adapter,
        lineCount: batch.lines.length,
        invoiceIds,
      }) as Prisma.InputJsonValue,
    },
  });

  return {
    batchId,
    paymentRoute: batch.paymentRoute,
    adapter,
    fileName,
    checksum,
    contentType,
    payloadBase64: Buffer.from(content, "utf8").toString("base64"),
    lineCount: batch.lines.length,
    invoiceIds,
  };
}

export async function markBatchSubmittedInPortal(
  batchId: string,
  actorUserId: string
) {
  const batch = await prisma.ndisClaimBatch.update({
    where: { id: batchId },
    data: {
      status: "submitted_in_portal",
      submittedAt: new Date(),
    },
  });

  await prisma.ndisClaimLine.updateMany({
    where: { batchId },
    data: { status: "submitted" },
  });

  await prisma.claimAuditEvent.create({
    data: {
      batchId,
      entityType: "ndis_claim_batch",
      entityId: batchId,
      action: "batch.marked_submitted_portal",
      actorUserId,
      afterJson: { status: batch.status },
    },
  });

  return batch;
}

const STATUS_MAP: Record<ClaimLineStatusUpdate, NdisClaimLineStatus> = {
  submitted: "submitted",
  pending: "pending",
  paid: "paid",
  rejected: "rejected",
  corrected: "corrected",
  resubmitted: "resubmitted",
  voided: "voided",
};

/**
 * @deprecated Prefer explicit workflow transitions with assertClaimLineStatusTransition.
 * Retained for API compatibility; now enforces allowed transitions.
 */
export async function updateClaimLineStatus(params: {
  lineId: string;
  status: ClaimLineStatusUpdate;
  actorUserId: string;
  rejectionCode?: string;
  rejectionMessage?: string;
}) {
  const line = await prisma.ndisClaimLine.findUnique({ where: { id: params.lineId } });
  if (!line) throw new Error("LINE_NOT_FOUND");

  const nextStatus = STATUS_MAP[params.status];
  assertClaimLineStatusTransition(line.status, nextStatus);

  const updated = await prisma.ndisClaimLine.update({
    where: { id: params.lineId },
    data: {
      status: nextStatus,
      rejectionCode: params.rejectionCode ?? line.rejectionCode,
      rejectionMessage: params.rejectionMessage ?? line.rejectionMessage,
    },
  });

  await prisma.claimAuditEvent.create({
    data: {
      claimLineId: params.lineId,
      batchId: line.batchId,
      entityType: "ndis_claim_line",
      entityId: params.lineId,
      action: `line.status.${params.status}`,
      actorUserId: params.actorUserId,
      beforeJson: { status: line.status },
      afterJson: { status: nextStatus },
    },
  });

  return updated;
}

export async function correctAndResubmitClaimLine(params: {
  originalLineId: string;
  corrections: Partial<ClaimLineInput>;
  actorUserId: string;
}) {
  const original = await prisma.ndisClaimLine.findUnique({
    where: { id: params.originalLineId },
  });
  if (!original) throw new Error("LINE_NOT_FOUND");
  if (original.status !== "rejected") {
    throw new Error("LINE_NOT_REJECTED");
  }

  const supportItemCode =
    params.corrections.supportItemCode ?? original.supportItemCode;
  if (supportItemCode.toUpperCase() === "PENDING_CODE") {
    throw new Error("PENDING_CODE_REFUSED");
  }
  const unitPriceCents =
    params.corrections.unitPriceCents ?? original.unitPriceCents;
  if (unitPriceCents <= 0) {
    throw new Error("ZERO_PRICE_REFUSED");
  }

  await updateClaimLineStatus({
    lineId: original.id,
    status: "corrected",
    actorUserId: params.actorUserId,
  });

  const input: ClaimLineInput = {
    participantId: original.participantId,
    providerOrgId: original.providerOrgId,
    bookingId: original.bookingId,
    // Persist masked value only — never decrypt.
    ndisParticipantNumber: original.ndisParticipantNumber,
    participantName: original.participantName,
    supportItemCode,
    supportDescription:
      params.corrections.supportDescription ?? original.supportDescription,
    serviceStartDate:
      params.corrections.serviceStartDate ?? original.serviceStartDate.toISOString(),
    serviceEndDate:
      params.corrections.serviceEndDate ?? original.serviceEndDate.toISOString(),
    quantity: params.corrections.quantity ?? Number(original.quantity),
    unitPriceCents,
    totalAmountCents:
      params.corrections.totalAmountCents ?? original.totalAmountCents,
    paymentRoute: original.paymentRoute,
    evidenceJson:
      params.corrections.evidenceJson ??
      ((original.evidenceJson as Record<string, unknown>) ?? {}),
  };

  const validation = await validateClaimLineInput(input);
  const status = validationResultToStatus(validation);

  const newLine = await prisma.ndisClaimLine.create({
    data: {
      participantId: input.participantId,
      providerOrgId: input.providerOrgId,
      bookingId: input.bookingId,
      correctedFromLineId: original.id,
      ndisParticipantNumber: original.ndisParticipantNumber,
      participantName: input.participantName,
      supportItemCode: input.supportItemCode.trim(),
      supportDescription: input.supportDescription,
      serviceStartDate: new Date(input.serviceStartDate),
      serviceEndDate: new Date(input.serviceEndDate),
      quantity: new Prisma.Decimal(input.quantity),
      unitPriceCents: input.unitPriceCents,
      totalAmountCents: input.totalAmountCents,
      paymentRoute: input.paymentRoute,
      status: validation.valid ? "resubmitted" : status,
      evidenceJson: input.evidenceJson as Prisma.InputJsonValue,
      validationJson: mergeValidationJson(validation) as Prisma.InputJsonValue,
      createdById: params.actorUserId,
    },
  });

  await prisma.claimAuditEvent.create({
    data: {
      claimLineId: newLine.id,
      entityType: "ndis_claim_line",
      entityId: newLine.id,
      action: "line.resubmitted",
      actorUserId: params.actorUserId,
      metadataJson: { correctedFromLineId: original.id },
      afterJson: { status: newLine.status },
    },
  });

  return { original, newLine, validation };
}

export async function searchClaimLines(params: {
  providerOrgId: string;
  status?: NdisClaimLineStatus;
  paymentRoute?: NdisPaymentRoute;
  q?: string;
  limit?: number;
}) {
  const where: Prisma.NdisClaimLineWhereInput = {
    providerOrgId: params.providerOrgId,
  };
  if (params.status) where.status = params.status;
  if (params.paymentRoute) where.paymentRoute = params.paymentRoute;
  if (params.q?.trim()) {
    where.OR = [
      { participantName: { contains: params.q, mode: "insensitive" } },
      { supportItemCode: { contains: params.q, mode: "insensitive" } },
      { bookingId: params.q },
    ];
  }

  return prisma.ndisClaimLine.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
    select: {
      id: true,
      status: true,
      paymentRoute: true,
      participantName: true,
      supportItemCode: true,
      serviceStartDate: true,
      totalAmountCents: true,
      bookingId: true,
      batchId: true,
      rejectionCode: true,
      rejectionMessage: true,
      validationJson: true,
      createdAt: true,
    },
  });
}

export { createClaimBatch, validateClaimBatch, assertClaimLineStatusTransition };
